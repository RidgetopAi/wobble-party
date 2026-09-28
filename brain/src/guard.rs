//! Who may talk to the brain. It listens on 127.0.0.1 only, and every request
//! must also pass:
//!
//!  - Host: one of our loopback names. A web page that DNS-rebinds its own
//!    domain to 127.0.0.1 still sends its own Host, so it is refused.
//!  - Origin (when a browser sends one): the same loopback names, so no other
//!    site can open the WebSocket or read cover art cross-origin.
//!  - Peer: the connecting socket must belong to the same user as the brain
//!    (looked up in /proc/net/tcp), so other local users cannot read what is
//!    playing. No token is needed, so nothing secret ends up in argv.

use crate::limits::{self, MIB};
use axum::extract::{ConnectInfo, Request};
use axum::http::{StatusCode, header};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use std::net::{Ipv4Addr, SocketAddr};
use std::path::Path;

const NAMES: [&str; 3] = ["127.0.0.1", "localhost", "wobble.localhost"];

fn host_name_ok(host: &str) -> bool {
    // "name" or "name:port"; IPv6 literals are never ours.
    let name = host.rsplit_once(':').map_or(host, |(n, port)| if port.bytes().all(|b| b.is_ascii_digit()) { n } else { host });
    NAMES.iter().any(|n| n.eq_ignore_ascii_case(name))
}

fn origin_ok(origin: &str) -> bool {
    origin.strip_prefix("http://").is_some_and(|rest| !rest.contains('/') && host_name_ok(rest))
}

pub async fn check(ConnectInfo(peer): ConnectInfo<SocketAddr>, req: Request, next: Next) -> Response {
    let headers = req.headers();
    let host = headers.get(header::HOST).and_then(|v| v.to_str().ok());
    if !host.is_some_and(host_name_ok) {
        return (StatusCode::FORBIDDEN, "wobble-brain: unexpected Host").into_response();
    }
    if let Some(origin) = headers.get(header::ORIGIN) {
        if !origin.to_str().is_ok_and(origin_ok) {
            return (StatusCode::FORBIDDEN, "wobble-brain: unexpected Origin").into_response();
        }
    }
    if !peer_is_us(peer) {
        return (StatusCode::FORBIDDEN, "wobble-brain: connection from another user").into_response();
    }
    next.run(req).await
}

/// True if the loopback socket at `peer` is owned by our uid.
fn peer_is_us(peer: SocketAddr) -> bool {
    let SocketAddr::V4(p) = peer else { return false };
    if !p.ip().is_loopback() {
        return false;
    }
    let Some(table) = limits::read_text(Path::new("/proc/net/tcp"), 16 * MIB) else { return false };
    let me = limits::uid();
    table.lines().skip(1).any(|line| {
        let f: Vec<&str> = line.split_whitespace().collect();
        f.len() > 7 && parse_addr(f[1]) == Some((*p.ip(), p.port())) && f[7].parse::<u32>() == Ok(me)
    })
}

/// "0100007F:1D35" -> (127.0.0.1, 7477). The address is the in_addr's bytes
/// printed as a little-endian u32.
fn parse_addr(s: &str) -> Option<(Ipv4Addr, u16)> {
    let (ip, port) = s.split_once(':')?;
    let ip = u32::from_str_radix(ip, 16).ok()?;
    let port = u16::from_str_radix(port, 16).ok()?;
    Some((Ipv4Addr::from(ip.to_le_bytes()), port))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hosts() {
        for ok in ["127.0.0.1:7477", "localhost:5188", "wobble.localhost:7477", "WOBBLE.localhost", "localhost"] {
            assert!(host_name_ok(ok), "{ok}");
        }
        for bad in ["evil.com:7477", "127.0.0.1.evil.com", "wobble.localhost.evil.com:7477", "[::1]:7477", "", "localhost:77x"] {
            assert!(!host_name_ok(bad), "{bad}");
        }
    }

    #[test]
    fn origins() {
        assert!(origin_ok("http://wobble.localhost:7477"));
        assert!(origin_ok("http://127.0.0.1:5188"));
        for bad in ["https://evil.com", "http://evil.com:7477", "null", "http://localhost:7477/x", "file://"] {
            assert!(!origin_ok(bad), "{bad}");
        }
    }

    #[test]
    fn proc_addr() {
        assert_eq!(parse_addr("0100007F:1D35"), Some((Ipv4Addr::new(127, 0, 0, 1), 7477)));
    }

    #[test]
    fn own_socket_is_us() {
        let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let c = std::net::TcpStream::connect(l.local_addr().unwrap()).unwrap();
        assert!(peer_is_us(c.local_addr().unwrap()));
        assert!(!peer_is_us("127.0.0.1:1".parse().unwrap()));
    }
}

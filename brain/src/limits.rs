//! Bounded input. Everything the brain reads from outside (files, child
//! processes, the network via curl) is capped at the producer side: reads
//! stop at a byte limit, children are killed and reaped on timeout.

use std::fs::File;
use std::io::Read;
use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
use std::path::Path;
use std::process::Stdio;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use tokio::process::Command;

pub const KIB: u64 = 1024;
pub const MIB: u64 = 1024 * KIB;

/// Read at most `cap` bytes of a regular file. `None` if it is missing, not a
/// regular file, or larger than `cap`. With `nofollow`, a symlink at the final
/// path component is refused; with `own`, so is a file owned by another user.
pub fn read_file(path: &Path, cap: u64, nofollow: bool, own: bool) -> Option<Vec<u8>> {
    let mut opts = std::fs::OpenOptions::new();
    opts.read(true);
    // O_NONBLOCK: never hang opening a FIFO dropped where a file should be.
    let mut flags = libc::O_NONBLOCK | libc::O_CLOEXEC;
    if nofollow {
        flags |= libc::O_NOFOLLOW;
    }
    opts.custom_flags(flags);
    let f: File = opts.open(path).ok()?;
    let meta = f.metadata().ok()?;
    if !meta.is_file() || meta.len() > cap {
        return None;
    }
    if own && meta.uid() != uid() {
        return None;
    }
    let mut buf = Vec::with_capacity(meta.len() as usize);
    f.take(cap + 1).read_to_end(&mut buf).ok()?;
    (buf.len() as u64 <= cap).then_some(buf)
}

/// Read a small text file (config, theme files).
pub fn read_text(path: &Path, cap: u64) -> Option<String> {
    String::from_utf8(read_file(path, cap, false, false)?).ok()
}

/// Run a child with a byte cap on its stdout and a wall-clock timeout. The
/// child is killed and reaped if it exceeds either; stderr is discarded.
pub async fn run_capped(mut cmd: Command, cap: u64, timeout: Duration) -> Option<Vec<u8>> {
    cmd.stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::null()).kill_on_drop(true);
    let mut child = cmd.spawn().ok()?;
    let mut stdout = child.stdout.take()?;
    let mut buf = Vec::new();
    let read = async {
        (&mut stdout).take(cap + 1).read_to_end(&mut buf).await.ok()?;
        let status = child.wait().await.ok()?;
        Some(status)
    };
    let status = match tokio::time::timeout(timeout, read).await {
        Ok(Some(s)) => s,
        _ => {
            let _ = child.start_kill();
            let _ = child.wait().await;
            return None;
        }
    };
    (status.success() && buf.len() as u64 <= cap).then_some(buf)
}

/// Image type by magic bytes; anything else is refused.
pub fn image_mime(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("image/png")
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some("image/jpeg")
    } else if bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("image/webp")
    } else {
        None
    }
}

/// Truncate to at most `max` characters.
pub fn clip(s: &str, max: usize) -> String {
    match s.char_indices().nth(max) {
        Some((i, _)) => s[..i].to_string(),
        None => s.to_string(),
    }
}

pub fn uid() -> u32 {
    // SAFETY: getuid has no preconditions and cannot fail.
    unsafe { libc::getuid() }
}

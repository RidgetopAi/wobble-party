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

/// Width and height from the image header (PNG IHDR, JPEG SOFn, WebP
/// VP8/VP8L/VP8X). `None` if the header cannot be read.
pub fn image_dims(b: &[u8]) -> Option<(u32, u32)> {
    let be16 = |i: usize| Some(u16::from_be_bytes([*b.get(i)?, *b.get(i + 1)?]) as u32);
    let le16 = |i: usize| Some(u16::from_le_bytes([*b.get(i)?, *b.get(i + 1)?]) as u32);
    let le24 = |i: usize| Some(u32::from_le_bytes([*b.get(i)?, *b.get(i + 1)?, *b.get(i + 2)?, 0]));
    match image_mime(b)? {
        "image/png" => {
            if b.get(12..16)? != b"IHDR" {
                return None;
            }
            let be32 = |i: usize| Some(u32::from_be_bytes(b.get(i..i + 4)?.try_into().ok()?));
            Some((be32(16)?, be32(20)?))
        }
        "image/jpeg" => {
            let mut i = 2;
            loop {
                while *b.get(i)? == 0xFF && *b.get(i + 1)? == 0xFF {
                    i += 1;
                }
                if *b.get(i)? != 0xFF {
                    return None;
                }
                let m = *b.get(i + 1)?;
                if matches!(m, 0x01 | 0xD0..=0xD8) {
                    i += 2;
                    continue;
                }
                if (0xC0..=0xCF).contains(&m) && !matches!(m, 0xC4 | 0xC8 | 0xCC) {
                    return Some((be16(i + 7)?, be16(i + 5)?));
                }
                i += 2 + be16(i + 2)? as usize;
            }
        }
        _ => match b.get(12..16)? {
            b"VP8 " => Some((le16(26)? & 0x3FFF, le16(28)? & 0x3FFF)),
            b"VP8L" => {
                let (b1, b2, b3, b4) = (*b.get(21)? as u32, *b.get(22)? as u32, *b.get(23)? as u32, *b.get(24)? as u32);
                Some((1 + (b1 | (b2 & 0x3F) << 8), 1 + (b2 >> 6 | b3 << 2 | (b4 & 0x0F) << 10)))
            }
            b"VP8X" => Some((1 + le24(24)?, 1 + le24(27)?)),
            _ => None,
        },
    }
}

/// An image we will hand to the stage: a known type whose declared size is
/// within bounds (a tiny file can declare a huge decode).
pub fn image_ok(bytes: &[u8], max_side: u32, max_pixels: u64) -> Option<&'static str> {
    let mime = image_mime(bytes)?;
    let (w, h) = image_dims(bytes)?;
    (w > 0 && h > 0 && w <= max_side && h <= max_side && w as u64 * h as u64 <= max_pixels).then_some(mime)
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

#[cfg(test)]
mod tests {
    use super::*;

    fn png(w: u32, h: u32) -> Vec<u8> {
        let mut b = b"\x89PNG\r\n\x1a\n\0\0\0\x0dIHDR".to_vec();
        b.extend(w.to_be_bytes());
        b.extend(h.to_be_bytes());
        b
    }

    #[test]
    fn dims() {
        assert_eq!(image_dims(&png(640, 480)), Some((640, 480)));
        assert!(image_ok(&png(640, 640), 4096, 16 << 20).is_some());
        assert!(image_ok(&png(60000, 60000), 4096, 16 << 20).is_none());
        assert!(image_ok(b"GIF89a", 4096, 16 << 20).is_none());
        // JPEG: SOI, an APP0 segment, then SOF0 with height 300, width 400.
        let jpg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 4, 0, 0, 0xFF, 0xC0, 0, 17, 8, 1, 44, 1, 144];
        assert_eq!(image_dims(&jpg), Some((400, 300)));
        assert_eq!(image_dims(&[0xFF, 0xD8, 0xFF, 0xE0, 0, 200]), None);
    }

    #[test]
    fn real_images() {
        for (path, want) in [
            ("../stage/public/logos/omarchy.png", (600, 141)),
            ("../preview.png", (1280, 720)),
            ("../docs/img/crowd.jpg", (1600, 900)),
            ("../docs/img/themes.jpg", (1280, 1080)),
            ("testdata/lossy.webp", (33, 21)),
            ("testdata/lossless.webp", (31, 19)),
            ("testdata/extended.webp", (27, 13)),
        ] {
            let b = std::fs::read(path).unwrap();
            assert_eq!(image_dims(&b), Some(want), "{path}");
        }
    }
}

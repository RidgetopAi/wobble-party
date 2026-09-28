//! Audio sources. Everything becomes interleaved stereo f32 @ 48 kHz read from
//! a child process: `pw-record` for the live desktop mix, `ffmpeg` for files.

use anyhow::{Context, Result};
use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};

#[derive(Clone, Debug)]
pub enum Source {
    /// The default sink's monitor: whatever the desktop is playing
    /// (cliamp, Spotify in Chromium, ...). Follows default-sink changes.
    Monitor,
    /// Decode a file. `realtime` paces decoding at playback speed.
    File { path: PathBuf, realtime: bool },
    /// Raw f32le stereo 48 kHz on stdin (`cat` stands in for a child process).
    Stdin,
}

pub struct Reader {
    child: Child,
    buf: Vec<u8>,
    /// pw-record writes an AU header before the samples; skipped on first read.
    header_checked: bool,
}

impl Source {
    pub fn open(&self) -> Result<Reader> {
        let mut cmd = match self {
            Source::Monitor => {
                let mut c = Command::new("pw-record");
                c.args([
                    "-P",
                    "{ stream.capture.sink=true node.name=wobble-party-listen media.name=\"Wobble Party\" node.dont-reconnect=false }",
                    "--rate",
                    "48000",
                    "--channels",
                    "2",
                    "--format",
                    "f32",
                    "--latency",
                    "10ms",
                    "-",
                ]);
                c.stdin(Stdio::null());
                c
            }
            Source::Stdin => {
                let mut c = Command::new("cat");
                c.stdin(Stdio::inherit());
                c
            }
            Source::File { path, realtime } => {
                let mut c = Command::new("ffmpeg");
                c.args(["-v", "error", "-nostdin"]);
                if *realtime {
                    c.arg("-re");
                }
                c.arg("-i").arg(path).args(["-f", "f32le", "-ac", "2", "-ar", "48000", "-"]);
                c.stdin(Stdio::null());
                c
            }
        };
        let child = cmd
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .with_context(|| format!("starting audio source {self:?}"))?;
        // Only capture streams can carry an AU header; decoded files are raw.
        let header_checked = matches!(self, Source::File { .. });
        Ok(Reader { child, buf: vec![0u8; 4096], header_checked })
    }
}

impl Reader {
    /// Blocking read of the next chunk of samples. `false` at end of stream.
    pub fn next_chunk(&mut self, out: &mut Vec<f32>) -> Result<bool> {
        let stdout = self.child.stdout.as_mut().context("no stdout")?;
        out.clear();
        if !self.header_checked {
            self.header_checked = true;
            if let Some(first) = skip_au_header(stdout)? {
                push_samples(&first, out);
            }
        }
        let mut filled = 0;
        // Read until we hold a whole number of stereo frames (8 bytes each).
        loop {
            let n = stdout.read(&mut self.buf[filled..])?;
            if n == 0 {
                break;
            }
            filled += n;
            if filled % 8 == 0 {
                break;
            }
        }
        push_samples(&self.buf[..filled - filled % 8], out);
        Ok(filled > 0)
    }
}

/// If the stream starts with a Sun AU header (".snd", or "dns." as PipeWire
/// writes it little-endian), consume it so samples stay frame-aligned.
/// Returns the bytes read when there was no header (they are samples).
fn skip_au_header(r: &mut impl Read) -> Result<Option<[u8; 8]>> {
    let mut head = [0u8; 8];
    r.read_exact(&mut head)?;
    let offset = match &head[..4] {
        b".snd" => u32::from_be_bytes([head[4], head[5], head[6], head[7]]),
        b"dns." => u32::from_le_bytes([head[4], head[5], head[6], head[7]]),
        _ => return Ok(Some(head)),
    } as usize;
    let mut rest = vec![0u8; offset.saturating_sub(8)];
    r.read_exact(&mut rest)?;
    Ok(None)
}

fn push_samples(bytes: &[u8], out: &mut Vec<f32>) {
    // Capture streams can start with garbage (we have seen NaN in the first
    // buffer); one non-finite sample would poison every running average.
    out.extend(bytes.chunks_exact(4).map(|b| {
        let x = f32::from_le_bytes([b[0], b[1], b[2], b[3]]);
        if x.is_finite() { x.clamp(-4.0, 4.0) } else { 0.0 }
    }));
}

impl Drop for Reader {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

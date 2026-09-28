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
}

pub struct Reader {
    child: Child,
    buf: Vec<u8>,
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
                c
            }
            Source::File { path, realtime } => {
                let mut c = Command::new("ffmpeg");
                c.args(["-v", "error", "-nostdin"]);
                if *realtime {
                    c.arg("-re");
                }
                c.arg("-i").arg(path).args(["-f", "f32le", "-ac", "2", "-ar", "48000", "-"]);
                c
            }
        };
        let child = cmd
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .stdin(Stdio::null())
            .spawn()
            .with_context(|| format!("starting audio source {self:?}"))?;
        Ok(Reader { child, buf: vec![0u8; 4096] })
    }
}

impl Reader {
    /// Blocking read of the next chunk of samples. `false` at end of stream.
    pub fn next_chunk(&mut self, out: &mut Vec<f32>) -> Result<bool> {
        let stdout = self.child.stdout.as_mut().context("no stdout")?;
        out.clear();
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

fn push_samples(bytes: &[u8], out: &mut Vec<f32>) {
    out.extend(bytes.chunks_exact(4).map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]])));
}

impl Drop for Reader {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

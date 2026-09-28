mod analysis;
mod frame;
mod guard;
mod limits;
mod nowplaying;
mod server;
mod source;
mod theme;

use anyhow::{Context, Result, bail};
use std::io::{BufWriter, Write};
use std::path::PathBuf;

const USAGE: &str = "\
wobble-brain — Wobble Party audio brain

USAGE:
  wobble-brain serve [--port 7477] [--static DIR] [--file PATH [--loop]]
                     [--exit-when-idle SECS] [--dev-origin ORIGIN]
      Listen to the desktop mix (default sink monitor), or a file played in
      real time, and stream analysis frames to the stage at ws://127.0.0.1:PORT/ws.
      The stage is built in; --static serves it from disk instead (development).
      --exit-when-idle stops the brain once no stage has been connected for SECS.
      Only the brain's own page may call it; --dev-origin also allows one more
      exact origin (development: http://127.0.0.1:5188 for the Vite server).

  wobble-brain analyze PATH [--out FILE.jsonl] [--features]
      Analyse a file offline (as fast as possible) and write one JSON frame
      per line. --features adds the vocal feature vector (`vf`). PATH `-`
      reads raw f32le stereo 48 kHz from stdin.

  wobble-brain features
      Read raw f32le stereo 48 kHz on stdin, write the vocal network's input
      features (128 x f32 per frame) to stdout. Used by tools/vocal_train.py.

  wobble-brain info
      Report whether the singing-voice network is compiled in.
";

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let Some(cmd) = args.first() else {
        print!("{USAGE}");
        return Ok(());
    };
    let flag = |name: &str| args.iter().any(|a| a == name);
    let value = |name: &str| args.iter().position(|a| a == name).and_then(|i| args.get(i + 1)).cloned();

    match cmd.as_str() {
        "serve" => {
            let port = value("--port").map(|p| p.parse()).transpose()?.unwrap_or(7477);
            let static_dir = value("--static").map(PathBuf::from);
            let exit_when_idle = value("--exit-when-idle").map(|s| s.parse::<f64>()).transpose()?.map(std::time::Duration::from_secs_f64);
            let source = match value("--file") {
                Some(p) => source::Source::File { path: p.into(), realtime: true },
                None => source::Source::Monitor,
            };
            guard::configure(port, value("--dev-origin"));
            let rt = tokio::runtime::Runtime::new()?;
            rt.block_on(server::run(server::Options { port, source, static_dir, loop_file: flag("--loop"), exit_when_idle }))
        }
        "analyze" => {
            let path = args.get(1).context("analyze needs a PATH")?;
            // `-` reads raw f32le stereo 48 kHz from stdin (e.g. a pw-record capture).
            let src = if path == "-" { source::Source::Stdin } else { source::Source::File { path: path.into(), realtime: false } };
            let mut reader = src.open()?;
            let out: Box<dyn Write> = match value("--out") {
                Some(p) => Box::new(std::fs::File::create(p)?),
                None => Box::new(std::io::stdout().lock()),
            };
            let mut out = BufWriter::new(out);
            let mut analyzer = analysis::Analyzer::new();
            analyzer.emit_features = flag("--features");
            let mut chunk = Vec::new();
            let mut err = None;
            while reader.next_chunk(&mut chunk)? {
                analyzer.push(&chunk, |f| {
                    if err.is_none()
                        && let Err(e) = serde_json::to_writer(&mut out, &f).map_err(anyhow::Error::from).and_then(|_| {
                            out.write_all(b"\n")?;
                            Ok(())
                        })
                    {
                        err = Some(e);
                    }
                });
            }
            if let Some(e) = err {
                return Err(e);
            }
            out.flush()?;
            Ok(())
        }
        "features" => {
            let mut analyzer = analysis::Analyzer::new();
            analyzer.mel_sink = Some(Vec::new());
            let mut stdin = std::io::stdin().lock();
            let mut stdout = BufWriter::new(std::io::stdout().lock());
            let mut bytes = vec![0u8; 1 << 16];
            let mut carry: Vec<u8> = Vec::new();
            let mut samples = Vec::new();
            loop {
                let n = std::io::Read::read(&mut stdin, &mut bytes)?;
                if n == 0 {
                    break;
                }
                carry.extend_from_slice(&bytes[..n]);
                let whole = carry.len() - carry.len() % 8;
                samples.clear();
                samples.extend(carry[..whole].chunks_exact(4).map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]])));
                carry.drain(..whole);
                analyzer.push(&samples, |_| {});
                let sink = analyzer.mel_sink.as_mut().expect("sink set");
                for v in sink.drain(..) {
                    stdout.write_all(&v.to_le_bytes())?;
                }
            }
            stdout.flush()?;
            Ok(())
        }
        "info" => {
            let a = analysis::Analyzer::new();
            println!("vocal network: {}", if a.has_net() { "embedded" } else { "missing (DSP fallback)" });
            Ok(())
        }
        "-h" | "--help" | "help" => {
            print!("{USAGE}");
            Ok(())
        }
        other => bail!("unknown command `{other}`\n\n{USAGE}"),
    }
}

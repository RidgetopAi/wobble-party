//! The analysis chain. Feed interleaved stereo f32 at 48 kHz, get `Frame`s.

pub mod beat;
pub mod dsp;
pub mod mel;
pub mod net;
pub mod sections;
pub mod vocal;

use crate::frame::Frame;
use dsp::{AutoRange, Follower, PeakPicker, PeakScale, Stft, db, hz_to_bin};

pub const SAMPLE_RATE: f32 = 48_000.0;
pub const HOP: usize = 512;
pub const FPS: f32 = SAMPLE_RATE / HOP as f32;
const WIN: usize = 2048;
const VOCAL_WIN: usize = 4096;
const RING: usize = VOCAL_WIN;
const SILENCE_DB: f32 = -62.0;

const BAND_EDGES: [(f32, f32); 6] = [
    (20.0, 60.0),
    (60.0, 150.0),
    (150.0, 400.0),
    (400.0, 2000.0),
    (2000.0, 6000.0),
    (6000.0, 16000.0),
];

pub struct Analyzer {
    ring_l: Vec<f32>,
    ring_r: Vec<f32>,
    write: usize,
    pending: usize,
    samples: u64,
    stft: Stft,
    vstft: Stft,
    prev_log: Vec<f32>,
    level_range: AutoRange,
    band_ranges: Vec<AutoRange>,
    band_smooth: Vec<Follower>,
    level_smooth: Follower,
    flux_scale: PeakScale,
    onset_pick: PeakPicker,
    kick_pick: PeakPicker,
    snare_pick: PeakPicker,
    hat_pick: PeakPicker,
    kick_scale: PeakScale,
    beat: beat::BeatTracker,
    sections: sections::Sections,
    vocal: vocal::VocalDetector,
    mel: mel::Mel,
    net: Option<net::VocalNet>,
    silent_frames: usize,
    pub emit_features: bool,
    /// When set, every hop's network input features are appended here.
    pub mel_sink: Option<Vec<f32>>,
}

impl Default for Analyzer {
    fn default() -> Self {
        Self::new()
    }
}

impl Analyzer {
    /// True when the trained singing-voice network is compiled in.
    pub fn has_net(&self) -> bool {
        self.net.is_some()
    }

    pub fn new() -> Self {
        let vstft = Stft::new(VOCAL_WIN);
        let vbin = vstft.bin_hz(SAMPLE_RATE);
        Self {
            ring_l: vec![0.0; RING],
            ring_r: vec![0.0; RING],
            write: 0,
            pending: 0,
            samples: 0,
            stft: Stft::new(WIN),
            vstft,
            prev_log: vec![0.0; WIN / 2 + 1],
            level_range: AutoRange::new(24.0, FPS),
            band_ranges: (0..6).map(|_| AutoRange::new(20.0, FPS)).collect(),
            band_smooth: (0..6).map(|_| Follower::new(0.01, 0.12, FPS)).collect(),
            level_smooth: Follower::new(0.01, 0.15, FPS),
            flux_scale: PeakScale::new(8.0, FPS, 1e-3),
            onset_pick: PeakPicker::new(FPS, 0.5, 1.4, 0.10, 0.07),
            kick_pick: PeakPicker::new(FPS, 0.5, 1.5, 0.15, 0.12),
            snare_pick: PeakPicker::new(FPS, 0.5, 1.5, 0.15, 0.12),
            hat_pick: PeakPicker::new(FPS, 0.5, 1.4, 0.12, 0.06),
            kick_scale: PeakScale::new(8.0, FPS, 1e-3),
            beat: beat::BeatTracker::new(FPS),
            sections: sections::Sections::new(FPS),
            vocal: vocal::VocalDetector::new(FPS, vbin),
            mel: mel::Mel::new(WIN, SAMPLE_RATE, FPS),
            net: net::VocalNet::embedded().filter(|n| n.n_inputs() == mel::N_FEAT),
            silent_frames: 0,
            emit_features: false,
            mel_sink: None,
        }
    }

    /// Push interleaved stereo samples; calls `out` for every completed hop.
    pub fn push(&mut self, interleaved: &[f32], mut out: impl FnMut(Frame)) {
        for pair in interleaved.chunks_exact(2) {
            self.ring_l[self.write] = pair[0];
            self.ring_r[self.write] = pair[1];
            self.write = (self.write + 1) % RING;
            self.pending += 1;
            self.samples += 1;
            if self.pending == HOP {
                self.pending = 0;
                out(self.hop());
            }
        }
    }

    fn hop(&mut self) -> Frame {
        let t = self.samples as f64 / SAMPLE_RATE as f64;

        // Level of the newest hop.
        let mut sum = 0.0;
        for (l, r) in window(self.write, HOP, &self.ring_l).zip(window(self.write, HOP, &self.ring_r)) {
            let m = 0.5 * (l + r);
            sum += m * m;
        }
        let rms_db = db(sum / HOP as f32);
        let silent_now = rms_db < SILENCE_DB;
        self.silent_frames = if silent_now { self.silent_frames + 1 } else { 0 };
        let silent = self.silent_frames as f32 > 0.25 * FPS;

        let (l, r): (Vec<f32>, Vec<f32>) = (
            window(self.write, WIN, &self.ring_l).collect(),
            window(self.write, WIN, &self.ring_r).collect(),
        );
        self.stft.process(l.into_iter(), r.into_iter());
        let bin_hz = self.stft.bin_hz(SAMPLE_RATE);
        let mag = &self.stft.mag;

        // Bands.
        let mut bands = [0.0f32; 6];
        for (i, &(lo, hi)) in BAND_EDGES.iter().enumerate() {
            let (a, b) = (hz_to_bin(lo, bin_hz).max(1), hz_to_bin(hi, bin_hz).min(mag.len() - 1));
            let p: f32 = mag[a..=b].iter().map(|m| m * m).sum();
            let v = if silent { 0.0 } else { self.band_ranges[i].update(db(p)) };
            bands[i] = self.band_smooth[i].update(v);
        }
        let level = self.level_smooth.update(if silent { 0.0 } else { self.level_range.update(rms_db) });

        // Brightness: spectral centroid on a log scale 200 Hz..8 kHz.
        let (mut num, mut den) = (0.0, 0.0);
        for (k, m) in mag.iter().enumerate().skip(1) {
            num += k as f32 * bin_hz * m;
            den += m;
        }
        let centroid = if den > 1e-9 { num / den } else { 200.0 };
        let brightness = ((centroid.max(1.0) / 200.0).log2() / (8000.0f32 / 200.0).log2()).clamp(0.0, 1.0);

        // Log-magnitude spectral flux, overall and per region.
        let (mut flux, mut low, mut mid, mut high) = (0.0, 0.0, 0.0, 0.0);
        let (k_low, k_mid, k_high) = (hz_to_bin(150.0, bin_hz), hz_to_bin(5000.0, bin_hz), hz_to_bin(16000.0, bin_hz));
        for k in 1..=k_high.min(mag.len() - 1) {
            let lg = (1.0 + 1000.0 * mag[k]).ln();
            let d = (lg - self.prev_log[k]).max(0.0);
            self.prev_log[k] = lg;
            flux += d;
            if k <= k_low {
                low += d;
            } else if k <= k_mid {
                mid += d;
            } else {
                high += d;
            }
        }
        let flux_n = if silent { 0.0 } else { self.flux_scale.update(flux) };
        let onset = self.onset_pick.update(flux);
        let kick = self.kick_pick.update(low);
        let snare = self.snare_pick.update(mid);
        let hat = self.hat_pick.update(high);
        let low_n = self.kick_scale.update(low);

        let b = self.beat.update(flux_n, low_n, silent);
        let s = self.sections.update(level, bands[1], bands[5], onset, self.beat.confidence);

        let (vl, vr): (Vec<f32>, Vec<f32>) = (
            window(self.write, VOCAL_WIN, &self.ring_l).collect(),
            window(self.write, VOCAL_WIN, &self.ring_r).collect(),
        );
        self.vstft.process(vl.into_iter(), vr.into_iter());
        let feats = self.mel.update(&self.stft.mag, &self.stft.side, silent);
        if let Some(sink) = self.mel_sink.as_mut() {
            sink.extend_from_slice(feats);
        }
        let net_out = self.net.as_mut().map(|n| n.step(feats));
        let v = self.vocal.update(&self.vstft.mag, &self.vstft.center, net_out, silent);

        Frame {
            t,
            silent,
            level,
            db: rms_db,
            bands,
            brightness,
            flux: flux_n,
            onset,
            kick,
            snare,
            hat,
            bpm: self.beat.bpm,
            beat_conf: self.beat.confidence,
            beat_phase: self.beat.phase,
            beat: self.beat.beat,
            bar_beat: b.bar_beat,
            beat_hit: b.hit,
            energy: s.energy,
            energy_long: s.energy_long,
            build: s.build,
            drop: s.drop,
            calm: s.calm,
            density: s.density,
            section: s.section,
            vocal: v.presence,
            vocal_env: v.env,
            syllable: v.syllable,
            pitch: v.pitch,
            pitch_hz: v.pitch_hz,
            phrase: v.phrase,
            vf: self.emit_features.then(|| {
                let mut vf = v.features.to_vec();
                if let Some((p, l)) = net_out {
                    vf.extend([p, l]);
                }
                vf
            }),
        }
    }
}

/// The newest `n` samples of a ring buffer, oldest first.
fn window(write: usize, n: usize, ring: &[f32]) -> impl Iterator<Item = f32> + '_ {
    let start = (write + RING - n) % RING;
    (0..n).map(move |i| ring[(start + i) % RING])
}

//! Song-relative intensity: how close the music is to this song's loud parts.
//!
//! `level` (auto-ranged against its own quiet moments) pumps nicely with each
//! kick, but it reads dense music as quiet: a wall of guitar or a compressed
//! club mix never dips, so it sits just above its own floor. Intensity instead
//! compares perceived loudness with a reference for "loud, for this song":
//!
//!   STFT power (both channels) -> K-weighting (ITU-R BS.1770) -> 1 s mean
//!   -> dB  (`loud`)
//!   0.5 s blocks -> 90th percentile over the last 60 s -> reference that
//!   rises in seconds and falls over tens of seconds (`reference`), held
//!   through silence so the next song starts from the last one's loudness
//!   -> intensity = 0.8 at the reference, 1 a few dB above, 0 far below.

use super::dsp::coef;
use std::collections::VecDeque;

/// Loudness window: about a beat or two, so sparse grooves (hip-hop: hits
/// with gaps) read as loud as dense ones instead of dipping between hits.
const MOMENTARY_S: f32 = 1.0;
/// Reference block length and history.
const BLOCK_S: f32 = 0.5;
const HISTORY_S: f32 = 60.0;
const PERCENTILE: f32 = 0.9;
/// Reference time constants: catch a louder section fast, forget it slowly.
const RISE_S: f32 = 1.5;
const FALL_S: f32 = 25.0;
/// Intensity at the reference, and the dB span from silent-ish to there.
const AT_REF: f32 = 0.8;
const SPAN_DB: f32 = 15.0;
/// Until the reference has heard this much music it is a guess (the first
/// song's intro may be its loudest part so far): blend toward a neutral groove.
const LEARN_S: f32 = 20.0;
const NEUTRAL: f32 = 0.65;

pub struct Intensity {
    weights: Vec<f32>,
    ring: VecDeque<f32>,
    ring_len: usize,
    sum: f64,
    block: (f64, usize),
    block_len: usize,
    history: VecDeque<f32>,
    history_len: usize,
    scratch: Vec<f32>,
    target: f32,
    pub reference: f32,
    primed: bool,
    /// Blocks of music heard since start (saturating; drives the learning blend).
    heard: usize,
    rise: f32,
    fall: f32,
}

pub struct IntensityOut {
    /// K-weighted momentary loudness, dB (relative, not calibrated LUFS).
    pub loud: f32,
    pub reference: f32,
    pub intensity: f32,
}

impl Intensity {
    pub fn new(n_fft: usize, sample_rate: f32, fps: f32) -> Self {
        let bin_hz = sample_rate / n_fft as f32;
        let weights = (0..=n_fft / 2).map(|k| k_weight_power(k as f32 * bin_hz, sample_rate)).collect();
        let ring_len = (MOMENTARY_S * fps).round() as usize;
        let block_len = (BLOCK_S * fps).round() as usize;
        Self {
            weights,
            ring: VecDeque::with_capacity(ring_len),
            ring_len,
            sum: 0.0,
            block: (0.0, 0),
            block_len,
            history: VecDeque::new(),
            history_len: (HISTORY_S / BLOCK_S) as usize,
            scratch: Vec::new(),
            target: 0.0,
            reference: 0.0,
            primed: false,
            heard: 0,
            rise: coef(RISE_S, fps),
            fall: coef(FALL_S, fps),
        }
    }

    /// `mag`/`side`: mid and side magnitude spectra of the newest window.
    pub fn update(&mut self, mag: &[f32], side: &[f32], silent: bool) -> IntensityOut {
        // Mid² + side² = (L² + R²) / 2: both channels, so wide-panned guitars count.
        let p: f32 = mag.iter().zip(side).zip(&self.weights).map(|((m, s), w)| (m * m + s * s) * w).sum();
        self.ring.push_back(p);
        self.sum += p as f64;
        if self.ring.len() > self.ring_len {
            self.sum -= self.ring.pop_front().unwrap() as f64;
        }
        let mean = (self.sum.max(0.0) / self.ring.len() as f64) as f32;
        let loud = 10.0 * (mean + 1e-12).log10();

        if !silent {
            self.block.0 += p as f64;
            self.block.1 += 1;
            if self.block.1 >= self.block_len {
                let db = 10.0 * ((self.block.0 / self.block.1 as f64) as f32 + 1e-12).log10();
                self.block = (0.0, 0);
                self.history.push_back(db);
                self.heard = self.heard.saturating_add(1);
                if self.history.len() > self.history_len {
                    self.history.pop_front();
                }
                self.scratch.clear();
                self.scratch.extend(&self.history);
                self.scratch.sort_by(f32::total_cmp);
                self.target = self.scratch[((self.scratch.len() - 1) as f32 * PERCENTILE).round() as usize];
                if !self.primed {
                    self.reference = self.target;
                    self.primed = true;
                }
            }
            if self.primed {
                let k = if self.target > self.reference { self.rise } else { self.fall };
                self.reference += (self.target - self.reference) * k;
            }
        }

        let intensity = if silent || !self.primed {
            0.0
        } else {
            let raw = (AT_REF + (loud - self.reference) / SPAN_DB).clamp(0.0, 1.0);
            let heard = (self.heard as f32 * BLOCK_S / LEARN_S).min(1.0);
            NEUTRAL + (raw - NEUTRAL) * heard
        };
        IntensityOut { loud, reference: self.reference, intensity }
    }
}

/// Power gain of the BS.1770 K-weighting filter (pre-filter shelf + RLB
/// high-pass) at `f` Hz, evaluated from the standard 48 kHz biquads.
fn k_weight_power(f: f32, sample_rate: f32) -> f32 {
    let w = 2.0 * std::f64::consts::PI * f as f64 / sample_rate as f64;
    let gain = |b: [f64; 3], a: [f64; 3]| {
        // |H(e^jw)|² for H = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2).
        let (c1, s1, c2, s2) = (w.cos(), w.sin(), (2.0 * w).cos(), (2.0 * w).sin());
        let num = (b[0] + b[1] * c1 + b[2] * c2).powi(2) + (b[1] * s1 + b[2] * s2).powi(2);
        let den = (a[0] + a[1] * c1 + a[2] * c2).powi(2) + (a[1] * s1 + a[2] * s2).powi(2);
        num / den
    };
    let shelf = gain([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]);
    let highpass = gain([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]);
    (shelf * highpass) as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn k_weighting_shape() {
        let db = |f| 10.0 * k_weight_power(f, 48_000.0).log10();
        // Flat-ish through the mids, ~+4 dB shelf on top, rolled off in the sub.
        assert!(db(1000.0).abs() < 1.0, "1k {}", db(1000.0));
        assert!((db(8000.0) - 4.0).abs() < 0.5, "8k {}", db(8000.0));
        assert!(db(20.0) < -10.0, "20 Hz {}", db(20.0));
    }

    #[test]
    fn steady_loud_mix_reads_high() {
        // A dense mix that never dips: intensity should sit at the reference.
        let mut it = Intensity::new(2048, 48_000.0, 93.75);
        let mag = vec![0.01; 1025];
        let side = vec![0.005; 1025];
        let mut last = 0.0;
        for _ in 0..(30.0 * 93.75) as usize {
            last = it.update(&mag, &side, false).intensity;
        }
        assert!((last - AT_REF).abs() < 0.02, "steady intensity {last}");
    }

    #[test]
    fn breakdown_reads_low_and_reference_holds() {
        let mut it = Intensity::new(2048, 48_000.0, 93.75);
        let loud = vec![0.01; 1025];
        let quiet = vec![0.0025; 1025]; // -12 dB
        for _ in 0..(40.0 * 93.75) as usize {
            it.update(&loud, &loud, false);
        }
        let reference = it.reference;
        let mut last = 0.0;
        for _ in 0..(8.0 * 93.75) as usize {
            last = it.update(&quiet, &quiet, false).intensity;
        }
        assert!(last < 0.25, "breakdown intensity {last}");
        assert!(reference - it.reference < 3.0, "reference fell {} dB in 8 s", reference - it.reference);
    }
}

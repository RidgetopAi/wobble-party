//! Singing-voice detector for full mixes (causal, DSP features + a small
//! logistic model fitted against a cappella ground truth, see `tools/`).
//!
//! Signal path:
//!   4096-pt STFT -> causal HPSS mask (median over time vs over frequency)
//!   -> centre-weighted harmonic spectrum -> features:
//!      vocal-band level, vocal-band dominance, harmonic ratio, centre ratio,
//!      pitch salience, pitch motion (glide/vibrato), syllabic modulation,
//!      vocal-band flux
//!   -> logistic presence -> hysteresis phrases, syllable events, pitch.

use super::dsp::{AutoRange, Follower, PeakPicker, coef, db, hz_to_bin, median_in_place};
use std::collections::VecDeque;

pub const N_FEATURES: usize = 8;

/// Logistic weights over the feature vector, fitted by `tools/fit_vocal.py`.
pub const WEIGHTS: [f32; N_FEATURES] = [2.0, 1.5, 2.0, 1.0, 2.5, 2.0, 2.0, 0.5];
pub const BIAS: f32 = -6.0;

const TIME_MEDIAN: usize = 9;
const FREQ_MEDIAN_HALF: usize = 8;
const MOD_LEN: usize = 128;

pub struct VocalOut {
    pub presence: f32,
    pub env: f32,
    pub syllable: f32,
    pub pitch: f32,
    pub pitch_hz: f32,
    pub phrase: u8,
    pub features: [f32; N_FEATURES],
}

pub struct VocalDetector {
    fps: f32,
    bin_hz: f32,
    top_bin: usize,
    hist: VecDeque<Vec<f32>>,
    scratch: Vec<f32>,
    mask: Vec<f32>,
    hc: Vec<f32>,
    prev_log: Vec<f32>,
    f0_grid: Vec<f32>,
    level_range: AutoRange,
    dom_range: AutoRange,
    flux_scale: super::dsp::PeakScale,
    pitch_hist: VecDeque<(f32, f32)>,
    env_hist: VecDeque<f32>,
    mod_cos: Vec<Vec<f32>>,
    mod_sin: Vec<Vec<f32>>,
    presence: Follower,
    env: Follower,
    syllables: PeakPicker,
    in_phrase: bool,
    below_for: usize,
    pitch_center: f32,
    pitch_smooth: f32,
    pitch_k: f32,
    net_level_prev: f32,
}

impl VocalDetector {
    pub fn new(fps: f32, bin_hz: f32) -> Self {
        let top_bin = hz_to_bin(5000.0, bin_hz);
        // f0 candidates: 80..1000 Hz in quarter-tone steps.
        let mut f0_grid = Vec::new();
        let mut f = 80.0f32;
        while f <= 1000.0 {
            f0_grid.push(f);
            f *= 2f32.powf(1.0 / 24.0);
        }
        // Modulation analysis: correlate the level envelope with sinusoids.
        let mod_freqs: Vec<f32> = (1..=40).map(|i| i as f32 * 0.5).collect();
        let mod_cos = mod_freqs
            .iter()
            .map(|&mf| (0..MOD_LEN).map(|i| (2.0 * std::f32::consts::PI * mf * i as f32 / fps).cos()).collect())
            .collect();
        let mod_sin = mod_freqs
            .iter()
            .map(|&mf| (0..MOD_LEN).map(|i| (2.0 * std::f32::consts::PI * mf * i as f32 / fps).sin()).collect())
            .collect();
        Self {
            fps,
            bin_hz,
            top_bin,
            hist: VecDeque::with_capacity(TIME_MEDIAN + 1),
            scratch: Vec::with_capacity(32),
            mask: vec![0.0; top_bin + 1],
            hc: vec![0.0; top_bin + 1],
            prev_log: vec![0.0; top_bin + 1],
            f0_grid,
            level_range: AutoRange::new(18.0, fps),
            dom_range: AutoRange::new(10.0, fps),
            flux_scale: super::dsp::PeakScale::new(5.0, fps, 1e-3),
            pitch_hist: VecDeque::with_capacity(40),
            env_hist: VecDeque::with_capacity(MOD_LEN + 1),
            mod_cos,
            mod_sin,
            presence: Follower::new(0.06, 0.25, fps),
            env: Follower::new(0.015, 0.08, fps),
            syllables: PeakPicker::new(fps, 0.4, 1.2, 0.12, 0.09),
            in_phrase: false,
            below_for: 0,
            pitch_center: 60.0,
            pitch_smooth: 0.0,
            pitch_k: coef(0.05, fps),
            net_level_prev: 0.0,
        }
    }

    /// `net`: (presence probability, vocal level) from the trained network,
    /// when available; otherwise the logistic DSP model is used.
    pub fn update(&mut self, mag: &[f32], center: &[f32], net: Option<(f32, f32)>, silent: bool) -> VocalOut {
        let top = self.top_bin;
        self.hist.push_back(mag[..=top].to_vec());
        if self.hist.len() > TIME_MEDIAN {
            self.hist.pop_front();
        }

        // Causal HPSS soft mask.
        for k in 0..=top {
            self.scratch.clear();
            self.scratch.extend(self.hist.iter().map(|h| h[k]));
            let h = median_in_place(&mut self.scratch);
            self.scratch.clear();
            let lo = k.saturating_sub(FREQ_MEDIAN_HALF);
            let hi = (k + FREQ_MEDIAN_HALF).min(top);
            self.scratch.extend_from_slice(&mag[lo..=hi]);
            let p = median_in_place(&mut self.scratch);
            let (h2, p2) = (h * h, p * p);
            self.mask[k] = h2 / (h2 + p2 + 1e-20);
        }

        let b = |hz: f32| hz_to_bin(hz, self.bin_hz);
        let (v_lo, v_hi) = (b(200.0), b(4000.0));
        let mut e_vocal_h = 0.0; // harmonic, centre-weighted, vocal band
        let mut e_vocal_raw = 0.0;
        let mut e_vocal_harm = 0.0;
        let mut e_center = 0.0;
        for k in 0..=top {
            let hm = mag[k] * self.mask[k];
            let w = 0.25 + 0.75 * center[k];
            self.hc[k] = hm * w;
            if k >= v_lo && k <= v_hi {
                let m2 = mag[k] * mag[k];
                e_vocal_raw += m2;
                e_vocal_harm += hm * hm;
                e_center += m2 * center[k];
                e_vocal_h += self.hc[k] * self.hc[k];
            }
        }
        let e_total: f32 = mag[b(30.0)..mag.len().min(b(16000.0))].iter().map(|m| m * m).sum();

        let level = if silent { 0.0 } else { self.level_range.update(db(e_vocal_h)) };
        let dominance = if silent { 0.0 } else { self.dom_range.update(db(e_vocal_h / (e_total + 1e-12))) };
        let harm_ratio = e_vocal_harm / (e_vocal_raw + 1e-12);
        let center_ratio = e_center / (e_vocal_raw + 1e-12);

        // Pitch salience by harmonic summation on the centre-harmonic spectrum.
        let (f0, salience) = self.pitch();
        let midi = 69.0 + 12.0 * (f0 / 440.0).log2();
        self.pitch_hist.push_back((midi, salience));
        if self.pitch_hist.len() > 30 {
            self.pitch_hist.pop_front();
        }
        let motion = self.pitch_motion();

        // Syllabic modulation of the vocal-band level (3-8 Hz share).
        self.env_hist.push_back(e_vocal_h.sqrt());
        if self.env_hist.len() > MOD_LEN {
            self.env_hist.pop_front();
        }
        let modulation = self.modulation();

        // Vocal-band flux on the harmonic-centre spectrum.
        let mut flux = 0.0;
        for k in b(300.0)..=b(3500.0) {
            let l = (1.0 + 1000.0 * self.hc[k]).ln();
            flux += (l - self.prev_log[k]).max(0.0);
            self.prev_log[k] = l;
        }
        let flux_n = self.flux_scale.update(flux);

        let features = [
            level,
            dominance,
            harm_ratio,
            center_ratio,
            (salience / 4.0).min(1.5),
            motion,
            modulation,
            flux_n,
        ];
        let (raw_presence, vocal_level, syl_signal) = match net {
            Some((p, lvl)) => {
                // Syllables = rises in the network's vocal-level estimate.
                let rise = (lvl - self.net_level_prev).max(0.0);
                self.net_level_prev = lvl;
                (p, lvl, rise)
            }
            None => {
                let z: f32 = BIAS + WEIGHTS.iter().zip(&features).map(|(w, f)| w * f).sum::<f32>();
                (1.0 / (1.0 + (-z).exp()), level, flux)
            }
        };
        let presence = self.presence.update(if silent { 0.0 } else { raw_presence });
        let env = self.env.update(if silent { 0.0 } else { vocal_level * smoothstep(0.25, 0.65, presence) });

        let syl = self.syllables.update(syl_signal);
        let syllable = if presence > 0.45 { syl } else { 0.0 };

        // Phrase hysteresis with a short gap tolerance.
        let mut phrase = 0;
        if !self.in_phrase && presence > 0.6 {
            self.in_phrase = true;
            self.below_for = 0;
            phrase = 1;
        } else if self.in_phrase {
            if presence < 0.35 {
                self.below_for += 1;
                if self.below_for as f32 > 0.3 * self.fps {
                    self.in_phrase = false;
                    phrase = 2;
                }
            } else {
                self.below_for = 0;
            }
        }

        // Pitch relative to the singer's running centre, in octaves (-1..1).
        if presence > 0.55 && salience > 2.0 {
            self.pitch_center += (midi - self.pitch_center) * 0.01;
            let rel = ((midi - self.pitch_center) / 12.0).clamp(-1.0, 1.0);
            self.pitch_smooth += (rel - self.pitch_smooth) * self.pitch_k;
        } else {
            self.pitch_smooth *= 0.99;
        }

        VocalOut {
            presence,
            env,
            syllable,
            pitch: self.pitch_smooth,
            pitch_hz: if presence > 0.5 { f0 } else { 0.0 },
            phrase,
            features,
        }
    }

    fn pitch(&self) -> (f32, f32) {
        let spec = &self.hc;
        let comp = |k: usize| -> f32 { if k < spec.len() { spec[k].sqrt() } else { 0.0 } };
        let mut best = (0.0f32, 0.0f32);
        let mut total = 0.0;
        for &f0 in &self.f0_grid {
            let mut s = 0.0;
            let mut w = 1.0;
            for h in 1..=8 {
                let pos = f0 * h as f32 / self.bin_hz;
                let k = pos.round() as usize;
                if k + 1 >= spec.len() {
                    break;
                }
                let v = comp(k).max(comp(k.saturating_sub(1)) * 0.7).max(comp(k + 1) * 0.7);
                s += v * w;
                w *= 0.82;
            }
            total += s;
            if s > best.1 {
                best = (f0, s);
            }
        }
        let mean = total / self.f0_grid.len() as f32;
        (best.0, if mean > 1e-9 { best.1 / mean } else { 0.0 })
    }

    fn pitch_motion(&self) -> f32 {
        // Mean small pitch movement (semitones/frame) across salient frames,
        // scaled so that sung vibrato/glides land near 1.
        let mut acc = 0.0;
        let mut n = 0;
        for w in self.pitch_hist.iter().collect::<Vec<_>>().windows(2) {
            let (a, b) = (w[0], w[1]);
            if a.1 > 2.0 && b.1 > 2.0 {
                let d = (b.0 - a.0).abs();
                if d < 1.5 && d > 0.0 {
                    acc += d;
                }
                n += 1;
            }
        }
        if n < 6 {
            return 0.0;
        }
        (acc / n as f32 / 0.25).min(1.5)
    }

    fn modulation(&self) -> f32 {
        if self.env_hist.len() < MOD_LEN {
            return 0.0;
        }
        let mean = self.env_hist.iter().sum::<f32>() / MOD_LEN as f32;
        if mean < 1e-9 {
            return 0.0;
        }
        let mut syll = 0.0;
        let mut all = 0.0;
        for (j, (c, s)) in self.mod_cos.iter().zip(&self.mod_sin).enumerate() {
            let mf = (j + 1) as f32 * 0.5;
            let (mut re, mut im) = (0.0, 0.0);
            for (i, v) in self.env_hist.iter().enumerate() {
                let x = v - mean;
                re += x * c[i];
                im += x * s[i];
            }
            let p = re * re + im * im;
            all += p;
            if (3.0..=8.0).contains(&mf) {
                syll += p;
            }
        }
        if all < 1e-12 { 0.0 } else { syll / all }
    }
}

pub fn smoothstep(a: f32, b: f32, x: f32) -> f32 {
    let t = ((x - a) / (b - a)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

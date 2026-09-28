//! Small DSP building blocks shared by the analysis stages.

use rustfft::{Fft, FftPlanner, num_complex::Complex};
use std::collections::VecDeque;
use std::sync::Arc;

/// Stereo short-time Fourier transform with a Hann window.
///
/// Produces per-bin magnitudes of the mid and side signals plus a per-bin
/// "centerness" (1.0 when left and right agree, 0.0 when they are
/// uncorrelated or panned).
pub struct Stft {
    pub n: usize,
    fft: Arc<dyn Fft<f32>>,
    window: Vec<f32>,
    buf_l: Vec<Complex<f32>>,
    buf_r: Vec<Complex<f32>>,
    pub mag: Vec<f32>,
    pub side: Vec<f32>,
    pub center: Vec<f32>,
}

impl Stft {
    pub fn new(n: usize) -> Self {
        let mut planner = FftPlanner::new();
        let window = (0..n)
            .map(|i| 0.5 - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / n as f32).cos())
            .collect();
        Self {
            n,
            fft: planner.plan_fft_forward(n),
            window,
            buf_l: vec![Complex::default(); n],
            buf_r: vec![Complex::default(); n],
            mag: vec![0.0; n / 2 + 1],
            side: vec![0.0; n / 2 + 1],
            center: vec![0.0; n / 2 + 1],
        }
    }

    /// `l` and `r` must each hold exactly `n` samples (oldest first).
    pub fn process(&mut self, l: impl Iterator<Item = f32>, r: impl Iterator<Item = f32>) {
        for ((dst, s), w) in self.buf_l.iter_mut().zip(l).zip(&self.window) {
            *dst = Complex::new(s * w, 0.0);
        }
        for ((dst, s), w) in self.buf_r.iter_mut().zip(r).zip(&self.window) {
            *dst = Complex::new(s * w, 0.0);
        }
        self.fft.process(&mut self.buf_l);
        self.fft.process(&mut self.buf_r);
        let scale = 2.0 / self.n as f32;
        for k in 0..=self.n / 2 {
            let (a, b) = (self.buf_l[k], self.buf_r[k]);
            let mid = (a + b) * 0.5;
            self.mag[k] = mid.norm() * scale;
            self.side[k] = ((a - b) * 0.5).norm() * scale;
            let pa = a.norm_sqr();
            let pb = b.norm_sqr();
            let denom = pa + pb;
            self.center[k] = if denom > 1e-18 {
                let ratio = 0.5 + (a.re * b.re + a.im * b.im) / denom;
                ((ratio - 0.5) * 2.0).clamp(0.0, 1.0)
            } else {
                0.0
            };
        }
    }

    pub fn bin_hz(&self, sample_rate: f32) -> f32 {
        sample_rate / self.n as f32
    }
}

/// One-pole smoothing coefficient for a time constant in seconds at `fps`.
pub fn coef(tau_s: f32, fps: f32) -> f32 {
    1.0 - (-1.0 / (tau_s * fps)).exp()
}

/// Asymmetric one-pole follower (fast attack, slower release, or vice versa).
#[derive(Clone, Copy)]
pub struct Follower {
    pub value: f32,
    up: f32,
    down: f32,
}

impl Follower {
    pub fn new(attack_s: f32, release_s: f32, fps: f32) -> Self {
        Self { value: 0.0, up: coef(attack_s, fps), down: coef(release_s, fps) }
    }
    pub fn update(&mut self, x: f32) -> f32 {
        let k = if x > self.value { self.up } else { self.down };
        self.value += (x - self.value) * k;
        self.value
    }
}

/// Adaptive range normaliser working in dB.
///
/// Tracks a slow floor and a peak with slow release so that the output uses
/// the full 0..1 range regardless of master volume or mastering loudness.
#[derive(Clone, Debug)]
pub struct AutoRange {
    floor: f32,
    peak: f32,
    min_range: f32,
    peak_release: f32,
    floor_rise: f32,
    floor_fall: f32,
    primed: bool,
}

impl AutoRange {
    pub fn new(min_range_db: f32, fps: f32) -> Self {
        Self {
            floor: -80.0,
            peak: -20.0,
            min_range: min_range_db,
            peak_release: 2.5 / fps,
            floor_rise: coef(12.0, fps),
            floor_fall: coef(0.8, fps),
            primed: false,
        }
    }

    pub fn update(&mut self, db: f32) -> f32 {
        if !db.is_finite() {
            return 0.0;
        }
        if !self.primed && db > -90.0 {
            self.floor = db - self.min_range;
            self.peak = db;
            self.primed = true;
        }
        if db > self.peak {
            self.peak = db;
        } else {
            self.peak -= self.peak_release;
        }
        let k = if db > self.floor { self.floor_rise } else { self.floor_fall };
        self.floor += (db - self.floor) * k;
        if self.peak < self.floor + self.min_range {
            self.peak = self.floor + self.min_range;
        }
        ((db - self.floor) / (self.peak - self.floor)).clamp(0.0, 1.0)
    }
}

/// Running peak with slow release, for scaling unbounded detection functions.
pub struct PeakScale {
    peak: f32,
    release: f32,
    floor: f32,
}

impl PeakScale {
    pub fn new(release_s: f32, fps: f32, floor: f32) -> Self {
        Self { peak: floor, release: (-1.0 / (release_s * fps)).exp(), floor }
    }
    pub fn update(&mut self, x: f32) -> f32 {
        self.peak = (self.peak * self.release).max(x).max(self.floor);
        (x / self.peak).clamp(0.0, 1.0)
    }
}

/// Adaptive-threshold peak picker for onset detection functions.
///
/// Reports a peak one frame late (it needs the next value to confirm a local
/// maximum). Strength is how far the peak cleared the threshold, 0..1.
pub struct PeakPicker {
    hist: VecDeque<f32>,
    len: usize,
    mult: f32,
    add: f32,
    refractory: usize,
    since: usize,
    prev: f32,
    prev2: f32,
    scale: PeakScale,
    scratch: Vec<f32>,
}

impl PeakPicker {
    pub fn new(fps: f32, window_s: f32, mult: f32, add: f32, refractory_s: f32) -> Self {
        let len = (window_s * fps) as usize;
        Self {
            hist: VecDeque::with_capacity(len + 1),
            len,
            mult,
            add,
            refractory: (refractory_s * fps).round() as usize,
            since: usize::MAX / 2,
            prev: 0.0,
            prev2: 0.0,
            scale: PeakScale::new(6.0, fps, 1e-4),
            scratch: Vec::with_capacity(len),
        }
    }

    /// Feed the next detection-function value; returns peak strength (0 = none).
    pub fn update(&mut self, x: f32) -> f32 {
        let scaled = self.scale.update(x);
        self.since = self.since.saturating_add(1);
        self.scratch.clear();
        self.scratch.extend(self.hist.iter().copied());
        let median = median_in_place(&mut self.scratch);
        let thr = median * self.mult + self.add;
        let candidate = self.prev;
        let mut out = 0.0;
        if candidate > self.prev2 && candidate >= scaled && candidate > thr && self.since >= self.refractory {
            out = ((candidate - thr) / (1.0 - thr).max(0.05)).clamp(0.0, 1.0);
            self.since = 0;
        }
        self.hist.push_back(scaled);
        if self.hist.len() > self.len {
            self.hist.pop_front();
        }
        self.prev2 = self.prev;
        self.prev = scaled;
        out
    }
}

pub fn median_in_place(v: &mut [f32]) -> f32 {
    if v.is_empty() {
        return 0.0;
    }
    let mid = v.len() / 2;
    let (_, m, _) = v.select_nth_unstable_by(mid, |a, b| a.total_cmp(b));
    *m
}

pub fn db(power: f32) -> f32 {
    10.0 * (power + 1e-12).log10()
}

pub fn hz_to_bin(hz: f32, bin_hz: f32) -> usize {
    (hz / bin_hz).round() as usize
}

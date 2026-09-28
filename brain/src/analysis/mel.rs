//! Log-mel features for the vocal network: 64 mid bands + 64 side bands,
//! level-normalised by a slow running mean so master/sink volume and
//! mastering loudness do not change what the network sees.

use super::dsp::coef;

pub const N_MELS: usize = 64;
pub const N_FEAT: usize = N_MELS * 2;
const F_MIN: f32 = 60.0;
const F_MAX: f32 = 8000.0;

pub struct Mel {
    filters: Vec<(usize, Vec<f32>)>,
    offset: f32,
    primed: bool,
    k: f32,
    pub out: [f32; N_FEAT],
}

fn hz_to_mel(f: f32) -> f32 {
    2595.0 * (1.0 + f / 700.0).log10()
}

fn mel_to_hz(m: f32) -> f32 {
    700.0 * (10f32.powf(m / 2595.0) - 1.0)
}

impl Mel {
    pub fn new(n_fft: usize, sample_rate: f32, fps: f32) -> Self {
        let bin_hz = sample_rate / n_fft as f32;
        let (m0, m1) = (hz_to_mel(F_MIN), hz_to_mel(F_MAX));
        let edges: Vec<f32> = (0..N_MELS + 2).map(|i| mel_to_hz(m0 + (m1 - m0) * i as f32 / (N_MELS + 1) as f32)).collect();
        let filters = (0..N_MELS)
            .map(|m| {
                let (lo, mid, hi) = (edges[m], edges[m + 1], edges[m + 2]);
                let start = (lo / bin_hz).floor() as usize;
                let end = (hi / bin_hz).ceil() as usize;
                let w: Vec<f32> = (start..=end)
                    .map(|k| {
                        let f = k as f32 * bin_hz;
                        if f <= lo || f >= hi {
                            0.0
                        } else if f <= mid {
                            (f - lo) / (mid - lo)
                        } else {
                            (hi - f) / (hi - mid)
                        }
                    })
                    .collect();
                let norm: f32 = w.iter().sum::<f32>().max(1e-6);
                (start, w.into_iter().map(|x| x / norm).collect())
            })
            .collect();
        Self { filters, offset: 0.0, primed: false, k: coef(4.0, fps), out: [0.0; N_FEAT] }
    }

    pub fn update(&mut self, mid: &[f32], side: &[f32], silent: bool) -> &[f32; N_FEAT] {
        let mut mean = 0.0;
        for (m, (start, w)) in self.filters.iter().enumerate() {
            let (mut pm, mut ps) = (0.0f32, 0.0f32);
            for (i, wi) in w.iter().enumerate() {
                let k = start + i;
                if k < mid.len() {
                    pm += wi * mid[k] * mid[k];
                    ps += wi * side[k] * side[k];
                }
            }
            let (lm, ls) = ((pm + 1e-10).ln(), (ps + 1e-10).ln());
            self.out[m] = lm;
            self.out[N_MELS + m] = ls;
            mean += lm;
        }
        mean /= N_MELS as f32;
        if !silent {
            if !self.primed {
                self.offset = mean;
                self.primed = true;
            }
            self.offset += (mean - self.offset) * self.k;
        }
        for v in self.out.iter_mut() {
            *v = ((*v - self.offset) / 5.0).clamp(-4.0, 4.0);
        }
        &self.out
    }
}

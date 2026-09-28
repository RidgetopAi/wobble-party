//! Causal tempo + beat-phase tracker.
//!
//! Tempo: autocorrelation of the onset envelope over the last ~8 s, scored
//! with a harmonic comb and a log-normal tempo prior, smoothed across updates.
//! Phase: a free-running beat clock is nudged toward the phase that best
//! explains recent onsets (a soft phase-locked loop). The clock keeps running
//! through fills and breakdowns, so the stage always has a beat to dance to.

use std::collections::VecDeque;

const BPM_MIN: f32 = 60.0;
const BPM_MAX: f32 = 200.0;
const BPM_STEP: f32 = 0.5;

pub struct BeatTracker {
    fps: f32,
    env: VecDeque<f32>,
    env_len: usize,
    grid: Vec<f32>,
    scores: Vec<f32>,
    acf: Vec<f32>,
    frame: u64,
    pub bpm: f32,
    period: f32,
    pub phase: f32,
    pub beat: u64,
    pub confidence: f32,
    phase_conf: f32,
    tempo_conf: f32,
    bar_acc: [f32; 4],
    pub bar_offset: u64,
    pending_downbeat: f32,
    /// Bass / level means over the half beat before and after the last beat.
    pre: HalfBeat,
    post: HalfBeat,
    next_pre: HalfBeat,
    /// Recent (beat, level over the half beat after it), for anchoring the
    /// bar on a drop.
    recent_levels: VecDeque<(u64, f32)>,
    locked: bool,
}

#[derive(Default, Clone, Copy)]
struct HalfBeat {
    bass: f32,
    level: f32,
    n: f32,
}

impl HalfBeat {
    fn add(&mut self, bass: f32, level: f32) {
        self.bass += bass;
        self.level += level;
        self.n += 1.0;
    }
    fn mean(&self) -> (f32, f32) {
        if self.n > 0.0 { (self.bass / self.n, self.level / self.n) } else { (0.0, 0.0) }
    }
}

pub struct BeatOut {
    pub hit: bool,
    pub bar_beat: u8,
}

impl BeatTracker {
    pub fn new(fps: f32) -> Self {
        let grid: Vec<f32> = (0..=((BPM_MAX - BPM_MIN) / BPM_STEP) as usize)
            .map(|i| BPM_MIN + i as f32 * BPM_STEP)
            .collect();
        let env_len = (8.0 * fps) as usize;
        Self {
            fps,
            env: VecDeque::with_capacity(env_len + 1),
            env_len,
            scores: vec![0.0; grid.len()],
            grid,
            acf: Vec::new(),
            frame: 0,
            bpm: 120.0,
            period: fps * 0.5,
            phase: 0.0,
            beat: 0,
            confidence: 0.0,
            phase_conf: 0.0,
            tempo_conf: 0.0,
            bar_acc: [0.0; 4],
            bar_offset: 0,
            pending_downbeat: 0.0,
            pre: HalfBeat::default(),
            post: HalfBeat::default(),
            next_pre: HalfBeat::default(),
            recent_levels: VecDeque::with_capacity(9),
            locked: false,
        }
    }

    /// `onset`: onset-strength envelope sample. `low`: low-band onset strength
    /// (kick-ish), `bass`/`level`: normalised bass-band and overall level; the
    /// last three drive downbeat estimation. `silent`: input is silent.
    pub fn update(&mut self, onset: f32, low: f32, bass: f32, level: f32, silent: bool) -> BeatOut {
        self.frame += 1;
        self.env.push_back(if silent { 0.0 } else { onset });
        if self.env.len() > self.env_len {
            self.env.pop_front();
        }

        if self.frame % 24 == 0 && self.env.len() >= (self.fps * 3.0) as usize && !silent {
            self.estimate_tempo();
        }
        if self.frame % 4 == 0 && self.env.len() >= (self.fps * 2.0) as usize && !silent {
            self.correct_phase();
        }
        if silent {
            self.confidence *= 0.995;
            self.tempo_conf *= 0.995;
        }

        // Accumulate low-band energy near the beat for downbeat voting.
        if self.phase > 0.9 || self.phase < 0.1 {
            self.pending_downbeat = self.pending_downbeat.max(low);
        }

        let first_half = self.phase < 0.5;
        if first_half {
            self.post.add(bass, level);
        } else {
            self.next_pre.add(bass, level);
        }

        self.phase += 1.0 / self.period;
        let mut hit = false;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
            self.beat += 1;
            hit = true;
            self.pre = std::mem::take(&mut self.next_pre);
            self.post = HalfBeat::default();
        }
        // Vote once the half beat after the beat has been heard. Downbeats
        // are where the arrangement changes: the bass moves and sections land.
        // A kick alone says little in four-on-the-floor, so it only nudges.
        if first_half && self.phase >= 0.5 {
            let (pre_bass, pre_level) = self.pre.mean();
            let (post_bass, post_level) = self.post.mean();
            let jump = (post_level - pre_level).max(0.0);
            let vote = 0.3 * self.pending_downbeat + 2.0 * (post_bass - pre_bass).abs() + 2.0 * jump;
            let slot = (self.beat % 4) as usize;
            for v in self.bar_acc.iter_mut() {
                *v *= 0.97;
            }
            self.bar_acc[slot] += vote;
            self.pending_downbeat = 0.0;
            if self.recent_levels.len() >= 8 {
                self.recent_levels.pop_front();
            }
            self.recent_levels.push_back((self.beat, post_level));
            let best = (0..4).max_by(|&a, &b| self.bar_acc[a].total_cmp(&self.bar_acc[b])).unwrap();
            let current = (self.bar_offset % 4) as usize;
            if self.bar_acc[best] > self.bar_acc[current] * 1.25 {
                self.bar_offset = best as u64;
            }
        }
        let bar_beat = ((self.beat + 4 - self.bar_offset % 4) % 4) as u8;
        BeatOut { hit, bar_beat }
    }

    /// A drop was detected (a little after it landed): the beat among the
    /// last few whose level jumps most over the bar before it is a downbeat,
    /// whatever the votes said. Measured against a whole bar, not the half
    /// beat before, so off-beat pickups into the drop do not win.
    pub fn anchor_downbeat(&mut self) {
        let lv: Vec<(u64, f32)> = self.recent_levels.iter().copied().collect();
        let mut best: Option<(u64, f32)> = None;
        for i in 4.max(lv.len().saturating_sub(3))..lv.len() {
            let before = lv[i - 4..i].iter().map(|x| x.1).sum::<f32>() / 4.0;
            let jump = lv[i].1 - before;
            if best.is_none_or(|b| jump > b.1) {
                best = Some((lv[i].0, jump));
            }
        }
        let Some((beat, _)) = best else { return };
        let slot = (beat % 4) as usize;
        let top = self.bar_acc.iter().cloned().fold(0.0, f32::max);
        self.bar_acc[slot] = top * 1.5 + 0.5;
        self.bar_offset = slot as u64;
    }

    fn env_at(&self, frames_ago: f32) -> f32 {
        // Linear interpolation into the envelope, `0` = newest sample.
        let n = self.env.len();
        let pos = n as f32 - 1.0 - frames_ago;
        if pos < 0.0 {
            return 0.0;
        }
        let i = pos.floor() as usize;
        let f = pos - i as f32;
        let a = self.env[i];
        let b = if i + 1 < n { self.env[i + 1] } else { a };
        a + (b - a) * f
    }

    fn estimate_tempo(&mut self) {
        let n = self.env.len();
        let mean = self.env.iter().sum::<f32>() / n as f32;
        let max_lag = ((60.0 / BPM_MIN) * self.fps * 4.0).ceil() as usize + 2;
        let max_lag = max_lag.min(n - 1);
        self.acf.clear();
        self.acf.resize(max_lag + 1, 0.0);
        let centered: Vec<f32> = self.env.iter().map(|v| (v - mean).max(-mean)).collect();
        let energy: f32 = centered.iter().map(|v| v * v).sum::<f32>().max(1e-9);
        for lag in 1..=max_lag {
            let mut s = 0.0;
            for i in lag..n {
                s += centered[i] * centered[i - lag];
            }
            self.acf[lag] = s / energy * (n as f32 / (n - lag) as f32);
        }
        let acf_at = |lag: f32| -> f32 {
            let i = lag.floor() as usize;
            if i + 1 >= self.acf.len() {
                return 0.0;
            }
            let f = lag - i as f32;
            self.acf[i] * (1.0 - f) + self.acf[i + 1] * f
        };

        let mut fresh = vec![0.0f32; self.grid.len()];
        for (j, &bpm) in self.grid.iter().enumerate() {
            let lag = 60.0 / bpm * self.fps;
            let comb = acf_at(lag) + 0.5 * acf_at(2.0 * lag) + 0.25 * acf_at(4.0 * lag);
            // Log-normal tempo preference centred on 120 BPM.
            let oct = (bpm / 120.0).log2();
            let prior = (-0.5 * (oct / 0.7).powi(2)).exp();
            fresh[j] = comb.max(0.0) * prior;
        }
        let top = fresh.iter().cloned().fold(0.0f32, f32::max).max(1e-9);
        for (s, f) in self.scores.iter_mut().zip(&fresh) {
            *s = *s * 0.85 + (f / top) * 0.15;
        }

        let (best_j, best) = self
            .scores
            .iter()
            .enumerate()
            .max_by(|a, b| a.1.total_cmp(b.1))
            .map(|(j, s)| (j, *s))
            .unwrap();
        let mut sorted = self.scores.clone();
        let median = super::dsp::median_in_place(&mut sorted);
        self.tempo_conf = ((best - median) / best.max(1e-6)).clamp(0.0, 1.0);

        // Parabolic refinement around the best grid point.
        let refine = |j: usize| -> f32 {
            if j == 0 || j + 1 >= self.scores.len() {
                return self.grid[j];
            }
            let (a, b, c) = (self.scores[j - 1], self.scores[j], self.scores[j + 1]);
            let d = a - 2.0 * b + c;
            let off = if d.abs() > 1e-9 { 0.5 * (a - c) / d } else { 0.0 };
            self.grid[j] + off.clamp(-0.5, 0.5) * BPM_STEP
        };
        let candidate = refine(best_j);

        // Hysteresis: small moves track freely; big jumps need a clear win.
        let cur_j = self
            .grid
            .iter()
            .position(|&g| g >= self.bpm)
            .unwrap_or(self.grid.len() - 1);
        let cur_score = self.scores[cur_j.saturating_sub(1)..(cur_j + 2).min(self.scores.len())]
            .iter()
            .cloned()
            .fold(0.0f32, f32::max);
        let rel = (candidate - self.bpm).abs() / self.bpm;
        if !self.locked || rel < 0.03 || best > cur_score * 1.15 {
            self.bpm = if self.locked && rel < 0.03 { self.bpm + (candidate - self.bpm) * 0.3 } else { candidate };
            self.period = 60.0 / self.bpm * self.fps;
            self.locked = self.tempo_conf > 0.2;
        }
    }

    fn correct_phase(&mut self) {
        // Score each candidate "time since last beat" by summing the onset
        // envelope at that offset plus whole periods further back.
        let p = self.period;
        let steps = (p * 2.0).ceil() as usize;
        let horizon = (self.env.len() as f32 - 2.0).min(self.fps * 6.0);
        let mut best = (0.0f32, -1.0f32);
        let mut total = 0.0;
        for s in 0..steps {
            let offset = s as f32 * 0.5;
            let mut score = 0.0;
            let mut w = 1.0;
            let mut back = offset;
            while back < horizon {
                // Small tolerance window: take the max of neighbours.
                let v = self.env_at(back).max(self.env_at(back + 1.0) * 0.8).max(self.env_at((back - 1.0).max(0.0)) * 0.8);
                score += v * w;
                w *= 0.88;
                back += p;
            }
            total += score;
            if score > best.1 {
                best = (offset, score);
            }
        }
        let mean = total / steps as f32;
        self.phase_conf = self.phase_conf * 0.9 + 0.1 * ((best.1 - mean) / best.1.max(1e-6)).clamp(0.0, 1.0);

        // Onset peaks show up ~1 frame late relative to the clock tick.
        let target_since = best.0;
        let clock_since = self.phase * p;
        let mut err = target_since - clock_since;
        if err > p / 2.0 {
            err -= p;
        }
        if err < -p / 2.0 {
            err += p;
        }
        // Positive err: the real beat happened earlier than the clock thinks,
        // so advance the phase. Stronger pull while unlocked/low confidence.
        let gain = if self.confidence < 0.3 { 0.35 } else { 0.12 };
        let mut dphase = gain * err / p;
        // Never jump across a beat boundary backwards (would double-fire).
        if self.phase + dphase < 0.0 {
            dphase = -self.phase;
        }
        if self.phase + dphase >= 1.0 {
            dphase = 0.999 - self.phase;
        }
        self.phase += dphase;
        self.confidence = (self.tempo_conf * 0.5 + self.phase_conf * 0.5).clamp(0.0, 1.0);
    }
}

//! Song-structure cues: energy tiers, builds, drops and calm passages.
//! These drive the show director (camera shots, lighting states, crowd mood).

use super::dsp::Follower;
use std::collections::VecDeque;

pub const CALM: u8 = 0;
pub const GROOVE: u8 = 1;
pub const BUILD: u8 = 2;
pub const PEAK: u8 = 3;

pub struct SectionOut {
    pub energy: f32,
    pub energy_long: f32,
    pub build: f32,
    pub drop: f32,
    pub calm: f32,
    pub density: f32,
    pub section: u8,
}

pub struct Sections {
    fps: f32,
    fast: Follower,
    short: Follower,
    long: Follower,
    bass_short: Follower,
    bass_long: Follower,
    high_short: Follower,
    high_long: Follower,
    hist: VecDeque<(f32, f32)>, // (energy short, bass short)
    onsets: VecDeque<bool>,
    density: Follower,
    build: Follower,
    since_drop: usize,
    section: u8,
    section_hold: usize,
    peak_left: usize,
}

impl Sections {
    pub fn new(fps: f32) -> Self {
        Self {
            fps,
            fast: Follower::new(0.03, 0.12, fps),
            short: Follower::new(0.25, 0.5, fps),
            long: Follower::new(5.0, 5.0, fps),
            bass_short: Follower::new(0.15, 0.6, fps),
            bass_long: Follower::new(6.0, 6.0, fps),
            high_short: Follower::new(0.4, 0.6, fps),
            high_long: Follower::new(6.0, 6.0, fps),
            hist: VecDeque::new(),
            onsets: VecDeque::new(),
            density: Follower::new(0.5, 1.0, fps),
            build: Follower::new(1.0, 0.4, fps),
            since_drop: usize::MAX / 2,
            section: GROOVE,
            section_hold: 0,
            peak_left: 0,
        }
    }

    /// `level`: normalised loudness. `bass`/`high`: normalised band levels.
    /// `onset`: onset event strength this frame (0 if none).
    pub fn update(&mut self, level: f32, bass: f32, high: f32, onset: f32, beat_conf: f32) -> SectionOut {
        let fast = self.fast.update(level);
        let e = self.short.update(level);
        let el = self.long.update(level);
        let bs = self.bass_short.update(bass);
        let bl = self.bass_long.update(bass);
        let hs = self.high_short.update(high);
        let hl = self.high_long.update(high);

        // Onset density: events per second over the last 2 s, scaled to 0..1.
        self.onsets.push_back(onset > 0.0);
        while self.onsets.len() > 2 * self.fps as usize {
            self.onsets.pop_front();
        }
        let per_sec = self.onsets.iter().filter(|&&o| o).count() as f32 / 2.0;
        let density = self.density.update((per_sec / 8.0).min(1.0));

        self.hist.push_back((e, bs));
        let hist_len = (4.0 * self.fps) as usize;
        if self.hist.len() > hist_len {
            self.hist.pop_front();
        }

        // Build: brightness and density rising while the low end is held back.
        let rising_high = ((hs - hl) * 3.0).clamp(0.0, 1.0);
        let bass_held = ((bl - bs) * 2.5 + 0.3).clamp(0.0, 1.0);
        let slope = if self.hist.len() == hist_len {
            let first: f32 = self.hist.iter().take(hist_len / 4).map(|h| h.0).sum::<f32>() / (hist_len / 4) as f32;
            ((e - first) * 3.0).clamp(0.0, 1.0)
        } else {
            0.0
        };
        let build_raw = (rising_high * 0.4 + slope * 0.4 + density * 0.2) * bass_held;
        let build = self.build.update(build_raw);

        // Drop: bass slams back after being low, with a jump in loudness.
        self.since_drop = self.since_drop.saturating_add(1);
        let min_bass_recent = self.hist.iter().map(|h| h.1).fold(1.0f32, f32::min);
        let min_energy_recent = self.hist.iter().map(|h| h.0).fold(1.0f32, f32::min);
        let mut drop = 0.0;
        if self.since_drop as f32 > 6.0 * self.fps
            && bass > 0.65
            && min_bass_recent < 0.3
            && fast - min_energy_recent > 0.3
            && beat_conf > 0.15
        {
            drop = ((fast - min_energy_recent) * 1.5).clamp(0.4, 1.0);
            self.since_drop = 0;
            self.peak_left = (16.0 * self.fps) as usize;
        }

        let calm = ((0.45 - el) * 2.5).clamp(0.0, 1.0).max(((0.3 - density) * 2.0).clamp(0.0, 1.0) * (1.0 - e));

        // Section state with hold time so the director gets stable states.
        self.peak_left = self.peak_left.saturating_sub(1);
        let target = if self.peak_left > 0 || (e > 0.8 && bs > 0.6 && el > 0.65) {
            PEAK
        } else if build > 0.45 {
            BUILD
        } else if calm > 0.5 {
            CALM
        } else {
            GROOVE
        };
        self.section_hold = self.section_hold.saturating_add(1);
        if target != self.section && (self.section_hold as f32 > 2.0 * self.fps || drop > 0.0) {
            self.section = target;
            self.section_hold = 0;
        }

        SectionOut { energy: e, energy_long: el, build, drop, calm, density, section: self.section }
    }
}

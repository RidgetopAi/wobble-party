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
    kicks: VecDeque<bool>,
    density: Follower,
    density_long: Follower,
    build: Follower,
    build_held: f32,
    build_decay: f32,
    since_drop: usize,
    since_build: usize,
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
            kicks: VecDeque::new(),
            density: Follower::new(0.5, 1.0, fps),
            density_long: Follower::new(8.0, 8.0, fps),
            build: Follower::new(1.0, 0.4, fps),
            build_held: 0.0,
            build_decay: (-1.0 / (2.5 * fps)).exp(),
            since_drop: usize::MAX / 2,
            since_build: usize::MAX / 2,
            section: GROOVE,
            section_hold: 0,
            peak_left: 0,
        }
    }

    /// `level`: normalised loudness. `sub`/`bass`/`high`: normalised band levels.
    /// `onset`: onset event strength this frame (0 if none).
    pub fn update(&mut self, level: f32, sub: f32, bass: f32, high: f32, onset: f32, kick: f32, beat_conf: f32) -> SectionOut {
        let fast = self.fast.update(level);
        let e = self.short.update(level);
        let el = self.long.update(level);
        let bs = self.bass_short.update(bass);
        let bl = self.bass_long.update(bass);
        let hs = self.high_short.update(high);
        let hl = self.high_long.update(high);

        // Kicks in the last 4 s: a drop needs drums, not just a loud voice.
        self.kicks.push_back(kick > 0.0);
        while self.kicks.len() > 4 * self.fps as usize {
            self.kicks.pop_front();
        }
        let recent_kicks = self.kicks.iter().filter(|&&k| k).count();

        // Onset density: events per second over the last 2 s, scaled to 0..1.
        self.onsets.push_back(onset > 0.0);
        while self.onsets.len() > 2 * self.fps as usize {
            self.onsets.pop_front();
        }
        let per_sec = self.onsets.iter().filter(|&&o| o).count() as f32 / 2.0;
        let density = self.density.update((per_sec / 8.0).min(1.0));

        self.hist.push_back((e, bs));
        let hist_len = (7.0 * self.fps) as usize;
        if self.hist.len() > hist_len {
            self.hist.pop_front();
        }

        // Build: tension rising (onsets thickening, highs opening up, level
        // climbing) while the low end is held back — or the low end pulled out
        // under a still-busy mix (snare roll over a filtered/removed bass).
        let rising_high = ((hs - hl) * 3.0).clamp(0.0, 1.0);
        let bass_held = ((bl - bs) * 2.5 + 0.3).clamp(0.0, 1.0);
        let bass_out = ((bl - bs) * 3.0).clamp(0.0, 1.0);
        let density_rise = ((density - self.density_long.update(density)) * 3.0).clamp(0.0, 1.0);
        let busy = ((density - 0.25) * 3.0).clamp(0.0, 1.0);
        let win = (4.0 * self.fps) as usize;
        let slope = if self.hist.len() >= win {
            let q = win / 4;
            let first: f32 = self.hist.iter().skip(self.hist.len() - win).take(q).map(|h| h.0).sum::<f32>() / q as f32;
            ((e - first) * 3.0).clamp(0.0, 1.0)
        } else {
            0.0
        };
        let tension = density_rise.max(rising_high).max(slope);
        let build_raw = (tension * 0.8 * bass_held + bass_out * busy * 0.6 + 0.3 * density_rise * bass_out).min(1.0);
        // Hold the tension until the energy lands (or it fades): risers often
        // end with a beat of silence or a few sub hits before the drop.
        let held = if fast > 0.55 && slope > 0.5 { 0.0 } else { self.build_held * self.build_decay };
        self.build_held = self.build.update(build_raw).max(held);
        let build = self.build_held;

        // Drop: a sustained energy step — a quiet stretch (breakdown/build)
        // followed by the full mix with low end slamming in. Rare by design.
        self.since_drop = self.since_drop.saturating_add(1);
        self.since_build = if self.section == BUILD { 0 } else { self.since_build.saturating_add(1) };
        let n = self.hist.len();
        let pre_end = n.saturating_sub((0.6 * self.fps) as usize);
        let pre = &self.hist.make_contiguous()[..pre_end];
        let mut drop = 0.0;
        if pre.len() as f32 > 4.0 * self.fps {
            let pre_energy = pre.iter().map(|h| h.0).sum::<f32>() / pre.len() as f32;
            let after_build = (self.since_build as f32) < 4.0 * self.fps;
            let jump_min = if after_build { 0.25 } else { 0.35 };
            if self.since_drop as f32 > 16.0 * self.fps
                && beat_conf > 0.5
                && pre_energy < 0.42
                && fast > 0.6
                && fast - pre_energy > jump_min
                && (bs > 0.5 || sub > 0.5)
                && recent_kicks >= 3
            {
                drop = ((fast - pre_energy) * 1.6).clamp(0.5, 1.0);
                self.since_drop = 0;
                self.peak_left = (16.0 * self.fps) as usize;
            }
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

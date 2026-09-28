//! The wire contract between brain and stage. One `Frame` per analysis hop
//! (~94 per second). Scalars are normalised 0..1 unless noted; event fields
//! are 0 except on the frame the event fires, where they carry its strength.

use serde::Serialize;

#[derive(Serialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    /// Audio clock in seconds (sample-accurate, since capture start).
    pub t: f64,
    pub silent: bool,
    /// Loudness, auto-ranged.
    pub level: f32,
    /// Raw RMS in dBFS (for diagnostics).
    pub db: f32,
    /// sub, bass, low-mid, mid, high-mid, high — auto-ranged per band.
    pub bands: [f32; 6],
    /// Spectral centroid mapped to 0..1 (dark..bright).
    pub brightness: f32,
    /// Onset strength envelope, scaled.
    pub flux: f32,
    /// Events.
    pub onset: f32,
    pub kick: f32,
    pub snare: f32,
    pub hat: f32,

    pub bpm: f32,
    pub beat_conf: f32,
    /// Position inside the current beat, 0..1 (extrapolate with bpm).
    pub beat_phase: f32,
    /// Monotonic beat counter.
    pub beat: u64,
    /// 0..3, 0 = estimated downbeat.
    pub bar_beat: u8,
    pub beat_hit: bool,

    pub energy: f32,
    pub energy_long: f32,
    pub build: f32,
    pub drop: f32,
    pub calm: f32,
    pub density: f32,
    /// 0 calm, 1 groove, 2 build, 3 peak.
    pub section: u8,

    /// Singing-voice presence probability (smoothed).
    pub vocal: f32,
    /// Vocal loudness gated by presence (mouth opening).
    pub vocal_env: f32,
    pub syllable: f32,
    /// Pitch relative to the singer's centre, octaves, -1..1.
    pub pitch: f32,
    pub pitch_hz: f32,
    /// 1 = phrase starts this frame, 2 = phrase ends this frame.
    pub phrase: u8,

    /// Vocal feature vector (only in `analyze --features` output).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vf: Option<Vec<f32>>,
}

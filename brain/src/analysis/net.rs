//! Streaming inference for the singing-voice network trained by
//! `tools/vocal_train.py`:
//!
//!   log-mel (128) -> Linear(H) + ReLU -> GRU(H) -> GRU(H) -> Linear(2)
//!   outputs: [presence logit, vocal level logit]
//!
//! Plain Rust, one frame at a time, ~100k multiply-adds per frame.
//! Weights file: b"WPN1", u32 count, then per tensor:
//!   u32 name_len, name, u32 ndim, u32 dims.., f32 data (little endian).

use std::collections::HashMap;

pub static EMBEDDED: &[u8] = include_bytes!("../../model/vocal.bin");

struct Linear {
    w: Vec<f32>, // (out, in) row-major
    b: Vec<f32>,
    inp: usize,
    out: usize,
}

impl Linear {
    fn forward(&self, x: &[f32], y: &mut [f32]) {
        for o in 0..self.out {
            let row = &self.w[o * self.inp..(o + 1) * self.inp];
            y[o] = self.b[o] + dot(row, x);
        }
    }
}

struct Gru {
    w_ih: Vec<f32>, // (3H, in)
    w_hh: Vec<f32>, // (3H, H)
    b_ih: Vec<f32>,
    b_hh: Vec<f32>,
    inp: usize,
    h: usize,
}

impl Gru {
    fn step(&self, x: &[f32], state: &mut [f32], gi: &mut [f32], gh: &mut [f32]) {
        let h = self.h;
        for j in 0..3 * h {
            gi[j] = self.b_ih[j] + dot(&self.w_ih[j * self.inp..(j + 1) * self.inp], x);
            gh[j] = self.b_hh[j] + dot(&self.w_hh[j * h..(j + 1) * h], state);
        }
        for j in 0..h {
            let r = sigmoid(gi[j] + gh[j]);
            let z = sigmoid(gi[h + j] + gh[h + j]);
            let n = (gi[2 * h + j] + r * gh[2 * h + j]).tanh();
            state[j] = (1.0 - z) * n + z * state[j];
        }
    }
}

pub struct VocalNet {
    inp: Linear,
    g1: Gru,
    g2: Gru,
    out: Linear,
    x: Vec<f32>,
    s1: Vec<f32>,
    s2: Vec<f32>,
    gi: Vec<f32>,
    gh: Vec<f32>,
    y: [f32; 2],
}

impl VocalNet {
    pub fn embedded() -> Option<Self> {
        Self::from_bytes(EMBEDDED)
    }

    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        let mut t = parse(bytes)?;
        let mut take = |name: &str| t.remove(name);
        let lin = |w: (Vec<usize>, Vec<f32>), b: (Vec<usize>, Vec<f32>)| Linear { inp: w.0[1], out: w.0[0], w: w.1, b: b.1 };
        let inp = lin(take("inp.weight")?, take("inp.bias")?);
        let mut gru = |l: usize| -> Option<Gru> {
            let wi = take(&format!("gru.weight_ih_l{l}"))?;
            let wh = take(&format!("gru.weight_hh_l{l}"))?;
            Some(Gru {
                inp: wi.0[1],
                h: wh.0[1],
                w_ih: wi.1,
                w_hh: wh.1,
                b_ih: take(&format!("gru.bias_ih_l{l}"))?.1,
                b_hh: take(&format!("gru.bias_hh_l{l}"))?.1,
            })
        };
        let g1 = gru(0)?;
        let g2 = gru(1)?;
        let out = lin(take("out.weight")?, take("out.bias")?);
        let h = g1.h;
        Some(Self {
            x: vec![0.0; inp.out],
            s1: vec![0.0; h],
            s2: vec![0.0; h],
            gi: vec![0.0; 3 * h],
            gh: vec![0.0; 3 * h],
            y: [0.0; 2],
            inp,
            g1,
            g2,
            out,
        })
    }

    pub fn n_inputs(&self) -> usize {
        self.inp.inp
    }

    /// Advance one frame. Returns (presence probability, vocal level 0..1).
    pub fn step(&mut self, feat: &[f32]) -> (f32, f32) {
        self.inp.forward(feat, &mut self.x);
        for v in self.x.iter_mut() {
            *v = v.max(0.0);
        }
        self.g1.step(&self.x, &mut self.s1, &mut self.gi, &mut self.gh);
        self.g2.step(&self.s1, &mut self.s2, &mut self.gi, &mut self.gh);
        self.out.forward(&self.s2, &mut self.y);
        (sigmoid(self.y[0]), sigmoid(self.y[1]))
    }
}

fn dot(a: &[f32], b: &[f32]) -> f32 {
    // Four accumulators let the compiler vectorise without fast-math.
    let mut acc = [0.0f32; 4];
    let chunks = a.len() / 4;
    for i in 0..chunks {
        for k in 0..4 {
            acc[k] += a[i * 4 + k] * b[i * 4 + k];
        }
    }
    let mut s = acc[0] + acc[1] + acc[2] + acc[3];
    for i in chunks * 4..a.len() {
        s += a[i] * b[i];
    }
    s
}

fn sigmoid(x: f32) -> f32 {
    1.0 / (1.0 + (-x).exp())
}

fn parse(bytes: &[u8]) -> Option<HashMap<String, (Vec<usize>, Vec<f32>)>> {
    let mut pos = 0;
    let u32_at = |pos: &mut usize| -> Option<u32> {
        let v = u32::from_le_bytes(bytes.get(*pos..*pos + 4)?.try_into().ok()?);
        *pos += 4;
        Some(v)
    };
    if bytes.get(0..4)? != b"WPN1" {
        return None;
    }
    pos += 4;
    let count = u32_at(&mut pos)?;
    let mut out = HashMap::new();
    for _ in 0..count {
        let nl = u32_at(&mut pos)? as usize;
        let name = std::str::from_utf8(bytes.get(pos..pos + nl)?).ok()?.to_string();
        pos += nl;
        let nd = u32_at(&mut pos)? as usize;
        let mut dims = Vec::with_capacity(nd);
        for _ in 0..nd {
            dims.push(u32_at(&mut pos)? as usize);
        }
        let n: usize = dims.iter().product();
        let data: Vec<f32> = bytes
            .get(pos..pos + 4 * n)?
            .chunks_exact(4)
            .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
            .collect();
        pos += 4 * n;
        out.insert(name, (dims, data));
    }
    Some(out)
}

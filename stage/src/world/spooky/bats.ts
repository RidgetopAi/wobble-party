/**
 * Bats. A few always circle high over the room; on a drop a colony bursts
 * out from behind the LED wall, swirls over the crowd and scatters out of
 * the room. One instanced mesh; the wings flap in the vertex shader.
 */

import * as THREE from 'three';
import type { Music } from '../../music';
import { Rng } from '../../rng';

const N = 64;
const RESIDENTS = 5;

/** Body, two scalloped wings and two red eyes, facing +z. aWing = flap weight. */
function batGeometry() {
  const pos: number[] = [];
  const wing: number[] = [];
  const col: number[] = [];
  const dark = [0.05, 0.04, 0.07];
  const tri = (a: number[], b: number[], c: number[], w: [number, number, number], rgb = dark) => {
    pos.push(...a, ...b, ...c);
    wing.push(...w);
    col.push(...rgb, ...rgb, ...rgb);
  };
  for (const sx of [-1, 1]) {
    // Wing: root along the body, tip out at x = 0.55, scalloped trailing edge.
    const root0 = [sx * 0.04, 0, 0.1];
    const root1 = [sx * 0.04, 0, -0.12];
    const tip = [sx * 0.55, 0.06, 0.02];
    const e1 = [sx * 0.4, 0, -0.1];
    const e2 = [sx * 0.24, 0, -0.07];
    const e3 = [sx * 0.12, 0, -0.14];
    const wt = (p: number[]) => Math.abs(p[0]) / 0.55;
    tri(root0, tip, e1, [0, 1, wt(e1)]);
    tri(root0, e1, e2, [0, wt(e1), wt(e2)]);
    tri(root0, e2, e3, [0, wt(e2), wt(e3)]);
    tri(root0, e3, root1, [0, wt(e3), 0]);
  }
  // Body (a flat diamond) and ears.
  tri([0, 0.02, 0.16], [-0.05, 0.02, 0], [0.05, 0.02, 0], [0, 0, 0]);
  tri([-0.05, 0.02, 0], [0, 0.02, -0.16], [0.05, 0.02, 0], [0, 0, 0]);
  for (const sx of [-1, 1]) {
    tri([sx * 0.015, 0.02, 0.12], [sx * 0.045, 0.02, 0.1], [sx * 0.035, 0.09, 0.13], [0, 0, 0]);
    tri([sx * 0.02, 0.035, 0.15], [sx * 0.04, 0.035, 0.14], [sx * 0.03, 0.05, 0.155], [0, 0, 0], [3, 0.3, 0.3]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

interface Bat {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  /** 0 roosting, 1 swarming, 2 leaving, 3 resident. */
  mode: number;
  life: number;
  orbit: number;
  radius: number;
  height: number;
  exit: THREE.Vector3;
  scale: number;
}

export class Bats {
  readonly mesh: THREE.InstancedMesh;
  private bats: Bat[] = [];
  private rng = new Rng(666);
  private uTime = { value: 0 };
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private fwd = new THREE.Vector3(0, 0, 1);
  private dir = new THREE.Vector3();
  private goal = new THREE.Vector3();
  private t = 0;

  constructor() {
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.uTime;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aWing;\nattribute float aPhase;\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float flap = sin(uTime * 22.0 + aPhase);
          transformed.y += flap * aWing * 0.32;
          transformed.x *= 1.0 - 0.18 * aWing * (0.5 + 0.5 * flap);`,
        );
    };
    mat.customProgramCacheKey = () => 'wobble-bats';
    const geo = batGeometry();
    const phase = new Float32Array(N);
    for (let i = 0; i < N; i++) phase[i] = this.rng.range(0, 6.28);
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    this.mesh = new THREE.InstancedMesh(geo, mat, N);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N; i++) {
      const b: Bat = {
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        mode: i < RESIDENTS ? 3 : 0,
        life: 0,
        orbit: this.rng.range(0, 6.28),
        radius: this.rng.range(4, 9),
        height: this.rng.range(5.5, 8.5),
        exit: new THREE.Vector3(),
        scale: this.rng.range(0.8, 1.25),
      };
      if (b.mode === 3) {
        b.radius = this.rng.range(8, 12);
        b.height = this.rng.range(8, 10);
        b.pos.set(Math.sin(b.orbit) * b.radius, b.height, 5 + Math.cos(b.orbit) * b.radius);
      }
      this.bats.push(b);
    }
  }

  /** Release `count` bats from behind the LED wall. */
  burst(count: number) {
    let n = 0;
    for (const b of this.bats) {
      if (n >= count) break;
      if (b.mode !== 0) continue;
      n++;
      b.mode = 1;
      b.life = this.rng.range(4, 8);
      b.pos.set(this.rng.range(-6, 6), this.rng.range(5.5, 8), -10);
      b.vel.set(this.rng.range(-2, 2), this.rng.range(1, 3), this.rng.range(5, 9));
      b.orbit = this.rng.range(0, 6.28);
      const side = this.rng.chance(0.5) ? 1 : -1;
      b.exit.set(side * this.rng.range(22, 30), this.rng.range(7, 12), this.rng.range(-4, 18));
    }
  }

  update(dt: number, music: Music) {
    this.t += dt;
    this.uTime.value = this.t;
    const r = this.rng;
    for (let i = 0; i < N; i++) {
      const b = this.bats[i];
      if (b.mode === 0) {
        this.m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, this.m);
        continue;
      }
      if (b.mode === 1) {
        b.life -= dt;
        if (b.life <= 0) b.mode = 2;
      }
      // Steer toward a point that circles over the crowd (or the exit).
      const speed = b.mode === 3 ? 0.25 : 0.55 + 0.25 * music.hype;
      b.orbit += dt * speed * (i % 2 ? 1 : -1);
      if (b.mode === 2) this.goal.copy(b.exit);
      else this.goal.set(Math.sin(b.orbit) * b.radius, b.height + 0.8 * Math.sin(this.t * 1.7 + i), 4 + Math.cos(b.orbit) * b.radius * 0.7);
      this.dir.subVectors(this.goal, b.pos);
      const k = b.mode === 3 ? 0.6 : 1.4;
      b.vel.addScaledVector(this.dir, k * dt);
      b.vel.x += r.range(-1, 1) * 9 * dt;
      b.vel.y += r.range(-1, 1) * 6 * dt;
      b.vel.z += r.range(-1, 1) * 9 * dt;
      const vmax = b.mode === 3 ? 3.5 : 8;
      const sp = b.vel.length();
      if (sp > vmax) b.vel.multiplyScalar(vmax / sp);
      b.vel.multiplyScalar(Math.exp(-dt * 0.3));
      b.pos.addScaledVector(b.vel, dt);
      if (b.mode === 2 && this.dir.length() < 3) b.mode = 0;
      // Residents only show while music plays.
      const vis = b.mode === 3 ? Math.min(1, music.presence * 1.5) : 1;
      this.q.setFromUnitVectors(this.fwd, this.dir.copy(b.vel).normalize());
      this.s.setScalar(b.scale * 1.3 * vis);
      this.m.compose(b.pos, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

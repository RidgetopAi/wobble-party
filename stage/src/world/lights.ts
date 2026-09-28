/**
 * Light rig: moving heads with volumetric beams, laser fans, colour wash
 * spots, key/rim/ambient light and a (comfort-limited) strobe. The show
 * director picks programmes; this file animates them on the beat clock.
 */

import * as THREE from 'three';
import type { Music } from '../music';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Rng, approach } from '../rng';
import type { Palette } from '../theme';
import { BOOTH_Z, STAGE_Y } from './venue';

export type HeadProgram = 'sweep' | 'crowd' | 'fan' | 'center' | 'ballyhoo' | 'calm' | 'off';
export type LaserProgram = 'off' | 'fan' | 'scan' | 'tunnel';

const BEAM_VERT = /* glsl */ `
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
varying vec3 vW;
void main() {
  vAlong = -position.y / 18.0;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
varying vec3 vW;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
  float fall = pow(1.0 - clamp(vAlong, 0.0, 1.0), 1.6);
  float haze = 0.55 + 0.45 * noise(vW * 0.7 + vec3(0.0, uTime * 0.25, uTime * 0.15));
  float floorFade = smoothstep(0.0, 0.6, vW.y);
  float near = smoothstep(1.0, 4.0, length(cameraPosition - vW));
  float a = uIntensity * edge * fall * haze * floorFade * near;
  gl_FragColor = vec4(uColor * a, 1.0);
}
`;

const LASER_VERT = /* glsl */ `
varying vec2 vUv;
varying float vCamDist;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vCamDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const LASER_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
varying float vCamDist;
void main() {
  float across = abs(vUv.x - 0.5) * 2.0;
  float core = exp(-across * across * 18.0);
  float fall = 1.0 - smoothstep(0.55, 1.0, vUv.y);
  // A laser plane passing right by the lens would fill the frame: fade it.
  float near = smoothstep(1.5, 5.0, vCamDist);
  gl_FragColor = vec4(uColor * uIntensity * core * fall * near, 1.0);
}
`;

interface Head {
  base: THREE.Vector3;
  yoke: THREE.Group;
  beam: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  lens: THREE.MeshBasicMaterial;
  pan: number;
  tilt: number;
  panT: number;
  tiltT: number;
  intensity: number;
  target: THREE.Vector3;
  colorIdx: number;
}

export class LightRig {
  readonly group = new THREE.Group();
  readonly heads: Head[] = [];
  readonly spots: THREE.SpotLight[] = [];
  readonly key: THREE.DirectionalLight;
  readonly rim: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly djLight: THREE.SpotLight;
  program: HeadProgram = 'calm';
  laserProgram: LaserProgram = 'off';
  /** 0..1 strobe flash level for the post pass. */
  strobe = 0;
  strobeEnabled = true;
  hideLasers = false;
  private lasers: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; i: number; src: number }[] = [];
  private laserLevel = 0;
  private colorShift = 0;
  private rng = new Rng(4242);
  private lastStrobe = -10;
  private tmp = new THREE.Vector3();

  constructor(
    private p: Palette,
    fixtures: THREE.Vector3[],
    crowdTargets: THREE.Vector3[],
  ) {
    // Ambient + key + rim: keep characters readable under any theme.
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
    this.key = new THREE.DirectionalLight(0xffffff, 0.9);
    this.key.position.set(4, 12, 14);
    // Rim/back light kept steep (~60°) so its mirror reflection off the
    // glossy floor passes above front cameras instead of glaring into them.
    this.rim = new THREE.DirectionalLight(0xffffff, 1.2);
    this.rim.position.set(0, 16, -9);
    this.group.add(this.hemi, this.key, this.rim);

    // Colour wash spots over the crowd.
    for (let i = 0; i < 4; i++) {
      const s = new THREE.SpotLight(0xffffff, 60, 40, 0.5, 0.6, 1.2);
      s.position.set(-9 + i * 6, 8.2, -3.2);
      s.target.position.set(-6 + i * 4, 0, 4 + (i % 2) * 3);
      this.group.add(s, s.target);
      this.spots.push(s);
    }
    // Follow spot on the DJ.
    this.djLight = new THREE.SpotLight(0xffffff, 40, 20, 0.28, 0.5, 1.2);
    this.djLight.position.set(0, 8.2, -1.5);
    this.djLight.target.position.set(0, STAGE_Y + 1.5, BOOTH_Z - 0.9);
    this.group.add(this.djLight, this.djLight.target);

    const beamGeo = new THREE.CylinderGeometry(0.09, 1.9, 18, 32, 1, true);
    beamGeo.translate(0, -9, 0);
    const yokeMat = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.5, metalness: 0.6 });
    fixtures.forEach((f, i) => {
      const yoke = new THREE.Group();
      yoke.position.copy(f);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), yokeMat);
      yoke.add(housing);
      const lens = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lensMesh = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), lens);
      lensMesh.rotation.x = Math.PI / 2;
      lensMesh.position.y = -0.215;
      yoke.add(lensMesh);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uTime: { value: 0 } },
        vertexShader: BEAM_VERT,
        fragmentShader: BEAM_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, mat);
      beam.frustumCulled = false;
      yoke.add(beam);
      this.group.add(yoke);
      this.heads.push({
        base: f.clone(),
        yoke,
        beam,
        mat,
        lens,
        pan: 0,
        tilt: 0.3,
        panT: 0,
        tiltT: 0.3,
        intensity: 0,
        target: crowdTargets[i % crowdTargets.length].clone(),
        colorIdx: i % 6,
      });
    });

    // Lasers: a fan from the booth and one from each stage corner.
    // Two crossed planes so a laser never vanishes edge-on.
    const a = new THREE.PlaneGeometry(0.07, 34);
    const b = new THREE.PlaneGeometry(0.07, 34).rotateY(Math.PI / 2);
    const laserGeo = mergeGeometries([a, b])!;
    laserGeo.translate(0, 17, 0);
    const sources = [
      new THREE.Vector3(0, 8.1, -9.3), // back truss, above the LED wall
      new THREE.Vector3(-10, STAGE_Y + 0.3, -3.3),
      new THREE.Vector3(10, STAGE_Y + 0.3, -3.3),
    ];
    sources.forEach((src, si) => {
      const n = si === 0 ? 10 : 6;
      for (let i = 0; i < n; i++) {
        const mat = new THREE.ShaderMaterial({
          uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 } },
          vertexShader: LASER_VERT,
          fragmentShader: LASER_FRAG,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(laserGeo, mat);
        mesh.position.copy(src);
        mesh.frustumCulled = false;
        mesh.visible = false;
        this.group.add(mesh);
        this.lasers.push({ mesh, mat, i, src: si });
      }
    });
  }

  retarget(crowdTargets: THREE.Vector3[]) {
    for (const h of this.heads) h.target.copy(this.rng.pick(crowdTargets));
  }

  onBar(bar: number) {
    if (bar % 2 === 0) this.colorShift = (this.colorShift + 1) % 6;
  }

  update(dt: number, music: Music, time: number, crowdTargets: THREE.Vector3[]) {
    const p = this.p;
    const pres = music.presence;
    const hype = music.hype;
    const beats = music.beatPos;
    const bp = music.beatPhase;

    // Ambient / key / rim from theme.
    this.hemi.color.copy(p.lights[0]).lerp(new THREE.Color(1, 1, 1), 0.6);
    this.hemi.groundColor.copy(p.bgDeep);
    this.hemi.intensity = p.light ? 0.8 : 0.55 + 0.25 * pres;
    this.key.intensity = p.light ? 1.2 : 0.75;
    this.rim.color.copy(p.lights[1 % p.lights.length]);
    this.rim.intensity = 0.9 + 0.8 * music.kickPulse * pres + 0.5 * hype;

    this.spots.forEach((s, i) => {
      s.color.copy(p.lights[(i + this.colorShift) % 6]);
      const chase = Math.exp(-(((bp * 4 - i) % 4) + 4) % 4 * 1.2);
      s.intensity = (12 + 26 * hype + 22 * chase * hype) * (0.35 + 0.65 * pres);
    });
    this.djLight.color.copy(p.fg).lerp(p.lights[0], 0.3);
    this.djLight.intensity = 18 + 14 * music.vocal + 10 * music.kickPulse;

    // Moving heads.
    const prog = pres < 0.2 ? 'calm' : this.program;
    this.heads.forEach((h, i) => {
      const n = this.heads.length;
      const k = i / (n - 1) - 0.5;
      let want = 0;
      switch (prog) {
        case 'sweep': {
          const ph = (beats / 8) * Math.PI * 2;
          h.panT = Math.PI + 0.55 * Math.sin(ph + i * 0.35);
          h.tiltT = 0.45 + 0.25 * Math.sin(ph * 0.5 + i * 0.5);
          want = 0.7 + 0.3 * hype;
          break;
        }
        case 'crowd': {
          this.aimAt(h, h.target);
          want = 0.55 + 0.35 * hype;
          break;
        }
        case 'fan': {
          h.panT = Math.PI + k * 1.6;
          h.tiltT = 0.35 + 0.15 * Math.sin(beats * Math.PI * 0.5);
          const chase = Math.exp(-((((beats * 2 - i) % n) + n) % n) * 0.9);
          want = 0.3 + 0.9 * chase;
          break;
        }
        case 'center':
          this.aimAt(h, this.tmp.set(0, STAGE_Y + 1.6, BOOTH_Z - 1));
          want = 0.8;
          break;
        case 'ballyhoo': {
          const a = time * 2.4 + i * 0.9;
          h.panT = Math.PI + 0.7 * Math.sin(a);
          h.tiltT = 0.55 + 0.35 * Math.cos(a * 1.3);
          want = 0.9 + 0.3 * Math.exp(-bp * 5);
          break;
        }
        case 'calm': {
          h.panT = Math.PI + 0.3 * Math.sin(time * 0.15 + i);
          h.tiltT = 0.25 + 0.1 * Math.sin(time * 0.2 + i * 0.7);
          want = i % 3 === 0 ? 0.35 * (0.4 + 0.6 * pres) : 0.05;
          break;
        }
        case 'off':
          want = 0;
      }
      // Punch on the beat while music plays.
      want *= 0.7 + 0.5 * Math.exp(-bp * 4) * pres;
      h.intensity = approach(h.intensity, want, 10, dt);
      const rate = prog === 'ballyhoo' ? 14 : 5;
      h.pan = approach(h.pan, h.panT, rate, dt);
      h.tilt = approach(h.tilt, h.tiltT, rate, dt);
      h.yoke.rotation.set(h.tilt, h.pan, 0, 'YXZ');
      const c = p.lights[(h.colorIdx + this.colorShift) % 6];
      h.mat.uniforms.uColor.value.copy(c);
      // Mono dark themes are a black-and-white club carried by white light in
      // haze, so the beams get much more presence there.
      h.mat.uniforms.uIntensity.value = h.intensity * (p.light ? 0.05 : p.mono ? 0.6 : 0.28);
      h.mat.uniforms.uTime.value = time;
      h.lens.color.copy(c).multiplyScalar(0.5 + 3 * h.intensity);
    });
    if (prog === 'crowd' && crowdTargets.length && this.rng.chance(dt * 0.3)) this.retarget(crowdTargets);

    // Lasers.
    const lp = pres < 0.3 ? 'off' : this.laserProgram;
    this.laserLevel = approach(this.laserLevel, lp === 'off' ? 0 : 1, 6, dt);
    for (const l of this.lasers) {
      const on = this.laserLevel > 0.01 && !this.hideLasers;
      l.mesh.visible = on;
      if (!on) continue;
      const n = l.src === 0 ? 10 : 6;
      const k = l.i / (n - 1) - 0.5;
      const sideSign = l.src === 1 ? 1 : l.src === 2 ? -1 : 0;
      let yaw = 0;
      let pitch = 0;
      switch (lp) {
        case 'fan':
          yaw = k * 1.5;
          pitch = -0.95 + 0.2 * Math.sin(beats * Math.PI * 0.5);
          break;
        case 'scan':
          yaw = k * 0.9 + 0.6 * Math.sin(beats * Math.PI * 0.25);
          pitch = -0.9 + 0.1 * Math.sin(beats * Math.PI + k * 3);
          break;
        case 'tunnel': {
          const a = (l.i / n) * Math.PI * 2 + time * 0.8;
          yaw = 0.35 * Math.cos(a);
          pitch = -0.95 + 0.22 * Math.sin(a);
          break;
        }
      }
      if (sideSign) yaw = yaw * 0.6 + sideSign * 0.7;
      // The centre fan hangs from the back truss: aim it down over the crowd.
      if (l.src === 0) pitch = -2.05 - (pitch + 0.95) * 0.8;
      l.mesh.rotation.set(0, 0, 0);
      l.mesh.rotateY(yaw);
      l.mesh.rotateX(-pitch);
      const flick = 0.75 + 0.25 * Math.exp(-bp * 6) + 0.3 * music.hatPulse;
      l.mat.uniforms.uColor.value.copy(p.lights[(l.i + this.colorShift + l.src) % 6]);
      l.mat.uniforms.uIntensity.value = this.laserLevel * flick * (p.light ? 0.5 : 1.6);
    }

    // Strobe: only at peaks, on beats, never more than 3 flashes/s.
    this.strobe *= Math.exp(-dt * 22);
  }

  /** Called on each beat by the show while strobing is wanted. */
  flash(time: number, level: number) {
    if (!this.strobeEnabled) return;
    if (time - this.lastStrobe < 1 / 3) return;
    this.lastStrobe = time;
    this.strobe = Math.max(this.strobe, level);
  }

  private aimAt(h: Head, target: THREE.Vector3) {
    const d = this.tmp.copy(target).sub(h.base);
    // Yoke: Ry(pan) * Rx(tilt) applied to the beam's rest direction (0,-1,0)
    // gives (-sin t sin p, -cos t, -sin t cos p).
    h.panT = Math.atan2(-d.x, -d.z);
    if (h.panT < 0) h.panT += Math.PI * 2;
    const horiz = Math.hypot(d.x, d.z);
    h.tiltT = Math.atan2(horiz, -d.y);
  }
}

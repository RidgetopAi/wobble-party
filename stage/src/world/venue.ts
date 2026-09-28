/**
 * The venue: dance floor, stage, DJ booth (decks + mixer + LED front),
 * LED wall and columns, speaker stacks, truss arch and the neon sign.
 * Layout (units: a wobbler is ~1 tall):
 *   crowd floor  z in [-2, 16]
 *   stage        z in [-10, -3], deck height 1.0
 *   booth        z = -5.2, DJ stands at z = -6.1
 *   LED wall     z = -9.6
 */

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Music } from '../music';
import type { Palette } from '../theme';
import { floorMaterial, ledMaterial } from './led';
import type { ShowUniforms } from './showUniforms';

export const STAGE_Y = 1.0;
export const STAGE_FRONT = -3.0;
export const BOOTH_Z = -5.2;
export const DJ_Z = -6.2;
/** The DJ stands on a riser behind the booth. */
export const DJ_RISER = 0.5;
export const WALL_Z = -9.6;

export class Venue {
  readonly group = new THREE.Group();
  readonly djSpot = new THREE.Vector3(0, STAGE_Y, DJ_Z);
  readonly trussY = 8.6;
  /** Fixture mount points for moving heads (world). */
  readonly fixtures: THREE.Vector3[] = [];
  private platters: THREE.Mesh[] = [];
  private cones: THREE.Mesh[] = [];
  private neonMats: THREE.MeshStandardMaterial[] = [];
  private faceMats: THREE.MeshStandardMaterial[] = [];
  private metal: THREE.MeshStandardMaterial;
  private stageMat: THREE.MeshStandardMaterial;
  private faders: THREE.Mesh[] = [];

  constructor(
    private palette: Palette,
    private u: ShowUniforms,
    quality: 'high' | 'low',
  ) {
    const p = palette;
    this.metal = new THREE.MeshStandardMaterial({ color: p.metal, roughness: 0.35, metalness: 0.85 });
    this.metal.color = p.metal;
    this.stageMat = new THREE.MeshStandardMaterial({ color: p.floor, roughness: 0.5, metalness: 0.3 });
    this.stageMat.color = p.floor;

    this.buildFloor();
    this.buildStage();
    this.buildBooth(quality);
    this.buildWall();
    this.buildSpeakers();
    this.buildTruss();
    this.buildHouse();
    this.loadSign();
  }

  private buildFloor() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), floorMaterial(this.u, this.palette.floor));
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 12;
    floor.receiveShadow = false;
    this.group.add(floor);
  }

  private buildStage() {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(22, STAGE_Y, 8), this.stageMat);
    deck.position.set(0, STAGE_Y / 2, -7);
    this.group.add(deck);
    // Glowing lip along the front edge.
    const strip = new THREE.MeshBasicMaterial({ color: this.palette.lights[0] });
    strip.color = this.palette.lights[0];
    const lip = new THREE.Mesh(new THREE.BoxGeometry(22, 0.06, 0.06), strip);
    lip.position.set(0, STAGE_Y - 0.05, STAGE_FRONT + 0.02);
    this.group.add(lip);
    const lip2 = lip.clone();
    lip2.position.y = 0.05;
    this.group.add(lip2);
    // Steps at the sides (read as a real stage).
    for (const sx of [-1, 1]) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2, STAGE_Y / 2, 1), this.stageMat);
      step.position.set(sx * 9.5, STAGE_Y / 4, STAGE_FRONT + 0.5);
      this.group.add(step);
    }
  }

  private buildBooth(quality: 'high' | 'low') {
    const booth = new THREE.Group();
    booth.position.set(0, STAGE_Y, BOOTH_Z);
    const W = 3.6;
    const Hh = 0.95;
    const D = 1.1;
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, D), new THREE.MeshStandardMaterial({ color: 0x0c0b12, roughness: 0.4, metalness: 0.5 }));
    body.position.y = Hh / 2;
    booth.add(body);
    // LED front panel.
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, Hh - 0.2), ledMaterial(this.u, [72, 18], 1.1, 1));
    panel.position.set(0, Hh / 2, D / 2 + 0.005);
    booth.add(panel);
    // Top slab.
    const top = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.06, D + 0.1), this.metal);
    top.position.y = Hh + 0.03;
    booth.add(top);
    // Turntables.
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.5, metalness: 0.4 });
    const vinylMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.25, metalness: 0.1 });
    const labelMat = new THREE.MeshStandardMaterial({ color: this.palette.lights[1], emissive: this.palette.lights[1], emissiveIntensity: 0.6 });
    labelMat.color = this.palette.lights[1];
    labelMat.emissive = this.palette.lights[1];
    for (const sx of [-1, 1]) {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.95), deckMat);
      plinth.position.set(sx * 1.05, Hh + 0.11, 0);
      booth.add(plinth);
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, quality === 'high' ? 48 : 24), vinylMat);
      platter.position.set(sx * 1.05, Hh + 0.18, 0);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.045, 24), labelMat);
      platter.add(label);
      // A stripe so the spin reads.
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.046, 0.025), new THREE.MeshBasicMaterial({ color: 0x444455 }));
      stripe.position.x = 0.24;
      platter.add(stripe);
      booth.add(platter);
      this.platters.push(platter);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.5), this.metal);
      arm.position.set(sx * 1.05 + 0.45, Hh + 0.24, -0.05);
      arm.rotation.y = 0.35;
      booth.add(arm);
    }
    // Mixer with faders.
    const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.85), deckMat);
    mixer.position.set(0, Hh + 0.12, 0);
    booth.add(mixer);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.08), knobMat);
      f.position.set(-0.15 + i * 0.15, Hh + 0.2, 0.1);
      booth.add(f);
      this.faders.push(f);
    }
    this.group.add(booth);
    // Riser the DJ stands on.
    const riser = new THREE.Mesh(new THREE.BoxGeometry(3.2, DJ_RISER, 1.6), this.stageMat);
    riser.position.set(0, STAGE_Y + DJ_RISER / 2, DJ_Z - 0.2);
    this.group.add(riser);
  }

  private buildWall() {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(13, 5.6), ledMaterial(this.u, [104, 45], 0.9, 2, true));
    wall.position.set(0, STAGE_Y + 3.2, WALL_Z);
    this.group.add(wall);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(13.4, 6.0, 0.3), this.metal);
    frame.position.set(0, STAGE_Y + 3.2, WALL_Z - 0.2);
    this.group.add(frame);
    // LED columns either side.
    for (const x of [-8.2, -7.2, 7.2, 8.2]) {
      const col = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6.4), ledMaterial(this.u, [5, 44], 1.0, x));
      col.position.set(x, STAGE_Y + 3.3, WALL_Z + 0.6);
      this.group.add(col);
    }
    // Backdrop behind everything.
    const back = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ color: this.palette.bgDeep }));
    (back.material as THREE.MeshBasicMaterial).color = this.palette.bgDeep;
    back.position.set(0, 15, -22);
    this.group.add(back);
  }

  private buildSpeakers() {
    const cab = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.6, metalness: 0.2 });
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.8 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x777788, metalness: 0.9, roughness: 0.3 });
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 1.4), cab);
        const y = STAGE_Y + 0.8 + i * 1.62;
        box.position.set(sx * 10.2, y, -5.2);
        box.rotation.y = -sx * 0.25;
        this.group.add(box);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.3, 0.2, 32), coneMat);
        cone.rotation.x = Math.PI / 2;
        cone.position.set(0, 0, 0.72);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 32), ringMat);
        ring.position.z = 0.72;
        box.add(cone, ring);
        this.cones.push(cone);
      }
    }
  }

  private buildTruss() {
    const beam = (len: number) => {
      const g = new THREE.Group();
      const r = 0.05;
      const w = 0.45;
      const rail = new THREE.CylinderGeometry(r, r, len, 8);
      for (const [x, z] of [
        [-w / 2, -w / 2],
        [w / 2, -w / 2],
        [-w / 2, w / 2],
        [w / 2, w / 2],
      ]) {
        const m = new THREE.Mesh(rail, this.metal);
        m.position.set(x, 0, z);
        g.add(m);
      }
      // Zig-zag lacing.
      const n = Math.floor(len / 0.5);
      const lace = new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(0.5, w), 5);
      const inst = new THREE.InstancedMesh(lace, this.metal, n * 4);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      let k = 0;
      for (let i = 0; i < n; i++) {
        const y = -len / 2 + (i + 0.5) * 0.5;
        const a = Math.atan2(w, 0.5) * (i % 2 ? 1 : -1);
        for (let face = 0; face < 4; face++) {
          const rotY = (face * Math.PI) / 2;
          q.setFromEuler(new THREE.Euler(0, rotY, a, 'YXZ'));
          const off = new THREE.Vector3(0, 0, w / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
          m.compose(new THREE.Vector3(off.x, y, off.z), q, new THREE.Vector3(1, 1, 1));
          inst.setMatrixAt(k++, m);
        }
      }
      g.add(inst);
      return g;
    };
    const H = this.trussY;
    for (const sx of [-1, 1]) {
      const tower = beam(H);
      tower.position.set(sx * 11.8, H / 2, -3.6);
      this.group.add(tower);
      const towerBack = beam(H);
      towerBack.position.set(sx * 11.8, H / 2, -9.4);
      this.group.add(towerBack);
      const side = beam(5.8);
      side.rotation.x = Math.PI / 2;
      side.position.set(sx * 11.8, H, -6.5);
      this.group.add(side);
    }
    for (const z of [-3.6, -9.4]) {
      const top = beam(23.6);
      top.rotation.z = Math.PI / 2;
      top.position.set(0, H, z);
      this.group.add(top);
    }
    // Moving-head mounts along the front and back truss.
    for (let i = 0; i < 8; i++) this.fixtures.push(new THREE.Vector3(-9.8 + i * 2.8, H - 0.35, -3.6));
    for (let i = 0; i < 6; i++) this.fixtures.push(new THREE.Vector3(-8.5 + i * 3.4, H - 0.35, -9.4));
  }

  /** Walls around the dance floor with neon shapes (seen in reverse shots). */
  private buildHouse() {
    // Walls take the theme background: in light themes the room becomes a
    // seamless paper studio instead of a flat grey slab.
    const wallMat = new THREE.MeshBasicMaterial({ color: this.palette.bgDeep, fog: true });
    wallMat.color = this.palette.bgDeep;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 16), wallMat);
    back.position.set(0, 8, 22);
    back.rotation.y = Math.PI;
    this.group.add(back);
    for (const sx of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), wallMat);
      side.position.set(sx * 20, 8, 4);
      side.rotation.y = -sx * Math.PI / 2;
      this.group.add(side);
    }
    const neon = (shape: THREE.Shape, color: THREE.Color, pos: THREE.Vector3, rotY: number, scale: number) => {
      const pts = shape.getSpacedPoints(120).map((p) => new THREE.Vector3(p.x, p.y, 0));
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.05, 8, true);
      const mat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: 2.2 });
      mat.emissive = color;
      this.neonMats.push(mat);
      const m = new THREE.Mesh(tube, mat);
      m.position.copy(pos);
      m.rotation.y = rotY;
      m.scale.setScalar(scale);
      this.group.add(m);
    };
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 0.45 : 1;
      if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    star.closePath();
    const bolt = new THREE.Shape();
    [[0.2, 1], [-0.45, -0.05], [0.0, -0.05], [-0.25, -1], [0.5, 0.15], [0.05, 0.15], [0.35, 1]].forEach(([x, y], i) => (i ? bolt.lineTo(x, y) : bolt.moveTo(x, y)));
    bolt.closePath();
    const heart = new THREE.Shape();
    heart.moveTo(0, -0.9);
    heart.bezierCurveTo(-1.2, -0.1, -0.9, 0.9, 0, 0.45);
    heart.bezierCurveTo(0.9, 0.9, 1.2, -0.1, 0, -0.9);
    neon(star, this.palette.lights[2], new THREE.Vector3(-13.5, 5.2, -8.2), 0.35, 1.2);
    neon(bolt, this.palette.lights[4], new THREE.Vector3(13.5, 5.2, -8.2), -0.35, 1.2);
    neon(heart, this.palette.lights[1], new THREE.Vector3(-8, 6, 21.9), Math.PI, 1.6);
    neon(star, this.palette.lights[3], new THREE.Vector3(8, 6, 21.9), Math.PI, 1.4);
    neon(bolt, this.palette.lights[0], new THREE.Vector3(19.9, 6, 8), -Math.PI / 2, 1.5);
    neon(heart, this.palette.lights[5], new THREE.Vector3(-19.9, 6, 8), Math.PI / 2, 1.5);
    // A glowing bar counter along the back wall.
    const bar = new THREE.Mesh(new THREE.BoxGeometry(14, 1.1, 1.2), new THREE.MeshStandardMaterial({ color: 0x0d0c12, roughness: 0.4, metalness: 0.4 }));
    bar.position.set(0, 0.55, 20.8);
    this.group.add(bar);
    const barStrip = new THREE.Mesh(new THREE.BoxGeometry(14, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: this.palette.lights[0] }));
    (barStrip.material as THREE.MeshBasicMaterial).color = this.palette.lights[0];
    barStrip.position.set(0, 1.12, 20.2);
    this.group.add(barStrip);
  }

  private async loadSign() {
    const font = await new FontLoader().loadAsync(new URL('fonts/titan-one.typeface.json', document.baseURI).href);
    const make = (text: string, size: number, color: THREE.Color, y: number) => {
      const depth = 0.16;
      const g = new TextGeometry(text, { font, size, depth, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
      g.computeBoundingBox();
      const bb = g.boundingBox!;
      const cx = -(bb.max.x + bb.min.x) / 2;
      g.translate(cx, 0, 0);
      // Letter face: dark, lit from within by its own tubes.
      const face = new THREE.MeshStandardMaterial({ color: 0x14111c, emissive: color, emissiveIntensity: 0.28, roughness: 0.35, metalness: 0.2 });
      face.emissive = color;
      this.faceMats.push(face);
      const m = new THREE.Mesh(g, face);
      m.position.set(0, y, WALL_Z + 0.9);
      // Neon tubes tracing every glyph contour (outer edges and holes).
      const tubes: THREE.BufferGeometry[] = [];
      for (const shape of font.generateShapes(text, size)) {
        for (const path of [shape, ...shape.holes]) {
          const pts = path.getSpacedPoints(Math.max(24, Math.round(path.getLength() * 40)));
          const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x + cx, p.y, depth + 0.05)), true);
          tubes.push(new THREE.TubeGeometry(curve, pts.length * 2, 0.034, 6, true));
        }
      }
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: 2.4, roughness: 0.3 });
      tubeMat.emissive = color;
      this.neonMats.push(tubeMat);
      const neon = new THREE.Mesh(mergeGeometries(tubes)!, tubeMat);
      neon.position.copy(m.position);
      this.group.add(m, neon);
    };
    make('WOBBLE', 1.35, this.palette.neon2, STAGE_Y + 6.45);
    make('PARTY', 1.35, this.palette.neon, STAGE_Y + 4.95);
  }

  update(dt: number, music: Music, time: number) {
    // Platters spin at 33⅓ (visually sped up) while music plays.
    const rps = (0.9 + 0.4 * music.hype) * music.presence;
    for (const p of this.platters) p.rotation.y += rps * Math.PI * 2 * dt;
    // Speaker cones pump with the low end.
    const push = 1 + 0.25 * music.kickPulse + 0.12 * music.bass;
    for (const c of this.cones) c.scale.set(push, 1, push);
    // Neon breathes with the vocal and flares on drops.
    // Ink mode (mono light theme): nothing glows; signs read as black lettering.
    const glow = this.palette.ink ? 0 : 1;
    for (const [i, m] of this.neonMats.entries()) {
      m.emissiveIntensity = glow * (2.0 + 0.6 * music.hype + 1.2 * music.dropPulse + (i % 2 === 0 ? 0.6 * music.kickPulse : 0.6 * music.snarePulse));
    }
    for (const m of this.faceMats) m.emissiveIntensity = glow * (0.22 + 0.25 * music.vocal + 0.3 * music.dropPulse);
    for (const f of this.faders) f.position.z = 0.1 + 0.12 * Math.sin(time * 0.7 + f.position.x * 20);
  }
}

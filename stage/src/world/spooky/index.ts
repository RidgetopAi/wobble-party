/**
 * The spooky skin's world: jack-o'-lanterns, cobwebs and a spider, ground
 * fog, bats, ghosts, a witch's hat on the sign, and lightning. Built the
 * first time the skin is worn; hidden (and not updated) otherwise.
 */

import * as THREE from 'three';
import { Section, type Music, type MusicEvent } from '../../music';
import { Rng } from '../../rng';
import type { Palette } from '../../theme';
import type { ShowUniforms } from '../showUniforms';
import type { Venue } from '../venue';
import { Bats } from './bats';
import { GroundFog, type FogOccupant } from './fog';
import { Ghosts } from './ghosts';
import { Lanterns } from './lanterns';
import { Webs } from './webs';

export class SpookyWorld {
  readonly group = new THREE.Group();
  readonly bats = new Bats();
  private lanterns: Lanterns;
  private webs: Webs;
  private fog: GroundFog;
  private ghosts: Ghosts;
  private signDone = false;
  private rng = new Rng(1031);
  /** Lightning level 0..1 (wall + screen flash), and when it may strike next. */
  lightning = 0;
  private nextStrike = 0;
  private t = 0;

  constructor(
    private u: ShowUniforms,
    private p: Palette,
    private venue: Venue,
    quality: 'high' | 'low',
    occupants: FogOccupant[],
  ) {
    this.lanterns = new Lanterns(quality);
    this.webs = new Webs(p);
    this.fog = new GroundFog(u, p, quality);
    this.fog.occupants.push(...occupants, ...this.lanterns.floor);
    this.ghosts = new Ghosts(quality, p);
    this.group.add(this.lanterns.group, this.webs.group, this.fog.group, this.bats.mesh, this.ghosts.group);
  }

  applyPalette(p: Palette) {
    this.ghosts.applyPalette(p);
  }

  onEvent(e: MusicEvent, music: Music) {
    this.webs.onEvent(e);
    this.ghosts.onEvent(e, music);
    switch (e.type) {
      case 'drop':
        this.bats.burst(40);
        this.strike(1);
        break;
      case 'beat':
        // Thunder at the top of a build, and now and then at a peak.
        if (e.barBeat === 0 && music.section === Section.Build && music.build > 0.8) this.strike(0.7);
        else if (e.barBeat === 0 && music.section === Section.Peak && this.rng.chance(0.08)) this.strike(0.6);
        break;
      case 'phraseStart':
        if (music.section === Section.Peak && this.rng.chance(0.35)) this.bats.burst(8);
        break;
    }
  }

  /** Lightning, rate-limited (never more than one strike every 2.5 s). */
  strike(level: number) {
    if (this.t < this.nextStrike) return;
    this.nextStrike = this.t + 2.5;
    this.lightning = Math.max(this.lightning, level);
    this.u.uLightSeed.value = this.rng.range(0, 100);
  }

  update(dt: number, music: Music) {
    this.t += dt;
    this.lightning *= Math.exp(-dt * 7);
    this.u.uLightning.value = this.lightning;
    this.lanterns.update(dt, music, this.p.ink ? 0.3 : 1);
    this.webs.update(dt, music);
    this.fog.update(dt, music);
    this.bats.update(dt, music);
    this.ghosts.update(dt, music);
    if (!this.signDone && this.venue.signBounds) this.dressSign(this.venue.signBounds);
  }

  /** The screen flash for the post pass: a cold blue-white, decaying fast. */
  get flash() {
    return this.lightning * this.lightning * 0.5;
  }

  /** A witch's hat tipped on the W of WOBBLE and a pumpkin on the end of PARTY. */
  private dressSign(b: { wobble: THREE.Box3; party: THREE.Box3 }) {
    this.signDone = true;
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1b1424, roughness: 0.5, metalness: 0.1 });
    const band = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: this.p.neon, emissiveIntensity: 1.8 });
    band.emissive = this.p.neon;
    const hat = new THREE.Group();
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 40), hatMat);
    hat.add(brim);
    let parent: THREE.Object3D = hat;
    for (const [r0, r1, h, tilt] of [
      [0.34, 0.22, 0.42, 0],
      [0.22, 0.11, 0.36, -0.4],
      [0.11, 0.015, 0.34, -0.8],
    ]) {
      const piece = new THREE.Group();
      piece.rotation.x = tilt;
      parent.add(piece);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 24), hatMat);
      m.position.y = h / 2;
      piece.add(m);
      const next = new THREE.Group();
      next.position.y = h;
      piece.add(next);
      parent = next;
    }
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.1, 24, 1, true), band);
    ring.position.y = 0.07;
    hat.add(ring);
    const w = b.wobble;
    hat.position.set(w.min.x + 0.55, w.max.y + 0.02, (w.min.z + w.max.z) / 2);
    hat.rotation.set(0.1, 0.2, 0.28);
    this.group.add(hat);

    // A lantern on the end of PARTY.
    const pb = b.party;
    this.lanterns.add(pb.max.x + 0.6, pb.min.y, (pb.min.z + pb.max.z) / 2 + 0.2, 0.45, -0.2);
  }
}

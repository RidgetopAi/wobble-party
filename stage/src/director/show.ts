/**
 * Show director: song structure -> lighting programmes, LED programmes,
 * lasers, confetti, strobe and crowd-wide moves.
 */

import * as THREE from 'three';
import { dials } from '../dials';
import { Section, type Music, type MusicEvent } from '../music';
import { Rng } from '../rng';
import type { Crowd } from '../crowd';
import type { Confetti } from '../world/fx';
import { LED_MODES } from '../world/led';
import type { HeadProgram, LaserProgram, LightRig } from '../world/lights';
import { pushKick, setLedMode, type ShowUniforms } from '../world/showUniforms';
import type { CameraDirector } from './camera';

export class ShowDirector {
  private rng = new Rng(314);
  private bar = 0;
  /** Debug (?swirl): a swirl ripple every 4 bars. */
  forceSwirl = false;

  constructor(
    private rig: LightRig,
    private u: ShowUniforms,
    private crowd: Crowd,
    private confetti: Confetti,
    private cam: CameraDirector,
  ) {}

  onEvent(e: MusicEvent, music: Music, time: number) {
    switch (e.type) {
      case 'kick':
        pushKick(this.u);
        break;
      case 'beat':
        if (e.barBeat === 0) this.onBar(music, time);
        if (music.section === Section.Peak && music.hype > 0.7 && e.barBeat % 2 === 0) this.rig.flash(time, 0.28);
        if (music.section === Section.Build && music.build > 0.85) this.rig.flash(time, 0.18);
        break;
      case 'drop':
        this.confetti.burst(420, new THREE.Vector3(0, 8.2, 3), new THREE.Vector3(11, 0.3, 5), 1);
        this.rig.flash(time, 0.45);
        this.rig.program = 'ballyhoo';
        this.rig.laserProgram = 'fan';
        setLedMode(this.u, LED_MODES.checker);
        this.cam.onDrop();
        break;
      case 'section':
        this.applySection(music);
        break;
      case 'phraseStart':
        this.cam.onPhraseStart(music);
        if (music.section === Section.Groove && this.rng.chance(0.4)) setLedMode(this.u, LED_MODES.wave);
        break;
      case 'musicStart':
        this.applySection(music);
        break;
    }
  }

  private onBar(music: Music, time: number) {
    this.bar++;
    this.rig.onBar(this.bar);
    this.cam.onBar(music);
    if (this.bar % 8 === 0) this.applySection(music, true);
    // A stadium wave now and then when the room is hot.
    if (music.section === Section.Peak && this.bar % 16 === 8 && this.rng.chance(0.6)) {
      this.crowd.wave(time, this.rng.chance(0.5), 60 / music.danceBpm);
    }
    // The crowd's signature move, rippling out from the middle.
    if (this.forceSwirl && this.bar % 4 === 1) {
      const dir = this.rng.chance(0.5) ? 1 : -1;
      this.crowd.swirlRipple(music, dir);
      this.crowd.dj.startSwirl(music, 0, 2, dir);
    } else if (music.hype > 0.55 && ((music.section === Section.Peak && this.bar % 16 === 0 && this.rng.chance(0.5 * dials.swirl)) || (music.section === Section.Groove && this.bar % 16 === 12 && this.rng.chance(0.25 * dials.swirl)))) {
      this.crowd.swirlRipple(music, this.rng.chance(0.5) ? 1 : -1);
    }
    // Confetti sprinkles at peaks.
    if (music.section === Section.Peak && this.rng.chance(0.3)) {
      this.confetti.burst(60, new THREE.Vector3(this.rng.range(-8, 8), 8.2, 2), new THREE.Vector3(2, 0.2, 2), 0.5);
    }
  }

  applySection(music: Music, rotate = false) {
    const s = music.section;
    const pickHead = (xs: HeadProgram[]) => this.rng.pick(xs);
    const pickLaser = (xs: LaserProgram[]) => this.rng.pick(xs);
    if (!music.playing) {
      this.rig.program = 'calm';
      this.rig.laserProgram = 'off';
      setLedMode(this.u, LED_MODES.plasma);
      return;
    }
    switch (s) {
      case Section.Calm:
        this.rig.program = 'calm';
        this.rig.laserProgram = 'off';
        setLedMode(this.u, LED_MODES.plasma);
        break;
      case Section.Groove:
        this.rig.program = pickHead(['sweep', 'crowd', 'fan']);
        this.rig.laserProgram = music.hype > 0.65 ? pickLaser(['fan', 'scan', 'off']) : 'off';
        setLedMode(this.u, this.rng.pick([LED_MODES.eq, LED_MODES.wave, LED_MODES.tunnel]));
        break;
      case Section.Build:
        this.rig.program = rotate ? pickHead(['fan', 'center']) : 'center';
        this.rig.laserProgram = 'scan';
        setLedMode(this.u, LED_MODES.tunnel);
        break;
      case Section.Peak:
        this.rig.program = pickHead(['ballyhoo', 'sweep', 'fan']);
        this.rig.laserProgram = pickLaser(['fan', 'tunnel', 'scan']);
        setLedMode(this.u, this.rng.pick([LED_MODES.checker, LED_MODES.tunnel, LED_MODES.eq]));
        break;
    }
  }
}

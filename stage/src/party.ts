/**
 * The party: owns the scene and runs the frame in order
 *   music -> show/crowd events -> dancers -> lights/fx -> camera -> post.
 */

import * as THREE from 'three';
import { Crowd } from './crowd';
import { CameraDirector } from './director/camera';
import { ShowDirector } from './director/show';
import { Music, type MusicEvent } from './music';
import { Logos } from './logos';
import { NowPlaying } from './nowplaying';
import { Post } from './post';
import { ThemeState, type Palette } from './theme';
import { Confetti, Haze } from './world/fx';
import { LightRig } from './world/lights';
import { createShowUniforms, setLedMode, updateShowUniforms, type ShowUniforms } from './world/showUniforms';
import { LED_MODES } from './world/led';
import { Venue } from './world/venue';
import { skin, type SkinId } from './skin';
import { SpookyWorld } from './world/spooky';

const COLD_FLASH = new THREE.Color(0.62, 0.74, 1.0);

export interface PartyOptions {
  quality: 'high' | 'low';
  crowd: number;
}

export class Party {
  readonly scene = new THREE.Scene();
  readonly music = new Music();
  readonly theme: ThemeState;
  readonly u: ShowUniforms;
  readonly venue: Venue;
  readonly lights: LightRig;
  readonly crowd: Crowd;
  readonly cam: CameraDirector;
  readonly show: ShowDirector;
  readonly confetti: Confetti;
  readonly haze: Haze;
  readonly post: Post;
  readonly nowPlaying: NowPlaying;
  readonly logos: Logos;
  /** The spooky skin's props and effects (built the first time it is worn). */
  spooky: SpookyWorld | null = null;
  time = 0;
  private pmrem: THREE.PMREMGenerator;
  private envScene = new THREE.Scene();
  private envPanels: { mat: THREE.MeshBasicMaterial; src: THREE.Color; gain: number }[] = [];
  private envTimer = 0;
  private envDirty = true;
  private fog: THREE.FogExp2;
  private envDisabled = false;
  private hazeHidden = false;
  private fogDisabled = false;
  private quality: 'high' | 'low';
  private flashColor = new THREE.Color();

  constructor(
    private renderer: THREE.WebGLRenderer,
    palette: Palette,
    opts: PartyOptions,
  ) {
    this.quality = opts.quality;
    this.theme = new ThemeState(palette);
    const p = this.theme.p;
    this.u = createShowUniforms(p);
    setLedMode(this.u, LED_MODES.plasma);
    this.u.uModeMix.value = 1;
    this.scene.background = p.bgDeep;
    this.fog = new THREE.FogExp2(p.bgDeep.getHex(), 0.016);
    this.scene.fog = this.fog;

    this.venue = new Venue(p, this.u, opts.quality);
    this.crowd = new Crowd(opts.crowd, opts.quality, p);
    this.lights = new LightRig(p, this.venue.fixtures, this.crowd.targets);
    this.confetti = new Confetti(p);
    this.haze = new Haze(p);
    this.cam = new CameraDirector(innerWidth / innerHeight, this.crowd);
    this.show = new ShowDirector(this.lights, this.u, this.crowd, this.confetti, this.cam);
    this.nowPlaying = new NowPlaying(this.u);
    this.logos = new Logos(this.u);
    this.scene.add(this.venue.group, this.crowd.group, this.crowd.shadows, this.lights.group, this.confetti.group, this.haze.group);

    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.buildEnvScene();
    this.post = new Post(renderer, this.scene, this.cam.camera, opts.quality);

    this.theme.onChange((pp) => {
      this.crowd.applyPalette(pp);
      this.spooky?.applyPalette(pp);
      this.envDirty = true;
    });
    this.show.spookySong = () => /\b(thriller|monsters?|zombies?|ghosts?|spooky|halloween|witch(es)?|vampires?|skeletons?|haunted|creep|scream|dead|devil)\b/i.test(this.nowPlaying.track?.title ?? '');
    this.setSkin(skin.id);
    skin.onChange((id) => this.setSkin(id));
    this.music.on((e) => this.onMusic(e));
    // Timing probe: every landing, with the dance-beat position it hit.
    for (const w of this.crowd.all) {
      w.rig.onLand = (speed) => {
        if (this.landings.length < 20000) this.landings.push({ t: this.time, beat: this.music.danceBeatPos, speed, bpm: this.music.danceBpm });
      };
    }
  }

  /** Landing log for timing analysis (tools/timing.mjs). */
  readonly landings: { t: number; beat: number; speed: number; bpm: number }[] = [];

  /** A little "club" for reflections: coloured light panels around a dark room. */
  private buildEnvScene() {
    const p = this.theme.p;
    const room = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: 0x050507, side: THREE.BackSide }));
    this.envScene.add(room);
    const add = (color: THREE.Color, w: number, h: number, pos: THREE.Vector3, gain: number) => {
      const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.copy(pos);
      m.lookAt(0, 0, 0);
      this.envScene.add(m);
      this.envPanels.push({ mat, src: color, gain });
    };
    // Soft overhead key, coloured side panels, and the LED wall behind.
    add(p.fg, 10, 4, new THREE.Vector3(0, 6.5, 4), 2.2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      add(p.lights[i], 3, 5, new THREE.Vector3(Math.sin(a) * 13, 1.5, Math.cos(a) * 13), 2.5);
    }
    add(p.lights[0], 12, 5, new THREE.Vector3(0, 3, -14), 1.6);
  }

  private rebuildEnv() {
    for (const panel of this.envPanels) panel.mat.color.copy(panel.src).multiplyScalar(panel.gain);
    const old = this.scene.environment;
    this.scene.environment = this.pmrem.fromScene(this.envScene, 0.03).texture;
    old?.dispose();
    this.scene.environmentIntensity = this.theme.p.light ? 0.5 : 0.55;
  }

  private onMusic(e: MusicEvent) {
    const ctx = { music: this.music, time: this.time, cameraYaw: null };
    this.crowd.onEvent(e, ctx);
    this.show.onEvent(e, this.music, this.time);
    if (this.spooky?.group.visible) this.spooky.onEvent(e, this.music);
  }

  /** Dress the party for a skin: costumes, decor, confetti, LED programmes. */
  setSkin(id: SkinId) {
    const spooky = id === 'spooky';
    if (spooky && !this.spooky) {
      this.spooky = new SpookyWorld(this.u, this.theme.p, this.venue, this.quality);
      this.scene.add(this.spooky.group);
    }
    if (this.spooky) this.spooky.group.visible = spooky;
    this.crowd.setSkin(id);
    this.venue.setSkin(id);
    this.confetti.setKind(spooky ? 'candy' : 'confetti');
    this.u.uSkin.value = spooky ? 1 : 0;
    this.show.applySection(this.music);
    this.envDirty = true;
  }

  /** Hide layers by name (debugging the image one layer at a time). */
  debugHide(names: Set<string>) {
    if (names.has('lasers')) this.lights.hideLasers = true;
    if (names.has('beams')) for (const h of this.lights.heads) h.beam.visible = false;
    if (names.has('spots')) for (const s of this.lights.spots) s.visible = false;
    if (names.has('haze')) this.hazeHidden = true;
    if (names.has('crowd')) this.crowd.group.visible = false;
    if (names.has('bloom')) this.post.bloom.enabled = false;
    if (names.has('rim')) this.lights.rim.visible = false;
    if (names.has('djspot')) this.lights.djLight.visible = false;
    if (names.has('env')) this.envDisabled = true;
    if (names.has('fog')) this.fogDisabled = true;
  }

  setPalette(p: Palette, instant = false) {
    this.theme.set(p, instant);
  }

  step(dt: number) {
    this.time += dt;
    const t = this.time;
    this.theme.update(dt);
    const p = this.theme.p;
    this.music.update(dt);
    updateShowUniforms(this.u, this.music, p, t, dt);

    this.crowd.update(dt, this.music, t, this.cam.camera);
    this.venue.update(dt, this.music, t);
    this.lights.update(dt, this.music, t, this.crowd.targets);
    this.confetti.update(dt);
    this.haze.update(t, this.music);
    this.nowPlaying.update(dt, this.music);
    this.logos.update(dt, this.music);
    this.cam.update(dt, this.music, t);
    if (this.spooky?.group.visible) this.spooky.update(dt, this.music);

    // Light themes: a daylight party. Additive atmosphere only adds white
    // in a bright room, so haze goes, fog nearly goes, exposure comes down.
    for (const d of this.crowd.dancers) d.glowScale = p.light ? 0 : 1;
    this.fog.color.copy(p.bgDeep);
    this.fog.density = this.fogDisabled ? 0 : p.light ? 0.0025 : 0.016;
    this.haze.group.visible = !p.light && !this.hazeHidden;
    this.renderer.toneMappingExposure = p.light ? 0.82 : 1.05;
    this.envTimer -= dt;
    if (this.envDirty && this.envTimer <= 0 && !this.envDisabled) {
      this.rebuildEnv();
      this.envDirty = false;
      this.envTimer = 0.3;
    }
    // Lightning (spooky) flashes cold blue-white; the strobe stays white.
    const bolt = this.spooky?.group.visible && this.lights.strobeEnabled ? this.spooky.flash : 0;
    if (bolt > this.lights.strobe) this.flashColor.copy(COLD_FLASH);
    else this.flashColor.setRGB(1, 1, 1);
    this.post.finish.uniforms.uFlashColor.value.copy(this.flashColor);
    this.post.update(t, Math.max(this.lights.strobe, bolt), this.music.dropPulse * 0.8, p.light, p.ink);
  }

  render() {
    this.post.render();
  }

  resize(w: number, h: number) {
    this.cam.camera.aspect = w / h;
    this.cam.camera.updateProjectionMatrix();
    this.post.setSize(w, h);
  }
}

/**
 * Character lab (?lab): a lineup of wobblers under neutral studio light for
 * judging looks, shading and poses. `?lab&pose=<name>` freezes a pose.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { crowdLook, djLook, heroLooks } from './wobbler/look';
import { Wobbler } from './wobbler/wobbler';
import { paletteFrom } from './theme';
import { skin } from './skin';

export function startLab(renderer: THREE.WebGLRenderer, params: URLSearchParams) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2833);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 6, 5);
  scene.add(key, new THREE.HemisphereLight(0xbfd4ff, 0x302838, 0.9));

  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x3a3844, roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const palette = paletteFrom({ name: params.get('theme') ?? 'default', colors: {} });
  // Spooky: enough of the crowd to see every costume (?crowd=N for more).
  const nCrowd = Number(params.get('crowd') ?? (skin.id === 'spooky' ? 18 : 6));
  let looks = [djLook(), ...heroLooks(), ...Array.from({ length: nCrowd }, (_, i) => crowdLook(i + 1))];
  if (skin.id === 'spooky') {
    // Front row: one crowd member in each costume; then the DJ and heroes.
    const seen = new Set<number>();
    const each = [];
    for (let i = 1; i < 400 && each.length < 10; i++) {
      const l = crowdLook(i);
      if (l.costume && !seen.has(l.costume.kind)) {
        seen.add(l.costume.kind);
        each.push(l);
      }
    }
    looks = [...each, djLook(), ...heroLooks()];
  }
  const wobs = looks.map((l, i) => {
    const w = new Wobbler(l, i + 1, 'high');
    w.setSkin(skin.id);
    w.applyPalette(palette);
    const cols = Math.max(6, Math.ceil(looks.length / 2));
    const x = ((i % cols) - (cols - 1) / 2) * 1.25;
    const z = -Math.floor(i / cols) * 1.5;
    w.placeAt(x, z, Number(params.get('yaw') ?? 0));
    scene.add(w.root, w.shadow);
    return w;
  });

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 100);
  const span = Math.max(1, Math.ceil(looks.length / 2) / 6);
  camera.position.set(0, 2.2 + 3 * (span - 1), 9.5 * span);
  camera.lookAt(0, 0.4, -0.8 * span);

  const pose = params.get('pose') ?? 'idle';
  let t = 0;
  const step = (dt: number) => {
    t += dt;
    wobs.forEach((w, i) => {
      const e = w.expr;
      const ph = t * 2 + i * 0.7;
      switch (pose) {
        case 'up':
          w.arms[0].target({ raise: 2.7, elbow: 0.3 });
          w.arms[1].target({ raise: 2.7, elbow: 0.3 });
          e.happy = true;
          e.mouth = 0.7;
          break;
        case 'sing':
          e.mouth = 0.5 + 0.5 * Math.sin(ph * 3);
          e.closed = i % 2 === 0;
          w.rig.tiltZ.target = 0.15 * Math.sin(ph);
          break;
        case 'lean':
          w.rig.tiltZ.target = 0.35;
          w.rig.stretch.target = 1.15;
          break;
        case 'zombie':
          for (const a of w.arms) a.target({ raise: Number(params.get('r') ?? 0.3), fwd: Number(params.get('f') ?? 1.5), inward: Number(params.get('i') ?? 0.1), elbow: Number(params.get('e') ?? 0.15) });
          w.rig.tiltX.target = 0.16;
          e.mouth = 0.3;
          break;
        case 'squash':
          w.rig.stretch.target = 0.75;
          break;
        default:
          w.rig.tiltZ.target = 0.06 * Math.sin(ph);
          e.mouth = i % 3 === 0 ? 0.4 : 0;
          e.star = i === 3;
          e.wink = i === 1 ? 1 : 0;
      }
      w.update(dt);
    });
  };
  // Settle springs so a single screenshot shows the pose.
  for (let i = 0; i < 240; i++) step(1 / 120);

  (window as unknown as { __wp: unknown }).__wp = {
    ready: true,
    step: (n: number, dt = 1 / 60) => {
      for (let i = 0; i < n; i++) step(dt);
      renderer.render(scene, camera);
    },
  };
  renderer.setAnimationLoop(() => {
    if (params.has('frozen')) return;
    step(1 / 60);
    renderer.render(scene, camera);
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });
}

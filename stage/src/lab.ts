/**
 * Character lab (?lab): a lineup of wobblers under neutral studio light for
 * judging looks, shading and poses. `?lab&pose=<name>` freezes a pose.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { crowdLook, djLook, heroLooks } from './wobbler/look';
import { Wobbler } from './wobbler/wobbler';
import { paletteFrom } from './theme';

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
  const looks = [djLook(), ...heroLooks(), ...Array.from({ length: 6 }, (_, i) => crowdLook(i + 1))];
  const wobs = looks.map((l, i) => {
    const w = new Wobbler(l, i + 1, 'high');
    w.applyPalette(palette);
    const cols = 6;
    const x = ((i % cols) - (cols - 1) / 2) * 1.25;
    const z = -Math.floor(i / cols) * 1.5;
    w.placeAt(x, z, 0);
    scene.add(w.root, w.shadow);
    return w;
  });

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 2.2, 9.5);
  camera.lookAt(0, 0.4, -0.8);

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

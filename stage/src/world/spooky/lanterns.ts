/**
 * Jack-o'-lanterns: carved pumpkins along the stage front, round the speaker
 * stacks and on the DJ booth, lit from inside. The candles flicker and flare
 * with the kick; two warm point lights spill their glow onto the stage.
 */

import * as THREE from 'three';
import type { Music } from '../../music';
import { Rng } from '../../rng';
import { BOOTH_Z, STAGE_FRONT, STAGE_Y } from '../venue';

/** Ribbed, slightly squashed sphere. */
function pumpkinGeometry() {
  const g = new THREE.SphereGeometry(1, 48, 28);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const phi = Math.atan2(v.x, v.z);
    const groove = Math.pow(1 - Math.abs(Math.sin(phi * 4)), 6);
    const k = 1 - 0.07 * groove;
    // Dimple at the top and bottom where the ribs meet.
    const y = v.y * 0.74 - 0.08 * Math.pow(Math.max(0, v.y), 6);
    pos.setXYZ(i, v.x * k, y, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Carving as an emissive map on the sphere's UVs (the face is at u = 0.25). */
function faceTexture(variant: number) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#fff';
  const cx = 128;
  const tri = (x: number, y: number, w: number, h: number, up = true) => {
    g.beginPath();
    g.moveTo(x - w / 2, up ? y + h / 2 : y - h / 2);
    g.lineTo(x + w / 2, up ? y + h / 2 : y - h / 2);
    g.lineTo(x, up ? y - h / 2 : y + h / 2);
    g.closePath();
    g.fill();
  };
  if (variant === 0) {
    // Classic: triangle eyes and nose, a gap-toothed grin.
    tri(cx - 34, 100, 34, 30);
    tri(cx + 34, 100, 34, 30);
    tri(cx, 128, 16, 14);
    g.beginPath();
    g.moveTo(cx - 62, 140);
    g.quadraticCurveTo(cx, 200, cx + 62, 140);
    g.quadraticCurveTo(cx, 168, cx - 62, 140);
    g.fill();
    g.fillStyle = '#000';
    g.fillRect(cx - 24, 150, 14, 12);
    g.fillRect(cx + 10, 150, 14, 12);
  } else {
    // Spooky: slanted eyes and a jagged mouth.
    g.save();
    g.translate(cx - 34, 100);
    g.rotate(0.35);
    tri(0, 0, 38, 24, false);
    g.restore();
    g.save();
    g.translate(cx + 34, 100);
    g.rotate(-0.35);
    tri(0, 0, 38, 24, false);
    g.restore();
    g.beginPath();
    g.moveTo(cx - 60, 142);
    for (let i = 0; i <= 8; i++) g.lineTo(cx - 60 + i * 15, i % 2 ? 156 : 146);
    g.lineTo(cx + 60, 142);
    g.lineTo(cx + 46, 176);
    for (let i = 8; i >= 0; i--) g.lineTo(cx - 52 + i * 13, i % 2 ? 166 : 178);
    g.closePath();
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Lanterns {
  readonly group = new THREE.Group();
  private mats: THREE.MeshStandardMaterial[] = [];
  private glow: THREE.PointLight[] = [];
  private rng = new Rng(1031);
  private t = 0;
  /** Put a lantern of radius r sitting on height y. */
  readonly add: (x: number, y: number, z: number, r: number, yaw: number) => void;

  constructor(quality: 'high' | 'low') {
    const geo = pumpkinGeometry();
    const stemGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.3, 8);
    stemGeo.translate(0, 0.15, 0);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4f6b25, roughness: 0.8 });
    const flame = new THREE.Color(1.0, 0.55, 0.12);
    for (let v = 0; v < 2; v++) {
      this.mats.push(
        new THREE.MeshStandardMaterial({ color: 0xf2701a, roughness: 0.45, emissive: flame, emissiveMap: faceTexture(v), emissiveIntensity: 2 }),
      );
    }
    this.add = (x: number, y: number, z: number, r: number, yaw: number) => {
      const m = new THREE.Mesh(geo, this.mats[this.rng.int(2)]);
      m.scale.setScalar(r);
      m.position.set(x, y + r * 0.72, z);
      m.rotation.y = yaw;
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.66;
      stem.rotation.z = this.rng.range(-0.3, 0.3);
      m.add(stem);
      this.group.add(m);
    };
    const add = this.add;
    // Stage front, clear of the booth sightline.
    for (const sx of [-1, 1]) {
      [3.0, 4.7, 6.5, 8.3].forEach((x, i) => add(sx * x, STAGE_Y, STAGE_FRONT - 0.45, [0.34, 0.42, 0.3, 0.46][i], sx * -0.15 + this.rng.range(-0.2, 0.2)));
      // A pile on the floor by the stage steps.
      add(sx * 9.4, 0, STAGE_FRONT + 1.6, 0.5, sx * -0.4);
      add(sx * 10.2, 0, STAGE_FRONT + 1.2, 0.36, sx * -0.6);
      add(sx * 9.0, 0, STAGE_FRONT + 2.5, 0.3, sx * -0.3);
      // One on each corner of the DJ booth.
      add(sx * 1.62, STAGE_Y + 1.01, BOOTH_Z + 0.3, 0.17, sx * -0.25);
    }
    if (quality === 'high') {
      for (const sx of [-1, 1]) {
        const l = new THREE.PointLight(0xff8a2a, 0, 7, 1.6);
        l.position.set(sx * 5.5, STAGE_Y + 0.6, STAGE_FRONT - 0.2);
        this.glow.push(l);
        this.group.add(l);
      }
    }
  }

  update(dt: number, music: Music, dim: number) {
    this.t += dt;
    const t = this.t;
    const flare = 0.6 * music.kickPulse * music.presence + 0.8 * music.dropPulse;
    this.mats.forEach((m, i) => {
      const flick = 0.85 + 0.15 * Math.sin(t * (19 + i * 4)) * Math.sin(t * 7.1 + i);
      m.emissiveIntensity = (1.6 + flare) * flick * dim;
    });
    for (const l of this.glow) l.intensity = (6 + 10 * flare) * (0.9 + 0.1 * Math.sin(t * 23)) * dim;
  }

  /** Light themes: keep the lights off (no lights in a bright room). */
  setVisible(v: boolean) {
    this.group.visible = v;
  }
}

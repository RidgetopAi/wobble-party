/** Post-processing: bloom -> tone map -> finish (vignette, grain, strobe, CA). */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uFlash: { value: 0 },
    uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uCA: { value: 0 },
    uVignette: { value: 0.9 },
    uGrain: { value: 0.035 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uFlash, uCA, uVignette, uGrain;
    uniform vec3 uFlashColor;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float ca = uCA * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + c * ca).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - c * ca).b;
      float v = smoothstep(0.95, 0.25, length(c * vec2(1.1, 1.0)));
      col *= mix(1.0, v, uVignette * 0.55);
      col += uFlashColor * uFlash * (0.6 + 0.4 * v);
      col += (h(vUv * 1000.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class Post {
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass;
  readonly finish: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, quality: 'high' | 'low') {
    const size = renderer.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality === 'high' ? 4 : 0 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));
    const scale = quality === 'high' ? 0.5 : 0.35;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x * scale, size.y * scale), 0.6, 0.45, 0.85);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);
  }

  setSize(w: number, h: number) {
    this.composer.setSize(w, h);
  }

  update(time: number, flash: number, drop: number, lightTheme: boolean) {
    const u = this.finish.uniforms;
    u.uTime.value = time % 100;
    u.uFlash.value = flash;
    u.uCA.value = drop;
    u.uVignette.value = lightTheme ? 0.5 : 0.95;
    this.bloom.strength = lightTheme ? 0.35 : 0.6;
    this.bloom.threshold = lightTheme ? 0.95 : 0.85;
  }

  render() {
    this.composer.render();
  }
}

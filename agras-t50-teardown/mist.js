import * as THREE from 'three';
import {rng} from 'teardown-kit/util.js';

const VERTEX = `
  attribute vec2 speck;
  uniform float time, amount, screenHeight;
  varying float strength, softness;

  void main() {
    float progress = fract(time * 1.64 + position.x);
    float angle = position.z * 6.283185 + progress * .48;
    float spread = (.027 + .47 * progress) * sqrt(position.y);
    vec3 fan = vec3(cos(angle) * spread, -.015 - 1.51 * progress,
      sin(angle) * spread - .28 * progress * progress);

    vec4 view = modelViewMatrix * vec4(fan, 1.0);
    gl_Position = projectionMatrix * view;
    softness = speck.y;
    float size = mix(.022 + .033 * speck.x, .13 + .18 * speck.x, softness);
    size *= .68 + .85 * progress;
    gl_PointSize = max(1.0, size * projectionMatrix[1][1] * .5 * screenHeight / max(-view.z, .2));
    strength = amount * smoothstep(0.0, .075, progress) * (1.0 - smoothstep(.64, 1.0, progress));
  }
`;

const FRAGMENT = `
  uniform vec3 fineColor, hazeColor;
  varying float strength, softness;

  void main() {
    float radius = length(2.0 * gl_PointCoord - 1.0);
    float disc = 1.0 - smoothstep(mix(.16, .0, softness), 1.0, radius);
    float alpha = disc * disc * strength * mix(.62, .17, softness);
    gl_FragColor = vec4(mix(fineColor, hazeColor, softness), alpha);
    #include <colorspace_fragment>
  }
`;

export function makeMist(outlet, seed) {
  const random = rng(seed);
  const positions = [], sizes = [];
  for (let i = 0; i < 250; i++) {
    positions.push(random(), random(), random());
    sizes.push(random(), i < 112 ? 1 : 0);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('speck', new THREE.Float32BufferAttribute(sizes, 2));
  // The position attribute stores seeds; it does not enlarge the inspectable part.
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
  const uniforms = {
    time: {value: 0},
    amount: {value: 0},
    screenHeight: {value: 1},
    fineColor: {value: new THREE.Color('#c9efe6')},
    hazeColor: {value: new THREE.Color('#70b5a5')},
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms,
    transparent: true, depthWrite: false, toneMapped: false,
  });
  const cloud = new THREE.Points(geometry, material);
  cloud.frustumCulled = false;
  cloud.visible = false;
  cloud.raycast = () => {};
  const bufferSize = new THREE.Vector2();
  cloud.onBeforeRender = renderer => {
    uniforms.screenHeight.value = renderer.getDrawingBufferSize(bufferSize).y;
  };
  outlet.add(cloud);
  return flight => {
    const amount = flight?.spray ?? 0;
    cloud.visible = amount > 0;
    uniforms.amount.value = amount;
    uniforms.time.value = flight?.time ?? 0;
  };
}

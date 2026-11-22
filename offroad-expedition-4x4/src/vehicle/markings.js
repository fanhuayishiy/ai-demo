import * as THREE from 'three';
import { mesh } from './geometry.js';

function texture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  draw(context);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

let sidewall;
let plate;

export function addSidewallMarkings(wheel) {
  if (!sidewall) {
    const map = texture(512, 512, (context) => {
      context.translate(256, 256);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const setLetters = (text, height, start, end, lower = false) => {
        context.font = `bold ${height}px Arial, sans-serif`;
        context.lineWidth = 1.6;
        context.strokeStyle = 'rgba(20, 19, 16, .57)';
        context.fillStyle = 'rgba(105, 98, 82, .67)';
        [...text].forEach((character, index) => {
          const angle = THREE.MathUtils.lerp(start, end, index / (text.length - 1));
          context.save();
          context.rotate(angle);
          if (lower) context.rotate(Math.PI);
          const y = lower ? 219 : -219;
          context.strokeText(character, 0, y);
          context.fillText(character, 0, y - 0.75);
          context.restore();
        });
      };
      setLetters('ALL TERRAIN', 20, -0.48, 0.48);
      setLetters('LT 285/75 R17', 16, Math.PI + 0.43, Math.PI - 0.43, true);
    });
    sidewall = new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.045, roughness: 0.95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  }
  const graphic = mesh(wheel, new THREE.RingGeometry(0.281, 0.369, 80), sidewall, 0, 0, 0.1441);
  graphic.castShadow = false;
  graphic.receiveShadow = false;
}

export function addPlateMarking(rearDoor) {
  if (!plate) {
    const map = texture(320, 96, (context) => {
      context.fillStyle = '#c1b69b';
      context.fillRect(0, 0, 320, 96);
      context.strokeStyle = '#625748';
      context.lineWidth = 4;
      context.strokeRect(9, 9, 302, 78);
      context.font = 'bold 56px Consolas, monospace';
      context.fillStyle = '#38342a';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('EX 442', 160, 51);
      for (let i = 0; i < 180; i++) {
        const x = (i * 163 + i * i * 41) % 320;
        const y = (i * 97 + i * i * 19) % 95;
        context.fillStyle = i % 3 === 0 ? '#79604455' : '#ded0af8c';
        context.fillRect(x, y, 1 + i % 3, 1 + i % 2);
      }
    });
    plate = new THREE.MeshStandardMaterial({ map, roughness: 0.87 });
  }
  const graphic = mesh(rearDoor, new THREE.PlaneGeometry(0.229, 0.065), plate, -0.394, 0.793, -1.931);
  graphic.rotation.y = Math.PI;
  graphic.castShadow = false;
}

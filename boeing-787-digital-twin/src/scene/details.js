import * as THREE from 'three';
import { line, profileAt } from './geometry.js';

function group(parent, name) {
  const result = new THREE.Group();
  result.name = name;
  parent.add(result);
  return result;
}

export function addWingDetails(parent, stations, side, metal) {
  const details = group(parent, 'wing-surface-details');
  function surface(span, t) {
    const index = Math.max(0, stations.findIndex((s) => s[0] >= span) - 1);
    const a = stations[index],
      b = stations[index + 1];
    const mix = THREE.MathUtils.clamp((span - a[0]) / (b[0] - a[0]), 0, 1);
    const [, x, y, chord, thickness] = a.map((value, i) => THREE.MathUtils.lerp(value, b[i], mix));
    const foil =
      5 *
      thickness *
      (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t ** 2 + 0.2843 * t ** 3 - 0.1036 * t ** 4);
    return [x + t * chord, y + foil + Math.sin(t * Math.PI) * chord * 0.012 + 0.012, span * side];
  }
  for (const [start, end] of [
    [2.7, 4.7],
    [5.2, 7.7],
    [8.2, 10.7],
    [11.2, 13.2],
  ]) {
    const corners = [
      [start, 0.48],
      [end, 0.48],
      [end, 0.69],
      [start, 0.69],
      [start, 0.48],
    ];
    const points = [];
    for (let i = 0; i < corners.length - 1; i++) {
      for (let j = 0; j < 9; j++) {
        const t = j / 8;
        points.push(
          surface(
            THREE.MathUtils.lerp(corners[i][0], corners[i + 1][0], t),
            THREE.MathUtils.lerp(corners[i][1], corners[i + 1][1], t),
          ),
        );
      }
    }
    details.add(line(points, 0x566e77, 0.7));
  }
  for (const fraction of [0.13, 0.76]) {
    const points = Array.from({ length: 80 }, (_, i) => surface(1.2 + (i / 79) * 13.7, fraction));
    details.add(line(points, 0x617881, 0.6));
  }
  const wicks = group(parent, 'wing-static-wicks');
  for (const span of [8.5, 9.7, 10.9, 12, 13.1, 14]) {
    const start = new THREE.Vector3(...surface(span, 1));
    const curve = new THREE.LineCurve3(
      start,
      start.clone().add(new THREE.Vector3(0.34, -0.025, side * 0.015)),
    );
    wicks.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 1, 0.012, 5, false), metal));
  }
}

export function addSpinnerMark(fan, material) {
  const points = Array.from({ length: 70 }, (_, i) => {
    const t = i / 69;
    const x = -0.42 + t * 0.4;
    const radius = (x + 0.45) * 0.46 + 0.006;
    return new THREE.Vector3(
      x,
      Math.cos(t * Math.PI * 3.4) * radius,
      Math.sin(t * Math.PI * 3.4) * radius,
    );
  });
  const spiral = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 90, 0.009, 5, false),
    material,
  );
  spiral.name = 'spinner-spiral-mark';
  fan.add(spiral);
}

export function addFuselageDetails({ nose, upper, lower, profile, materials }) {
  const radome = group(nose, 'radome-seam');
  const x = -13.9,
    r = profileAt(profile, x) + 0.007;
  radome.add(
    line(
      Array.from({ length: 97 }, (_, i) => [
        x,
        Math.cos((i / 96) * Math.PI * 2) * r,
        Math.sin((i / 96) * Math.PI * 2) * r,
      ]),
      0x72858b,
      0.6,
    ),
  );
  const antennas = group(upper, 'dorsal-antennas');
  for (const x of [-5.8, 3.8]) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.2, 0);
    shape.lineTo(-0.1, 0.3);
    shape.lineTo(0.24, 0.08);
    shape.lineTo(0.28, 0);
    shape.closePath();
    const blade = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false }),
      materials.white,
    );
    blade.position.set(x, profileAt(profile, x), -0.0225);
    antennas.add(blade);
  }
  const cargo = group(lower, 'cargo-door-details');
  for (const center of [-6.4, 5.8]) {
    const points = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      const x = center + Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.3 * 0.7;
      const y = -0.69 + Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.3 * 0.37;
      return [x, y, Math.sqrt(profileAt(profile, x) ** 2 - y ** 2) + 0.012];
    });
    cargo.add(line(points, 0x73858c, 0.7));
    for (const dx of [-0.38, 0.38]) {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.028, 0.02), materials.metal);
      latch.position.set(
        center + dx,
        -0.72,
        Math.sqrt(profileAt(profile, center + dx) ** 2 - 0.72 ** 2) + 0.016,
      );
      cargo.add(latch);
    }
  }
}

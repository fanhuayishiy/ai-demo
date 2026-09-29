import * as THREE from 'three';

export function profileAt(points, x) {
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const t = THREE.MathUtils.clamp(
        (x - points[i - 1][0]) / (points[i][0] - points[i - 1][0]),
        0,
        1,
      );
      const width = points[i][0] - points[i - 1][0];
      const secant = (index) =>
        (points[index + 1][1] - points[index][1]) / (points[index + 1][0] - points[index][0]);
      const tangent = (index) => {
        if (index === 0) return secant(0);
        if (index === points.length - 1) return secant(index - 1);
        const left = secant(index - 1),
          right = secant(index);
        return left * right <= 0 ? 0 : (2 * left * right) / (left + right);
      };
      const t2 = t * t,
        t3 = t2 * t;
      return (
        (2 * t3 - 3 * t2 + 1) * points[i - 1][1] +
        (t3 - 2 * t2 + t) * width * tangent(i - 1) +
        (-2 * t3 + 3 * t2) * points[i][1] +
        (t3 - t2) * width * tangent(i)
      );
    }
  }
  return points.at(-1)[1];
}

export function shellGeometry(points, from, to, thetaFrom = 0, thetaTo = Math.PI * 2, scale = 1) {
  const positions = [],
    uv = [],
    indices = [];
  const nx = Math.max(8, Math.ceil((to - from) * 7)),
    nt = 56;
  for (let i = 0; i <= nx; i++) {
    const x = from + ((to - from) * i) / nx;
    const radius = profileAt(points, x) * scale;
    for (let j = 0; j <= nt; j++) {
      const theta = thetaFrom + ((thetaTo - thetaFrom) * j) / nt;
      positions.push(x, Math.cos(theta) * radius, Math.sin(theta) * radius);
      uv.push(i / nx, j / nt);
      if (i < nx && j < nt) {
        const a = i * (nt + 1) + j,
          b = a + nt + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function wingGeometry(stations, side) {
  const positions = [],
    indices = [];
  const chordSteps = 26;
  // A closed airfoil section at each span station; trailing edges meet exactly.
  for (const [z, leading, y, chord, thickness] of stations) {
    for (let j = 0; j <= chordSteps * 2; j++) {
      const top = j <= chordSteps;
      const t = top ? j / chordSteps : 2 - j / chordSteps;
      const foil =
        5 *
        thickness *
        (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t ** 2 + 0.2843 * t ** 3 - 0.1036 * t ** 4);
      positions.push(
        leading + t * chord,
        y + (top ? foil : -foil) + Math.sin(t * Math.PI) * chord * 0.012,
        side * z,
      );
    }
  }
  const ring = chordSteps * 2 + 1;
  for (let i = 0; i < stations.length - 1; i++) {
    for (let j = 0; j < ring - 1; j++) {
      const a = i * ring + j,
        b = a + ring;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function line(points, color = 0x7b969c, opacity = 1) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p))),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
}

export function cylinderBetween(a, b, radius, material, segments = 12) {
  const start = new THREE.Vector3(...a),
    end = new THREE.Vector3(...b);
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), segments),
    material,
  );
  cylinder.position.copy(start).add(end).multiplyScalar(0.5);
  cylinder.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.clone().sub(start).normalize(),
  );
  return cylinder;
}

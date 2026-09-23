import * as THREE from 'three';

// Photo-informed, stylized banyan; dimensions and position are illustrative.
export function createHeartTree() {
  const tree = new THREE.Group();
  tree.name = '南后街爱心树';
  const bark = new THREE.MeshStandardMaterial({ color: '#665c46', roughness: 1 });
  const stone = new THREE.MeshStandardMaterial({ color: '#a7a38b', roughness: 1 });
  const leaves = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .92 });
  const branch = (a, b, bottom, top = bottom * .65) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, start.distanceTo(end), 9), bark);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    mesh.castShadow = mesh.receiveShadow = true;
    tree.add(mesh);
  };
  branch([0, .3, 0], [.55, 4.5, .15], 1.15, .8);
  branch([.55, 4.5, .15], [-.4, 9, 0], .8, .6);
  for (const side of [-1, 1]) {
    branch([.2, 6, 0], [side * 3.2, 12, .3], .6, .34);
    branch([side * 3.2, 12, .3], [side * 6, 17, .2], .34, .09);
    branch([side * 3, 11.5, .3], [side * 7, 13, -1.6], .3, .08);
  }
  for (let i = 0; i < 11; i++) {
    const angle = i * Math.PI * 2 / 11;
    branch([.2, 1.5, 0], [Math.cos(angle) * 2.7, .3, Math.sin(angle) * 2], .26, .12);
  }
  // Dense small clusters follow a heart silhouette with rounded depth, retaining
  // the cleft between the crown's lobes rather than hiding it under large spheres.
  const clusters = [];
  let seed = 14827;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 3400; i++) {
    const x = (random() - .5) * 2.35, y = (random() - .5) * 2.5;
    if ((x*x + y*y - 1) ** 3 - x*x*y*y*y > 0) continue;
    const depth = (random() - .5) * 6.5 * Math.sqrt(Math.max(.15, 1 - (x / 1.3) ** 2));
    clusters.push([x * 8.2, 14.2 + y * 7.2, depth]);
  }
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leaves, clusters.length);
  const dummy = new THREE.Object3D();
  const palette = ['#365c2c', '#456e32', '#527d38', '#648b42', '#74964c'];
  clusters.forEach((p, i) => {
    dummy.position.set(...p);
    const size = .32 + random() * .48;
    dummy.scale.set(size * 1.25, size * .8, size);
    dummy.rotation.set(random() * 3, random() * 3, random() * 3);
    dummy.updateMatrix();
    crown.setMatrixAt(i, dummy.matrix);
    crown.setColorAt(i, new THREE.Color(palette[Math.floor(random() * palette.length)]));
  });
  crown.castShadow = crown.receiveShadow = true;
  tree.add(crown);
  for (let i = 0; i < 20; i++) {
    const x = (random() - .5) * 10, z = (random() - .5) * 3;
    const y = 10 + random() * 3;
    branch([x, y, z], [x + .15, y - 2 - random() * 4, z + .2], .035, .02);
  }
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.1, .5, 24), stone);
  bed.position.y = .25;
  bed.receiveShadow = true;
  tree.add(bed);
  tree.rotation.y = .24;
  return tree;
}

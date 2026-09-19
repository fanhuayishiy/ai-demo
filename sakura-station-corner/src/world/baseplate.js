// 底座：规整正方形纯色平台（diorama 收藏模型基座）
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { grp, mesh, box } from '../core/kit.js';
import { MAT } from '../core/materials.js';
import { PAL } from '../core/palette.js';
import { PLATE_RECT } from './plan.js';

export const PLATE = {
  size: 40,
  thickness: 2.2,
  bevel: 0.11,
  top: -0.55, // 顶面标高（土台底）
  content: 36, // 内容区 x,z ∈ [-18,18]
};

export function build({ color = PAL.baseplate } = {}) {
  const g = grp('baseplate');
  const W = PLATE_RECT.x1 - PLATE_RECT.x0, D = PLATE_RECT.z1 - PLATE_RECT.z0;
  const CX = (PLATE_RECT.x0 + PLATE_RECT.x1) / 2, CZ = (PLATE_RECT.z0 + PLATE_RECT.z1) / 2;
  const geo = new RoundedBoxGeometry(W, PLATE.thickness, D, 3, PLATE.bevel);
  const mat = MAT.paint(color, {
    steps: 2,
    spec: 0.1,
    specPower: 14,
    specCut: 0.5,
    sheen: 0.012,
    rim: 0.1,
    rimColor: '#ffe9ef',
    shadowTint: '#a9a49b',
    shadowAmt: 0.5,
    dither: 0.006,
    sat: 0.98,
  });
  const m = new THREE.Mesh(geo, mat);
  m.name = 'plate';
  m.position.set(CX, -PLATE.thickness / 2 + PLATE.top, CZ);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);

  // 草绿台面板：参考图的基座顶面是一整块草地，内容区外那 2 m 边带也应是草绿，
  // 而不是裸底色——否则「收藏模型台」的感觉会被一圈米白边削弱。
  const deck = mesh(box(W - 0.16, 0.06, D - 0.16), MAT.grass({ base: PAL.grassDeck, repeat: 1 }), {
    pos: [CX, PLATE.top + 0.012, CZ],
    cast: false,
    receive: true,
    name: 'grass-deck',
  });
  g.add(deck);
  return g;
}

export default build;

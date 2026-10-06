import * as THREE from 'three';

// Shared, texture-free geometry keeps all 25 articulated characters lightweight.
const shapes = {
  sphere: new THREE.SphereGeometry(1, 12, 8),
  capsule: new THREE.CapsuleGeometry(1, 1, 3, 8),
  box: new THREE.BoxGeometry(1, 1, 1),
  hair: new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI * .56),
};
const materials = new Map();
function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .83 }));
  return materials.get(color);
}
function part(parent, shape, color, x, y, z, sx, sy, sz, shadow = true) {
  const mesh = new THREE.Mesh(shapes[shape], material(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = shadow;
  parent.add(mesh);
  return mesh;
}
const shirts = [0xf3b944, 0xee846c, 0x83bcb3, 0x8b96cf, 0xa8c77e, 0xe89daa];
const skinColors = [0xf1c7a5, 0xe7b38e, 0xd8a279, 0xf7d7ba];
const hairColors = [0x45372f, 0x302d30, 0x68503a];
const slideCurve = new THREE.CatmullRomCurve3([
  [-9, 2.58, .35], [-9, 2.1, 1.1], [-9, .8, 2.7], [-9, .22, 4],
].map(point => new THREE.Vector3(...point)));
const swingAxis = new THREE.Vector3(1, 0, 0);
const smooth = value => value * value * (3 - 2 * value);

function character(index, isTeacher) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = skinColors[index % skinColors.length];
  const hair = hairColors[index % hairColors.length];
  const shirt = isTeacher ? [0xe9b177, 0x98b9ad, 0xe49a86][index % 3] : shirts[index % shirts.length];
  part(body, 'sphere', shirt, 0, .61, 0, .205, .26, .14);
  part(body, 'sphere', 0xfff6dc, 0, .79, .103, .092, .032, .025, false);
  part(body, 'sphere', 0x556a78, 0, .41, 0, .177, .1, .125);
  const head = new THREE.Group();
  head.position.y = .94;
  body.add(head);
  part(head, 'sphere', skin, 0, 0, 0, .225, .235, .208);
  part(head, 'hair', hair, 0, .035, -.015, .233, .233, .218);
  part(head, 'sphere', hair, -.135, .125, .14, .105, .083, .058);
  for (const side of [-1, 1]) {
    part(head, 'sphere', skin, side * .216, -.01, 0, .043, .065, .043);
    part(head, 'sphere', 0x313338, side * .077, .012, .194, .021, .029, .013, false);
    part(head, 'sphere', 0xffffff, side * .077 - .005, .021, .205, .006, .008, .004, false);
    part(head, 'sphere', 0xe9998c, side * .13, -.062, .172, .037, .02, .009, false);
  }
  part(head, 'sphere', 0xc27a63, 0, -.083, .197, .029, .011, .006, false);
  part(head, 'sphere', skin, 0, -.035, .207, .026, .028, .026, false);
  if (index % 4 === 0 && !isTeacher) {
    part(head, 'hair', 0xf8d270, 0, .095, -.012, .244, .19, .23);
    part(head, 'sphere', 0xf8d270, 0, .11, .184, .23, .025, .13);
  } else if (index % 3 === 1) {
    for (const side of [-1, 1]) {
      part(head, 'sphere', hair, side * .211, .045, -.1, .09, .12, .09);
      part(head, 'sphere', shirt, side * .217, .08, -.08, .067, .03, .064);
    }
  }
  if (isTeacher) {
    part(body, 'box', 0xf9efd8, .045, .62, .145, .08, .105, .015, false);
    part(body, 'box', 0x53766f, .045, .735, .14, .012, .13, .012, false);
  }
  const arms = [], forearms = [], legs = [], knees = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .19, .75, 0); body.add(arm);
    part(arm, 'capsule', shirt, side * .022, -.085, 0, .064, .063, .064);
    const elbow = new THREE.Group(); elbow.position.set(side * .035, -.17, 0); arm.add(elbow);
    part(elbow, 'capsule', skin, 0, -.061, 0, .042, .053, .042);
    part(elbow, 'sphere', skin, 0, -.143, 0, .053, .054, .05);
    const leg = new THREE.Group(); leg.position.set(side * .091, .42, 0); body.add(leg);
    part(leg, 'capsule', 0x546979, 0, -.085, 0, .064, .064, .065);
    const knee = new THREE.Group(); knee.position.y = -.18; leg.add(knee);
    part(knee, 'capsule', skin, 0, -.085, 0, .046, .058, .046);
    part(knee, 'sphere', 0xfff3dc, 0, -.152, 0, .05, .05, .048);
    part(knee, 'sphere', index % 2 ? 0xd96754 : 0x435d67, 0, -.19, .034, .068, .051, .106);
    part(knee, 'box', 0xf6ead5, 0, -.227, .034, .12, .02, .16, false);
    arms.push(arm); forearms.push(elbow); legs.push(leg); knees.push(knee);
  }
  root.scale.setScalar(isTeacher ? 1.3 : .94 + (index % 3) * .035);
  const details = head.children.filter(mesh => mesh.scale.x < .14 && mesh.material !== material(hair));
  return { root, body, head, arms, forearms, legs, knees, details };
}

const definitions = [
  [-9.7, -7.1, 'class', '认真听讲', 'classroom'], [-6.6, -7.1, 'raise', '举手提问', 'classroom'],
  [-1.9, -7.1, 'read', '翻阅绘本', 'classroom'], [1.2, -7.1, 'paint', '绘画小天地', 'classroom'],
  [6.4, -8.3, 'read', '阅读时光', 'reading'], [9.6, -8.3, 'read', '分享绘本', 'reading'],
  [-13.7, 8.1, 'sand', '堆一座沙堡', 'playground'], [-12.1, 8.7, 'sand', '挖掘小世界', 'playground'],
  [-14, 2, 'swing', '荡起小秋千', 'playground'], [-9, 0, 'slide', '滑梯冒险', 'playground'],
  [-6.5, 7, 'seesaw', '跷跷板游戏', 'playground'], [-3.5, 7, 'seesaw', '一起找平衡', 'playground'],
  [0, 0, 'run', '追逐微风', 'sports'], [0, 0, 'run', '快乐小跑', 'sports'],
  [0, 0, 'run', '跑道探险', 'sports'], [0, 0, 'run', '阳光运动', 'sports'],
  [7, 4.8, 'kick', '踢踢小足球', 'sports'], [9.6, 4.1, 'ball', '等待传球', 'sports'],
  [-1.8, 10.5, 'talk', '草地悄悄话', 'garden'], [0, 10.8, 'talk', '分享新发现', 'garden'],
  [2, 10.6, 'jump', '蹦蹦跳跳', 'garden'], [1.4, 8.7, 'wave', '向朋友招手', 'garden'],
  [-5, -8.8, 'teach', '陪伴课堂探索', 'classroom'], [1, 0, 'walk', '巡视与陪伴', 'garden'],
  [-10.8, 5.5, 'watch', '守护快乐游戏', 'playground'],
];

/** Construct 22 anonymous pupils and three supervising teachers. Time is seconds. */
export function createPeople(scene) {
  const people = [], pickables = [], rigs = [];
  definitions.forEach(([x, z, behavior, activity, category], index) => {
    const isTeacher = index >= 22;
    const rig = character(index, isTeacher);
    const id = `${isTeacher ? 'teacher' : 'child'}-${String(isTeacher ? index - 21 : index + 1).padStart(2, '0')}`;
    const record = { id, group: rig.root, name: isTeacher ? ['暖心老师', '陪伴老师', '阳光老师'][index - 22] : `小小探索家 ${String(index + 1).padStart(2, '0')}`, activity, category, isTeacher };
    rig.root.name = id;
    rig.root.position.set(x, category === 'classroom' || category === 'reading' ? 4.2 : 0, z);
    if (behavior === 'paint') {
      const pencil = part(rig.forearms[1], 'capsule', 0xea8b47, 0, -.15, .06, .013, .09, .013);
      pencil.name = 'colored-pencil';
      pencil.rotation.x = -.55;
      part(rig.body, 'box', 0xfff8e9, 0, .59, .34, .4, .02, .31, false);
      for (let line = 0; line < 3; line++) {
        const stroke = part(rig.body, 'box', [0x74ae91, 0xe9b84f, 0xe78c79][line], -.07 + line * .07, .605, .34, .022, .008, .17, false);
        stroke.rotation.y = -.3 + line * .3;
      }
    }
    rig.root.traverse(object => {
      object.userData.person = record;
      if (object.isMesh) pickables.push(object);
    });
    // Reading props sit in the child's hands and share cached box geometry.
    if (behavior === 'read') {
      const book = part(rig.body, 'box', index % 2 ? 0xe3b553 : 0x699baf, 0, .57, .31, .32, .035, .23);
      book.rotation.x = -.3;
      book.userData.person = record;
      pickables.push(book);
      part(book, 'box', 0xfff3d9, 0, .6, 0, .86, .2, .85, false).userData.person = record;
    }
    scene.add(rig.root);
    people.push(record);
    rigs.push({ ...rig, record, x, z, behavior, index, floor: rig.root.position.y });
  });
  const cameraPosition = new THREE.Vector3();
  function update(time, camera) {
    const t = Number.isFinite(time) ? Math.max(0, time) : 0;
    if (camera) camera.getWorldPosition(cameraPosition);
    for (const rig of rigs) {
      const { root, body, head, arms, forearms, legs, knees, behavior, index } = rig;
      const phase = t * (2.15 + index % 4 * .17) + index * 1.91;
      let state = 'idle';
      let slideSeated = null;
      root.position.set(rig.x, rig.floor, rig.z);
      root.rotation.set(0, 0, 0);
      body.position.y = 0; body.rotation.set(0, 0, 0);
      head.rotation.set(0, Math.sin(phase * .27) * .11, 0);
      for (let i = 0; i < 2; i++) {
        arms[i].rotation.set(.025, 0, (i ? -1 : 1) * .1);
        forearms[i].rotation.set(0, 0, 0);
        legs[i].rotation.set(0, 0, 0); knees[i].rotation.set(0, 0, 0);
      }
      if (['class', 'raise', 'read', 'paint', 'swing', 'seesaw', 'slide'].includes(behavior)) state = 'seated';
      if (behavior === 'class' || behavior === 'raise' || behavior === 'read' || behavior === 'paint') {
        root.position.y = (rig.record.category === 'reading' ? 5.075 : 4.82) - .42 * root.scale.y;
        if (rig.record.category === 'classroom') root.rotation.y = Math.PI;
        if (behavior === 'raise') state = 'wave';
      }
      if (behavior === 'swing') {
        const a = Math.sin(t * 1.6) * .42;
        root.position.set(0, -2.2, 0).applyAxisAngle(swingAxis, a);
        root.position.x += -14;
        root.position.y += 3 - .42 * root.scale.y;
        root.position.z += 2;
      }
      if (behavior === 'seesaw') {
        const a = Math.sin(t * 1.3) * .16;
        const side = index === 10 ? -1.5 : 1.5;
        root.position.set(-5 + side * Math.cos(a) - .28 * Math.sin(a), .75 + side * Math.sin(a) + .28 * Math.cos(a) - .42 * root.scale.y, 7);
        root.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      if (behavior === 'slide') {
        const p = (t % 14) / 14;
        const hipHeight = .42 * root.scale.y;
        if (p < .22) {
          const u = p / .22;
          slideCurve.getPoint(u, root.position);
          root.position.y -= hipHeight;
          slideSeated = 1;
        } else if (p < .34) {
          const u = (p - .22) / .12;
          root.position.set(-9 - 1.1 * u, (.22 - hipHeight) * (1 - smooth(u)), 4);
          slideSeated = 1 - smooth(u);
          state = 'walking'; root.rotation.y = -Math.PI / 2;
        } else if (p < .68) {
          const u = (p - .34) / .34;
          root.position.set(-10.1, 0, 4 - 5.2 * u);
          state = 'walking'; root.rotation.y = Math.PI;
        } else if (p < .77) {
          const u = (p - .68) / .09;
          root.position.set(-10.1 + 1.1 * u, 0, -1.2);
          state = 'walking'; root.rotation.y = Math.PI / 2;
        } else {
          const u = (p - .77) / .23;
          root.position.set(-9, (2.58 - hipHeight) * u, -1.2 + 1.55 * u);
          slideSeated = smooth(Math.max(0, (u - .7) / .3));
          state = 'climb';
        }
      }
      if (behavior === 'run') {
        const a = t * (.24 + (index - 12) * .012) + (index - 12) * Math.PI / 2;
        root.position.set(8 + Math.cos(a) * 6.1, 0, 5 + Math.sin(a) * 3.7);
        root.rotation.y = Math.atan2(-6.1 * Math.sin(a), 3.7 * Math.cos(a));
        state = 'running';
      }
      if (behavior === 'walk') {
        root.position.set(1 + Math.sin(t * .2) * 2.4, 0, -.5 + Math.sin(t * .4) * .8);
        root.rotation.y = Math.atan2(Math.cos(t * .2) * .48, Math.cos(t * .4) * .32);
        state = 'walking';
      }
      if (behavior === 'sand') { state = 'play'; root.position.y = .41; root.rotation.y = index === 6 ? .8 : -1.8; }
      if (behavior === 'kick') { state = 'play'; root.rotation.y = 1.8; }
      if (behavior === 'ball') { state = 'talk'; root.rotation.y = -1.8; }
      if (behavior === 'talk') { state = 'talk'; root.rotation.y = index === 18 ? .9 : -.9; }
      if (behavior === 'jump') state = 'jump';
      if (behavior === 'wave' || behavior === 'teach') state = 'wave';
      if (behavior === 'watch') { root.rotation.y = -.5; state = 'talk'; }
      // Staggered deterministic attention cycles add pauses and individual gestures.
      const attentive = Math.sin(t * .43 + index * 2.3) > -.35;
      if (state === 'walking' || state === 'running') {
        const stride = Math.sin(phase * (state === 'running' ? 2.9 : 1.8));
        const magnitude = state === 'running' ? .68 : .36;
        legs[0].rotation.x = stride * magnitude; legs[1].rotation.x = -stride * magnitude;
        arms[0].rotation.x = -stride * magnitude; arms[1].rotation.x = stride * magnitude;
        knees[0].rotation.x = Math.max(0, -stride) * .5; knees[1].rotation.x = Math.max(0, stride) * .5;
        if (state === 'running') { body.position.y = Math.abs(stride) * .07; body.rotation.x = .1; }
      }
      if (state === 'seated' || behavior === 'raise') {
        legs.forEach(leg => { leg.rotation.x = -Math.PI / 2; });
        knees.forEach(knee => { knee.rotation.x = Math.PI / 2; });
        arms.forEach(arm => { arm.rotation.x = -.55; });
        forearms.forEach(arm => { arm.rotation.x = -.65; });
      }
      if (state === 'wave') {
        arms[1].rotation.z = attentive ? -2.45 + Math.sin(phase * 2) * .18 : -.55;
        forearms[1].rotation.x = -.4;
      }
      if (state === 'talk') {
        arms[0].rotation.x = -.3 - (Math.sin(phase) + 1) * .15;
        forearms[0].rotation.x = -.45;
      }
      if (state === 'jump') {
        const jump = Math.max(0, Math.sin(phase * 1.1));
        body.position.y = jump * .32;
        arms[0].rotation.z = jump * 1.3; arms[1].rotation.z = -jump * 1.3;
      }
      if (state === 'play') {
        if (behavior === 'sand') {
          body.rotation.x = .28; arms[0].rotation.x = -.8 + Math.sin(phase) * .23;
          forearms[0].rotation.x = -.4;
        } else legs[1].rotation.x = -Math.max(0, Math.sin(t * 1.6)) * .8;
      }
      if (state === 'climb') {
        arms.forEach((arm, side) => { arm.rotation.x = -2.4 + Math.sin(phase * 2 + side * Math.PI) * .4; });
        legs.forEach((leg, side) => { leg.rotation.x = -.25 + Math.sin(phase * 2 + side * Math.PI) * .35; });
      }
      if (slideSeated !== null) {
        legs.forEach(leg => { leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, -Math.PI / 2, slideSeated); });
        knees.forEach(knee => { knee.rotation.x = THREE.MathUtils.lerp(knee.rotation.x, Math.PI / 2, slideSeated); });
      }
      if (behavior === 'paint') {
        arms[1].rotation.x = -.83 + Math.sin(phase * 1.7) * .11;
        arms[1].rotation.z = -.1 + Math.cos(phase * 1.4) * .09;
        forearms[1].rotation.x = -.55 + Math.sin(phase * 1.7) * .08;
        head.rotation.x = .18;
      }
      const showDetails = !camera || root.position.distanceToSquared(cameraPosition) <= 55 * 55;
      for (const detail of rig.details) detail.visible = showDetails;
      rig.record.state = state;
    }
  }
  update(0);
  return { people, pickables, update };
}

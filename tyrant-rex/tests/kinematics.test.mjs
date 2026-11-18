import test from 'node:test';
import assert from 'node:assert/strict';
import {poseRex, DIM} from '../kinematics.mjs';
import * as kinematics from '../kinematics.mjs';

test('four planted steps carry the rex to each roar, and the return run closes the loop', () => {
  assert.equal(typeof kinematics.posePatrol, 'function', 'the exhibit needs a traveling gait before each roar');
  const {posePatrol, PATROL, ROAR} = kinematics;
  const legLength = (first, second) => Math.hypot(...first.map((value, axis) => value - second[axis]));
  const worldAnkle = ({path}, {ankle}) => [
    path.x + Math.cos(path.yaw) * (ankle[0] - DIM.hipX) + Math.sin(path.yaw) * ankle[2],
    ankle[1],
    path.z - Math.sin(path.yaw) * (ankle[0] - DIM.hipX) + Math.cos(path.yaw) * ankle[2],
  ];
  let previous;
  const steps = [[], []];
  const roarAnchors = [[], []];
  for (let frame = 0; frame < 1600; frame++) {
    const time = frame * PATROL.duration / 1600;
    const pose = posePatrol(time);
    const run = Math.floor(time / (PATROL.duration / 2));
    assert.ok(pose.legs.some(leg => leg.contact), 'there is always a supporting foot');
    for (const [index, leg] of pose.legs.entries()) {
      assert.ok(Math.abs(legLength(leg.hip, leg.knee) - DIM.femur) < 1e-6);
      assert.ok(Math.abs(legLength(leg.knee, leg.ankle) - DIM.tibia) < 1e-6);
      assert.ok(leg.toe[1] >= DIM.ground - 1e-8);
      const previousLeg = previous?.legs[index];
      if (leg.contact && previousLeg?.contact) {
        assert.ok(legLength(worldAnkle(pose, leg), worldAnkle(previous, previousLeg)) < .00001, 'a planted ankle stays fixed in world space');
      }
      if (pose.stage === 'walk' && !leg.contact && previousLeg?.contact) steps[run].push(index);
    }
    if (pose.stage === 'walk') {
      assert.ok(pose.jaw < .25 && pose.motion.roar === 0, 'walking comes before the roar');
    }
    if (pose.motion.roar > .9) {
      assert.equal(pose.stage, 'roar');
      assert.ok(pose.jaw > .85 && pose.legs.every(leg => leg.contact));
      roarAnchors[run].push(pose.path.x);
    }
    previous = pose;
  }
  assert.deepEqual(steps, [[0, 1, 0, 1], [0, 1, 0, 1]], 'each run takes four alternating steps');
  assert.ok(roarAnchors.every(anchors => anchors.length > 0 && anchors.every(anchor => anchor === anchors[0])));
  assert.ok(roarAnchors[1][0] - roarAnchors[0][0] > 2.8, 'the two roars occur at different ends of the platform');
  assert.ok(Math.abs(posePatrol(PATROL.walk + ROAR.duration + PATROL.turn + PATROL.walk / 2).path.yaw - Math.PI) < 1e-8);
  assert.deepEqual(posePatrol(PATROL.duration, {heartPhase: 0}), posePatrol(0));
  const beforeWrap = posePatrol(PATROL.duration - 1e-5);
  const afterWrap = posePatrol(0);
  assert.ok(beforeWrap.legs.every((leg, index) => legLength(worldAnkle(beforeWrap, leg), worldAnkle(afterWrap, afterWrap.legs[index])) < .001));
});

test('the roar cycle keeps the two-link legs valid and repeats at the boundary', () => {
  for (let i = 0; i <= 240; i++) {
    const pose = poseRex(i / 240);
    for (const leg of pose.legs) {
      assert.ok(leg.angles.every(Number.isFinite));
      for (const point of [leg.hip, leg.knee, leg.ankle, leg.toe]) assert.ok(point.every(Number.isFinite));
      assert.ok(leg.toe[1] >= DIM.ground - 1e-8, 'feet never pass through the floor');
      assert.ok(Math.abs(Math.hypot(...leg.hip.map((n, j) => n - leg.knee[j])) - DIM.femur) < 1e-6);
      assert.ok(Math.abs(Math.hypot(...leg.knee.map((n, j) => n - leg.ankle[j])) - DIM.tibia) < 1e-6);
    }
  }
  assert.deepEqual(poseRex(0), poseRex(1), 'the roar settles into its starting pose');
});

test('both feet stay braced as the torso draws back and lunges', () => {
  const planted = poseRex(0).legs.map(leg => leg.ankle);
  assert.ok(Math.abs(planted[1][0] - planted[0][0]) > .5, 'the feet take a staggered stance');
  for (let i = 0; i < 100; i++) {
    const {legs} = poseRex(i / 100);
    assert.deepEqual(legs.map(leg => leg.ankle), planted, 'neither foot slides or lifts');
    assert.ok(legs.every(leg => leg.contact));
  }
  assert.ok(poseRex(.22).legs[0].hip[0] - poseRex(.34).legs[0].hip[0] > .35, 'the torso drives forward over the planted feet');
});

test('the jaws open wide for a sustained roar and close again during recovery', () => {
  assert.ok(poseRex(.1).jaw < .25);
  for (let step = 32; step <= 53; step++) {
    assert.ok(poseRex(step / 100).jaw > Math.PI / 4, 'the held roar stays above 45 degrees');
  }
  assert.ok(poseRex(.86).jaw < .25);
  for (let i = 0; i < 100; i++) {
    const pose = poseRex(i / 100);
    assert.ok(pose.jaw >= 0.06 && pose.jaw <= 1.06);
    assert.equal(pose.tail.length, 14);
    assert.ok(pose.tail.every(Number.isFinite));
  }
});

test('the head looks aside, turns before the call and holds its aim until the jaws close', () => {
  const windup = poseRex(.11), turn = poseRex(.225), peak = poseRex(.39);
  assert.ok(windup.motion.headYaw < -.1);
  assert.ok(turn.motion.headYaw > .42 && turn.jaw < .2 && turn.motion.roar === 0);
  assert.ok(peak.motion.headYaw > .85 && peak.jaw > 1 && peak.motion.roar > .95);
  assert.ok(poseRex(.75).motion.headYaw > .35 && poseRex(.75).motion.roar === 0);
  assert.equal(poseRex(.97).motion.headYaw, 0);
});

test('requesting a fresh roar blends from the current body pose without resetting the heart', () => {
  const current = poseRex(.4, {heartPhase: .61});
  const start = poseRex(.12, {heartPhase: .61, from: current, blend: 0});
  const halfway = poseRex(.12, {heartPhase: .65, from: current, blend: .5});
  assert.equal(start.jaw, current.jaw);
  assert.equal(start.motion.headYaw, current.motion.headYaw);
  assert.deepEqual(start.legs, current.legs);
  assert.deepEqual(start.tail, current.tail);
  assert.equal(start.reactorAngle, current.reactorAngle);
  assert.ok(halfway.jaw < current.jaw && halfway.jaw > poseRex(.12).jaw);
  assert.ok(halfway.reactorAngle > start.reactorAngle);
});

test('the heart flywheel turns in one direction and crosses the cycle boundary continuously', () => {
  for (let i = 0; i < 120; i++) {
    const a = poseRex(i / 120).reactorAngle;
    const b = poseRex((i + .5) / 120).reactorAngle;
    assert.ok(Number.isFinite(a) && b > a, 'the rotor advances instead of oscillating');
  }
  const before = poseRex(1 - 1e-6).reactorAngle;
  const after = poseRex(1e-6).reactorAngle;
  assert.ok(Math.hypot(Math.cos(before) - Math.cos(after), Math.sin(before) - Math.sin(after)) < .00002);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import * as motion from '../kinematics.mjs';
const {PHASES, travel, tourPose, TOUR_SECONDS} = motion;

test('the airframe matches the T50 drawing with a wider front row and an elevated rear row', () => {
  assert.ok(motion.ROTOR_MOUNTS, 'the four rotor mounts have a shared layout');
  const front = motion.ROTOR_MOUNTS.filter(mount => mount.front);
  const rear = motion.ROTOR_MOUNTS.filter(mount => !mount.front);
  assert.equal(front.length, 2);
  assert.equal(rear.length, 2);
  const track = row => Math.abs(row[1].x - row[0].x);
  assert.ok(Math.abs(track(front) / track(rear) - 1710 / 1645) < .005);
  assert.ok(rear[0].y > front[0].y);
});

test('each assembly step returns to its mount at zero and reaches its full offset at one', () => {
  for (const [start, end] of Object.values(PHASES)) {
    assert.equal(travel(0, start, end), 0);
    assert.equal(travel(1, start, end), 1);
    assert.equal(travel((start + end) / 2, start, end).toFixed(5), '0.50000');
    let previous = 0;
    for (let frame = 0; frame <= 100; frame++) {
      const current = travel(frame / 100, start, end);
      assert.ok(current >= previous, 'pieces never reverse during a disassembly sweep');
      previous = current;
    }
  }
  assert.ok(PHASES.propellers[0] < PHASES.motorTop[0]);
  assert.ok(PHASES.tank[0] < PHASES.avionics[0]);
});

test('the looping teardown tour can be sampled out of order for frame capture', () => {
  const tourStart = tourPose(0);
  assert.deepEqual(tourStart, tourPose(TOUR_SECONDS));
  assert.equal(tourPose(7).amount, 1);
  assert.equal(tourPose(11).focus, 'motors');
  assert.equal(tourPose(17).focus, 'sensors');
  assert.equal(tourPose(22).view, 'top');
});

test('the aircraft climbs before translating and lands at the far end', () => {
  assert.ok(motion.flightPose, 'the flight demonstration defines the motion timeline');
  const {flightPose, FLIGHT} = motion;
  const rest = flightPose(0);
  const takeoff = flightPose(3.1);
  const forward = flightPose(4.85);
  const descent = flightPose(10.5);
  const landed = flightPose(FLIGHT.seconds);
  assert.equal(rest.lift, 0);
  assert.equal(rest.z, -FLIGHT.span / 2);
  assert.equal(takeoff.phase, 'takeoff');
  assert.ok(takeoff.lift > 0 && takeoff.z === rest.z);
  assert.equal(forward.phase, 'forward');
  assert.ok(forward.z > takeoff.z && forward.lift > takeoff.lift && forward.pitch > 0);
  assert.equal(descent.phase, 'landing');
  assert.ok(descent.lift > 0 && descent.lift < forward.lift);
  assert.equal(landed.phase, 'landed');
  assert.equal(landed.lift, 0);
  assert.equal(landed.z, FLIGHT.span / 2);
  assert.equal(landed.pitch, 0);
});

test('the visible spray starts during forward flight and stops before descent', () => {
  const {flightPose, FLIGHT} = motion;
  const start = flightPose(5.25);
  const pass = flightPose(6.4);
  const end = flightPose(8.39);
  assert.equal(flightPose(3.1).spray, 0);
  assert.equal(start.phase, 'spray');
  assert.ok(start.spray > 0 && start.spray < pass.spray);
  assert.equal(pass.spray, 1);
  assert.ok(pass.z > start.z && pass.lift > 0);
  assert.ok(end.spray > 0 && end.spray < pass.spray);
  assert.equal(flightPose(FLIGHT.descent[0]).spray, 0);
  assert.equal(flightPose(FLIGHT.seconds).spray, 0);
  assert.deepEqual(flightPose(6.4), pass);
});

test('the rotor pose is deterministic and spins down after ground contact', () => {
  assert.ok(motion.flightPose);
  const {flightPose, FLIGHT} = motion;
  assert.equal(flightPose(0).rotorSpeed, 0);
  const topSpeed = flightPose(6);
  assert.equal(topSpeed.rotorSpeed, 1);
  assert.ok(flightPose(12.3).rotorSpeed > 0);
  assert.equal(flightPose(FLIGHT.seconds).rotorSpeed, 0);
  assert.ok(flightPose(FLIGHT.seconds).rotorAngle > topSpeed.rotorAngle);
  assert.deepEqual(flightPose(6), topSpeed);
});

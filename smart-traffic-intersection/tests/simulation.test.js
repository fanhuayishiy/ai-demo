import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TrafficSimulation } from '../src/simulation.js';
import { ROAD } from '../src/geometry.js';

const advance = (sim, seconds) => { for (let i = 0; i < seconds * 20; i++) sim.tick(0.05); };
test('higher measured demand receives a longer green allocation', () => {
  const sim = new TrafficSimulation({ seed: 4 });
  assert.ok(sim.greenFor(18, 2) > sim.greenFor(2, 18));
  assert.ok(sim.greenFor(100, 0) <= sim.maxGreen);
  assert.ok(sim.greenFor(0, 100) >= sim.minGreen);
});
test('a pedestrian request shortens green then passes yellow and all-red before WALK', () => {
  const sim = new TrafficSimulation({ seed: 4, autoDemo: false });
  sim.setDemand('ns', 0); sim.setDemand('ew', 0);
  sim.cars = [];
  sim.phaseDuration = 28;
  advance(sim, 8);
  sim.requestPedestrian('button');
  assert.ok(sim.remaining <= 3.1);
  const seen = new Set();
  for (let i = 0; i < 240; i++) { sim.tick(0.05); seen.add(sim.phase); if (sim.pedPhase === 'WALK') break; }
  assert.ok(seen.has('YELLOW')); assert.ok(seen.has('ALL_RED')); assert.equal(sim.pedPhase, 'WALK');
  assert.equal(sim.signal('ns'), 'red'); assert.equal(sim.signal('ew'), 'green');
});
test('sensor requests and button requests share the pedestrian priority path', () => {
  const sim = new TrafficSimulation({ seed: 9, autoDemo: false });
  sim.addPedestrian(); advance(sim, 3);
  assert.ok(sim.pedRequested); assert.equal(sim.requestSource, 'sensor');
});
test('WALK never starts with a conflicting vehicle in the conflict area', () => {
  const sim = new TrafficSimulation({ seed: 2, autoDemo: false });
  advance(sim, 9); sim.requestPedestrian('button');
  for (let i = 0; i < 1600; i++) {
    sim.tick(0.05);
    if (sim.pedPhase === 'WALK') assert.equal(sim.cars.filter(c => c.axis !== sim.pedAxis && c.p > ROAD.stopPosition && c.p < ROAD.clearancePosition).length, 0);
  }
  assert.ok(sim.totalCrossed > 0);
});
test('queued cars maintain safe spacing and never enter against red', () => {
  const sim = new TrafficSimulation({ seed: 12, autoDemo: false });
  sim.setDemand('ns', 100); sim.setDemand('ew', 100);
  for (let i = 0; i < 4000; i++) {
    const old = new Map(sim.cars.map(c => [c.id, { p: c.p, signal: sim.signal(c.axis) }]));
    sim.tick(0.05);
    for (const dir of ['N', 'S', 'E', 'W']) {
      const lane = sim.cars.filter(c => c.dir === dir).sort((a,b) => b.p-a.p);
      for (let n = 1; n < lane.length; n++) assert.ok(lane[n-1].p-lane[n].p >= 4.6, `unsafe gap ${dir}`);
    }
    for (const c of sim.cars) if (old.get(c.id)?.p <= ROAD.stopPosition && c.p > ROAD.stopPosition) assert.equal(old.get(c.id).signal, 'green', 'vehicle must cross while the step starts on green');
  }
});
test('automatic demonstration injects demand changes and a pedestrian event', () => {
  const sim = new TrafficSimulation({ seed: 2, autoDemo: true });
  advance(sim, 65);
  assert.ok(sim.events.some(e => e.kind === 'demo'));
  assert.ok(sim.totalCrossed > 0);
  assert.ok(sim.totalPassed > 0);
});
test('reset restores an operating simulation and reproducible initial state', () => {
  const sim = new TrafficSimulation({ seed: 22 });
  const initial = sim.cars.map(c => c.p); advance(sim, 20); sim.reset();
  assert.equal(sim.time, 0); assert.equal(sim.phase, 'NS_GREEN');
  assert.deepEqual(sim.cars.map(c => c.p), initial);
});

test('a pedestrian arriving late during WALK is served in a later safe crossing', () => {
  const sim = new TrafficSimulation({ seed: 7, autoDemo: false });
  sim.cars = []; sim.setDemand('ns', 0); sim.setDemand('ew', 0);
  sim.requestPedestrian('button',1);sim.tick(.05);advance(sim,5);
  sim.addPedestrian('sensor',1); advance(sim, 2);
  assert.ok(sim.pedRequested, 'late arrival must remain registered for another crossing');
  advance(sim, 55);
  assert.ok(sim.totalCrossed >= 2, 'late pedestrian must eventually cross');
});

test('countdown rounds integer boundaries without a floating-point extra second', () => {
  const sim = new TrafficSimulation({ autoDemo: false });
  sim.phaseDuration = 10; sim.elapsed = 3 - 1e-12;
  assert.equal(sim.signalClock.seconds, 7);
});

test('adaptive allocation cannot change the final three seconds of green', () => {
  const sim = new TrafficSimulation({ autoDemo: false });
  sim.cars = []; sim.setDemand('ns', 0); sim.setDemand('ew', 0);
  for (let i = 0; i < 8; i++) sim.spawnCar(i % 2 ? 'N' : 'S', -20 - Math.floor(i / 2) * 6);
  sim.phaseDuration = 12; sim.elapsed = 9.2; sim.adaptTimer = 1.5;
  sim.tick(0.05);
  assert.equal(sim.phaseDuration, 12, 'the committed countdown must not restart near zero');
});

test('occupied all-red clearance holds without repeatedly adding fake seconds', () => {
  const sim = new TrafficSimulation({ autoDemo: false });
  sim.cars = []; sim.setDemand('ns', 0); sim.setDemand('ew', 0);
  sim.spawnCar('N', 0); sim.cars[0].speed = 0; sim.cars[0].desiredSpeed = 0;
  sim.enterPhase('ALL_RED', 1.5); advance(sim, 3);
  assert.equal(sim.phase, 'ALL_RED');
  assert.equal(sim.phaseDuration, 1.5, 'minimum clearance duration must stay fixed');
  assert.equal(sim.remaining, 0); assert.equal(sim.signalClock.holding, true);
  sim.cars = []; sim.tick(0.05);
  assert.ok(sim.isGreen); assert.equal(sim.elapsed, 0, 'clearance hold time must not consume the next green');
});

test('pedestrian clearance also uses a holding state instead of a stuck countdown', () => {
  const sim = new TrafficSimulation({ autoDemo: false });
  sim.cars = []; sim.setDemand('ns', 0); sim.setDemand('ew', 0);
  sim.requestPedestrian('button',1);sim.tick(.05);sim.pedestrians[0].pace=0;advance(sim,16);
  assert.equal(sim.pedPhase, 'CLEARANCE'); assert.equal(sim.pedDuration, 2);
  assert.equal(sim.pedClock.holding, true);assert.equal(sim.signal('ns'),'green');
});

test('time exceeding a fixed phase boundary is carried into the following phase', () => {
  const sim = new TrafficSimulation({ autoDemo: false });
  sim.cars = []; sim.setDemand('ns', 0); sim.setDemand('ew', 0);
  sim.enterPhase('YELLOW', 3); sim.elapsed = 2.99; sim.tick(0.04);
  assert.equal(sim.phase, 'ALL_RED'); assert.ok(Math.abs(sim.elapsed - 0.03) < 1e-9);
});

test('a delayed visible frame does not silently discard simulation time', () => {
  const sim = new TrafficSimulation({ autoDemo: false });
  sim.tick(6.4); assert.ok(Math.abs(sim.time - 6.4) < 1e-8);
});

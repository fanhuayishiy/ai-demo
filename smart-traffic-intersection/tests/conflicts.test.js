import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TrafficSimulation } from '../src/simulation.js';
import { ROAD, vehiclePose, pedestrianPose } from '../src/geometry.js';
const advance=(s,t)=>{for(let i=0;i<Math.ceil(t/.05);i++)s.tick(.05);};
const empty=()=>{const s=new TrafficSimulation({autoDemo:false});s.cars=[];s.setDemand('ns',0);s.setDemand('ew',0);return s;};

test('a parallel crossing opens while both compatible straight directions keep green',()=>{
  const s=empty();s.requestPedestrian('button',1);s.tick(.05);
  assert.equal(s.pedPhase,'WALK');assert.equal(s.signal('ns'),'green');assert.equal(s.signal('ew'),'red');
  assert.equal(s.crosswalkSignal(1),'walk');assert.equal(s.crosswalkSignal(3),'walk');
  assert.equal(s.crosswalkSignal(0),'red');assert.equal(s.crosswalkSignal(2),'red');
  s.spawnCar('N',-16);s.spawnCar('S',-16);advance(s,3);
  assert.ok(s.cars.every(c=>c.p>-14),'both opposite through lanes must move during the parallel walk');
});
test('a conflicting crossing shortens green, clears vehicles and opens with parallel traffic',()=>{
  const s=empty();advance(s,8);s.requestPedestrian('button',0);assert.ok(s.remaining<=3.000001);
  const seen=new Set();for(let i=0;i<400&&s.pedPhase!=='WALK';i++){s.tick(.05);seen.add(s.phase);}
  assert.ok(seen.has('YELLOW'));assert.ok(seen.has('ALL_RED'));assert.equal(s.pedPhase,'WALK');
  assert.equal(s.signal('ew'),'green');assert.equal(s.signal('ns'),'red');
});
test('conflicting crossing requests are queued separately and neither is lost',()=>{
  const s=empty();s.requestPedestrian('button',1);s.tick(.05);s.requestPedestrian('button',0);
  const axes=new Set();for(let i=0;i<2200;i++){s.tick(.05);if(s.pedPhase==='WALK')axes.add(s.pedAxis);}
  assert.deepEqual([...axes].sort(),['ew','ns']);assert.equal(s.totalCrossed,2);
});
test('outgoing conflicting vehicles keep a crosswalk closed until their full body clears',()=>{
  const s=empty();s.startGreen('ew');s.spawnCar('N',11.5);const blocker=s.cars[0];blocker.speed=0;blocker.desiredSpeed=0;
  s.requestPedestrian('button',0);advance(s,2);assert.equal(s.pedPhase,'IDLE');assert.equal(s.signal('ew'),'green');
  blocker.p=15;s.tick(.05);assert.equal(s.pedPhase,'WALK');
});
test('pedestrian clearance keeps parallel cars moving and rejects new entrants',()=>{
  const s=empty();s.requestPedestrian('button',1);s.tick(.05);const first=s.pedestrians[0];first.pace=.2;
  advance(s,11.1);assert.equal(s.pedPhase,'CLEARANCE');s.addPedestrian('sensor',1);advance(s,3);
  assert.equal(s.signal('ns'),'green');assert.equal(s.crosswalkSignal(1),'clearance');assert.equal(s.signal('ew'),'red');
  assert.ok(s.pedestrians.some(p=>p.id!==first.id&&p.state==='waiting'));assert.ok(s.pedRequested);
  s.phaseDuration=s.elapsed;s.tick(.05);assert.equal(s.signalClock.holding,true);assert.equal(s.signal('ns'),'green');
});
test('multiple pedestrian waves cannot starve the other vehicle axis',()=>{
  const s=empty();s.setDemand('ns',100);s.setDemand('ew',100);let ewGreen=false;
  for(let i=0;i<2000;i++){if(i%30===0)s.requestPedestrian('button',1);s.tick(.05);if(s.signal('ew')==='green')ewGreen=true;}
  assert.ok(ewGreen);assert.ok(s.totalCrossed>0);
});
test('stress: green movements and crossing pedestrians never conflict physically',()=>{
  const s=new TrafficSimulation({seed:97,autoDemo:false});s.setDemand('ns',95);s.setDemand('ew',95);
  for(let i=0;i<12000;i++){
    if(i%173===0)s.addPedestrian('sensor',Math.floor(i/173)%4);
    const old=new Map(s.cars.map(c=>[c.id,{p:c.p,signal:s.signal(c.axis)}]));s.tick(.05);
    assert.ok(!(s.signal('ns')==='green'&&s.signal('ew')==='green'));
    for(const p of s.pedestrians.filter(p=>p.state==='crossing')){
      const conflict=p.crosswalk%2===0?'ns':'ew';assert.equal(s.signal(conflict),'red');
      assert.equal(s.cars.filter(c=>c.axis===conflict&&c.p>-14.65&&c.p<13.7).length,0);
    }
    const poses=s.cars.map(c=>({...vehiclePose(c),axis:c.axis,id:c.id}));
    for(let n=0;n<poses.length;n++)for(let m=n+1;m<poses.length;m++){
      const a=poses[n],b=poses[m];if(a.axis===b.axis)continue;
      assert.ok(Math.abs(a.x-b.x)>=2.725||Math.abs(a.z-b.z)>=2.725,'perpendicular car bodies must never overlap');
    }
    for(const p of s.pedestrians.filter(p=>p.state==='crossing')){
      const pos=pedestrianPose(p,s.time);
      for(const c of poses){const hx=c.axis==='ns'?.925:1.8,hz=c.axis==='ns'?1.8:.925;
        assert.ok(Math.abs(c.x-pos.x)>=hx+.25||Math.abs(c.z-pos.z)>=hz+.25,'car body must never overlap a crossing pedestrian');}
    }
    for(const dir of ['N','S','E','W']){
      const lane=s.cars.filter(c=>c.dir===dir).sort((a,b)=>b.p-a.p);
      for(let n=1;n<lane.length;n++)assert.ok(lane[n-1].p-lane[n].p>=5.29);
    }
    for(const c of s.cars)if(old.get(c.id)?.p<=-14.65&&c.p>-14.65)assert.equal(old.get(c.id).signal,'green');
  }
  assert.ok(s.totalPassed>100);assert.ok(s.totalCrossed>20);
});

test('right-hand lane heading and red-light stop leave the entire car behind its stop line',()=>{
  const s=empty();s.startGreen('ew');s.spawnCar('N',-19);s.spawnCar('S',-19);advance(s,8);
  for(const c of s.cars){assert.equal(c.p,ROAD.stopPosition);assert.ok(c.p+ROAD.carLength/2 < -ROAD.stopLine);}
  assert.ok(vehiclePose({dir:'N',p:-20}).x<0);assert.ok(vehiclePose({dir:'S',p:-20}).x>0);
  assert.ok(vehiclePose({dir:'W',p:-20}).z>0);assert.ok(vehiclePose({dir:'E',p:-20}).z<0);
});
test('a late compatible pedestrian request cannot restart the committed final three seconds',()=>{
  const s=empty();s.phaseDuration=12;s.elapsed=9.2;s.requestPedestrian('button',1);s.tick(.05);
  assert.equal(s.phaseDuration,12);assert.equal(s.pedPhase,'IDLE');assert.ok(s.pedRequested);
});

import { ROAD, CROSSWALKS, axisName, oppositeAxis } from './geometry.js';
const CLOCK_EPSILON = 1e-7;
export class TrafficSimulation {
  constructor({ seed = 42, autoDemo = true } = {}) {
    this.seed = seed; this.initialAuto = autoDemo; this.reset();
  }
  reset() {
    this.rng = this.seed; this.time = 0; this.phase = 'NS_GREEN'; this.activeAxis = 'ns';
    this.elapsed = 0; this.minGreen = 7; this.maxGreen = 32; this.phaseDuration = 22;
    this.demand = { ns: 66, ew: 34 }; this.autoDemo = this.initialAuto; this.demoStage = -1;
    this.cars = []; this.pedestrians = []; this.events = []; this.history = []; this.id = 0;
    this.totalPassed = 0; this.totalCrossed = 0; this.waitSamples = [];
    this.pedPhase = 'IDLE'; this.pedAxis = null; this.pedElapsed = 0; this.pedDuration = 0;
    this.pedServedThisGreen = false; this.pedProtectionUntil = 0; this.selectedCrosswalk = 0; this.pedSequence = 0; this.nextCrosswalk = 0; this.lastPedWait = 0; this.adaptTimer = 0;
    this.spawnTimers = { N: 0.8, S: 1.7, E: 1.3, W: 2.4 }; this.historyTimer = 0;
    this.timingAdjustment = null; this.lastAllocation = { ns: 22, ew: 14 }; this.lastAdjustment = 0; this.cycleCount = 1;
    for (const dir of ['N','S','E','W']) for (let i = 0; i < (dir === 'N' || dir === 'S' ? 4 : 3); i++) this.spawnCar(dir, -15 - i * 6.5);
    this.spawnCar('N', 4); this.spawnCar('S', 21); this.spawnCar('W', 25);
    this.log('感知系统已就绪', '4 组摄像头与毫米波雷达持续跟踪车流', 'sense');
    this.log('南北方向绿灯放行', '自适应配时已开启，实时评估双向交通需求', 'signal');
    this.sampleHistory();
  }
  random() { this.rng = (1664525 * this.rng + 1013904223) >>> 0; return this.rng / 4294967296; }
  log(title, detail, kind = 'decision') { this.events.unshift({ id: ++this.id, time: this.time, title, detail, kind }); if (this.events.length > 80) this.events.pop(); }
  get remaining() { return Math.max(0, this.phaseDuration - this.elapsed); }
  get signalClock() {
    const remaining = this.remaining;
    const seconds = Math.max(0, Math.ceil(remaining - CLOCK_EPSILON));
    const holding = remaining <= CLOCK_EPSILON && (this.phase === 'ALL_RED' || (this.isGreen && this.pedPhase !== 'IDLE'));
    return {
      seconds, remaining, holding,
      text: holding ? (this.isGreen ? '过街保护中' : '清空中') : `${seconds}s`,
      locked: this.isGreen && remaining <= 3 + CLOCK_EPSILON,
      progress: Math.max(0, Math.min(1, remaining / this.phaseDuration)),
    };
  }
  get phaseLabel() { return ({NS_GREEN:'南北通行',EW_GREEN:'东西通行',YELLOW:'黄灯过渡',ALL_RED:'路口清空'})[this.phase]; }
  get isGreen() { return this.phase.endsWith('_GREEN'); }
  signal(axis) { if (this.isGreen && this.activeAxis === axis) return 'green'; if (this.phase === 'YELLOW' && this.activeAxis === axis) return 'yellow'; return 'red'; }
  greenFor(own, other) { return Math.round(Math.min(this.maxGreen, Math.max(9, 12 + own * 0.65 + (own - other) * 0.85))); }
  metrics(axis) {
    const inbound = this.cars.filter(c => c.axis === axis && c.p <= ROAD.stopPosition);
    return { count: inbound.length, queue: inbound.filter(c => c.speed < 0.7).length, wait: inbound.length ? Math.round(inbound.reduce((s,c)=>s+c.wait,0)/inbound.length) : 0, density: Math.min(100, Math.round(inbound.length / 12 * 100)) };
  }
  setDemand(axis, value) { this.demand[axis] = Math.max(0, Math.min(100, Number(value))); }
  addTraffic(axis, count = 6) {
    this.setDemand(axis, Math.max(90, this.demand[axis]));
    for (let i = 0; i < count; i++) this.spawnCar(axis === 'ns' ? (i%2?'S':'N') : (i%2?'E':'W'));
    this.log(`${axis==='ns'?'南北':'东西'}来车增加`, `注入 ${count} 辆车的需求，雷达将重新评估绿灯时长`, 'sense');
  }
  spawnCar(dir, position) {
    const lane = this.cars.filter(c => c.dir === dir);
    const tail = lane.length ? Math.min(...lane.map(c => c.p)) : 0;
    let p = position ?? Math.min(-39, tail - 6.2);
    if (p < -74) return;
    this.cars.push({ id: ++this.id, dir, axis: dir==='N'||dir==='S'?'ns':'ew', p, speed: p > ROAD.stopPosition ? 6.5 : 0, desiredSpeed: 6.4 + this.random()*1.2, color: Math.floor(this.random()*7), wait: 0, passed: p>ROAD.clearancePosition, type: this.random() > 0.9 ? 'van' : 'car' });
  }
  get pendingPedestrians() { return this.pedestrians.filter(p => p.state === 'waiting' && p.requestedAt !== undefined).sort((a,b) => a.requestedAt-b.requestedAt || a.id-b.id); }
  get pedRequested() { return this.pendingPedestrians.length > 0; }
  get requestSource() { return this.pendingPedestrians[0]?.source || ''; }
  get pedWait() { return this.pedRequested ? this.time-this.pendingPedestrians[0].requestedAt : 0; }
  get pedClock() {
    const remaining = Math.max(0, this.pedDuration-this.pedElapsed);
    const seconds = Math.max(0, Math.ceil(remaining-CLOCK_EPSILON));
    const holding = this.pedPhase === 'CLEARANCE' && remaining <= CLOCK_EPSILON;
    return { remaining, seconds, holding, text: holding ? '清空中' : `${seconds}s` };
  }
  crosswalkSignal(id) {
    if (CROSSWALKS[id]?.travelAxis !== this.pedAxis || this.pedPhase === 'IDLE') return 'red';
    return this.pedPhase === 'WALK' ? 'walk' : 'clearance';
  }
  addPedestrian(source = 'sensor', crosswalk = this.nextCrosswalk++ % 4) {
    if (!CROSSWALKS[crosswalk] || this.pedestrians.filter(p => p.state !== 'done').length >= 16) return;
    const p = { id: ++this.id, side: this.pedSequence++ % 2, crosswalk, progress: 0, approach: 0, state: 'approach', source, pace: 2.25+this.random()*.3 };
    this.pedestrians.push(p);
    this.log('行人进入感知区域', `${CROSSWALKS[crosswalk].name}等待区目标跟踪已建立，接近路缘后申请${axisName(CROSSWALKS[crosswalk].travelAxis)}向过街`, 'sense');
    return p;
  }
  requestPedestrian(source = 'button', crosswalk = this.selectedCrosswalk) {
    if (!CROSSWALKS[crosswalk]) return;
    let p = this.pedestrians.find(p => p.crosswalk === crosswalk && p.state === 'waiting');
    if (!p) {
      if (this.pedestrians.filter(p => p.state !== 'done').length >= 16) return;
      p = { id: ++this.id, side: this.pedSequence++ % 2, crosswalk, progress: 0, approach: 1, state: 'waiting', source, pace: 2.4 };
      this.pedestrians.push(p);
    }
    this.registerPedestrian(p);
  }
  registerPedestrian(p) {
    if (p.requestedAt !== undefined) return;
    p.requestedAt = this.time;
    this.log(p.source === 'sensor' ? '检测到路缘等待行人' : '过街按钮已触发', `${CROSSWALKS[p.crosswalk].name}斑马线申请${axisName(CROSSWALKS[p.crosswalk].travelAxis)}向过街；仅停止冲突方向车流`, 'pedestrian');
    if (this.pedPhase === 'WALK' && CROSSWALKS[p.crosswalk].travelAxis === this.pedAxis && this.pedClock.remaining >= ROAD.crossingLength/p.pace+.5) this.admitPedestrian(p);
    this.prioritizePedestrians();
  }
  prioritizePedestrians() {
    const first = this.pendingPedestrians[0];
    if (this.isGreen && this.pedPhase === 'IDLE' && first && CROSSWALKS[first.crosswalk].travelAxis !== this.activeAxis) {
      this.phaseDuration = Math.min(this.phaseDuration, Math.max(this.minGreen, this.elapsed+3));
    }
  }
  admitPedestrian(p) { p.state = 'crossing'; p.progress = 0; this.lastPedWait = this.time-p.requestedAt; delete p.requestedAt; }
  maybeStartPedestrians() {
    const first = this.pendingPedestrians[0];
    if (!this.isGreen || this.pedPhase !== 'IDLE' || this.pedServedThisGreen || !first || this.remaining <= 3+CLOCK_EPSILON) return;
    if (CROSSWALKS[first.crosswalk].travelAxis !== this.activeAxis) return;
    if (this.elapsed+13 > this.maxGreen && this.metrics(oppositeAxis(this.activeAxis)).count > 0) return;
    // Include the far-side zebra crossing and the rear of outgoing cars, not only the central conflict square.
    if (this.cars.some(c => c.axis !== this.activeAxis && c.p > ROAD.stopPosition && c.p < ROAD.clearancePosition)) return;
    this.pedAxis = this.activeAxis; this.pedPhase = 'WALK'; this.pedElapsed = 0; this.pedDuration = 11;
    this.pedServedThisGreen = true; this.pedProtectionUntil = this.elapsed+13;
    const before = this.phaseDuration; this.phaseDuration = Math.max(this.phaseDuration, this.pedProtectionUntil);
    this.lastAllocation[this.activeAxis] = Math.round(this.phaseDuration);
    if (this.phaseDuration > before) this.timingAdjustment = { delta: Math.ceil(this.phaseDuration-before), at: this.time, reason: '行人并行保护' };
    this.pendingPedestrians.filter(p => CROSSWALKS[p.crosswalk].travelAxis === this.pedAxis).forEach(p => this.admitPedestrian(p));
    this.log('平行斑马线已开放', `${axisName(this.pedAxis)}向行人与${axisName(this.activeAxis)}向直行车辆并行，${axisName(oppositeAxis(this.activeAxis))}向车辆保持红灯`, 'pedestrian');
  }
  updatePedestrianPhase() {
    if (this.pedPhase === 'IDLE' || this.pedClock.remaining > CLOCK_EPSILON) return;
    if (this.pedPhase === 'WALK') {
      this.pedPhase = 'CLEARANCE'; this.pedElapsed = 0; this.pedDuration = 2;
      this.log('行人进入清空阶段', '人行灯闪烁，禁止新行人进入；平行直行车流继续通行', 'pedestrian');
    } else if (!this.pedestrians.some(p => p.state === 'crossing')) {
      this.pedPhase = 'IDLE'; this.pedAxis = null; this.pedElapsed = 0; this.pedDuration = 0;
      this.log('斑马线已清空', '本次过街完成，解除冲突方向的过街保护', 'pedestrian');
      this.prioritizePedestrians();
    }
  }
  enterPhase(phase, duration) { this.phase = phase; this.elapsed = 0; this.phaseDuration = duration; this.adaptTimer = 0; }
  startGreen(axis) {
    this.activeAxis = axis; const other = oppositeAxis(axis);
    const duration = this.greenFor(this.metrics(axis).count, this.metrics(other).count);
    this.lastAllocation[axis] = duration; this.lastAdjustment = 0; this.timingAdjustment = null; this.cycleCount++;
    this.pedServedThisGreen = false; this.pedProtectionUntil = 0;
    this.enterPhase(axis.toUpperCase()+'_GREEN', duration); this.prioritizePedestrians();
    this.log(`${axisName(axis)}方向绿灯放行`, `两个对向直行车道同时放行，分配 ${Math.round(this.phaseDuration)} 秒绿灯`, 'signal');
  }
  nextPhase() {
    if (this.isGreen) { if (this.pedPhase === 'IDLE') this.enterPhase('YELLOW', 3); }
    else if (this.phase === 'YELLOW') { this.enterPhase('ALL_RED', 1.5); this.log('进入全红清空', '方向交替：等待已驶入车辆连同车尾驶离冲突区及斑马线', 'signal'); }
    else if (this.phase === 'ALL_RED') {
      if (this.cars.some(c => c.p > ROAD.stopPosition && c.p < ROAD.clearancePosition)) return;
      this.startGreen(oppositeAxis(this.activeAxis));
    }
  }
  updateDemo() {
    const local = this.time % 100;
    const stage = local < 15 ? 0 : local < 27 ? 1 : local < 45 ? 2 : local < 65 ? 3 : local < 82 ? 4 : 5;
    if (stage === this.demoStage) return;
    this.demoStage = stage;
    if (stage===0) { this.setDemand('ns',66); this.setDemand('ew',34); this.log('自动演示 · 常态运行','观察传感器检测与车辆有序通行','demo'); }
    if (stage===1) { this.setDemand('ns',95); this.setDemand('ew',20); this.addTraffic('ns',6); this.log('自动演示 · 南北高峰','南北来车增加，自适应延长绿灯','demo'); }
    if (stage===2) { this.addPedestrian(); this.addPedestrian(); this.log('自动演示 · 行人优先','行人接近等待区后自动触发提前切换','demo'); }
    if (stage===3) { this.setDemand('ns',22); this.setDemand('ew',88); this.addTraffic('ew',6); this.log('自动演示 · 东西高峰','需求方向改变，重新分配绿灯资源','demo'); }
    if (stage===4) { this.addPedestrian(); this.log('自动演示 · 感知过街','验证第二次行人自动检测与安全过街','demo'); }
    if (stage===5) { this.setDemand('ns',48); this.setDemand('ew',48); this.log('自动演示 · 均衡通行','车流恢复均衡，信号继续自适应运行','demo'); }
  }
  sampleHistory() {
    this.history.push({time:this.time, ns:this.metrics('ns').count, ew:this.metrics('ew').count});
    if(this.history.length>60)this.history.shift();
  }
  tick(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    let left = dt;
    while (left > 1e-9) {
      const untilBoundary = this.remaining;
      const pedBoundary = this.pedPhase === 'IDLE' ? Infinity : this.pedClock.remaining;
      const step = Math.min(left, 0.05, untilBoundary > CLOCK_EPSILON ? untilBoundary : 0.05, pedBoundary > CLOCK_EPSILON ? pedBoundary : 0.05);
      this.step(step); left -= step;
    }
  }
  step(dt) {
    this.time += dt; this.elapsed += dt;
    if (this.autoDemo) this.updateDemo();
    if (this.pedPhase !== 'IDLE') this.pedElapsed += dt;
    for (const p of this.pedestrians) {
      if (p.state === 'approach') {
        p.approach += dt*.6;
        if (p.approach >= 1) { p.approach = 1; p.state = 'waiting'; this.registerPedestrian(p); }
      }
      if (p.state === 'crossing') {
        p.progress += dt*p.pace/ROAD.crossingLength;
        if (p.progress >= 1) { p.progress = 1; p.state = 'done'; p.doneAt = this.time; this.totalCrossed++; }
      }
    }
    this.pedestrians=this.pedestrians.filter(p=>p.state!=='done'||this.time-p.doneAt<3);
    for(const dir of ['N','S','E','W']) {
      const axis=dir==='N'||dir==='S'?'ns':'ew';
      this.spawnTimers[dir]-=dt;
      if(this.spawnTimers[dir]<=0){ if(this.demand[axis]>0)this.spawnCar(dir); this.spawnTimers[dir]=this.demand[axis] ? 2.2+(100-this.demand[axis])*0.13+this.random()*1.4 : 2; }
      const lane=this.cars.filter(c=>c.dir===dir).sort((a,b)=>b.p-a.p);
      lane.forEach((c,i)=>{
        let limit=Infinity;
        if(i>0)limit=lane[i-1].p-5.3;
        if(c.p<=ROAD.stopPosition && this.signal(axis)!=='green')limit=Math.min(limit,ROAD.stopPosition);
        const distance=limit-c.p;
        const target=Math.min(c.desiredSpeed,Math.sqrt(Math.max(0,2*3.5*distance)));
        c.speed+=Math.max(-dt*6,Math.min(dt*2.6,target-c.speed));
        c.speed=Math.max(0,c.speed);
        c.p=Math.min(c.p+c.speed*dt,limit);
        if(distance<0.03)c.speed=0;
        if(c.speed<0.7 && c.p<-13)c.wait+=dt;
        if(!c.passed&&c.p>ROAD.clearancePosition){c.passed=true;this.totalPassed++;this.waitSamples.push(c.wait);if(this.waitSamples.length>100)this.waitSamples.shift();}
      });
    }
    this.cars=this.cars.filter(c=>c.p<44);
    this.updatePedestrianPhase();
    this.adaptTimer+=dt;
    if(this.adaptTimer>=1.5 && this.isGreen && !this.pedRequested && this.pedPhase === 'IDLE' && this.remaining > 3 + CLOCK_EPSILON){
      this.adaptTimer=0;const axis=this.activeAxis,other=axis==='ns'?'ew':'ns';
      const own=this.metrics(axis).count,opposite=this.metrics(other).count;
      const target=this.greenFor(own,opposite);
      const duration=Math.min(this.maxGreen,Math.max(target,Math.ceil(this.elapsed+3),this.pedProtectionUntil));
      const diff=duration-this.phaseDuration;
      if(Math.abs(diff)>=1.8){this.phaseDuration=duration;this.lastAllocation[axis]=Math.round(duration);this.lastAdjustment=Math.round(diff);this.timingAdjustment={delta:Math.round(diff),at:this.time};this.log(diff>0?'车流增加 · 延长绿灯':'车流回落 · 缩短绿灯',`${axis==='ns'?'南北':'东西'} ${own} 辆 / 对向 ${opposite} 辆，当前绿灯调整至 ${Math.round(duration)} 秒`,'decision');}
    }
    if(this.remaining <= CLOCK_EPSILON) {
      const previousPhase = this.phase;
      // Carry only this step's boundary overshoot; completed hold time belongs to the old phase.
      const overshoot = this.elapsed - dt < this.phaseDuration - CLOCK_EPSILON
        ? Math.max(0, this.elapsed - this.phaseDuration) : 0;
      this.nextPhase();
      if(this.phase !== previousPhase) this.elapsed = overshoot;
    }
    this.maybeStartPedestrians();
    this.historyTimer+=dt;if(this.historyTimer>=1){this.historyTimer=0;this.sampleHistory();}
  }
}

import type { Command, SimulationState, UnitKind, UnitState, Vec3 } from '../types';
import { createUnits, KIND_LABELS, PHASES, stagingFor, WATER_POINTS } from './data';
import { distance, planRoute } from './routing';
import { moveVehicle, prepareTraffic, trafficOrder } from './traffic';
import { advanceAircraft, advanceAircraftLift, AIRCRAFT_TIMING, beginAircraftReturn, cargoFlightTime, cargoLiftReady, cargoMissionDuration, FIRE_HOSE_DEMO_FLOW_LPS, fireAircraftReadyCount, fireHoseChainReady, isAircraftCarrier } from './aircraft';
import { cargoRescueBlocker } from './cargoRescue';
import { crewForCarrier, crewReady, crewTravelSeconds } from '../spatial/crew';
import { STAGING } from '../spatial/layout';
import { turnAngle } from './geometry';
export { KIND_LABELS, PHASES, STATUS_LABELS, STATIONS, WATER_POINTS } from './data';
export { cargoFlightTime, cargoMissionDuration } from './aircraft';

type Unit = UnitState & { refillTrip?: boolean; cycles?: number; energyClock?: number; travelHold?: boolean; returningHome?: boolean;
  airPendingRoute?: { destination: Vec3; returning: boolean }; crewPendingRoute?: { destination: Vec3; returning: boolean } };
type State = SimulationState & { rescueProgress?: number };
const active = (u: UnitState) => u.status === 'working' && u.battery > 8 && !u.airReturning && (u.kind !== 'dog' || crewReady(u));
const available = (s: State, kind: UnitKind) => s.units.find(u => u.kind === kind && active(u));
const airborne = (u: UnitState) => u.kind === 'recon' || u.kind === 'fire-drone' || u.kind === 'cargo';
const requestedFlow = (s: State) => {
  if (s.time < 48) return 0;
  const drone = available(s, 'fire-drone');
  return (available(s, 'boom') ? 24 : 0) + (drone && fireHoseChainReady(drone) ? FIRE_HOSE_DEMO_FLOW_LPS : 0) + (s.phase >= 3 && available(s, 'dog') ? 3 : 0);
};
const waterDemand = (s: State) => s.water.connected ? requestedFlow(s) : 0;

function refreshFault(s: State, u: Unit) {
  if (u.travelHold || !['working', 'fault'].includes(u.status)) return;
  const fault = (airborne(u) && s.flags.droneFault) || (u.kind === 'fire-drone' && !s.flags.airConcept) || (u.kind === 'power' && s.flags.powerFault);
  if (fault || u.battery <= 8) {
    u.status = 'fault'; u.task = fault ? '安全闭锁，等待故障解除' : '低电量，等待能源补给';
  } else if (u.status === 'fault' && !u.airReturning) { u.status = 'working'; u.task = `${KIND_LABELS[u.kind]}恢复作业`; }
  if (u.status === 'fault') beginAircraftReturn(u);
}

function log(s: State, id: string, text: string, level: 'info' | 'success' | 'warning' = 'info') {
  if (s.events.some(e => e.id === id)) return;
  s.events.push({ id, time: s.time, text, level });
  if (s.events.length > 80) s.events.shift();
}

function clearCargoRescueRequests(s: State) {
  s.units.forEach(unit => { if (unit.airRescueRequested) unit.airRescueRequested = false; });
}

function updateCargoRescueRequest(s: State) {
  const cargo = s.units.find(unit => unit.kind === 'cargo');
  if (!cargo?.airRescueRequested) return;
  if (s.approvals.lift) { cargo.airRescueRequested = false; return; }
  const blocker = cargoRescueBlocker(s);
  if (blocker) {
    cargo.airRescueRequested = false;
    log(s, `cargo-rescue-revoked-${s.time}`, `本轮吊人待执行授权已撤销：${blocker}。`, 'warning');
    return;
  }
  if (!cargoLiftReady(cargo) || s.metrics.delivered < 4) return;
  cargo.airRescueRequested = false;
  s.approvals.lift = true;
  log(s, `cargo-rescue-start-${s.time}`, '人工吊人授权生效：屋顶物资已交接，开始下放吊篮接应1名人员。', 'success');
}

export function createInitialState(): SimulationState {
  return { time: 0, playing: true, speed: 1, mode: 'guided', phase: 0, complete: false, units: createUnits(),
    water: { buffer: 900, capacity: 1800, inflow: 0, outflow: 0, totalUsed: 0, interruptedFor: 0,
      connected: false, sourceAvailable: true, refillCycles: 0 },
    flags: { blockedRoad: false, lowWater: false, droneFault: false, powerFault: false, airConcept: true, liftConcept: false },
    approvals: { dispatch: false, connection: false, rescue: false, lift: false },
    life: { detected: false, confirmed: false, rescued: 0, source: '等待搜索' },
    events: [{ id: 'alarm', time: 0, text: '高层建筑火警：多站模块化协同响应启动。', level: 'warning' }],
    metrics: { firstRecon: null, firstArrival: null, delivered: 0, energySwaps: 0 } };
}

const parkedAtPost = (u: Unit) => distance(u.position, STAGING[u.id].position) < .001
  && Math.abs(turnAngle(u.heading ?? STAGING[u.id].heading, STAGING[u.id].heading)) < .005;

function routeUnit(s: State, u: Unit, destination: Vec3, returning = false) {
  u.destination = [...destination];
  if (u.airReturning) {
    u.airPendingRoute = { destination: [...destination], returning };
    u.crewReturning = false;
    delete u.crewPendingRoute;
    u.returningHome = returning; u.route = []; u.status = 'returning';
    u.task = '等待飞行器回收后移动车辆';
    return;
  }
  delete u.airPendingRoute;
  if ((u.crewProgress ?? 0) > 0) {
    // Redispatch at the same berth reverses the walk without moving through crew.
    if (!returning && distance(destination, STAGING[u.id].position) < .001 && parkedAtPost(u)) {
      delete u.crewPendingRoute;
      u.crewReturning = false; u.returningHome = false; u.travelHold = false;
      u.route = []; u.status = 'deploying'; u.task = '恢复现场岗位 / 消防员下车就位';
    } else {
      u.crewPendingRoute = { destination: [...destination], returning };
      u.crewReturning = true; u.returningHome = returning; u.travelHold = false;
      u.route = []; u.status = 'returning'; u.task = '等待消防员全部登车后出发';
    }
    return;
  }
  delete u.crewPendingRoute;
  u.crewReturning = false;
  u.route = planRoute(u.position, destination, s.flags.blockedRoad);
  u.travelHold = false; u.returningHome = returning;
  u.travel = 0; u.deployment = 0;
  if (!u.route.length) {
    u.travelHold = true;
    u.status = 'fault'; u.task = '道路不可达，原地安全等待';
    log(s, `unreachable-${u.id}`, `${u.name}：道路不可达，停止前进。`, 'warning');
    return;
  }
  u.status = returning ? 'returning' : 'enroute';
  u.task = returning ? '撤回消防站' : u.refillTrip ? '前往水源补水' : '沿规划道路赴场';
}

function dispatch(s: State, u: Unit) {
  if (!['standby', 'recalled', 'returning'].includes(u.status)) return;
  if (u.battery <= 8) { log(s, `battery-dispatch-${u.id}`, `${u.name}电量不足，不能出动。`, 'warning'); return; }
  u.refillTrip = false;
  routeUnit(s, u, stagingFor(u.id));
  const crew = crewForCarrier(u.id).length;
  log(s, `dispatch-${u.id}-${Math.floor(s.time)}`, `${u.name}从${u.station === 'NORTH' ? '北站' : u.station === 'WEST' ? '西站' : '东站'}出动${crew ? `，随车消防员${crew}人` : ''}。`);
}

function scheduleDispatch(s: State) {
  if (!s.approvals.dispatch) return;
  const firstResponse = new Set(['R01', 'W01', 'M01', 'B01', 'D01', 'T01']);
  const pending = s.units.filter(u => u.status === 'standby' && (firstResponse.has(u.id) || s.life.detected));
  if (s.life.detected && pending.some(u => !firstResponse.has(u.id))) {
    log(s, 'support-dispatch', '预案增援：生命信号触发高层救援、物资、能源和循环供水模块出动。', 'success');
  }
  pending.forEach(u => dispatch(s, u));
}

function moveUnit(s: State, u: Unit, dt: number) {
  if (u.airReturning || u.crewPendingRoute || (u.crewProgress ?? 0) > 0 || (u.status !== 'enroute' && u.status !== 'returning')) return;
  if (u.battery <= 0) { u.status = 'fault'; u.travelHold = true; u.task = '行驶电量耗尽，原地等待救援'; return; }
  u.battery = Math.max(0, u.battery - dt * 0.12);
  if (!moveVehicle(s, u, dt)) return;
  if (u.status === 'returning') { u.status = 'recalled'; u.task = '撤回完成，不参与现场作业'; return; }
  if (u.refillTrip) { u.status = 'refilling'; u.task = '水源补水'; return; }
  u.status = 'deploying'; u.task = '停靠展开'; u.deployment = 0;
  if (s.metrics.firstArrival === null) s.metrics.firstArrival = s.time;
  log(s, `arrival-${u.id}`, `${u.name}抵达指定作业位。`, 'success');
}

function advanceCrew(s: State, u: Unit, dt: number) {
  const duration = crewTravelSeconds(u.id);
  if (!duration) return;
  const progress = u.crewProgress ?? 0;
  const pending = u.crewPendingRoute;
  if (pending && !u.airReturning) {
    u.crewProgress = Math.max(0, progress - dt / duration);
    if (u.crewProgress < .000001) {
      u.crewProgress = 0;
      log(s, `crew-boarded-${u.id}-${s.time.toFixed(1)}`, `${u.name}：消防员已全部登车，可以离场。`, 'success');
      routeUnit(s, u, pending.destination, pending.returning);
    }
    return;
  }
  // Returning aircraft still need their ground team; finish walking to the posts.
  if (u.travelHold || (!u.airReturning && !['deploying', 'working', 'fault'].includes(u.status)) || !parkedAtPost(u)) return;
  u.crewReturning = false;
  u.crewProgress = Math.min(1, progress + dt / duration);
  if (1 - u.crewProgress < .000001) u.crewProgress = 1;
  if (!progress) log(s, `crew-exit-${u.id}-${s.time.toFixed(1)}`, `${u.name}：停车完成，${crewForCarrier(u.id).length}名消防员依次下车就位。`);
  if (progress < 1 && u.crewProgress === 1) log(s, `crew-ready-${u.id}-${s.time.toFixed(1)}`, `${u.name}：随车消防员已到达地面岗位。`, 'success');
}

function permissions(s: State) {
  if (s.mode !== 'guided') return;
  if (!s.approvals.dispatch) {
    s.approvals.dispatch = true;
    log(s, 'guided-dispatch', '指挥员授权分批预案：首批侦察、供水、移动增压、喷射、搜索与破拆模块并行出动。', 'success');
  }
  if (s.time >= 38 && !s.approvals.connection) {
    s.approvals.connection = true;
    log(s, 'guided-connection', '指挥员授权：移动增压车建立缓冲水箱与喷射管路连接。', 'success');
  }
  if (s.time >= 60 && s.life.detected && !s.life.confirmed) {
    s.life.confirmed = true;
    log(s, 'guided-confirm', '指挥员复核现场回传：确认受困人员。', 'success');
  }
  if (s.time >= 72 && s.life.confirmed && !s.approvals.rescue) {
    s.approvals.rescue = true;
    log(s, 'guided-rescue', '指挥员授权：采用云梯进行人员救援；不授权概念吊运。', 'success');
  }
}

function equipment(s: State, dt: number) {
  prepareTraffic(s);
  trafficOrder(s).forEach(u => moveUnit(s, u, dt));
  for (const unit of s.units) {
    const u = unit as Unit;
    advanceCrew(s, u, dt);
    if (u.travelHold) continue;
    if (u.status === 'deploying') {
      u.deployment += dt;
      const readyAt = u.kind === 'recon' ? 0 : u.kind === 'dog' ? 48 : u.kind === 'water' ? 24 : 35;
      if (u.deployment >= (u.kind === 'recon' ? 1 : 5) && s.time >= readyAt && (u.kind !== 'dog' || crewReady(u))) {
        u.status = 'working'; u.task = `${KIND_LABELS[u.kind]}就绪`;
      }
    }
    if (['recalled', 'standby', 'returning', 'enroute', 'refilling', 'deploying'].includes(u.status)) continue;
    refreshFault(s, u);
    if (active(u)) u.battery = Math.max(0, u.battery - dt * (airborne(u) ? 0.7 : u.kind === 'power' ? 0.25 : s.flags.powerFault ? 0.7 : 0.28));
  }
  const power = available(s, 'power');
  if (power && !s.flags.powerFault) {
    power.task = '轮换电池 / 模块充电';
    for (const unit of s.units) {
      const u = unit as Unit;
      if (u.kind === 'power' || u.travelHold || !['working', 'fault'].includes(u.status) || u.battery >= 68) continue;
      u.energyClock = (u.energyClock ?? 0) + dt;
      if (u.energyClock >= 5) {
        u.battery = Math.min(100, u.battery + 28); u.energyClock = 0; s.metrics.energySwaps++;
        log(s, `energy-${s.metrics.energySwaps}`, `${u.name}完成能源补给，恢复可用续航。`, 'success');
      }
    }
  }
  // Consume the request before advancing flight time so the 39-second boundary remains valid.
  updateCargoRescueRequest(s);
  aircraft(s, dt);
  const recon = available(s, 'recon'), dog = available(s, 'dog');
  if (!s.life.detected && (recon || dog)) {
    s.life.detected = true; s.life.source = recon ? '无人机热成像回传' : '机器犬生命搜索回传';
    s.metrics.firstRecon = s.time;
    log(s, 'life-detected', '检测到疑似生命信号：检测不等于确认，等待指挥员复核。', 'warning');
  }
  if (dog) dog.task = '室内生命搜索 / 环境侦测';
  if (recon) recon.task = '空中热成像与火场测绘';
  const tools = available(s, 'tools'); if (tools) tools.task = '建立破拆与救援通道';
  const cargo = available(s, 'cargo');
  if (!cargo || cargo.airRescuePassenger || cargo.airRescueDelivered || !s.flags.liftConcept || s.flags.droneFault
    || !s.life.confirmed || s.life.rescued || cargoFlightTime(cargo) >= AIRCRAFT_TIMING.cargo.retract) s.approvals.lift = false;
}

function cargoRescueTask(u: UnitState) {
  const t = cargoFlightTime(u), timing = AIRCRAFT_TIMING.roofRescue;
  const task = t < timing.groundApproach ? '概念屋顶转运：人员在篮 / 转运至地面接应区'
    : t < timing.groundLower ? '概念屋顶转运：地面接应 / 下放吊篮'
      : t < timing.groundDelivery ? '概念屋顶转运：地面接应 / 人员离篮'
        : t < timing.groundRetract ? '概念屋顶转运：地面交接完成 / 回收空篮'
          : t < timing.mission ? '概念屋顶转运：运输机返航回收' : '概念屋顶转运完成 / 运输机已回收';
  return u.airReturning ? `${task} / 载车原地等待` : task;
}

function aircraft(s: State, dt: number) {
  for (const unit of s.units) {
    const u = unit as Unit;
    if (!isAircraftCarrier(u)) continue;
    if (!active(u)) beginAircraftReturn(u);
    const previous = u.airTime ?? 0;
    const previousFlight = cargoFlightTime(u), previousLift = u.airLiftDeployment ?? 0, previousBoarding = u.airRescueBoarding ?? 0;
    const hadPassenger = u.airRescuePassenger, hadDelivered = u.airRescueDelivered;
    const outcome = advanceAircraft(u, dt);
    advanceAircraftLift(u, dt, s.approvals.lift && s.flags.liftConcept && !s.flags.droneFault && s.life.confirmed && !s.life.rescued);
    const current = u.airTime ?? 0;
    if (u.kind === 'fire-drone' && active(u) && current > previous) {
      AIRCRAFT_TIMING.fire.launchOffsets.forEach((offset, index) => {
        const role = index < 2 ? `${index + 1}号托举机` : '3号末端喷射机';
        if ((offset === 0 && previous === 0) || (previous < offset && current >= offset)) {
          log(s, `air-launch-${u.id}-${index + 1}-${s.time.toFixed(1)}`,
            `${u.name}：${role}${index < 2 ? '依次起飞，分段托举并放出水带。' : '最后起飞，携带水带末端喷头。'}`);
        }
        const arrival = offset + AIRCRAFT_TIMING.fire.route;
        if (previous < arrival && current >= arrival) {
          log(s, `air-ready-${u.id}-${index + 1}-${s.time.toFixed(1)}`,
            `${u.name}：${role}${index < 2 ? '就位，承担对应水带段重量。' : '就位，承重水带链路就绪。'}`, 'success');
        }
      });
    }
    if (u.kind === 'cargo' && previous === 0 && current > 0 && !u.airReturning) {
      log(s, `air-launch-${u.id}-${s.time.toFixed(1)}`, `${u.name}：飞行器从机场载车起飞。`);
    }
    if (outcome === 'delivered' && s.metrics.delivered === 0) {
      s.metrics.delivered = 4;
      log(s, 'cargo-delivered', '重载运输机完成屋顶吊放，4组物资已由屋顶接应区接收。', 'success');
    }
    if (u.kind === 'cargo') {
      if (!hadPassenger && !u.airReturning && previousLift === 0 && (u.airLiftDeployment ?? 0) > 0) {
        log(s, 'roof-rescue-lowering', '概念屋顶转运：人工授权后下放空篮，屋顶人员准备接应。');
      }
      if (!hadPassenger && previousBoarding === 0 && (u.airRescueBoarding ?? 0) > 0) {
        log(s, 'roof-rescue-boarding', '概念屋顶转运：吊篮抵达屋顶接应点，1名人员开始登篮。');
      }
      if (!hadPassenger && u.airRescuePassenger) {
        log(s, 'roof-rescue-boarded', '概念屋顶转运：1名人员已登篮，转运至地面接应区；不计云梯救援统计。', 'success');
      }
      if (u.airRescuePassenger && previousFlight < AIRCRAFT_TIMING.roofRescue.groundApproach && cargoFlightTime(u) >= AIRCRAFT_TIMING.roofRescue.groundApproach) {
        log(s, 'roof-rescue-ground-approach', '概念屋顶转运：抵达地面接应区，下放载人吊篮。');
      }
      if (!hadDelivered && u.airRescueDelivered) {
        log(s, 'roof-rescue-delivered', '概念屋顶转运：1名人员已离篮并完成地面接应，单独记录，不计云梯救援统计。', 'success');
      }
    }
    if (outcome === 'landed') {
      log(s, `air-landed-${u.id}-${s.time.toFixed(1)}`, `${u.name}：飞行器已回收${u.airPendingRoute && (u.crewProgress ?? 0) > 0 ? '，等待消防员登车' : '，载车待命'}。`, 'success');
      const pending = u.airPendingRoute;
      if (pending) { routeUnit(s, u, pending.destination, pending.returning); continue; }
    }
    if (u.airReturning) {
      u.task = u.kind === 'fire-drone' ? '托举机与末端机返航 / 水带回收，机场车等待'
        : u.airRescuePassenger || u.airRescueDelivered ? cargoRescueTask(u)
          : (u.airRescueBoarding ?? 0) > 0 ? '撤销屋顶接应：人员退回屋顶 / 载车原地等待'
            : (u.airLiftDeployment ?? 0) > 0 ? '撤销屋顶接应：回收空篮 / 载车原地等待' : '运输机返航回收，载车原地等待';
      continue;
    }
    if (u.kind === 'cargo' && active(u)) {
      const t = cargoFlightTime(u), timing = AIRCRAFT_TIMING.cargo;
      u.task = u.airRescuePassenger || u.airRescueDelivered ? cargoRescueTask(u)
        : s.approvals.lift && s.flags.liftConcept ? (u.airLiftDeployment ?? 0) < 1
          ? '概念屋顶转运：下放空篮 / 屋顶接应' : '概念屋顶转运：屋顶人员登篮'
          : t < timing.launch ? '重载运输机垂直起飞' : t < timing.transit ? '重载运输机航路飞行'
            : t < timing.approach ? '运输机接近屋顶接收区' : t < timing.delivery ? '向屋顶吊放4组物资'
              : t < timing.retract ? '屋顶物资接应 / 回收吊索' : t < cargoMissionDuration(u) ? '运输机返航回收' : '4组屋顶物资已交付 / 运输机已回收';
    }
  }
}

function updateConnection(s: State) {
  const connected = s.approvals.connection && !!available(s, 'booster');
  if (connected !== s.water.connected) {
    log(s, `water-${connected ? 'connected' : 'disconnected'}-${s.time.toFixed(1)}`,
      connected ? '移动增压车已就位：缓冲水箱与现场喷射管路接通。' : '移动增压车停止作业：管路泄压，缓冲水量保留。', connected ? 'success' : 'warning');
  }
  s.water.connected = connected;
  if (!connected) { s.water.inflow = 0; s.water.outflow = 0; }
}

function updateFireHoseTask(s: State) {
  const drone = available(s, 'fire-drone');
  if (!drone) return;
  const ready = fireAircraftReadyCount(drone);
  if (fireHoseChainReady(drone)) {
    drone.task = waterDemand(s) > 0 && s.water.outflow > 0.001
      ? '概念演示：2架分段托举 / 末端喷射机喷水'
      : '概念水带就绪：2架分段托举 / 末端等待管路与供水';
    return;
  }
  const t = drone.airTime ?? 0;
  const launched = t > 0 ? AIRCRAFT_TIMING.fire.launchOffsets.filter(offset => t >= offset).length : 0;
  drone.task = ready > 0 ? `分段托举：${ready}/2架支撑就位 / 等待末端喷射机`
    : `依次起飞：${launched}/3架 / 水带分段放出与托举`;
}

function supply(s: State, dt: number) {
  const w = s.water;
  w.sourceAvailable = !s.flags.lowWater;
  w.inflow = 0; w.outflow = 0;
  updateConnection(s);
  for (const unit of s.units) {
    const u = unit as Unit;
    if (u.kind !== 'water') continue;
    if (u.status === 'refilling') {
      u.task = w.sourceAvailable ? '水源补水' : '水源不足，等待恢复';
      if (!w.sourceAvailable) continue;
      u.water = Math.min(u.capacity, u.water + 100 * dt);
      if (u.water >= u.capacity) {
        u.cycles = (u.cycles ?? 0) + 1; w.refillCycles++;
        log(s, `refill-${u.id}-${u.cycles}`, `${u.name}补水完成，沿道路返回现场。`, 'success');
        u.refillTrip = false; routeUnit(s, u, stagingFor(u.id));
      }
    } else if (active(u) && w.connected) {
      const transfer = Math.min(u.water, 32 * dt, w.capacity - w.buffer);
      u.water -= transfer; w.buffer += transfer; w.inflow += transfer / dt;
      u.task = transfer > 0 ? '向移动增压车缓冲水箱供水' : '满箱待供 / 保持连接';
      if (u.water <= 0.001) {
        u.water = 0; u.refillTrip = true;
        const source = [...WATER_POINTS].sort((a, b) => distance(a, u.position) - distance(b, u.position))[0];
        routeUnit(s, u, source);
        log(s, `refill-depart-${u.id}-${u.cycles ?? 0}`, `${u.name}离开接口补水，移动增压车缓冲水箱继续供水。`);
      }
    }
  }
  const boom = available(s, 'boom');
  const demanded = requestedFlow(s);
  const used = Math.min(w.buffer, waterDemand(s) * dt);
  w.buffer -= used; w.totalUsed += used; w.outflow = used / dt;
  if (s.approvals.connection && demanded > 0 && w.outflow < demanded - 0.001) {
    w.interruptedFor += dt;
    log(s, 'water-interruption', '增压或缓冲水量不足：喷射流量下降，等待供水恢复。', 'warning');
  }
  if (boom) boom.task = w.outflow > 0 ? '举高喷射压制火势' : '等待管路与供水';
  updateFireHoseTask(s);
  const booster = available(s, 'booster');
  if (booster) booster.task = w.connected ? w.outflow > 0 ? '移动增压 / 稳压供水' : '增压模块待供' : '等待管路连接授权';
}

function rescue(s: State, dt: number) {
  const ladder = available(s, 'ladder');
  if (!s.life.confirmed || !s.approvals.rescue || !ladder || s.life.rescued) return;
  s.rescueProgress = (s.rescueProgress ?? 0) + dt;
  ladder.task = '云梯接近 / 人员转移';
  if (s.rescueProgress >= 70) {
    s.life.rescued = 2; s.approvals.lift = false; clearCargoRescueRequests(s); ladder.task = '2名受困人员转移完成';
    log(s, 'rescue-complete', '云梯救援完成：2名受困人员转移至地面安全区。', 'success');
  }
}

export function advance(state: SimulationState, dt: number): SimulationState {
  if (!state.playing || state.complete || !Number.isFinite(dt) || dt <= 0) return state;
  const s: State = structuredClone(state);
  const endTime = Math.min(180, Number((s.time + dt * s.speed).toFixed(9)));
  let remaining = endTime - s.time;
  // Substeps prevent resource or authorization events being skipped at high speed.
  while (remaining > 0.00001) {
    const step = Math.min(0.1, remaining); remaining -= step; s.time = Math.min(180, s.time + step);
    permissions(s); scheduleDispatch(s); equipment(s, step); supply(s, step); rescue(s, step);
    const phase = s.time < 2 ? 0 : s.time < 28 ? 1 : s.time < 48 ? 2 : s.time < 95 ? 3 : s.time < 150 ? 4 : 5;
    if (phase !== s.phase) { s.phase = phase; log(s, `phase-${phase}`, `进入阶段：${PHASES[phase]}。`); }
  }
  s.time = endTime;
  if (s.time >= 180) {
    s.complete = true; s.playing = false; s.approvals.lift = false; clearCargoRescueRequests(s);
    log(s, 'complete', s.life.rescued ? '演示结束：人员救援完成，请复核保障指标。' : '演示时间结束：救援条件未满足，不计作成功救援。', s.life.rescued ? 'success' : 'warning');
  }
  return s;
}

export function applyCommand(state: SimulationState, command: Command): SimulationState {
  if (command.type === 'reset') return createInitialState();
  const s: State = structuredClone(state);
  switch (command.type) {
    case 'toggle-play': if (!s.complete) s.playing = !s.playing; break;
    case 'speed': if ([0.5, 1, 2, 4].includes(command.value)) s.speed = command.value; break;
    case 'mode': s.mode = command.value; log(s, `mode-${s.mode}-${s.time}`, s.mode === 'guided' ? '切换引导模式：关键授权由可见指挥事件推进。' : '切换指挥模式：等待人工授权。'); break;
    case 'confirm-life':
      if (s.life.detected) { s.life.confirmed = true; log(s, 'manual-confirm', '指挥员人工复核：确认生命信号。', 'success'); }
      else log(s, 'confirm-denied', '尚未检测到生命信号，无法确认。', 'warning');
      break;
    case 'request-cargo-rescue': {
      const cargo = s.units.find(unit => unit.kind === 'cargo');
      if (cargo?.airRescueRequested || s.approvals.lift) break;
      const blocker = cargoRescueBlocker(s);
      if (!cargo || blocker) {
        log(s, `cargo-rescue-denied-${s.time}`, `载重无人机吊人未授权：${blocker ?? '载重无人机不可用'}。`, 'warning');
        break;
      }
      cargo.airRescueRequested = true;
      log(s, `cargo-rescue-request-${s.time}`, '人工干预：已授权 C01 本轮屋顶吊人；完成物资交接并满足接应条件后执行。', 'success');
      break;
    }
    case 'approve':
      if (command.key === 'lift' && (s.complete || s.life.rescued > 0 || !s.flags.liftConcept || s.flags.droneFault || !s.life.confirmed || !s.units.some(cargoLiftReady))) {
        log(s, `lift-denied-${s.time}`, '概念屋顶转运未满足开关、生命确认或卸货后剩余悬停时间条件，拒绝授权。', 'warning'); break;
      }
      s.approvals[command.key] = true;
      if (command.key === 'lift') clearCargoRescueRequests(s);
      log(s, `approve-${command.key}-${s.time}`, `人工授权：${({ dispatch: '出动', connection: '供水连接', rescue: '人员救援', lift: '概念屋顶转运试验（单独记录，不计云梯救援）' })[command.key]}。`, 'success');
      if (command.key === 'dispatch') scheduleDispatch(s);
      break;
    case 'dispatch': { const u = s.units.find(u => u.id === command.id); if (u) dispatch(s, u); break; }
    case 'recall': {
      const u = s.units.find(u => u.id === command.id) as Unit | undefined;
      if (u?.airRescueRequested) u.airRescueRequested = false;
      if (u && !['recalled', 'standby'].includes(u.status) && (u.status !== 'returning' || u.airPendingRoute?.returning === false)) {
        if (u.kind === 'ladder') s.rescueProgress = 0;
        if (u.kind === 'cargo') s.approvals.lift = false;
        beginAircraftReturn(u);
        u.refillTrip = false; routeUnit(s, u, u.home, true);
        log(s, `recall-${u.id}-${s.time}`, `${u.name}${u.airReturning ? '已撤销当前任务，完成飞行器回收和人员登车后返回。' : u.crewReturning ? '正在召回地面消防员，全部登车后返回。' : '已撤销当前任务并沿路返回。'}`, 'warning');
      }
      break;
    }
    case 'flag':
      s.flags[command.key] = command.value;
      log(s, `flag-${command.key}-${s.time}`, `${({ blockedRoad: '道路阻断', lowWater: '水源不足', droneFault: '无人机故障', powerFault: '能源故障', airConcept: '空中概念演示', liftConcept: '概念吊运' })[command.key]}：${command.value ? '开启' : '关闭'}。`, command.value ? 'warning' : 'info');
      if (command.key === 'blockedRoad') s.units.filter(u => !u.airReturning && (['enroute', 'returning'].includes(u.status) || (u as Unit).travelHold)).forEach(u => routeUnit(s, u, u.destination, u.status === 'returning' || (u as Unit).returningHome));
      if (command.key === 'liftConcept' && !command.value) {
        s.approvals.lift = false;
        s.units.filter(u => u.kind === 'cargo' && (u.airRescuePassenger || u.airRescueDelivered || (u.airLiftDeployment ?? 0) > 0 || (u.airRescueBoarding ?? 0) > 0))
          .forEach(u => beginAircraftReturn(u));
      }
      if (command.key === 'droneFault' && command.value) s.approvals.lift = false;
      if (command.key === 'lowWater') s.water.sourceAvailable = !command.value;
      s.units.forEach(u => refreshFault(s, u));
      break;
  }
  updateCargoRescueRequest(s);
  updateConnection(s);
  s.water.outflow = Math.min(s.water.outflow, waterDemand(s));
  updateFireHoseTask(s);
  return s;
}

import { CROSSWALKS, axisName, oppositeAxis } from './geometry.js';
import './style.css';
import { TrafficSimulation } from './simulation.js';
import { TrafficScene } from './scene.js';

const paths={
'dashboard':'<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
'signal':'<rect x="7" y="2" width="10" height="17" rx="3"/><circle cx="12" cy="6" r="1"/><circle cx="12" cy="10.5" r="1"/><circle cx="12" cy="15" r="1"/><path d="M12 19v3M8 22h8"/>',
'radar':'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 6M8 8a5.7 5.7 0 0 0 8 8M6.5 6.5a8 8 0 0 0 11 11"/><circle cx="9" cy="14" r="1"/>',
'chart':'<path d="M3 3v18h18M7 15l4-5 4 3 5-7"/>',
'sliders':'<path d="M4 6h5m4 0h7M4 12h10m4 0h2M4 18h3m4 0h9"/><circle cx="11" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
'help':'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1 .5-1.7 1-1.7 2.2M12 17h.01"/>',
'reset':'<path d="M3 11a9 9 0 1 1 2.8 7M3 4v7h7"/>',
'car':'<path d="m4 9 2-5h12l2 5M3 9h18v9H3zM5 18v3m14-3v3M6 13h2m8 0h2"/>',
'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
'route':'<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h6M5 8v7m-3-3 3 3 3-3"/>',
'person':'<circle cx="12" cy="5" r="2.5"/><path d="M8 21v-5H6v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5h-2v5M12 15v6"/>',
'pin':'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
'cube':'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
'expand':'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
'mouse':'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
'pause':'<path d="M7 4h3v16H7zm7 0h3v16h-3z"/>',
'play':'<path d="m7 4 13 8-13 8z"/>',
'plus':'<path d="M12 5v14M5 12h14"/>',
'person-plus':'<circle cx="9" cy="6" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M19 8v6m-3-3h6"/>',
'walk':'<circle cx="14" cy="4" r="2"/><path d="m7 21 3-7m6 7-3-7 1-6-4 1-3 5m7-6 3 5 4 1"/>',
'arrow':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
'spark':'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
'close':'<path d="m6 6 12 12M18 6 6 18"/>',
'top':'<path d="m12 3 9 6-9 6-9-6zM3 13l9 6 9-6M3 17l9 6 9-6"/>',
'tag':'<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7" cy="7" r="1"/>'};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.dashboard}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const $=id=>document.getElementById(id);
const sim=new TrafficSimulation();let scene;
let paused=false,speed=1,last=performance.now(),lastUi=0,lastEvent=0,toastTimer;
try{scene=new TrafficScene($('scene-container'),sim);$('scene-loading').classList.add('hidden');}
catch(error){$('scene-loading').innerHTML='三维场景初始化失败。请启用浏览器 WebGL 硬件加速后刷新。';console.error(error);}
const duration=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function manual(){if(sim.autoDemo){sim.autoDemo=false;toast('已进入手动模式，信号仍按实时车流自动调整');}}
function highlight(id){const el=$(id);el.scrollIntoView({behavior:'smooth',block:'nearest'});el.classList.remove('highlight');void el.offsetWidth;el.classList.add('highlight');}
function showDialog(title,html){$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('info-dialog').showModal();}
$('pause-button').onclick=()=>{paused=!paused;$('pause-button').innerHTML=icon(paused?'play':'pause');$('pause-button').setAttribute('aria-label',paused?'继续仿真':'暂停仿真');updateUI();};
$('speed-button').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('speed-button').textContent=`${speed}×`;toast(`仿真速度 ${speed} 倍`);};
$('auto-button').onclick=()=>{sim.autoDemo=!sim.autoDemo;if(sim.autoDemo){sim.demoStage=-1;paused=false;$('pause-button').innerHTML=icon('pause');$('pause-button').setAttribute('aria-label','暂停仿真');}toast(sim.autoDemo?'已开启自动场景演示':'已关闭自动演示，可手动调节车流');updateUI();};
$('reset-button').onclick=()=>{sim.reset();paused=false;speed=1;lastEvent=0;$('pause-button').innerHTML=icon('pause');$('pause-button').setAttribute('aria-label','暂停仿真');$('speed-button').textContent='1×';top=false;$('camera-top').classList.remove('active');scene?.view('iso');updateUI();toast('仿真已重置，重新开始感知与自适应控制');};
for(const axis of ['ns','ew']){$(`${axis}-demand`).oninput=e=>{manual();sim.setDemand(axis,e.target.value);updateUI();};$(`add-${axis}`).onclick=()=>{manual();sim.addTraffic(axis);updateUI();};}
$('crosswalk-select').onchange=e=>{sim.selectedCrosswalk=Number(e.target.value);updateUI();};
$('cross-button').onclick=()=>{manual();sim.requestPedestrian('button',sim.selectedCrosswalk);updateUI();toast('过街请求已接收，正在安排安全切换');};
$('detect-button').onclick=()=>{manual();sim.addPedestrian();updateUI();toast('已添加行人，接近路缘后将被自动检测');};
$('camera-reset').onclick=()=>{top=false;scene?.view('iso');$('camera-top').classList.remove('active');toast('已恢复默认视角');};
let top=false;$('camera-top').onclick=()=>{top=!top;scene?.view(top?'top':'iso');$('camera-top').classList.toggle('active',top);};
function toggleSensors(){if(!scene)return;scene.setSensors(!scene.sensorsOn);$('sensor-toggle').classList.toggle('active',scene.sensorsOn);$('sensor-toggle').setAttribute('aria-pressed',String(scene.sensorsOn));toast(scene.sensorsOn?'已显示雷达扫描、检测区和车辆跟踪框':'已隐藏感知可视化');}
$('sensor-toggle').onclick=toggleSensors;$('nav-sensors').onclick=toggleSensors;
$('label-toggle').onclick=()=>{scene?.setLabels(!scene.labelsOn);$('label-toggle').classList.toggle('active',scene?.labelsOn);$('label-toggle').setAttribute('aria-pressed',String(scene?.labelsOn));};
$('fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('scene-panel').requestFullscreen();}catch{toast('当前浏览器不支持全屏，可使用鼠标滚轮放大场景');}};
$('nav-overview').onclick=()=>{window.scrollTo({top:0,behavior:'smooth'});top=false;$('camera-top').classList.remove('active');scene?.view('iso');};$('nav-signal').onclick=()=>highlight('signal-card');$('nav-settings').onclick=()=>highlight('demand-card');$('nav-chart').onclick=()=>highlight('insights-panel');
$('help-button').onclick=()=>showDialog('认识路序',`<p>这是一个在浏览器中运行的交通仿真。车辆、行人和雷达数据均来自本地模拟，感知、决策与执行过程实时联动。</p><ul><li><b>观察路口：</b>鼠标左键拖动旋转，滚轮缩放，右键拖动平移。工具栏可切换俯视、感知图层、标签与全屏。</li><li><b>调节车流：</b>改变方向来车强度，或点击「南北来车 / 东西来车」添加 6 辆车。修改后进入手动模式，自适应配时持续运行。</li><li><b>行人优先：</b>先选择四条斑马线之一；「申请过街」提交该位置的请求，添加行人按钮模拟走入该等待区后自动感知。不同方向请求分别排队。</li><li><b>安全切换：</b>本场景为四个直行车道。南北对向车辆同时通行，东西对向车辆同时通行。行人与平行直行车辆可同时放行：北/南侧人行线配合东西车流，东/西侧配合南北车流。仅在机动车换向时经历 3 秒黄灯和至少 1.5 秒全红。人行绿灯 11 秒、清空至少 2 秒，清空期间平行车流继续通行，冲突车流保持红灯。</li><li><b>自动演示：</b>100 秒循环演示常态、南北高峰、行人优先、东西高峰与均衡通行。支持暂停和 1 / 2 / 4 倍速。</li></ul><p>配时公式：12 + 本方向感知车辆数 × 0.65 + 双向车辆数差 × 0.85，绿灯限制在 9–32 秒。数据面板统计本轮真实仿真结果。</p>`);
$('log-button').onclick=()=>showDialog('感知与决策日志',`<div class="full-log">${sim.events.map(e=>`<div><small>${duration(e.time)}</small><strong>${e.title}</strong><p>${e.detail}</p></div>`).join('')}</div>`);
$('close-dialog').onclick=()=>$('info-dialog').close();$('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
let signalDisplayKey = '';
function updateSignalUI() {
  const clock=sim.signalClock,pedClock=sim.pedClock,walk=sim.pedPhase==='WALK',clear=sim.pedPhase==='CLEARANCE';
  const adjustment=sim.isGreen&&sim.timingAdjustment&&sim.time-sim.timingAdjustment.at<2?sim.timingAdjustment.delta:0;
  const key=[sim.phase,sim.activeAxis,clock.seconds,clock.holding,clock.locked,adjustment,sim.pedPhase,sim.pedAxis,pedClock.seconds,pedClock.holding,sim.pedRequested,sim.selectedCrosswalk,sim.requestSource].join('|');
  if(key!==signalDisplayKey){
    signalDisplayKey=key;
    const current=sim.isGreen?'green':sim.phase==='YELLOW'?'yellow':'red';
    $('signal-label').textContent=sim.phaseLabel;
    $('ui-traffic-light').querySelectorAll('i').forEach(el=>el.classList.toggle('lit',el.classList.contains(current)));
    $('countdown').innerHTML=clock.holding?'—':`${clock.seconds}<span>s</span>`;
    $('countdown').dataset.remaining=clock.holding?'holding':String(clock.seconds);
    $('countdown').setAttribute('aria-label',clock.holding?(sim.isGreen?'过街保护中':'正在等待路口清空'):`机动车当前相位剩余 ${clock.seconds} 秒`);
    $('countdown').style.color=current==='green'?'#4e886d':current==='yellow'?'#c3a263':'#c58e7e';
    $('signal-phase').textContent=clock.holding?(sim.isGreen?'平行车流通行 · 等待行人清空':'等待车辆驶离 · 保持全红'):sim.isGreen?(walk||clear?'绿灯剩余 · 平行行人同步通行':clock.locked?'最后 3 秒 · 配时已锁定':adjustment?`配时已${adjustment>0?'延长':'缩短'} ${Math.abs(adjustment)} 秒`:'绿灯剩余 · 自适应配时'):sim.phase==='YELLOW'?'黄灯剩余 · 准备停车':'换向全红保护倒计时';
    for(const axis of ['ns','ew']){
      const sig=sim.signal(axis);$(`${axis}-dot`).className=`dot ${sig}-dot`;
      $(`${axis}-signal-text`).textContent=({green:'绿灯',yellow:'黄灯',red:'红灯'})[sig];
      $(`${axis}-timing`).textContent=sig==='green'||sig==='yellow'?(clock.holding?'过街保护':`${clock.seconds} s`):sim.phase==='ALL_RED'?'换向清空':walk||clear?'人车冲突 · 等待':'等待放行';
    }
    $('ped-explainer').innerHTML=walk?`${axisName(sim.pedAxis)}向行人绿灯 ${pedClock.text}，可进入斑马线。<br/>${axisName(sim.activeAxis)}直行车流同步通行，${axisName(oppositeAxis(sim.activeAxis))}车流红灯。`:clear?`人行清空 ${pedClock.text}，请勿再进入。<br/>${axisName(sim.activeAxis)}直行继续通行，冲突方向保持红灯。`:sim.pedRequested?`已接收过街请求 · 按方向依次安排。<br/>平行直行车流继续通行，仅停止冲突车流。`:'选择过街位置后申请或添加行人。<br/>人行灯按过街方向与平行车流联动。';
  }
  for(const cw of CROSSWALKS){
    const state=sim.crosswalkSignal(cw.id),row=$(`crosswalk-status-${cw.id}`),waiting=sim.pedestrians.filter(p=>p.crosswalk===cw.id&&(p.state==='waiting'||p.state==='approach')).length;
    row.dataset.signal=state;row.querySelector('b').textContent=state==='walk'?`绿灯 ${pedClock.text}`:state==='clearance'?`清空 ${pedClock.text}`:waiting?`红灯 · ${waiting}人等候`:'红灯等待';
  }
  $('countdown-ring').style.strokeDashoffset=String(213.63*(1-clock.progress));
}

function updateUI(){
  const ns=sim.metrics('ns'),ew=sim.metrics('ew'),walk=sim.pedPhase==='WALK',clear=sim.pedPhase==='CLEARANCE';
  const queuedPeds=sim.pedestrians.filter(p=>p.state==='waiting'||p.state==='approach').length;
  $('wall-clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour12:false});
  $('metric-cars').textContent=sim.cars.filter(c=>c.p>=-42).length;
  $('metric-wait').textContent=sim.waitSamples.length?(sim.waitSamples.reduce((a,b)=>a+b,0)/sim.waitSamples.length).toFixed(1):'0.0';
  $('metric-passed').textContent=sim.totalPassed;$('metric-time').textContent=`本轮运行 ${duration(sim.time)}`;$('metric-peds').textContent=sim.totalCrossed;
  $('metric-ped-note').textContent=walk?'斑马线开放中':queuedPeds?`${queuedPeds} 人等待过街`:'等待区暂无请求';
  updateSignalUI();
  for(const axis of ['ns','ew']) {
    $(`${axis}-demand`).value=sim.demand[axis];
    $(`${axis}-demand`).style.setProperty('--range',`${sim.demand[axis]}%`);
    $(`${axis}-demand-value`).textContent=sim.demand[axis];
  }
  $('decision-note').querySelector('p').textContent=sim.pedRequested?`行人优先请求已接收 · 已等待 ${Math.floor(sim.pedWait)} 秒`:walk?`${axisName(sim.pedAxis)}人行绿灯 · ${axisName(sim.activeAxis)}直行并行放行`:clear?`行人清空中 · ${axisName(sim.activeAxis)}直行继续通行`:sim.phase==='YELLOW'?'黄灯过渡 · 即将进入全红保护':sim.phase==='ALL_RED'?'保持全红 · 等待路口内车辆驶离':`本轮绿灯共 ${Math.round(sim.phaseDuration)} 秒 · 南北 ${ns.count} 辆 / 东西 ${ew.count} 辆`;
  $('ped-status').innerHTML=`<i></i>${walk?'并行通行':clear?'过街清空':sim.pedRequested?'请求排队':queuedPeds?'正在接近':'等待检测'}`;

  $('crosswalk-select').value=String(sim.selectedCrosswalk);
  $('cross-button').disabled=sim.pedestrians.some(p=>p.crosswalk===sim.selectedCrosswalk&&p.state==='waiting');
  $('auto-button').classList.toggle('on',sim.autoDemo);$('auto-button').setAttribute('aria-pressed',String(sim.autoDemo));
  $('demo-title').textContent=paused?'仿真已暂停':sim.autoDemo?'自动演示中':'手动探索中';
  const stages=['常态运行 · 观察自适应交通','南北高峰 · 动态延长绿灯','行人优先 · 提前安全切换','东西高峰 · 重新分配信号','行人感知 · 自动申请过街','均衡通行 · 持续优化配时'];
  $('demo-stage').textContent=sim.autoDemo?(stages[sim.demoStage]||stages[0]):'信号自适应运行 · 自由调节车流';$('demo-progress-fill').style.width=`${sim.time%100}%`;
  $('ns-live-count').textContent=ns.count;$('ew-live-count').textContent=ew.count;
  const history=sim.history,max=Math.max(12,...history.flatMap(h=>[h.ns,h.ew]));
  const chart=axis=>history.map((h,i)=>`${i===0?'M':'L'}${(59-history.length+1+i)/59*600},${64-h[axis]/max*55}`).join(' ');
  const nsPath=chart('ns');$('chart-ns').setAttribute('d',nsPath);$('chart-ew').setAttribute('d',chart('ew'));$('chart-area').setAttribute('d',nsPath?`${nsPath} L600,72 L${(60-history.length)/59*600},72 Z`:'');
  $('spark-cars').setAttribute('d',history.slice(-10).map((h,i)=>`${i?'L':'M'}${i*8.8},${30-(h.ns+h.ew)/(max*2)*26}`).join(' '));
  if(sim.events[0]?.id!==lastEvent){lastEvent=sim.events[0]?.id;$('event-list').innerHTML=sim.events.slice(0,3).map(e=>`<div class="event-item"><i class="event-dot ${e.kind}"></i><span class="event-text" title="${e.detail}">${e.title}</span><span class="event-time">${duration(e.time)}</span></div>`).join('');}
}
// Ignore time spent in a hidden tab, but catch up all elapsed time after a slow visible frame.
document.addEventListener('visibilitychange',()=>{last=performance.now();});
function frame(now) {
  const dt=Math.max(0,(now-last)/1000);last=now;
  if(!paused && !document.hidden)sim.tick(dt*speed);
  updateSignalUI();scene?.update(dt);
  if(now-lastUi>180){updateUI();lastUi=now;}
  requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);
window.__traffic={sim,get scene(){return scene;},get paused(){return paused;},get speed(){return speed;}};

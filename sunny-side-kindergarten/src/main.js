import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCampus } from './campus.js';
import { createPeople } from './people.js';
import { VIEWS, TOUR, ease } from './navigation.js';
import { icon, hydrateIcons } from './icons.js';

const $ = (selector) => document.querySelector(selector);
hydrateIcons();
for(const [id,name] of Object.entries({'sound-btn':'mute','zoom-in':'plus','zoom-out':'minus','reset-view':'home','fullscreen-btn':'fullscreen','pause-btn':'pause'})) $(`#${id}`).innerHTML = icon(name);

const world = $('#world');
const scene = new THREE.Scene();
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas:$('#scene-canvas'), antialias:true, alpha:true, powerPreference:'high-performance'});
} catch(error) {
  $('#loading-screen').classList.add('done');
  const message=document.createElement('div');message.className='error-message';
  message.textContent='当前浏览器无法启动 WebGL。请在 Chrome 或 Edge 中开启硬件加速后刷新页面。';
  $('#app').append(message);
  throw error;
}
renderer.setClearColor(0xe9f2ed,0);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
const camera = new THREE.PerspectiveCamera(40,1,0.1,180);
camera.position.fromArray(VIEWS.overview.position);
const controls = new OrbitControls(camera,renderer.domElement);
controls.target.fromArray(VIEWS.overview.target);
controls.enableDamping=true; controls.dampingFactor=.06;controls.enablePan=false;
controls.minDistance=12;controls.maxDistance=85;
controls.minPolarAngle=.3;controls.maxPolarAngle=1.4;
controls.minAzimuthAngle=-1.2;controls.maxAzimuthAngle=1.2;
controls.rotateSpeed=.6;controls.zoomSpeed=.75;
controls.update();

scene.add(new THREE.HemisphereLight(0xeef9ff,0xd3ddac,1.8));
const sunlight=new THREE.DirectionalLight(0xfff0d4,2.8);
sunlight.position.set(-16,32,18);sunlight.castShadow=true;
sunlight.shadow.mapSize.set(2048,2048);
Object.assign(sunlight.shadow.camera,{left:-31,right:31,top:30,bottom:-27,near:1,far:95});
sunlight.shadow.normalBias=.055;sunlight.shadow.bias=-.00012;sunlight.shadow.radius=4;
scene.add(sunlight);
const fill=new THREE.DirectionalLight(0xe8f5ff,1);fill.position.set(18,15,-15);scene.add(fill);

// A transparent shadow catcher preserves the page's soft mint backdrop.
const shadowFloor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x648671,opacity:.12}));
shadowFloor.rotation.x=-Math.PI/2;shadowFloor.position.y=-.91;shadowFloor.receiveShadow=true;scene.add(shadowFloor);
const campus=createCampus(scene);
const population=createPeople(scene);
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused=reducedMotion,highQuality=innerWidth>700,currentView='overview',transition=null,selectedPerson=null;
let roaming=false,tourIndex=0,tourElapsed=0,simTime=0,last=performance.now(),frameCount=0,fpsElapsed=0;
let hovered=null,pointerDown=null,toastTimer;
const projected=new THREE.Vector3();
const viewLabels=[
  {id:'classroom',text:'创意教室',position:new THREE.Vector3(-5,9,-7),icon:'palette'},
  {id:'play',text:'童趣乐园',position:new THREE.Vector3(-12,3.6,5),icon:'playground'},
  {id:'sports',text:'活力操场',position:new THREE.Vector3(10,1.8,8.5),icon:'ball'},
];
for(const label of viewLabels){
  const button=document.createElement('button');button.className='world-tag';button.tabIndex=-1;
  button.innerHTML=icon(label.icon)+label.text+'<span class="tag-dot"></span>';
  button.addEventListener('click',()=>focusView(label.id));$('#world-labels').append(button);label.element=button;
}

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function transitionTo(position,target,duration=1.7){
  transition={start:performance.now(),duration:reducedMotion?.12:duration,fromPosition:camera.position.clone(),fromTarget:controls.target.clone(),toPosition:new THREE.Vector3().fromArray(position),toTarget:new THREE.Vector3().fromArray(target)};
}
function stopTour(){roaming=false;$('#tour-btn').classList.remove('active');$('#tour-label').textContent='自动漫游';$('#tour-btn').querySelector('[data-icon]').innerHTML=icon('play');$('#tour-btn').setAttribute('aria-pressed','false');}
function focusView(id,fromTour=false){
  if(!VIEWS[id])return;
  if(!fromTour)stopTour();
  selectedPerson=null;$('#person-card').hidden=true;$('#day-card').style.opacity='';
  currentView=id;const view=VIEWS[id];
  document.body.classList.toggle('focused-view',id!=='overview');
  transitionTo(view.position,view.target);
  $('.location.active')?.classList.remove('active');$(`.location[data-view="${id}"]`)?.classList.add('active');
  $('#view-status').textContent=view.label;
  document.querySelectorAll('.location').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.view===id)));
}
function startTour(){
  if(roaming){stopTour();toast('已结束漫游，自由探索吧');return;}
  roaming=true;tourIndex=0;tourElapsed=0;
  $('#tour-btn').classList.add('active');$('#tour-label').textContent='结束漫游';$('#tour-btn').querySelector('[data-icon]').innerHTML=icon('pause');$('#tour-btn').setAttribute('aria-pressed','true');
  focusView(TOUR[0],true);toast('跟着阳光出发 · 拖拽可随时退出漫游');
}
function focusPerson(person){
  stopTour();selectedPerson=person;currentView='person';
  document.body.classList.add('focused-view');
  const p=person.group.getWorldPosition(new THREE.Vector3());
  const isInside=p.z<-4;
  const nearGate=p.z>8&&Math.abs(p.x)<4;
  transitionTo([p.x+(nearGate?12:7),p.y+7,p.z+(isInside?16:nearGate?8:12)],[p.x,p.y+.65,p.z],1.4);
  $('.location.active')?.classList.remove('active');
  document.querySelectorAll('.location').forEach(el=>el.setAttribute('aria-pressed','false'));
  $('#person-title').textContent=person.name;$('#person-activity').textContent=person.activity;
  $('#person-card').hidden=false;$('#day-card').style.opacity='0';$('#view-status').textContent=({classroom:'课堂探索',reading:'绘本阅读',playground:'童趣游戏',sports:'体育活动',garden:'户外探索'})[person.category]||'小小探索家';
  $('#person-tooltip').style.display='none';
}

function pick(event){
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(population.pickables,true)[0];
  if(!hit)return null;
  let object=hit.object;while(object&&!object.userData.person)object=object.parent;
  return object?.userData.person||null;
}
renderer.domElement.addEventListener('pointermove',event=>{
  if(pointerDown)return;
  hovered=pick(event);renderer.domElement.style.cursor=hovered?'pointer':'grab';
  if(hovered){
    const tip=$('#person-tooltip');tip.replaceChildren();tip.append(document.createTextNode(hovered.name));
    const small=document.createElement('small');small.textContent=`${hovered.activity} · 点击靠近看看`;tip.append(small);
    tip.style.display='block';const rect=world.getBoundingClientRect();
    tip.style.left=`${Math.min(event.clientX-rect.left+15,rect.width-210)}px`;tip.style.top=`${event.clientY-rect.top-50}px`;
  }else $('#person-tooltip').style.display='none';
});
renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};$('#person-tooltip').style.display='none';});
renderer.domElement.addEventListener('pointerup',event=>{
  if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)<6){const person=pick(event);if(person)focusPerson(person);}
  pointerDown=null;
});
renderer.domElement.addEventListener('pointerleave',()=>{$('#person-tooltip').style.display='none';pointerDown=null;});
renderer.domElement.addEventListener('pointercancel',()=>pointerDown=null);
controls.addEventListener('start',()=>{transition=null;stopTour();});
$('.brand').addEventListener('click',event=>{event.preventDefault();focusView('overview');});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>focusView(button.dataset.view)));
$('#reset-view').addEventListener('click',()=>focusView('overview'));
$('#back-from-person').addEventListener('click',()=>focusView('overview'));
$('.close-person').addEventListener('click',()=>{selectedPerson=null;$('#person-card').hidden=true;$('#day-card').style.opacity='';});
$('#tour-btn').addEventListener('click',startTour);$('#activity-explore').addEventListener('click',startTour);
for(const [id,factor] of [['zoom-in',.82],['zoom-out',1.22]])$( '#'+id).addEventListener('click',()=>{
  stopTour();transition=null;const delta=camera.position.clone().sub(controls.target);delta.setLength(THREE.MathUtils.clamp(delta.length()*factor,controls.minDistance,controls.maxDistance));transitionTo(controls.target.clone().add(delta).toArray(),controls.target.toArray(),.4);
});
$('#fullscreen-btn').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器窗口暂不支持全屏');}
});
function applyQuality(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,highQuality?1.8:1));
  renderer.shadowMap.enabled=highQuality;
  $('#quality-btn').innerHTML=`${highQuality?'高清':'流畅'}画质 <span>⌄</span>`;
}
$('#quality-btn').addEventListener('click',()=>{highQuality=!highQuality;applyQuality();toast(highQuality?'高清画质 · 柔和阴影已开启':'流畅画质 · 降低分辨率与阴影开销');});
function updatePauseUI(){ $('#pause-btn').innerHTML=icon(paused?'play':'pause');$('#pause-btn').setAttribute('aria-label',paused?'继续场景动画':'暂停场景动画');$('#pause-btn').title=paused?'继续场景动画':'暂停场景动画'; }
$('#pause-btn').addEventListener('click',()=>{paused=!paused;updatePauseUI();toast(paused?'时间暂停了，仍可自由观察':'小小世界继续运转');});
updatePauseUI();
document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>{
  const panel=button.dataset.panel;
  if(panel==='about')$('#about-dialog').showModal();
  else if(panel==='activities'){
    if(innerWidth<=800){toast('22 位小朋友：6 位运动、6 位创作阅读、10 位自由探索');}
    else {$('#day-card').animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],{duration:450});toast('点击「跟着镜头逛一逛」，参观今天的活动');}
  }else focusView('overview');
}));
$('#close-about').addEventListener('click',()=>$('#about-dialog').close());
$('#about-explore').addEventListener('click',()=>{$('#about-dialog').close();startTour();});
$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog'))$('#about-dialog').close();});

// Synthesized ambience is opt-in and never needs a download or microphone.
let audioContext=null,audioTimer=null,audioEnabled=false;
function chirp(){
  if(!audioContext||audioContext.state!=='running')return;
  const now=audioContext.currentTime;
  for(let i=0;i<2;i++){
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(1700+i*310,now+i*.2);osc.frequency.exponentialRampToValueAtTime(2800+i*210,now+i*.2+.07);osc.frequency.exponentialRampToValueAtTime(1850,now+i*.2+.18);
    gain.gain.setValueAtTime(0,now+i*.2);gain.gain.linearRampToValueAtTime(.018,now+i*.2+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.2+.2);
    osc.connect(gain).connect(audioContext.destination);osc.start(now+i*.2);osc.stop(now+i*.2+.22);
  }
}
$('#sound-btn').addEventListener('click',async()=>{
  try {
    if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
    audioEnabled=!audioEnabled;
    if(audioEnabled){await audioContext.resume();chirp();audioTimer=setInterval(chirp,4800);}
    else{clearInterval(audioTimer);await audioContext.suspend();}
    $('#sound-btn').innerHTML=icon(audioEnabled?'sound':'mute');$('#sound-btn').setAttribute('aria-label',audioEnabled?'关闭自然环境音':'开启自然环境音');$('#sound-btn').title=audioEnabled?'关闭自然环境音':'开启自然环境音';
    toast(audioEnabled?'自然环境音已开启 · 听，小鸟在唱歌':'自然环境音已关闭');
  }catch{audioEnabled=false;toast('当前浏览器不支持环境音播放');}
});
document.addEventListener('visibilitychange',()=>{
  last=performance.now();
  if(audioContext&&audioEnabled){if(document.hidden)audioContext.suspend();else audioContext.resume();}
});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'){stopTour();if(selectedPerson)focusView('overview');}
  if(event.target===world&&event.key==='Home'){event.preventDefault();focusView('overview');}
});

function resize(){
  const width=world.clientWidth,height=world.clientHeight;
  renderer.setSize(width,height,false);camera.aspect=width/height;
  camera.fov=width<800?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(20))*Math.max(1,1.1/camera.aspect))):40;
  if(innerHeight<560)camera.fov=Math.max(camera.fov,50);
  camera.setViewOffset(width,height,0,height*(width<800?-.025:.06),width,height);
  camera.updateProjectionMatrix();
}
applyQuality();resize();window.addEventListener('resize',resize);

function animate(now){
  requestAnimationFrame(animate);
  const realDt=Math.max(0,(now-last)/1000),dt=Math.min(realDt,.05);last=now;
  if(document.hidden)return;
  if(!paused){simTime+=dt;campus.update(simTime);population.update(simTime,camera);}
  if(roaming){tourElapsed+=dt;if(tourElapsed>7.5){tourElapsed=0;tourIndex=(tourIndex+1)%TOUR.length;focusView(TOUR[tourIndex],true);}}
  if(transition){
    const t=(now-transition.start)/(transition.duration*1000),alpha=ease(t);
    camera.position.lerpVectors(transition.fromPosition,transition.toPosition,alpha);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,alpha);
    if(t>=1)transition=null;
  }
  if(selectedPerson){
    $('#person-activity').textContent=selectedPerson.activity;
    if(!transition){
      const followTarget=selectedPerson.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.65,0));
      const followDelta=followTarget.sub(controls.target).multiplyScalar(1-Math.exp(-dt*4));
      controls.target.add(followDelta);camera.position.add(followDelta);
    }
  }
  controls.update();
  const width=world.clientWidth,height=world.clientHeight;
  for(const label of viewLabels){
    projected.copy(label.position).project(camera);
    const visible=currentView==='overview'&&projected.z<1&&Math.abs(projected.x)<.92&&Math.abs(projected.y)<.88;
    label.element.style.opacity=visible?'1':'0';label.element.style.pointerEvents=visible?'auto':'none';
    label.element.style.left=`${(projected.x*.5+.5)*width}px`;label.element.style.top=`${(-projected.y*.5+.5)*height}px`;
  }
  renderer.render(scene,camera);
  frameCount++;fpsElapsed+=realDt;
  if(fpsElapsed>=1){$('#fps-label').textContent=`${Math.min(144,Math.round(frameCount/fpsElapsed))} FPS`;frameCount=0;fpsElapsed=0;}
}
campus.update(0);population.update(0,camera);renderer.render(scene,camera);requestAnimationFrame(animate);
renderer.compileAsync(scene,camera).catch(()=>{}).finally(()=>{
  document.body.classList.add('loaded');$('#loading-screen').classList.add('done');
});
// Minimal read-only diagnostics for local verification; no scene mutation API.
window.__SUNNY__={
  get ready(){return document.body.classList.contains('loaded');},
  get population(){return population.people.map(p=>({id:p.id,name:p.name,isTeacher:p.isTeacher,activity:p.activity,position:p.group.position.toArray()}));},
  get state(){return {currentView,roaming,paused,simTime,highQuality,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray(),target:controls.target.toArray()};},
  get personScreens(){return population.people.map(p=>{const v=p.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.75,0)).project(camera);const r=world.getBoundingClientRect();return {id:p.id,x:r.left+(v.x*.5+.5)*r.width,y:r.top+(-v.y*.5+.5)*r.height};});}
};

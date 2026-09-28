import './style.css';
import './plumbing.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createWasher } from './model.js';
import { PART_INFO, viewState, clampExplosion, easeInOut } from './state.js';

const $ = id => document.getElementById(id);
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const state = { view: 'exploded', explosion: 62, target: 62, selected: 'heatpump', labels: true, rotate: false, tour: false, focused: false };
let renderer, composer, aoPass, scene, camera, controls, washer, lastTime = 0, tourStart = 0, toastTimer, cameraTween, frameCount = 0;
const defaultTarget = new THREE.Vector3(0, 1.82, .18);
const defaultDirection = new THREE.Vector3(7.8, 4.4, 10).normalize();
let defaultDistance = 11.8;
const clock = new THREE.Clock();
const rays = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const flowSystems = [];
const labelEntries = [];
let stageRing, guideLines;

function toast(message) { $('toast').textContent=message; $('toast').classList.add('is-visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('is-visible'),2800); }
function setPressed(el,on){el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on));}

function createStage() {
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#131a1e',roughness:.91,metalness:.16}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.032;floor.receiveShadow=true;scene.add(floor);
  stageRing=new THREE.Group();scene.add(stageRing);
  for(const r of [2.7,2.76,3.8]){
    const points=Array.from({length:181},(_,i)=>new THREE.Vector3(Math.sin(i/180*Math.PI*2)*r,-.023,Math.cos(i/180*Math.PI*2)*r));
    stageRing.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:r===2.7?'#566465':'#354347',transparent:true,opacity:r===2.7?.35:.18})));
  }
  const ticks=[];for(let i=0;i<120;i++){let a=i/120*Math.PI*2;const r=i%10===0?2.85:2.8;ticks.push(new THREE.Vector3(Math.sin(a)*2.77,-.022,Math.cos(a)*2.77),new THREE.Vector3(Math.sin(a)*r,-.022,Math.cos(a)*r));}
  stageRing.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks),new THREE.LineBasicMaterial({color:'#8c9a95',transparent:true,opacity:.25})));
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');const grad=ctx.createRadialGradient(128,128,3,128,128,128);grad.addColorStop(0,'rgba(0,0,0,.6)');grad.addColorStop(.38,'rgba(0,0,0,.24)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,256,256);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(6,5.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.018;scene.add(shadow);
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Array(6*washer.parts.length).fill(0),3));
  guideLines=new THREE.LineSegments(lineGeo,new THREE.LineDashedMaterial({color:'#b4ac99',transparent:true,opacity:.16,dashSize:.06,gapSize:.065}));scene.add(guideLines);
}

function createLighting() {
  scene.add(new THREE.HemisphereLight('#d6e3e5','#252d30',1.1));
  const key=new THREE.DirectionalLight('#fff2de',3.0);key.position.set(3.5,7,6);key.target.position.set(0,1.4,0);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-4;key.shadow.camera.near=.5;key.shadow.camera.far=25;key.shadow.bias=-.00035;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key,key.target);
  const fill=new THREE.DirectionalLight('#b9d7e3',1.5);fill.position.set(-5,3,4);scene.add(fill);
  const rim=new THREE.DirectionalLight('#e5edec',3.5);rim.position.set(3,6,-5);scene.add(rim);
  const warm=new THREE.PointLight('#e8ba83',13,12,2);warm.position.set(-3,4,-1);scene.add(warm);
  const pmrem=new THREE.PMREMGenerator(renderer);const env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.055).texture;scene.environmentIntensity=.72;env.dispose();pmrem.dispose();
}

function createPostprocessing(){
  const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:4});
  composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
  aoPass=new GTAOPass(scene,camera,innerWidth,innerHeight,undefined,{radius:.21,thickness:.5,distanceExponent:1.5,scale:1,samples:12,distanceFallOff:1});
  aoPass.blendIntensity=.75;composer.addPass(aoPass);composer.addPass(new OutputPass());
}

function makeFlow(points,color,count=18,radius=.017){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const group=new THREE.Group();group.visible=false;scene.add(group);
  const pipe=new THREE.Mesh(new THREE.TubeGeometry(curve,120,radius,7,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.46,depthTest:false}));pipe.renderOrder=10;group.add(pipe);
  const beads=new THREE.InstancedMesh(new THREE.ConeGeometry(radius*1.8,radius*6,8),new THREE.MeshBasicMaterial({color,depthTest:false}),count);beads.renderOrder=11;group.add(beads);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),scale=new THREE.Vector3(1,1,1);
  for(let i=0;i<count;i++){const t=i/count;rotation.setFromUnitVectors(up,curve.getTangentAt(t).normalize());matrix.compose(curve.getPointAt(t),rotation,scale);beads.setMatrixAt(i,matrix);}
  flowSystems.push({group,curve,beads,count,phase:0});
}
function createFlows(){
  // Blue: wet exhaust to evaporator. Amber: reheated supply to drum. Routes are schematic.
  makeFlow([[.2,1.8,.1],[.94,1.6,-.3],[1.08,2.18,-.92],[1.06,3.03,-.75],[.14,3.33,-.62],[-.57,3.33,-.40]],'#6cbdbb',20,.018);
  makeFlow([[-.57,3.33,-.4],[-.57,3.33,.55],[-1.09,3.08,.97],[-.81,2.44,1.15],[-.20,1.8,.90],[.2,1.8,.1]],'#e0a775',22,.018);
  // Refrigerant kept separate, copper-red; never mixed with the process air.
  makeFlow([[.64,3.27,-.71],[.8,3.52,-.35],[.3,3.54,.55],[-.34,3.53,.6],[-.73,3.47,.25],[-.73,3.47,-.47],[.13,3.49,-.83],[.64,3.27,-.71]],'#d68b60',17,.011);
  makeFlow([[-.56,3.18,-.45],[-1.09,2.74,-.48],[-1.12,.58,-.37],[-.2,.46,.52],[.66,.44,.88]],'#7aa6c8',12,.01);
}

function createLabels(){
  const configs=[
    ['heatpump','热泵换热模块',[.30,.26,.30],[-14,-36]],
    ['drum','穿孔不锈钢内筒',[-.55,.37,.71],[-86,-8]],
    ['motor','铜绕组 · 直驱电机',[.39,.49,-.06],[27,-14]],
    ['door','复合玻璃舱门',[-.65,-.31,.1],[-104,19]],
    ['inlet','冷水进水口 · INLET',[0,0,-.21],[20,-24]],
    ['outlet','排水出口 · DRAIN',[0,0,-.12],[-140,27]],
  ];
  for(const [id,text,local,offset] of configs){const el=document.createElement('div');el.className='scene-label';el.textContent=text;$('labels').appendChild(el);labelEntries.push({id,el,local:new THREE.Vector3(...local),offset,part:washer.parts.find(p=>p.id===id)});}
}

function updateLabels(){
  const width=innerWidth,height=innerHeight, mobile=width<600;
  for(const label of labelEntries){
    const pos=label.part.group.localToWorld(label.local.clone()).project(camera);
    const x=(pos.x*.5+.5)*width+label.offset[0], y=(-pos.y*.5+.5)*height+label.offset[1];
    const waterPort=['inlet','outlet'].includes(label.id);
    const allowed=state.labels && (state.view!=='assembled'||(waterPort&&camera.position.z<controls.target.z)) && label.part.group.visible && pos.z<1 && pos.z>-1 && x>(mobile?20:270) && x+label.el.offsetWidth<width-(mobile?20:285) && y>(mobile?250:112) && y<height-(mobile?290:170) && (!mobile || label.id==='heatpump'||waterPort);
    label.el.style.opacity=allowed?'1':'0';label.el.style.transform=`translate3d(${x}px,${y}px,0)`;label.el.classList.toggle('selected',label.id===state.selected);
  }
}

function updateExplosion(value){
  state.explosion=clampExplosion(value);const factor=state.explosion/100;
  const pos=guideLines.geometry.attributes.position;
  washer.parts.forEach((p,i)=>{
    p.group.position.copy(p.base).addScaledVector(p.offset,factor);
    // Mechanical exploded drawing axes terminate at the assembled part center.
    pos.setXYZ(i*2,p.base.x,p.base.y,p.base.z);pos.setXYZ(i*2+1,p.group.position.x,p.group.position.y,p.group.position.z);
  });
  washer.plumbing.update(factor);
  pos.needsUpdate=true;guideLines.computeLineDistances();guideLines.visible=state.labels&&factor>.25&&state.view==='exploded';
}

function updateRange(value){$('explode-range').value=String(Math.round(value));$('explode-range').style.setProperty('--range-progress',`${value}%`);$('explode-value').innerHTML=`${Math.round(value)}<span>%</span>`;}

function setView(view,{immediate=false,keepTour=false}={}){
  if(!keepTour)stopTour();
  state.rearView=false;
  const preset=viewState(view);state.view=view;state.target=preset.explosion;state.focused=false;document.body.dataset.mode=view;
  $('view-title').textContent=preset.title;
  const names={assembled:'ASSEMBLED VIEW',exploded:'EXPLODED VIEW',cutaway:'INTERNAL STRUCTURE',thermal:'THERMAL CIRCULATION'};$('view-description').textContent=names[view];
  for(const el of document.querySelectorAll('[data-view]'))setPressed(el,el.dataset.view===view);
  washer.parts.forEach(p=>{p.group.visible=preset.shell||!['shell','front'].includes(p.category);});
  washer.root.traverse(o=>{if(o.userData.cutawayHide)o.visible=preset.shell;});
  // Hide porthole and seal in cutaway to expose the internal drum face fully.
  for(const p of washer.parts)if(['door','gasket'].includes(p.id))p.group.visible=preset.shell;
  for(const flow of flowSystems)flow.group.visible=preset.flow;
  $('thermal-key').classList.toggle('is-hidden',!preset.flow);
  if(preset.flow)selectPart('heatpump',false);
  if(immediate){updateExplosion(state.target);updateRange(state.target);}else resetCamera(false);
}

let highlighted=[];
function selectPart(id,flash=true){
  if(!PART_INFO[id])return;state.selected=id;
  const data=PART_INFO[id];$('part-name').textContent=data.name;$('part-en').textContent=data.en;$('part-desc').textContent=data.description;$('part-index').textContent=`/ ${data.index}`;
  $('part-specs').replaceChildren(...data.specs.map(([label,value])=>{const row=document.createElement('div'),key=document.createElement('span'),val=document.createElement('strong');key.textContent=label;val.textContent=value;row.append(key,val);return row;}));
  for(const el of document.querySelectorAll('[data-part]'))setPressed(el,el.dataset.part===id);
  highlighted.forEach(({object,original,clone})=>{object.material=original;clone.dispose();});highlighted=[];
  if(flash){
    washer.parts.filter(p=>p.id===id).forEach(p=>p.group.traverse(object=>{
      if(object.isMesh&&!Array.isArray(object.material)&&object.material.isMeshStandardMaterial){const original=object.material,clone=original.clone();clone.emissive.set('#bea075');clone.emissiveIntensity=.13;object.material=clone;highlighted.push({object,original,clone});}
    }));
  }
  if(innerWidth<600&&flash)toast(`${data.name} · ${data.specs[0][1]}`);
}

function resetCamera(instant=false){
  state.rearView=false;
  const dest=defaultTarget.clone().addScaledVector(defaultDirection,defaultDistance);
  if(instant||motionQuery.matches){camera.position.copy(dest);controls.target.copy(defaultTarget);controls.update();cameraTween=null;}
  else cameraTween={start:performance.now(),from:camera.position.clone(),to:dest,fromTarget:controls.target.clone(),toTarget:defaultTarget.clone(),duration:1100};
  state.focused=false;
}

function viewConnections(id='inlet',immediate=false){
  setView('assembled',{immediate:true});state.rearView=true;selectPart(id,false);
  const target=new THREE.Vector3(0,1.67,-.35),direction=new THREE.Vector3(-5,3.4,-10).normalize();
  const destination=target.clone().addScaledVector(direction,innerWidth<600?19:11.5);
  if(immediate||motionQuery.matches){camera.position.copy(destination);controls.target.copy(target);cameraTween=null;controls.update();}
  else cameraTween={start:performance.now(),from:camera.position.clone(),to:destination,fromTarget:controls.target.clone(),toTarget:target,duration:1100};
  $('view-title').textContent='背面进排水接口';$('view-description').textContent='WATER INLET / DRAIN';
}

function focusPart(){
  const relevant=washer.parts.find(p=>p.id===state.selected);
  if(!relevant)return;
  if(!relevant.group.visible){setView('exploded');}
  const center=relevant.group.getWorldPosition(new THREE.Vector3());
  const direction=camera.position.clone().sub(controls.target).normalize();
  cameraTween={start:performance.now(),from:camera.position.clone(),to:center.clone().addScaledVector(direction,state.selected==='heatpump'?5.4:5.8),fromTarget:controls.target.clone(),toTarget:center,duration:1000};state.focused=true;toast('已聚焦部件 · 双击空白或按 Esc 返回');
}

function stopTour(){state.tour=false;$('tour-button').classList.remove('is-active');$('tour-button').querySelector('span').textContent='自动拆解';}
function toggleTour(){
  if(state.tour){stopTour();return;}
  state.tour=true;tourStart=performance.now();setView('assembled',{keepTour:true,immediate:true});resetCamera();$('tour-button').classList.add('is-active');$('tour-button').querySelector('span').textContent='暂停演示';toast('由完整机身，逐层展开精密内核');
}

function wireControls(){
  const waterTools=document.createElement('nav');waterTools.className='water-tools';waterTools.setAttribute('aria-label','进排水接口');waterTools.innerHTML='<button id="view-connections" type="button">查看背面接口 <span>↻</span></button><div><button type="button" data-part="inlet">冷水进水</button><button type="button" data-part="outlet">排水出口</button></div>';
  document.body.append(waterTools);$('view-connections').addEventListener('click',()=>viewConnections());
  const focus=document.createElement('button');focus.id='focus-part';focus.className='focus-button';focus.innerHTML='近看这一部件 <span>↗</span>';focus.addEventListener('click',focusPart);document.querySelector('.inspector').append(focus);
  const key=document.createElement('div');key.id='thermal-key';key.className='thermal-key is-hidden';key.innerHTML='<span><i style="background:#6cbdbb"></i>湿空气 · 冷却除湿</span><span><i style="background:#e0a775"></i>干空气 · 回热送风</span><span><i style="background:#d68b60"></i>密闭冷媒回路</span><span><i style="background:#7aa6c8"></i>冷凝排水</span><small>箭流为原理示意 · 并非实际管路尺寸</small>';document.body.append(key);
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>setView(el.dataset.view)));
  document.querySelectorAll('[data-part]').forEach(el=>el.addEventListener('click',()=>{if(['inlet','outlet'].includes(el.dataset.part)){viewConnections(el.dataset.part);return;}stopTour();selectPart(el.dataset.part);if(state.view==='assembled'&&el.dataset.part!=='door'&&el.dataset.part!=='cabinet')setView('exploded');}));
  $('explode-range').addEventListener('input',e=>{stopTour();if(state.view!=='exploded')setView('exploded');state.target=clampExplosion(e.target.value);updateRange(state.target);});
  $('toggle-labels').addEventListener('click',()=>{state.labels=!state.labels;setPressed($('toggle-labels'),state.labels);});
  $('toggle-rotate').addEventListener('click',()=>{state.rotate=!state.rotate;controls.autoRotate=state.rotate;setPressed($('toggle-rotate'),state.rotate);});
  $('reset-view').addEventListener('click',()=>{stopTour();resetCamera();toast('已重置观察视角');});
  $('tour-button').addEventListener('click',toggleTour);
  $('info-button').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());
  $('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const rect=$('help-dialog').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)$('help-dialog').close();}});
  $('export-image').addEventListener('click',async()=>{try{toast('正在渲染 3K 精细图像…');const data=await exportPoster();const link=document.createElement('a');link.download=`ORBIT-${state.view}-3000.png`;link.href=data;link.click();toast('图像已导出 · 3000 × 2000');}catch(error){console.error(error);toast('图像导出失败，请重试');}});
  const modelExport=document.createElement('button');modelExport.id='export-model';modelExport.className='focus-button';modelExport.textContent='下载带拆解动画的 3D 模型（GLB）';modelExport.addEventListener('click',async()=>{modelExport.disabled=true;try{const {exportAnimatedModel}=await import('./export-model.js');const binary=await exportAnimatedModel(washer);const url=URL.createObjectURL(new Blob([binary],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='ORBIT-heatpump-animated.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('3D 模型已导出 · 含拆解动画');}catch(error){console.error(error);toast('模型导出失败，请重试');}finally{modelExport.disabled=false;}});document.querySelector('.dialog-disclaimer').after(modelExport);
  let down;
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};cameraTween=null;});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const hit=pick(e);if(hit)selectPart(hit);});
  renderer.domElement.addEventListener('dblclick',e=>{const hit=pick(e);if(hit){selectPart(hit);focusPart();}else resetCamera();});
  renderer.domElement.addEventListener('pointermove',e=>{if(frameCount%3===0)renderer.domElement.style.cursor=pick(e)?'pointer':'grab';});
  document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||$('help-dialog').open)return;
    if(['1','2','3','4'].includes(e.key))setView(['assembled','exploded','cutaway','thermal'][Number(e.key)-1]);
    if(e.key.toLowerCase()==='l')$('toggle-labels').click();if(e.key.toLowerCase()==='r')$('toggle-rotate').click();if(e.key==='Escape'){stopTour();resetCamera();}if(e.code==='Space'){e.preventDefault();toggleTour();}
  });
}

function pick(event){
  pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);rays.setFromCamera(pointer,camera);
  const hits=rays.intersectObjects(washer.parts.filter(p=>p.group.visible).map(p=>p.group),true);
  for(const hit of hits){let o=hit.object,visible=true,id;while(o){if(!o.visible)visible=false;if(o.userData.partId)id=o.userData.partId;o=o.parent;}if(visible&&id)return id;}
  return null;
}

function resize(){
  renderer.setSize(innerWidth,innerHeight);composer?.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;
  // Reserve editorial columns while preserving a natural product photography lens.
  const mobile=innerWidth<600;
  defaultDistance=mobile?20.8:innerWidth<1000?15.6:innerWidth<1250?14:12.8;
  camera.fov=mobile?38:32;
  camera.setViewOffset(innerWidth,innerHeight,mobile?-innerWidth*.04:-innerWidth*.026,mobile?innerHeight*.015:innerHeight*.018,innerWidth,innerHeight);
  camera.updateProjectionMatrix();resetCamera(true);
}

function renderFrame(time){
  requestAnimationFrame(renderFrame);const dt=Math.min(.05,(time-lastTime)/1000||.016);lastTime=time;frameCount++;
  if(document.hidden)return;
  if(state.tour){const elapsed=(time-tourStart)/1000;if(elapsed<1.7)state.target=0;else if(elapsed<9.7){state.target=easeInOut(Math.min(1,(elapsed-1.7)/8))*100;state.view='exploded';setPressed(document.querySelector('[data-view="assembled"]'),false);setPressed(document.querySelector('[data-view="exploded"]'),true);$('view-title').textContent='逐层展开';$('view-description').textContent='ANATOMY IN MOTION';}else if(elapsed>11.5){stopTour();state.target=62;toast('拆解完成 · 点击任意部件继续探索');}}
  if(Math.abs(state.explosion-state.target)>.015){updateExplosion(motionQuery.matches?state.target:THREE.MathUtils.damp(state.explosion,state.target,4.4,dt));updateRange(state.explosion);}
  else if(state.explosion!==state.target){updateExplosion(state.target);updateRange(state.target);}
  if(cameraTween){const t=Math.min(1,(time-cameraTween.start)/cameraTween.duration),v=easeInOut(t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,v);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,v);if(t===1)cameraTween=null;}
  controls.update(dt);
  if(state.view==='thermal'&&!motionQuery.matches){washer.spin.rotation.z+=dt*.12;const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),scale=new THREE.Vector3(1,1,1);for(const f of flowSystems){for(let i=0;i<f.count;i++){const t=(i/f.count+time*.000055+f.phase)%1;rotation.setFromUnitVectors(up,f.curve.getTangentAt(t).normalize());matrix.compose(f.curve.getPointAt(t),rotation,scale);f.beads.setMatrixAt(i,matrix);}f.beads.instanceMatrix.needsUpdate=true;}}
  guideLines.visible=state.labels&&state.explosion>25&&state.view==='exploded';
  updateLabels();composer.render();
}

export async function exportPoster(width=3000,height=2000){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
  const oldSize=renderer.getSize(new THREE.Vector2()),oldPixelRatio=renderer.getPixelRatio(),oldCamera=camera.clone();
  const oldLines=guideLines.visible;guideLines.visible=state.view==='exploded';
  renderer.setPixelRatio(1);renderer.setSize(width,height,false);composer.setPixelRatio(1);composer.setSize(width,height);camera.clearViewOffset();camera.aspect=width/height;camera.fov=32;
  const target=state.rearView?new THREE.Vector3(0,1.67,-.35):new THREE.Vector3(0,1.99,.2);const direction=state.rearView?new THREE.Vector3(-5,3.4,-10).normalize():defaultDirection;camera.position.copy(target).addScaledVector(direction,state.rearView?11.5:state.view==='exploded'?13.8:10.4);camera.lookAt(target);camera.updateProjectionMatrix();composer.render();
  ctx.drawImage(renderer.domElement,0,0);const unit=width/1500;
  ctx.fillStyle='#ecece4';ctx.font=`500 ${27*unit}px Segoe UI`;ctx.fillText('ORBIT',56*unit,59*unit);ctx.fillStyle='#829093';ctx.font=`${8*unit}px Segoe UI`;ctx.fillText('F O R M   &   F U N C T I O N',57*unit,79*unit);
  ctx.fillStyle='#c5aa88';ctx.font=`${10*unit}px Segoe UI`;ctx.fillText('HEAT PUMP / WASHER–DRYER',56*unit,124*unit);
  ctx.fillStyle='#e3e5df';ctx.font=`300 ${34*unit}px Microsoft YaHei`;ctx.fillText(state.rearView?'背面进排水接口':viewState(state.view).title,55*unit,175*unit);
  ctx.fillStyle='#768487';ctx.font=`${11*unit}px Microsoft YaHei`;ctx.fillText('热泵式洗烘一体机 · 精密结构研究',57*unit,202*unit);
  if(state.view==='thermal'){
    const legend=[['#6cbdbb','湿空气 / 冷却除湿'],['#e0a775','干空气 / 回热送风'],['#d68b60','独立密闭冷媒回路'],['#7aa6c8','冷凝水 / 排水支路']];
    legend.forEach(([color,text],i)=>{const y=(244+i*22)*unit;ctx.fillStyle=color;ctx.beginPath();ctx.arc(60*unit,y-3*unit,2.5*unit,0,Math.PI*2);ctx.fill();ctx.fillStyle='#9caeab';ctx.font=`${10*unit}px Microsoft YaHei`;ctx.fillText(text,72*unit,y);});
  }
  if(state.view!=='assembled'||state.rearView){
    const labels=state.rearView?[['inlet','11 / 冷水进水口 · 内置进水阀',false,.27],['outlet','12 / 排水出口 · 外接波纹软管',true,.72]]:[['door','01 / 复合玻璃舱门',true,.71],['drum','03 / 不锈钢洗涤内筒',true,.52],['control','08 / 智能控制组件',true,.34],['motor','04 / 同轴直驱电机',false,.44],['heatpump','07 / 压缩机 · 双换热器',false,.23],['pump','09 / 过滤与排水组件',true,.85],['inlet','11 / 冷水进水口与进水阀',false,.34],['outlet','12 / 排水出口与外排软管',false,.75]];
    for(const [id,name,left,vertical] of labels){const part=washer.parts.find(p=>p.id===id);if(!part.group.visible)continue;const p=part.group.getWorldPosition(new THREE.Vector3()).project(camera);let x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;const endX=width*(left?.225:.80),endY=height*vertical;ctx.strokeStyle='#ab9b8180';ctx.lineWidth=unit*.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.lineTo(endX+(left?-108:108)*unit,endY);ctx.stroke();ctx.fillStyle='#c0b59f';ctx.beginPath();ctx.arc(x,y,2.2*unit,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b8c0b8';ctx.textAlign=left?'right':'left';ctx.font=`${11*unit}px Microsoft YaHei`;ctx.fillText(name,endX+(left?-5:5)*unit,endY-9*unit);ctx.textAlign='left';}
  }
  ctx.strokeStyle='#75808040';ctx.lineWidth=unit*.5;ctx.beginPath();ctx.moveTo(56*unit,height-64*unit);ctx.lineTo(width-56*unit,height-64*unit);ctx.stroke();
  ctx.fillStyle='#748387';ctx.font=`${9*unit}px Microsoft YaHei`;ctx.fillText('结构与管路为概念示意 · 非特定品牌产品 · 非拆机维修指引',56*unit,height-39*unit);ctx.textAlign='right';ctx.fillText('ORBIT     /     DESIGN ENGINEERING     /     001',width-56*unit,height-39*unit);
  camera.copy(oldCamera);renderer.setPixelRatio(oldPixelRatio);renderer.setSize(oldSize.x,oldSize.y,false);composer.setPixelRatio(oldPixelRatio);composer.setSize(oldSize.x,oldSize.y);guideLines.visible=oldLines;composer.render();
  return canvas.toDataURL('image/png');
}

async function init(){
  try{
    scene=new THREE.Scene();scene.background=new THREE.Color('#192126');scene.fog=new THREE.FogExp2('#192126',.035);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label','热泵洗烘一体机三维模型；拖动旋转，滚轮缩放，点击选择部件');renderer.domElement.tabIndex=0;$('scene-container').appendChild(renderer.domElement);
    camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,100);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=4;controls.maxDistance=24;controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=true;controls.autoRotateSpeed=.7;controls.target.copy(defaultTarget);
    washer=createWasher();scene.add(washer.root);createLighting();createStage();createFlows();createPostprocessing();createLabels();wireControls();resize();selectPart('heatpump',false);setView('exploded',{immediate:true});
    window.addEventListener('resize',resize);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('图形上下文已中断，请刷新页面恢复');});
    window.__ORBIT__={state,scene,camera,washer,renderer,composer,controls,setView,selectPart,exportPoster,resetCamera,viewConnections,ready:true};
    await renderer.compileAsync(scene,camera);composer.render();$('loading').classList.add('is-hidden');requestAnimationFrame(renderFrame);
  }catch(error){console.error(error);$('loading').innerHTML='<div class="loading-wordmark">ORBIT</div><p>三维视图未能加载<br>请使用支持 WebGL 2 的新版浏览器并启用硬件加速。</p>';window.__ORBIT_ERROR__=error.message;}
}
init();

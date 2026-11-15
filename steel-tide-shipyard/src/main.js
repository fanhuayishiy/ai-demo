import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {YardEngine,STAGES,GANGWAY,clamp,mix,smooth,path,sampleWorld} from './engine.js';
import {Batch,C,group,box,sign,line,dynamicLines,human} from './geometry.js';
import {buildYard,makeGantry} from './yard.js';
import {makeShip,makeTruck,makeTug} from './ship.js';

const $=id=>document.getElementById(id),engine=new YardEngine();
const icons={overview:'M3 7 12 2l9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5',factory:'M3 21V9l6 4V7l6 4V3h5v18H3Zm3-4h1m4 0h1m4 0h1',anchor:'M12 4v16M7 8h10M3 15c0 4 4 7 9 7s9-3 9-7M1 16l2-3 3 2m12 0 3-2 2 3M14 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0',gate:'M3 21V4h5v17M16 21V4h5v17M8 8h8M8 15h8M1 21h22',ship:'M3 17 2 11l10-4 10 4-1 6M7 9V4h10v5M3 20q3 3 6 0 3 3 6 0 3 3 6 0',waves:'M2 6q3-3 6 0t6 0 6 0M2 12q3-3 6 0t6 0 6 0M2 18q3-3 6 0t6 0 6 0',walk:'M14 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-4 8 2-6 4 4 4 1M4 13l4-3 4-3M11 14l-4 7m5-8 5 7',layers:'m12 3 10 6-10 6L2 9l10-6ZM2 15l10 6 10-6M2 12l10 6 10-6',stairs:'M3 21h6v-6h6V9h6V3M4 17V3h13',focus:'M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5M8 12h8m-4-4v8',replay:'M3 10a9 9 0 1 1 2 9M3 3v7h7',pause:'M8 5v14M16 5v14',play:'m8 4 12 8-12 8V4Z'};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]||icons.overview}"/></svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const stageButtons=$('stage-buttons');STAGES.forEach((stage,i)=>{const b=document.createElement('button');b.dataset.stage=i;b.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><span>${stage.short}</span>`;b.title=stage.name;b.setAttribute('aria-label',`阶段 ${i+1}：${stage.name}`);b.onclick=()=>{engine.jump(i);update(true);toast(`已回看 · ${stage.name}`);};stageButtons.appendChild(b);});

let renderer,scene,camera,orbit,yard,ship,gantry,second,truck,tugs,waterUniforms,dockWater,seaWater;
let follow=false,cutaway=false,walk=false,deckWalk=false,currentView='overview',cameraTween=null;
let yaw=0,pitch=-.08,lastPointer=null,keys={},prevWorld=null,lastUI=0,toastTimer,frameCount=0,fps=0,fpsTime=0;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),v3=new THREE.Vector3(),tmpMatrix=new THREE.Matrix4();
const workers=[],lamps=[],labels=[],wakes=[],selectables=[];
let ropes,towRopes,moorRopes,serviceLines,weld,dust,weldLight,radarLights,lightMaterial,sun,moon,ambient,sunDisc,moonDisc,clouds;
let rawPlate,cutPieces,plateHoist,workshopRope,gantryLight;const navBeacons=[];
let renderScale=1,softwareRenderer=false,gpuName='',cameraDirty=true,worldSignature='',panels=[];

function init(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0xc4dade);scene.fog=new THREE.FogExp2(0xc4dade,.00085);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.domElement.setAttribute('aria-label','海岬船厂三维场景，可拖动旋转、滚轮缩放');renderer.domElement.tabIndex=0;$('world').appendChild(renderer.domElement);
  const gl=renderer.getContext(),gpuInfo=gl.getExtension('WEBGL_debug_renderer_info');gpuName=gpuInfo?gl.getParameter(gpuInfo.UNMASKED_RENDERER_WEBGL):'unknown';softwareRenderer=/swiftshader|llvmpipe|software/i.test(gpuName);renderScale=softwareRenderer?.75:Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(renderScale);
  camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.2,2600);camera.position.set(-425,355,470);
  orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(-42,2,18);orbit.enableDamping=true;orbit.dampingFactor=.075;orbit.maxPolarAngle=Math.PI*.48;orbit.minDistance=15;orbit.maxDistance=1200;orbit.zoomSpeed=.75;orbit.update();orbit.addEventListener('start',()=>{cameraTween=null;if(!walk)follow=false;});orbit.addEventListener('change',()=>cameraDirty=true);
  ambient=new THREE.HemisphereLight(0xd7e9e6,0x6a7367,2);scene.add(ambient);
  sun=new THREE.DirectionalLight(0xfff0ce,2.6);sun.castShadow=true;sun.shadow.mapSize.set(softwareRenderer?1024:2048,softwareRenderer?1024:2048);sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;Object.assign(sun.shadow.camera,{left:-370,right:370,top:350,bottom:-350,near:10,far:1400});sun.shadow.bias=-.00045;sun.shadow.normalBias=.35;sun.target.position.set(0,0,0);scene.add(sun,sun.target);
  moon=new THREE.DirectionalLight(0x9ac4e1,.2);scene.add(moon);
  sunDisc=new THREE.Mesh(new THREE.SphereGeometry(11,12,8),new THREE.MeshBasicMaterial({color:0xffe6ab,fog:false}));moonDisc=new THREE.Mesh(new THREE.SphereGeometry(7,10,8),new THREE.MeshBasicMaterial({color:0xdbe9df,fog:false}));scene.add(sunDisc,moonDisc);
  createWater();yard=buildYard(scene);ship=makeShip(scene);gantry=makeGantry(scene);second=makeGantry(scene,{z:128,height:54,secondary:true});second.trolley.position.x=83;second.spreader.position.set(83,37,128);
  const secondLine=line(scene,[[83,50,128],[83,39,128]],0x324b50);secondLine.userData.decorative=true;
  gantryLight=new THREE.PointLight(0xffd7a0,0,135,2);gantryLight.position.set(0,40,0);gantryLight.visible=false;gantry.root.add(gantryLight);
  truck=makeTruck(scene);tugs=[makeTug(scene,'03'),makeTug(scene,'06')];ropes=dynamicLines(scene,14,0x263e43);towRopes=dynamicLines(scene,4,0x293e3f);moorRopes=dynamicLines(scene,8,0x4a5948);serviceLines=dynamicLines(scene,4,0xd4b16c);
  rawPlate=group(scene);box(rawPlate,0,0,0,48,.4,18,C.red);sign(rawPlate,'B-07',0,.25,0,14,{fg:'#f2d597'}).rotation.x=-Math.PI/2;
  cutPieces=group(rawPlate);const cb=new Batch();for(let i=0;i<6;i++){const x=-20+i*8;if(i===2){cb.box(x-2.8,0,0,2,.4,17.6,C.red);cb.box(x+2.8,0,0,2,.4,17.6,C.red);cb.box(x,0,7.2,4,.4,3.2,C.red);}else cb.box(x,0,0,7.6,.4,17.6,C.red);cb.box(x,.25,-7.8,7.2,.2,.2,C.yellow);}cb.finish(cutPieces);
  plateHoist=group(scene,-254,30,-27);const hb=new Batch();hb.box(0,0,0,90,2,3,C.orange);hb.box(0,-1,0,10,2,5,C.dark);hb.finish(plateHoist);workshopRope=dynamicLines(scene,4,0x43504b);
  createAtmosphere();createPeople();createLights();createParticles();createLabels();
  selectables.push(ship.root,ship.module.root,ship.island.root,truck.root,yard.parts,yard.gate);
  truck.root.userData={name:'模块化平板转运车',id:'SPMT-07'};yard.parts.userData={name:'B-07 配套板件',id:'B-07 / PLATE'};yard.gate.userData={name:'01 号船坞坞门',id:'GATE-01'};
  bindControls();resize();update(true);requestAnimationFrame(animate);
  setTimeout(()=>{$('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),550);},250);
  window.__shipyard={engine,scene,camera,renderer,setView,inspect:()=>{let moduleCount=0;scene.traverse(o=>{if(o.userData.id==='B-07')moduleCount++;});return { ...engine.inspect(),world:engine.world(),mode:walk?'walk':'orbit',view:currentView,cutaway,follow,fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,voxel:.2,moduleCount,walkPosition:camera.position.toArray(),cameraTarget:orbit.target.toArray(),renderScale,gpuName,softwareRenderer};}};
}
function createWater(){
  waterUniforms={uTime:{value:0},uDay:{value:1},uSky:{value:new THREE.Color(0xc4dade)},uCam:{value:new THREE.Vector3()}};
  const mat=new THREE.ShaderMaterial({uniforms:waterUniforms,transparent:true,opacity:1,depthWrite:true,vertexShader:`varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,fragmentShader:`uniform float uTime; uniform float uDay; uniform vec3 uSky; uniform vec3 uCam; varying vec3 vWorld;
    void main(){vec2 p=floor(vWorld.xz*1.25)/1.25;float a=sin(p.x*.12+p.y*.07+uTime*.45);float b=sin(p.y*.23-p.x*.04-uTime*.32);float ripple=a*b;float fleck=pow(max(0.,sin(p.x*.34+p.y*.13+uTime*.3)*sin(p.y*.41+uTime*.2)),18.);
    vec3 c=mix(vec3(.105,.28,.33),vec3(.28,.53,.55),uDay);c+=ripple*.018; c+=fleck*vec3(.19,.21,.17)*(.15+uDay*.7);float fog=1.-exp(-distance(uCam,vWorld)*.00062);c=mix(c,uSky,fog*.64);gl_FragColor=vec4(c,.96);}`});
  const plane=(w,d,x,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-Math.PI/2;m.position.set(x,0,z);scene.add(m);return m;};
  seaWater=plane(2200,1700,0,-1036);plane(1100,332,696,-20);dockWater=plane(87,328,60,-20);dockWater.position.y=-13.7;
  box(scene,0,-17,-400,2200,3,1800,0x42686b);
  // Harbor buoys and a distant breakwater, away from the navigable departure arc.
  const b=new Batch();for(let z=-265;z>-850;z-=95){for(const x of[-300,430]){b.box(x,.5,z,4,2,4,x<0?C.red:C.green);b.box(x,3,z,1.2,4,1.2,x<0?C.red:C.green);const beacon=new THREE.Mesh(new THREE.BoxGeometry(1.4,.8,1.4),new THREE.MeshBasicMaterial({color:x<0?0xff775c:0x9ddd9b}));beacon.position.set(x,5.4,z);scene.add(beacon);navBeacons.push(beacon);}}
  for(let x=-820;x<-350;x+=10)b.box(x,-.6,-410,10,4,22,0x7e9691);for(let x=-815;x<-350;x+=10)b.box(x,2,-410,9,1.4,18,0x9aaea3);b.finish(scene);
  for(const [x,z] of[[-350,-410],[430,-830]]){box(scene,x,7,z,4,14,4,C.white);box(scene,x,14,z,5,2,5,C.red);}
}
function createAtmosphere(){
  clouds=group(scene);const b=new Batch();for(let i=0;i<18;i++){const x=-850+i*105,z=420+(i%4)*80,y=122+(i%3)*28;for(let j=0;j<5;j++)b.box(x+j*15,y+(j%3)*3,z+(j%2)*8,28,7,20,0xe7eeea);}b.finish(clouds,false);
  // Wake blocks are instanced and reconstructed from trajectory, not random trails.
  for(let i=0;i<3;i++){const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xc5e4db,transparent:true,opacity:.35,depthWrite:false}),64);m.frustumCulled=false;scene.add(m);wakes.push(m);}
}
function createPeople(){for(let i=0;i<30;i++){const role=i<6?0:i<9?1:i<15?2:i<24?3:4;const w=human(scene,role,i);workers.push(w);selectables.push(w);}}
function createLights(){
  lightMaterial=new THREE.MeshStandardMaterial({color:0xffe8b0,emissive:0xffd68a,emissiveIntensity:0,roughness:.5});
  const supports=new Batch();for(const [x,z] of[[-90,-168],[-90,-40],[-90,94],[-90,228],[11,-156],[109,-135],[109,-25],[109,102],[278,-160],[278,-36],[278,90],[-310,250],[-221,10],[-135,100]]){
    supports.box(x,13,z,.6,18,.6,C.dark);supports.box(x+2,22,z,5,.6,.6,C.dark);const m=new THREE.Mesh(new THREE.BoxGeometry(3,.4,1.4),lightMaterial);m.position.set(x+3,21.8,z);scene.add(m);lamps.push(m);
    if([6,10,13].includes(lamps.length)){const light=new THREE.PointLight(0xffd69a,0,100,1.6);light.position.set(x+3,20,z);light.visible=false;scene.add(light);m.userData.light=light;}}
  supports.finish(scene);radarLights=group(scene);const b=new Batch();for(let z=-130;z<130;z+=8)b.box(-29,.05,z,.4,.2,.4,0xffdd81);b.finish(radarLights,false);
}
function createParticles(){
  const make=(count,color,size)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));const m=new THREE.Points(geo,new THREE.PointsMaterial({color,size,sizeAttenuation:true,transparent:true,opacity:.85,depthWrite:false}));m.frustumCulled=false;scene.add(m);return m;};
  weld=make(80,0xffca5d,.18);dust=make(50,0xc1bda0,.65);weldLight=new THREE.PointLight(0x9dd8ff,0,11,2);scene.add(weldLight);
}
function createLabels(){for(const data of[
  {text:'钢材加工',sub:'01 / CUT & FORM',pos:[-254,34,-45]},
  {text:'分段预制',sub:'02 / ASSEMBLY',pos:[-190,47,190]},
  {text:'01 号船坞',sub:'03 / DRY DOCK',pos:[111,8,120]},
  {text:'舾装码头',sub:'04 / OUTFITTING',pos:[278,12,58]},
  {text:'B–07',sub:'FOLLOW THE STEEL',pos:[0,0,0],module:true}]){const el=document.createElement('div');el.className='scene-label'+(data.module?' module':'');el.innerHTML=`<small>${data.sub}</small>${data.text}`;$('scene-labels').appendChild(el);labels.push({...data,el});}}

function updateWorld(s,dt){
  const night=s.shift.mode==='night',work=s.shift.mode==='work'||(s.shift.mode==='closing'&&engine.taskActive),time=engine.elapsed;
  ship.root.position.set(s.ship.x,s.ship.y,s.ship.z);ship.root.rotation.set(s.ship.pitch||0,s.ship.heading,s.ship.roll||0);
  ship.keel.visible=s.stage>=3;ship.ghost.visible=s.stage===0;
  const order=ship.chunks,priority=[0,1,14,15,2,3,12,13,4,5,10,11,7,8,9];order.forEach(ch=>{ch.root.visible=s.stage>=3&&(priority.indexOf(ch.index)<s.hullCount);ch.skin.visible=!cutaway||ch.pivot[0]>0||Math.abs(ch.pivot[2]+15)>35;ch.label.visible=camera.position.distanceTo(ship.root.position)<250;});
  ship.deck.forEach((panel,i)=>panel.visible=s.stage>=3&&i>=ship.deck.length-Math.ceil(s.deck*ship.deck.length));
  ship.deckSupports.visible=s.stage>=3;ship.marks.visible=s.stage>=6&&s.fittings>.20;ship.edge.visible=s.stage>=6&&s.fittings>.4;ship.jets.visible=s.stage===7||s.stage===6&&s.p>.8;
  ship.scaffold.visible=s.scaffold;ship.gangway.visible=s.gangway;ship.elevators.forEach((el,i)=>{el.visible=s.stage>=4&&(s.stage>4||s.p>.94);el.position.y=14.4-(work?s.elevatorOffsets[i]:0);});
  ship.elevatorGuides.forEach(g=>g.visible=s.stage>=4&&(s.stage>4||s.p>.94));
  ship.zoneLights.forEach((z,i)=>z.visible=s.stage>=6&&(night||s.stage===6&&s.p>.5+i*.11));
  // B-07 is exactly one object throughout. Its world transform changes only by owner.
  const mod=ship.module;mod.root.visible=s.stage>=2;
  if(s.module.installed){const pt=new THREE.Vector3(-10.8,-1,-15);ship.root.localToWorld(pt);mod.root.position.copy(pt);mod.root.rotation.copy(ship.root.rotation);}
  else{mod.root.position.fromArray(s.module.position);mod.root.rotation.set(0,0,0);}
  mod.skin.visible=s.stage===2?s.p>.72:!cutaway;mod.ribs.count=s.stage===2?Math.max(1,Math.floor(mod.ribs.instanceMatrix.count*smooth(s.p/.72))):mod.ribs.instanceMatrix.count;
  for(let i=3;i<mod.root.children.length;i++)mod.root.children[i].visible=s.stage>2||s.p>.5;
  yard.parts.visible=(s.stage===1&&s.p>.52)||(s.stage===2&&s.p<.68);yard.nesting.visible=s.stage<=1;
  yard.parts.children[0].count=s.stage===2?Math.max(1,Math.floor(yard.parts.children[0].instanceMatrix.count*(1-smooth(s.p/.68)))):yard.parts.children[0].instanceMatrix.count;
  truck.root.position.fromArray(night?[-90,4.6,20]:s.module.truck);truck.root.visible=s.stage>=2;
  truck.platform.position.y=s.module.lift*.8;
  let steer=s.stage===3?(s.p<.18?Math.PI/2:s.p<.39?Math.PI/2*(1-smooth((s.p-.246)/.01)+smooth((s.p-.316)/.01)):0):0;truck.wheels.forEach(w=>w.rotation.y=steer);
  const isl=ship.island;isl.root.visible=s.stage>=3;
  ship.islandSeat.visible=s.stage>4||(s.stage===4&&s.p>.40);
  if(s.island.installed){const v=new THREE.Vector3(22,15.8,30);ship.root.localToWorld(v);isl.root.position.copy(v);isl.root.rotation.copy(ship.root.rotation);}
  else{isl.root.position.fromArray(s.island.position);isl.root.rotation.set(0,0,0);}
  isl.extras.visible=s.stage>=6&&s.fittings>.6;isl.radar.rotation.y=s.stage>=6&&work?time*.5:0;
  // IS-01 target in engine is x82 z15 = ship local x22 z30.
  const hook=s.stage===4?s.island.hook:s.module.hook;
  gantry.root.position.z=hook[2];gantry.trolley.position.x=hook[0];gantry.spreader.position.fromArray(hook);
  const segments=[[[hook[0]-3,60,hook[2]-3],[hook[0]-3,hook[1]+1,hook[2]-3]],[[hook[0]+3,60,hook[2]+3],[hook[0]+3,hook[1]+1,hook[2]+3]]];
  if(s.stage===3&&s.module.attached){for(const x of[-7,7])for(const z of[-12,12])segments.push([[hook[0]+x,hook[1]-.4,hook[2]+z],[s.module.position[0]+x,s.module.position[1]+12.8,s.module.position[2]+z]]);}
  if(s.stage===4&&s.island.attached){for(const x of[-4,4])for(const z of[-10,10])segments.push([[hook[0]+x,hook[1]-.4,hook[2]+z],[s.island.position[0]+x,s.island.position[1]+21,s.island.position[2]+z]]);}
  ropes.set(segments);gantry.spreader.visible=true;gantry.root.visible=true;
  dockWater.position.y=s.water;dockWater.visible=s.stage>=5;yard.gate.position.x=60-98*s.gate;
  // Tugs stay on the water, with four real attachment lines to the vessel.
  const tugSegs=[];tugs.forEach((t,i)=>{let pos;if(s.towLines){const off=new THREE.Vector3(i===0?-38:38,-s.ship.y,i===0?-95:85);ship.root.localToWorld(off);pos=off;t.rotation.y=s.ship.heading;}else{pos=new THREE.Vector3(180+i*22,0,-242-i*18);t.rotation.y=Math.PI*.5;}
    t.position.copy(pos);if(s.towLines){const attach=new THREE.Vector3(i===0?-19:19,-1,i===0?-105:95);ship.root.localToWorld(attach);tugSegs.push([[t.position.x,2,t.position.z],[attach.x,attach.y,attach.z]]);}});towRopes.set(tugSegs);
  const moors=[];if(s.mooring)for(const z of[-122,115])for(const x of[-17,-8]){const p=new THREE.Vector3(x,8,z);ship.root.localToWorld(p);moors.push([[p.x,p.y,p.z],[266,5,p.z+(z<0?-12:12)]]);}if(s.dockMooring)for(const x of[-18,18])for(const z of[-110,105]){const p=new THREE.Vector3(x,4,z);ship.root.localToWorld(p);moors.push([[p.x,p.y,p.z],[x<0?9:111,5,p.z+8]]);}moorRopes.set(moors);
  const services=[];if(s.stage===6)for(let i=0;i<3;i++){const p=new THREE.Vector3(-25,10,-22+i*6);ship.root.localToWorld(p);services.push([[280,6,p.z],[p.x,p.y,p.z]]);}serviceLines.set(services);
  radarLights.visible=s.stage>=6&&s.fittings>.5;radarLights.position.copy(ship.root.position);radarLights.rotation.copy(ship.root.rotation);radarLights.position.y+=15;
  // The first steel plate follows the infeed/bridge crane into the cutting bed.
  rawPlate.visible=s.stage===0||(s.stage===1&&s.p<.8);rawPlate.children[0].visible=s.stage===0||s.p<.38;rawPlate.children[1].visible=s.stage===0||s.p<.38;cutPieces.visible=s.stage===1&&s.p>=.38;plateHoist.visible=s.stage<=2;
  if(s.stage===1){let p=s.p;if(p<.13)rawPlate.position.fromArray(path([[-285,8,-160],[-254,8,-146]],p/.13));else if(p<.32)rawPlate.position.fromArray(path([[-254,8,-146],[-254,21,-146],[-254,21,-27],[-254,5.6,-27]],(p-.13)/.19));else rawPlate.position.set(-254,5.6,-27);yard.cutter.position.x=work?Math.sin(time*.65)*20:0;yard.cutter.position.z=27+(work?Math.cos(time*.43)*6:0);plateHoist.position.z=rawPlate.position.z;workshopRope.set(p>=.13&&p<.32?[[[-270,29,rawPlate.position.z],[-270,rawPlate.position.y+.4,rawPlate.position.z]],[[-238,29,rawPlate.position.z],[-238,rawPlate.position.y+.4,rawPlate.position.z]]]:[]);}else{rawPlate.position.set(-254,5.6,-27);workshopRope.set([]);}
  updatePeople(s,work,night,time);updateParticles(s,work,time);updateWakes(s);updateLighting(engine.time,time);
  if(follow&&!walk){const pos=mod.root.position;const dest=pos.clone().add(new THREE.Vector3(-65,49,-75));if(camera.position.distanceTo(dest)>.005)cameraDirty=true;camera.position.lerp(dest,1-Math.exp(-dt*2.5));orbit.target.lerp(pos.clone().add(new THREE.Vector3(0,5,0)),1-Math.exp(-dt*3));}
  if(currentView==='sea'&&!walk){const pos=ship.root.position;const dest=pos.clone().add(new THREE.Vector3(-210,145,-250));if(camera.position.distanceTo(dest)>.005)cameraDirty=true;camera.position.lerp(dest,1-Math.exp(-dt*2));orbit.target.lerp(pos.clone().add(new THREE.Vector3(0,8,0)),1-Math.exp(-dt*2));}
  const accessWithdrawn=walk&&!s.gangway&&(deckWalk||(prevWorld?.gangway&&gangwayInfo(camera.position.x,camera.position.z).inside));
  if(accessWithdrawn){setView('pier');toast('舷梯已撤收，已返回码头安全步道');}
  else if(deckWalk){const offset=deckOffset;const pos=new THREE.Vector3(offset.x,16.9,offset.z);ship.root.localToWorld(pos);camera.position.copy(pos);}
  updateLabels();prevWorld=s;
}

function updatePeople(s,work,night,t){
  const bases=[[-235,4.2,-5],[-82,4.2,100],[-98,4.2,-55],[24,4.2,-30],[276,4.2,-25]],gate=[-296,4.2,261];
  workers.forEach((w,i)=>{const role=w.userData.role,k=i%6;let p=[bases[role][0]+(k%3)*3,bases[role][1],bases[role][2]+Math.floor(k/3)*6];
    if(role===0)p=[-225+(k%3)*7,4.2,-5-Math.floor(k/3)*9];
    if(role===1){p=[[-123,4.2,125],[-84,4.2,68],[-15,4.2,-58]][k%3].slice();p[2]+=Math.sin(t*.4+k)*1.2;}
    if(role===2){p=[-98,4.2,-58+k*4];if(s.stage===3&&s.p>=.46&&s.p<.57){const enter=s.p<.54?smooth((s.p-.46)/.07):1-smooth((s.p-.54)/.03);p=path([p,[-92,4.2,-60],[-42,4.2,-55],[-42,29,-45],[-39,29,-41+k*4]],enter);}}
    if(role===3){const base=[3,4.2,-65+k*8],target=[36+(k%3)*.8,11.2,-44+Math.floor(k/3)*9];p=s.workersAtSeam?path([base,[14,4.2,-64],[35,11.2,-64],target],clamp((s.p-.94)/.06-k*.018)):s.stage===4?target:s.stage===5&&s.p<.1?path([target,[35,11.2,-64],[14,4.2,-64],base],s.p/.1):base;}
    if(role===3&&s.stage===6){p=path([[276,4.2,-86+k*2],GANGWAY.a,[255.6,18.2,-18],[238,18.2,-26+k*5]],clamp(s.p*2-k*.04));}
    if(role===4)p=[275,4.2,-142+k*46];
    const walkCycle=(Math.sin(t*.38+i*1.6)+1)/2;
    if(work){if(role===0||role===4){p[2]+=walkCycle*7;w.rotation.y=Math.sin(t*.38+i*1.6)>0?0:Math.PI;}}
    let route=[gate,[-112,4.2,254],[-112,4.2,p[2]],p];
    if(role===4||(role===3&&s.stage>=6))route=[gate,[-112,4.2,254],[-112,4.2,158],[276,4.2,158],[276,4.2,role===3?-86:p[2]],...(role===3?[GANGWAY.a,[255.6,18.2,-18]]:[]),p];
    else if(role===3)route=[gate,[-112,4.2,254],[-112,4.2,158],[-3,4.2,158],[-3,4.2,-64],...(p[1]>5?[[14,4.2,-64],[35,11.2,-64]]:[]),p];
    if(s.shift.mode==='prepare'){const a=smooth((engine.time-6.5)/1.5);p=path(route,clamp(a*1.4-i*.015));}
    if(s.shift.mode==='closing'){const a=smooth((engine.time-17)/2);if(!engine.taskActive)p=path([...route].reverse(),a);}
    if(night){p=role===4?[276,4.2,-35]:[-296+(i%3)*2,4.2,257+Math.floor(i/3)];w.visible=i===0||i===26;}
    else w.visible=true;
    w.position.fromArray(p);const near=camera.position.distanceTo(w.position)<165;w.userData.arm.visible=near;w.userData.other.visible=near;const signal=role!==1||(s.stage===3&&s.p>[.10,.25,.32][k%3]&&s.p<[.25,.32,.46][k%3]);w.userData.arm.rotation.z=work&&signal?(role===1?-1.2+Math.sin(t*2+i)*.3:Math.sin(t*2.4+i)*.35):.08;w.userData.other.rotation.x=work&&signal?Math.sin(t*2.4+i+Math.PI)*.3:0;
  });
}
function updateParticles(s,work,t){
  const welding=work&&((s.stage===3&&s.workersAtSeam)||(s.stage===2&&s.p>.25)||(s.stage===1&&s.p>.32));
  let origin=s.stage===3?[39,10.8,-47]:s.stage===2?[-195,14,98]:[-254+yard.cutter.position.x,5.8,-53+yard.cutter.position.z];
  weld.visible=welding;weldLight.intensity=welding?10+Math.sin(t*23)*7:0;weldLight.position.fromArray(origin);
  const a=weld.geometry.attributes.position.array;for(let i=0;i<a.length/3;i++){const life=(t*1.6+i*.131)%1,angle=i*2.399;a[i*3]=origin[0]+Math.cos(angle)*life*2;a[i*3+1]=origin[1]+life*(2.5-life*5);a[i*3+2]=origin[2]+Math.sin(angle)*life*2;}weld.geometry.attributes.position.needsUpdate=true;
  dust.visible=work&&s.stage===1&&s.p>.4;const d=dust.geometry.attributes.position.array;for(let i=0;i<d.length/3;i++){const life=(t*.35+i*.219)%1;d[i*3]=origin[0]+Math.sin(i*3)*life*5;d[i*3+1]=origin[1]+life*4;d[i*3+2]=origin[2]+Math.cos(i*7)*life*4;}dust.geometry.attributes.position.needsUpdate=true;
}
function updateWakes(s){
  wakes.forEach((m,j)=>{m.visible=j===0?s.location==='sea':s.towLines;if(!m.visible)return;
    for(let i=0;i<64;i++){let x,z,y=.10,w,d;if(j===0){const past=sampleWorld(7,Math.max(.30,s.p-i*.00062));const h=past.ship.heading;x=past.ship.x+Math.sin(h)*128;z=past.ship.z+Math.cos(h)*128;const off=Math.sin(i*2.4)*(.5+i*.14);x+=Math.cos(h)*off;z-=Math.sin(h)*off;w=3.6+i*.12;d=2.4+s.speed*.15;}else{const past=sampleWorld(s.stage,Math.max(0,s.p-i*.00045)),h=past.ship.heading,ox=j===1?-38:38,oz=j===1?-95:85;x=past.ship.x+Math.cos(h)*ox+Math.sin(h)*oz;z=past.ship.z-Math.sin(h)*ox+Math.cos(h)*oz;w=past.towLines?2.2:0;d=1.5;}
      tmpMatrix.compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(w,.04,d));m.setMatrixAt(i,tmpMatrix);}m.instanceMatrix.needsUpdate=true;});
}
function updateLighting(h,t){
  const a=(h-6)/24*Math.PI*2,elevation=Math.sin(a),day=smooth((elevation+.13)/.55),dusk=Math.max(0,1-Math.abs(elevation)*4);
  const sky=new THREE.Color(0x102938).lerp(new THREE.Color(0xc4dade),day);sky.lerp(new THREE.Color(0xd5b6a0),dusk*.42);scene.background.copy(sky);scene.fog.color.copy(sky);
  sun.position.set(Math.cos(a)*420,Math.max(-200,elevation*510),-190);sun.intensity=Math.max(0,elevation)*2.6;sun.color.set(0xffdbae).lerp(new THREE.Color(0xfff4db),day);
  ambient.intensity=mix(.39,1.25,day);moon.position.set(-Math.cos(a)*400,250,220);moon.intensity=(1-day)*.45;
  sunDisc.position.copy(sun.position).multiplyScalar(2);sunDisc.visible=elevation>-.05;moonDisc.position.set(-Math.cos(a)*850,Math.max(80,-elevation*700),310);moonDisc.visible=day<.4;
  waterUniforms.uDay.value=day;waterUniforms.uSky.value.copy(sky);waterUniforms.uTime.value=t;waterUniforms.uCam.value.copy(camera.position);clouds.visible=day>.12;
  const on=1-smooth((elevation+.04)/.22);lightMaterial.emissiveIntensity=on*5;lamps.forEach(m=>{if(m.userData.light){m.userData.light.intensity=on*900;m.userData.light.visible=on>.02;}});gantryLight.intensity=on*2200;gantryLight.visible=on>.02;navBeacons.forEach((b,i)=>b.visible=on>.15&&Math.sin(t*1.5+i)>.1);
  document.body.classList.toggle('night',day<.3);
}
function updateLabels(){const h=innerHeight,w=innerWidth;labels.forEach(l=>{if(l.module){ship.module.root.getWorldPosition(v3);v3.y+=20;}else v3.fromArray(l.pos);v3.project(camera);const x=(v3.x*.5+.5)*w,y=(-v3.y*.5+.5)*h;const visible=v3.z<1&&v3.z>0&&x>10&&x<w-10&&y>116&&y<h-190&&!walk&&(l.module?engine.stage>=2:true)&&!panels.some(r=>x>r.left-10&&x<r.right+10&&y>r.top-12&&y<r.bottom+25);l.el.style.display=visible?'':'none';l.el.style.left=`${x}px`;l.el.style.top=`${y}px`;});}

let deckOffset={x:-2,z:-65};
const views={
  overview:{pos:[-425,355,470],target:[-42,2,18]},
  workshop:{pos:[-167,30,-5],target:[-251,13,-28],walk:[-201,6.1,4]},
  dock:{pos:[-42,65,-105],target:[59,0,-18],walk:[-3,6.1,-64]},
  gate:{pos:[-56,42,-236],target:[61,-4,-145],walk:[-3,6.1,-174]},
  pier:{pos:[430,160,-255],target:[220,8,-35],walk:[276,6.1,-54]},
  sea:{pos:[-20,150,-465],target:[100,5,-320],walk:[276,6.1,-158]}
};
function setView(name){
  follow=false;deckWalk=false;currentView=name;
  const view=views[name]||views.overview;
  cameraDirty=true;
  if(name==='sea'&&!walk){const s=engine.world();const pos=new THREE.Vector3(s.ship.x,s.ship.y,s.ship.z);camera.position.copy(pos).add(new THREE.Vector3(-210,145,-250));orbit.target.copy(pos).add(new THREE.Vector3(0,8,0));cameraTween=null;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));return;}
  if(walk){const pos=view.walk||[-112,6.1,156];camera.position.fromArray(pos);const tar=new THREE.Vector3(...view.target).sub(camera.position);yaw=Math.atan2(-tar.x,-tar.z);pitch=Math.asin(clamp(tar.normalize().y,-.8,.8));cameraTween=null;}
  else cameraTween={start:camera.position.clone(),end:new THREE.Vector3(...view.pos),ta:orbit.target.clone(),tb:new THREE.Vector3(...view.target),t:0};
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('follow').classList.remove('active');
}
function toggleWalk(){walk=!walk;orbit.enabled=!walk;deckWalk=false;$('walk').classList.toggle('active',walk);$('walk-hint').hidden=!walk;if(walk){cameraTween=null;setView(currentView);toast('已进入安全步道 · W A S D 行走，拖动转向');}else{setView('overview');}}
function gangwayInfo(x,z){const a=GANGWAY.a,b=GANGWAY.b,dx=b[0]-a[0],dz=b[2]-a[2],u=((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz),t=clamp(u);return {t,inside:u>=-.025&&u<=1.025&&Math.hypot(x-mix(a[0],b[0],t),z-mix(a[2],b[2],t))<1.6};}
function allowedWalk(x,z){if(engine.stage===3&&engine.progress>.54&&engine.progress<.94&&x>-9&&x<3&&z>-53&&z<-8)return false;if(engine.stage===4&&engine.progress>.56&&engine.progress<.94&&x>-9&&x<3&&z>-122&&z<35)return false;return (x>=-116&&x<=-108&&z>=-182&&z<=264)||(x>=-308&&x<=-108&&z>=0&&z<=8)||(x>=-7&&x<=1&&z>=-178&&z<=162)||(x>=-116&&x<=280&&z>=152&&z<=162)||(x>=272&&x<=280&&z>=-174&&z<=162)||(engine.world().gangway&&gangwayInfo(x,z).inside);}
function walkFrame(dt){
  camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
  const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),speed=(keys.ShiftLeft?14:6)*dt;
  const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*side)*speed;
  if(deckWalk){const h=engine.world().ship.heading,ldx=Math.cos(h)*dx-Math.sin(h)*dz,ldz=Math.sin(h)*dx+Math.cos(h)*dz,raw=new THREE.Vector3(deckOffset.x+ldx,16.9,deckOffset.z+ldz);ship.root.localToWorld(raw);const exit=gangwayInfo(raw.x,raw.z);if(exit.inside&&exit.t<.995&&dx*(GANGWAY.b[0]-GANGWAY.a[0])+dz*(GANGWAY.b[2]-GANGWAY.a[2])<0){deckWalk=false;camera.position.set(raw.x,mix(GANGWAY.a[1],GANGWAY.b[1],exit.t)+1.9,raw.z);return;}
    const nz=clamp(deckOffset.z+ldz,-115,110),left=nz<-105?-26.8:nz<-70?-30:-35.2,right=nz<-105?26:28,nx=clamp(deckOffset.x+ldx,left,right),blocked=(x,z)=>x>15&&x<29&&z>11&&z<49;if(!blocked(nx,deckOffset.z))deckOffset.x=nx;if(!blocked(deckOffset.x,nz))deckOffset.z=nz;const pos=new THREE.Vector3(deckOffset.x,16.9,deckOffset.z);ship.root.localToWorld(pos);camera.position.copy(pos);return;}
  let x=camera.position.x,z=camera.position.z;if(allowedWalk(x+dx,z))x+=dx;if(allowedWalk(x,z+dz))z+=dz;const ramp=gangwayInfo(x,z),onRamp=engine.world().gangway&&ramp.inside;camera.position.set(x,onRamp?mix(GANGWAY.a[1],GANGWAY.b[1],ramp.t)+1.9:6.1,z);if(onRamp&&ramp.t>.995){deckWalk=true;const local=ship.root.worldToLocal(camera.position.clone());deckOffset={x:local.x,z:local.z};toast('已沿舷梯进入飞行甲板');}
}
function toggleCutaway(){cutaway=!cutaway;$('cutaway').classList.toggle('active',cutaway);$('cutaway').setAttribute('aria-pressed',String(cutaway));toast(cutaway?'B-07 及相邻外板已打开 · 可见肋骨、管路与托架':'外板已闭合');update(true);}
function toggleFollow(){if(engine.stage<2){toast('B-07 尚为配套板件 · 已前往加工车间');setView('workshop');return;}if(walk)toggleWalk();follow=!follow;currentView='follow';$('follow').classList.toggle('active',follow);cameraTween=null;document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));toast(follow?'镜头正在跟随 B-07':'已解除跟随');}
function togglePause(){engine.paused=!engine.paused;update(true);toast(engine.paused?'时间与施工作业已冻结 · 镜头仍可操作':'时间与施工作业已继续');}
function bindControls(){
  $('pause').onclick=togglePause;$('clock-auto').onchange=e=>engine.clockAuto=e.target.checked;$('clock-speed').onchange=e=>{engine.clockSpeed=+e.target.value;};$('daytime').oninput=e=>{engine.setTime(+e.target.value);update(true);if(engine.notice){toast(engine.notice);engine.notice='';}};
  $('build-speed').onchange=e=>engine.rate=+e.target.value;$('progress').oninput=e=>{engine.jump(engine.stage,+e.target.value);update(true);};
  $('autoplay').onclick=()=>{engine.auto=!engine.auto;if(engine.stage===7&&engine.progress===1&&engine.auto){engine.auto=false;toast('建造已交付 · 使用工序重播或回看历史阶段');}update(true);};
  $('replay').onclick=()=>{engine.replay();update(true);toast('工序已回到起点 · 白天作业窗口');};
  $('restart').onclick=()=>{engine.replay(true);$('help').close();setView('overview');update(true);};
  $('walk').onclick=toggleWalk;$('cutaway').onclick=toggleCutaway;$('follow').onclick=toggleFollow;
  $('deck').onclick=()=>{if(!engine.world().gangway){toast('舷梯尚未接通 · 请在码头舾装或交付系泊阶段登舰');return;}walk=true;deckWalk=true;follow=false;cameraTween=null;orbit.enabled=false;deckOffset={x:-2,z:-65};yaw=Math.PI;pitch=-.08;$('walk').classList.add('active');$('walk-hint').hidden=false;toast('已沿舷梯登舰 · 当前为开放甲板观察点');};
  $('story-toggle').onclick=()=>{if(innerWidth<=760){$('story').classList.toggle('expanded');$('story-toggle').textContent=$('story').classList.contains('expanded')?'−':'+';}else{$('story').classList.toggle('collapsed');$('story-toggle').textContent=$('story').classList.contains('collapsed')?'+':'−';}resize();};
  $('help-toggle').onclick=()=>$('help').showModal();$('help-close').onclick=()=>$('help').close();$('selection-close').onclick=()=>$('selection').hidden=true;
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  window.addEventListener('resize',resize);
  window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;keys[e.code]=true;if(e.code==='Space'){e.preventDefault();togglePause();}if(e.code==='KeyG')toggleWalk();if(e.code==='KeyC')toggleCutaway();if(e.code==='KeyF')toggleFollow();if(e.code==='KeyH')$('help').open?$('help').close():$('help').showModal();if(e.code==='Escape'){if($('help').open)$('help').close();$('selection').hidden=true;}const idx=Number(e.key)-1;if(idx>=0&&idx<6)setView(Object.keys(views)[idx]);});
  window.addEventListener('keyup',e=>delete keys[e.code]);window.addEventListener('blur',()=>{keys={};lastPointer=null;});
  renderer.domElement.addEventListener('pointerdown',e=>{lastPointer={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};if(walk)renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(walk&&lastPointer){yaw-=(e.clientX-lastPointer.x)*.004;pitch=clamp(pitch-(e.clientY-lastPointer.y)*.003,-1.2,1.1);lastPointer.x=e.clientX;lastPointer.y=e.clientY;}});
  renderer.domElement.addEventListener('pointerup',e=>{if(lastPointer&&Math.hypot(e.clientX-lastPointer.startX,e.clientY-lastPointer.startY)<6)pick(e);lastPointer=null;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();engine.paused=true;toast('图形上下文已暂停，请刷新页面恢复');});
}
function pick(e){mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(selectables,true).find(({object})=>{for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;});if(!hit)return;let obj=hit.object;while(obj&&!obj.userData.name)obj=obj.parent;if(!obj)return;$('selection').hidden=false;$('selected-id').textContent=obj.userData.id||'CV–08';$('selected-name').textContent=obj.userData.name;$('selected-process').textContent=obj.userData.id==='B-07'?engine.world().module.operation:STAGES[engine.stage].name;}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);panels=[...document.querySelectorAll('.panel')].filter(el=>!el.hidden).map(el=>el.getBoundingClientRect());cameraDirty=true;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function update(force=false){
  if(force){cameraDirty=true;if(sun)sun.shadow.needsUpdate=true;}
  const s=engine.world(),stage=STAGES[engine.stage],h=Math.floor(engine.time),min=Math.floor((engine.time-h)*60);
  $('clock-text').textContent=`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;$('day-text').textContent=`第 ${String(engine.day).padStart(2,'0')} 日`;$('day-icon').textContent=h>=6&&h<18?'☀':'☾';$('daytime').value=engine.time;
  $('shift-label').textContent=engine.paused?'全部暂停':engine.waiting?'等待作业窗口':s.shift.name;$('world-label').textContent=s.location==='dock'?'01 号船坞':s.location==='berth'?'02 号泊位':s.location==='sea'?'近海试航区':'拖带移泊中';
  $('pause').textContent=engine.paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',engine.paused?'继续全部':'暂停全部');$('story-index').textContent=`0${engine.stage+1} / 08`;$('story-title').textContent=stage.verb;$('story-detail').textContent=stage.detail;$('story-route').textContent=stage.area;
  $('carrier-text').textContent=`当前承载：${s.module.carrier}`;$('operation-text').textContent=s.shift.mode==='night'?`${s.module.carrier}承托 · 夜间待命`:engine.waiting?'待命 · 下一作业窗口继续':s.module.operation;
  document.querySelectorAll('.chain>span').forEach((el,i)=>el.classList.toggle('complete',engine.stage>=i-(i===4?1:0)));
  $('stage-title').textContent=stage.name;$('progress-text').textContent=`0${engine.stage+1} / 08`;$('stage-percent').textContent=`${Math.round(engine.progress*100)}%`;$('progress').value=engine.progress;$('progress').style.setProperty('--fill',`${engine.progress*100}%`);
  $('autoplay').innerHTML=`${icon(engine.auto?'pause':'play')}<span>${engine.auto?'工程顺播中':'播放工程'}</span>`;$('autoplay').setAttribute('aria-pressed',String(engine.auto));
  document.querySelectorAll('[data-stage]').forEach((b,i)=>{b.classList.toggle('active',i===engine.stage);b.classList.toggle('completed',i<engine.stage);b.setAttribute('aria-current',i===engine.stage?'step':'false');});
  $('task-caption').textContent=engine.paused?'已暂停 · 可自由观察':engine.waiting?'作息待命 · 可跳转至 08:00 复工':s.delivered?'海试完成 · 返港交付':s.stage===5?`坞水位 ${s.water.toFixed(1)} m · ${s.ship.y>0?'舰体起浮':'坞墩支承'}`:stage.area;
  $('deck').disabled=!s.gangway;
  if(engine.notice){toast(engine.notice);engine.notice='';}
}
let last=performance.now(),frameGate=0;
function animate(now){
  requestAnimationFrame(animate);if(now-frameGate<1000/60)return;frameGate=now-((now-frameGate)%(1000/60));const actualDT=(now-last)/1000,uiDT=Math.min(.3,actualDT),dt=Math.min(.065,actualDT);last=now;engine.tick(dt);
  if(cameraTween&&!walk){const tw=cameraTween;tw.t+=actualDT;const p=smooth(tw.t/1.25);camera.position.lerpVectors(tw.start,tw.end,p);orbit.target.lerpVectors(tw.ta,tw.tb,p);cameraDirty=true;if(p>=1)cameraTween=null;}
  const s=engine.world();updateWorld(s,uiDT);if(walk){walkFrame(uiDT);cameraDirty=true;}else orbit.update();
  const sig=`${engine.stage}/${engine.progress}/${engine.time}/${engine.elapsed}/${cutaway}`;
  if(!engine.paused||cameraDirty||sig!==worldSignature){renderer.render(scene,camera);cameraDirty=false;worldSignature=sig;frameCount++;}
  fpsTime+=actualDT;if(fpsTime>1){fps=Math.round(frameCount/fpsTime);frameCount=0;fpsTime=0;}
  if(now-lastUI>140){update();if(!engine.paused)sun.shadow.needsUpdate=true;lastUI=now;}
}
try{init();}catch(error){console.error(error);$('loading').innerHTML=`<div class="loading-mark">钢潮入海</div><p>无法初始化三维场景。请使用开启硬件加速的 Chrome 或 Edge。</p><pre>${String(error).replaceAll('<','&lt;')}</pre>`;}

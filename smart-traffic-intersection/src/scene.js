import { ROAD, CROSSWALKS, vehiclePose, pedestrianPose } from './geometry.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const palettes = ['#f8f8ec','#7f9ca5','#dda76d','#a8b9a0','#cf8580','#577c8a','#d9d7cc'];
const cache = new Map(), mats = new Map();
const material = (color, options={}) => { const key=color+JSON.stringify(options); if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.82,...options})); return mats.get(key); };
const boxGeo = (w,h,d,r=0) => { const k=[w,h,d,r].join();if(!cache.has(k))cache.set(k,r?new RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d));return cache.get(k); };
function box(parent,w,h,d,color,x=0,y=0,z=0,r=0) {const m=new THREE.Mesh(boxGeo(w,h,d,r),typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=h>.15;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,top,bottom,h,color,x,y,z,segments=12) {const k=`c${top},${bottom},${h},${segments}`;if(!cache.has(k))cache.set(k,new THREE.CylinderGeometry(top,bottom,h,segments));const m=new THREE.Mesh(cache.get(k),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function sphere(parent,r,color,x,y,z,sx=1,sy=1,sz=1) {const k=`s${r}`;if(!cache.has(k))cache.set(k,new THREE.IcosahedronGeometry(r,1));const m=new THREE.Mesh(cache.get(k),material(color));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
function mergeStatic(group) {
  group.updateMatrixWorld(true);const parts=new Map();
  group.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geo.index){const flat=geo.toNonIndexed();geo.dispose();geo=flat;}if(!parts.has(o.material))parts.set(o.material,[]);parts.get(o.material).push(geo);}});
  group.clear();parts.forEach((geos,mat)=>{const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(merged){const m=new THREE.Mesh(merged,mat);m.castShadow=true;m.receiveShadow=true;group.add(m);}});
}
export class TrafficScene {
  constructor(container, simulation) {
    this.container=container;this.sim=simulation;this.carMeshes=new Map();this.pedMeshes=new Map();this.labels=[];this.sensorsOn=true;this.labelsOn=true;this.cameraTarget=null;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e9efee');
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    container.prepend(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','可拖动旋转和滚轮缩放的三维十字路口');
    this.camera=new THREE.OrthographicCamera(-55,55,40,-40,.1,350);this.camera.position.set(64,67,76);this.camera.lookAt(0,2,0);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,2,0);this.controls.enableDamping=true;this.controls.dampingFactor=.065;this.controls.maxPolarAngle=Math.PI*.46;this.controls.minPolarAngle=.12;this.controls.minZoom=.65;this.controls.maxZoom=3;this.controls.enablePan=true;this.controls.maxTargetRadius=18;
    this.controls.addEventListener('start',()=>{this.cameraTarget=null;});
    this.scene.add(new THREE.HemisphereLight('#f6fbff','#a2af94',2.1));
    const sun=new THREE.DirectionalLight('#fff5df',2.6);sun.position.set(-30,60,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:150});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;sun.shadow.radius=3;this.scene.add(sun);
    const fill=new THREE.DirectionalLight('#d1e4ef',.6);fill.position.set(35,20,-30);this.scene.add(fill);
    this.world=new THREE.Group();this.scene.add(this.world);this.sensorGroup=new THREE.Group();this.scene.add(this.sensorGroup);this.signals=[];this.crosswalks=[];this.radarRings=[];this.pedSignals=[];
    this.createEnvironment();mergeStatic(this.world);this.createSensors();this.createSignals();this.createLabels();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('scene-loading').classList.remove('hidden');document.getElementById('scene-loading').textContent='三维上下文已暂停，请刷新页面恢复';});
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h);const half=w<550?43:39;this.camera.left=-half*w/h;this.camera.right=half*w/h;this.camera.top=half;this.camera.bottom=-half;this.camera.updateProjectionMatrix();}
  tree(x,z,size=1,type=0) {
    cylinder(this.world,.15,.23,2.2,'#9c8d73',x,1.2,z,7);
    if(type){cylinder(this.world,.1,1.3,4.3,'#84a58e',x,3.4,z,7);cylinder(this.world,0,1,3.1,'#9eb6a0',x,4.9,z,7);}
    else {sphere(this.world,1.5,'#8cac8c',x,3.4,z,size,1.05*size,size);sphere(this.world,1.1,'#a3bc91',x-.7,3.6,z+.6,size,size,size);sphere(this.world,.95,'#91b29b',x+.7,4,z-.1,size,size,size);}
    box(this.world,2.4,.12,2.4,'#b1c0ab',x,.16,z,.3);
  }
  building(x,z,w,d,h,color,style=0) {
    const g=this.world;box(g,w+.7,.5,d+.7,'#d0d4ca',x,.5,z,.2);box(g,w,h,d,color,x,h/2+.6,z,.25);
    box(g,w+.4,.4,d+.4,'#eeeede',x,h+.8,z,.1);box(g,w-1,.15,d-1,'#c4cdc3',x,h+1.05,z);
    const glass=style?'#829e9f':'#a0babf',frames=style?'#d7dacb':'#e6e9df';
    for(let row=0;row<Math.floor(h/2.7);row++)for(let col=0;col<Math.floor(w/2.1);col++) {
      const xx=x-w/2+1.2+col*2.1,yy=2.2+row*2.7;
      box(g,1.25,1.65,.08,glass,xx,yy,z+d/2+.04);box(g,1.45,.13,.17,frames,xx,yy-.85,z+d/2+.11);
    }
    for(let row=0;row<Math.floor(h/2.7);row++)for(let col=0;col<Math.floor(d/2.2);col++) {
      const zz=z-d/2+1.3+col*2.2,yy=2.2+row*2.7;
      box(g,.08,1.65,1.3,glass,x+w/2+.04,yy,zz);box(g,.15,.13,1.45,frames,x+w/2+.1,yy-.85,zz);
    }
    box(g,1.8,2.5,.14,'#6f8582',x,1.85,z+d/2+.1);
    for(let i=0;i<2;i++){box(g,1.7,.8,1.1,'#b7c2b8',x-w/4+i*w/2,h+1.4,z);box(g,1.3,.08,.8,'#9eafa3',x-w/4+i*w/2,h+1.83,z);}
    if(style===2){box(g,w*.8,.9,.13,'#b78062',x,3.2,z+d/2+.15);box(g,w*.75,.09,1.5,'#c28e69',x,3.7,z+d/2+.8);}
  }
  createEnvironment() {
    const g=this.world;
    box(g,84,2.2,84,'#d1d8ce',0,-1.2,0,.7);box(g,84,.22,84,'#c4d1be',0,-.02,0,.6);
    box(g,14,.12,84,'#596c72',0,.14,0);box(g,84,.13,14,'#596c72',0,.15,0);
    // Sidewalk blocks and continuous curbstones form the four street corners.
    for(const sx of [-1,1])for(const sz of [-1,1]) {
      box(g,34,.35,34,'#dce0d1',sx*25,.18,sz*25,.8);
      box(g,27,.2,27,'#b9caaa',sx*26,.43,sz*26,1.1);
      box(g,.42,.22,34,'#e4e7dd',sx*8.2,.42,sz*25,.1);box(g,34,.22,.42,'#e4e7dd',sx*25,.42,sz*8.2,.1);
      for(let v=12;v<40;v+=3){box(g,.035,.02,3.5,'#c4cdbd',sx*v,.37,sz*10.25);box(g,3.5,.02,.035,'#c4cdbd',sx*10.25,.37,sz*v);}
      box(g,2.4,.025,2.8,'#dacdaf',sx*10,.38,sz*12.1,.15);
    }
    // Lane paint, stop lines, zebra stripes and arrows.
    for(const offset of [-.14,.14]){box(g,.09,.025,28,'#d4bf82',offset,.23,-28);box(g,.09,.025,28,'#d4bf82',offset,.23,28);box(g,28,.025,.09,'#d4bf82',-28,.235,offset);box(g,28,.025,.09,'#d4bf82',28,.235,offset);}
    for(const sign of [-1,1])for(let p=16;p<41;p+=5.5) {
      box(g,.1,.025,2.6,'#d4d9cf',sign*4.8,.235,p);box(g,.1,.025,2.6,'#d4d9cf',sign*4.8,.235,-p);
      box(g,2.6,.025,.1,'#d4d9cf',p,.24,sign*4.8);box(g,2.6,.025,.1,'#d4d9cf',-p,.24,sign*4.8);
    }
    for(const sign of [-1,1]) {
      const stop=box(g,6.4,.035,.28,'#e2e4d6',-sign*3.5,.25,-sign*ROAD.stopLine);
      this.stopLines ??= [];this.stopLines.push({axis:'ns',x:stop.position.x,z:stop.position.z});
      const ewStop=box(g,.28,.035,6.4,'#e2e4d6',sign*ROAD.stopLine,.25,-sign*3.5);
      this.stopLines.push({axis:'ew',x:ewStop.position.x,z:ewStop.position.z});
      for(let n=0;n<12;n++){
        box(g,.65,.03,2.8,'#e4e6d8',-6.05+n*1.1,.26,sign*10.2,.03);
        box(g,2.8,.03,.65,'#e4e6d8',sign*10.2,.26,-6.05+n*1.1,.03);
      }
      const arrow=new THREE.Shape();arrow.moveTo(-.13,-1.3);arrow.lineTo(.13,-1.3);arrow.lineTo(.13,.6);arrow.lineTo(.65,.6);arrow.lineTo(0,1.5);arrow.lineTo(-.65,.6);arrow.lineTo(-.13,.6);arrow.closePath();
      for(const dir of ['N','S','E','W']){if(sign===-1)continue;const geo=new THREE.ShapeGeometry(arrow);geo.rotateX(-Math.PI/2);geo.rotateY(Math.PI);const m=new THREE.Mesh(geo,material('#dce0d2'));const {x,z,rot}=this.positionFor({dir,p:-22});m.position.set(x,.26,z);m.rotation.y=rot;g.add(m);}
    }
    // Distinct neighborhood corners keep the intersection readable from every angle.
    this.building(-29,-28,10,11,17,'#e5e9df');this.building(-18,-31,7,10,9.5,'#afc4bf',1);
    this.building(29,-29,13,10,10,'#e5d8bc',2);this.building(30,29,12,10,11.5,'#c7cabc',1);
    this.building(20,31,6,9,7.5,'#d6b99e',2);
    // Roof solar panels.
    for(let n=0;n<5;n++){const p=box(g,1.25,.12,3,'#69878c',26+n*1.7,11.3,-29);p.rotation.x=-.14;}
    // Small park with concentric fountain and perimeter paths.
    box(g,23,.04,2.6,'#dedfc8',-26,.57,23,.3);box(g,2.6,.04,24,'#dedfc8',-25,.58,27,.3);
    cylinder(g,4.7,4.7,.15,'#d7dccc',-25,.62,23,48);cylinder(g,3.4,3.5,.6,'#e3e6d8',-25,.88,23,48);cylinder(g,2.9,2.9,.04,'#8ebbb5',-25,1.2,23,48);cylinder(g,.7,1.1,1.1,'#d9e3d3',-25,1.65,23,20);cylinder(g,.36,.25,1.2,'#b6d4ca',-25,2.5,23,12);
    // Pavilion and café terrace.
    box(g,6,3.6,4.6,'#d5c6aa',-33,2.35,33,.2);box(g,7,.35,5.6,'#819b91',-33,4.4,33,.2);box(g,4.7,2.2,.1,'#8ba7a5',-33,2.5,35.35);
    for(const [x,z,s,t] of [[-14,-18,.85,0],[-13,-27,.9,1],[-35,-17,1.1,0],[-22,-16,1,0],[-35,-36,.8,1],[15,-17,.9,0],[20,-20,1,0],[36,-17,.9,1],[15,-32,.8,1],[15,17,1,0],[36,17,.9,0],[18,26,.8,1],[35,37,1,1],[-15,16,.9,0],[-16,34,1.1,0],[-34,15,1,0],[-37,26,.85,1],[-16,39,.85,1],[39,-36,.8,1]])this.tree(x,z,s,t);
    // Low hedges, planters, seats and tactile roadside details.
    for(const sx of [-1,1])for(const sz of [-1,1]) {
      for(let n=0;n<3;n++){box(g,2.2,.6,1.3,'#a0b48f',sx*(17+n*3),.9,sz*14,.4);}
      for(let n=0;n<2;n++) {
        const x=sx*(17+n*7),z=sz*10.4;box(g,2.8,.18,.85,'#af9e7e',x,1,z,.07);box(g,2.8,.7,.12,'#b4a385',x,1.5,z+sz*.45,.05);
        cylinder(g,.08,.08,.7,'#758780',x-1,.65,z,6);cylinder(g,.08,.08,.7,'#758780',x+1,.65,z,6);
      }
      cylinder(g,.3,.33,.9,'#87988a',sx*13,.85,sz*13,12);
    }
    // Bus shelter on the western approach.
    for(const x of [-31,-25]){cylinder(g,.08,.08,3.4,'#788c84',x,2,-9.8,8);}
    box(g,7,.22,2.4,'#96b0a3',-28,3.8,-10,.15);box(g,6,2.5,.1,'#bacdc3',-28,2.3,-10.8);box(g,4,.2,.7,'#9eaa91',-28,1,-10);
    // Street lights, camera masts and roadside push buttons.
    for(const [x,z] of [[-9,-19],[9,19],[-19,9],[19,-9]]) {
      cylinder(g,.11,.17,6.8,'#80938a',x,3.7,z,8);box(g,1.4,.17,.5,'#d4dece',x+.5,7.1,z,.1);
    }
    for(const [x,z] of [[-9.7,-13],[9.7,13],[-13,9.7],[13,-9.7]]){box(g,.16,1.5,.16,'#7a8c84',x,1.15,z);box(g,.32,.55,.25,'#d5b97e',x,1.65,z);box(g,.15,.15,.06,'#dce9d9',x,1.68,z+.15);}
    // Tiny road studs emphasize the physical island edge.
    for(let n=-39;n<40;n+=4)for(const s of [-1,1]){box(g,.12,.04,.12,'#cad0bd',s*7.25,.25,n);box(g,.12,.04,.12,'#cad0bd',n,.25,s*7.25);}
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(500,500),material('#e9efee'));plane.rotation.x=-Math.PI/2;plane.position.y=-2.4;plane.receiveShadow=true;g.add(plane);
  }
  positionFor(car){return vehiclePose(car);}
  createSensors(){
    const g=this.sensorGroup;const lineMat=new THREE.LineBasicMaterial({color:'#50acaa',transparent:true,opacity:.28,depthWrite:false});
    for(const rot of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      const sector=new THREE.Group();sector.rotation.y=rot;g.add(sector);
      const x=-2.4,z=-24;
      const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8.8,6.8,-13),new THREE.Vector3(-6.6,.4,-33),new THREE.Vector3(-.4,.4,-34),new THREE.Vector3(-8.8,6.8,-13),new THREE.Vector3(-.4,.4,-34),new THREE.Vector3(-.4,.4,-17)]);
      geo.setIndex([0,1,2,3,4,5]);geo.computeVertexNormals();
      const cone=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#7bc2bd',transparent:true,opacity:.095,side:THREE.DoubleSide,depthWrite:false}));sector.add(cone);
      const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.4,.32,-16),new THREE.Vector3(-.7,.32,-16),new THREE.Vector3(-.7,.32,-35),new THREE.Vector3(-6.4,.32,-35)]),lineMat);sector.add(outline);
      for(let n=0;n<3;n++){
        const ring=new THREE.Mesh(new THREE.RingGeometry(3,3.04,64),new THREE.MeshBasicMaterial({color:'#55aaa0',transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.33,z);ring.userData.phase=n/3;sector.add(ring);this.radarRings.push(ring);
      }
      const scan=box(sector,5.8,.015,.12,material('#63b4aa',{transparent:true,opacity:.45}),-3.6,.35,-24);this.radarRings.push(scan);scan.userData.scan=true;
    }
    for(const r of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      const group=new THREE.Group();group.rotation.y=r;g.add(group);
      const zone=new THREE.Mesh(new THREE.PlaneGeometry(3.4,4.2),new THREE.MeshBasicMaterial({color:'#bba7cd',transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.set(-9.8,.44,-10.3);group.add(zone);
      const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-11.5,.45,-12.4),new THREE.Vector3(-8.1,.45,-12.4),new THREE.Vector3(-8.1,.45,-8.2),new THREE.Vector3(-11.5,.45,-8.2)]),new THREE.LineDashedMaterial({color:'#a794bd',dashSize:.4,gapSize:.22,transparent:true,opacity:.5}));edge.computeLineDistances();group.add(edge);
    }
  }
  createSignals(){
    for(const [dir,rot,axis] of [['N',0,'ns'],['S',Math.PI,'ns'],['W',Math.PI/2,'ew'],['E',-Math.PI/2,'ew']]) {
      const g=new THREE.Group();g.rotation.y=rot;this.scene.add(g);
      cylinder(g,.12,.18,6.2,'#697d75',-8.9,3.5,-12.8,10);
      box(g,7,.15,.15,'#697d75',-5.45,6.55,-12.8,.04);
      box(g,1.3,.12,.2,'#697d75',-3.1,6.55,-12.8);
      box(g,.75,2.05,.55,'#364942',-2.4,5.6,-12.8,.14);
      const lamps=[];
      for(let n=0;n<3;n++){
        const lamp=new THREE.Mesh(new THREE.SphereGeometry(.21,12,8),material('#4b5c4d'));lamp.position.set(-2.4,6.22-n*.6,-13.1);lamp.scale.z=.5;g.add(lamp);lamps.push(lamp);
        box(g,.59,.09,.35,'#3d5047',-2.4,6.45-n*.6,-13.14,.03);
      }
      // Camera and its separate radar face, both visibly mounted on the mast.
      box(g,.7,.35,.9,'#e7eadf',-8.85,6.95,-13.25,.08);box(g,.47,.24,.12,'#4e7774',-8.85,6.95,-13.76,.03);box(g,.4,.3,.15,'#b8d0c0',-8.85,6.4,-12.98,.04);
      this.signals.push({dir,axis,lamps});
    }
    for(const cw of CROSSWALKS){
      const a=cw.id*Math.PI/2,group=new THREE.Group();group.rotation.y=-a;this.scene.add(group);
      const overlay=new THREE.Mesh(new THREE.PlaneGeometry(14.5,2.8),new THREE.MeshBasicMaterial({color:'#5ac791',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
      overlay.rotation.x=-Math.PI/2;overlay.position.set(0,.3,-ROAD.crossingOffset);overlay.userData.crosswalk=cw.id;
      group.add(overlay);this.crosswalks.push(overlay);
      for(const side of [-1,1]){
        const ped=new THREE.Group();ped.position.set(side*8.8,0,-ROAD.crossingOffset);ped.rotation.y=side<0?Math.PI/2:-Math.PI/2;group.add(ped);
        box(ped,.1,2.8,.1,'#7c9182',0,1.7,0);box(ped,.55,.85,.3,'#526a58',0,3.1,0,.08);
        const lamp=sphere(ped,.16,'#b99585',0,3.15,.18);lamp.scale.z=.3;
        this.pedSignals.push({crosswalk:cw.id,lamp});
      }
    }
  }

  createCar(car){
    const g=new THREE.Group();const color=palettes[car.color],v=car.type==='van';
    box(g,1.85,.65,3.6,color,0,.7,0,.22);box(g,1.62,v?1.15:.75,v?2.4:1.9,color,0,v?1.35:1.25,v?-.25:-.15,.2);
    // Distinct front, rear and side windows make heading legible.
    box(g,1.4,.5,.08,'#536e77',0,1.38,v?.98:.82,.05);box(g,1.4,.48,.08,'#71878a',0,1.38,v?-1.48:-1.15,.05);
    for(const sx of [-1,1]){box(g,.04,.45,1.4,'#6d858b',sx*.83,1.38,-.15,.03);box(g,.06,.48,.06,color,sx*.86,1.38,-.2);box(g,.12,.09,.38,'#d9ded7',sx*.95,.9,-.25,.03);}
    for(const sx of [-1,1])for(const z of [-1.12,1.12]){const wheel=cylinder(g,.36,.36,.19,'#3a4440',sx*.94,.49,z,12);wheel.rotation.z=Math.PI/2;const hub=cylinder(g,.19,.19,.2,'#aeb6ae',sx*.96,.49,z,10);hub.rotation.z=Math.PI/2;}
    for(const sx of [-1,1]){box(g,.45,.15,.09,'#fff4cb',sx*.59,.79,1.8,.04);box(g,.4,.13,.09,'#bb7e69',sx*.6,.82,-1.8,.03);}
    box(g,.7,.15,.05,'#d5ded3',0,.52,1.83);box(g,.5,.12,.05,'#d5ded3',0,.56,-1.83);
    mergeStatic(g);
    const frame=new THREE.LineSegments(this.trackingGeometry(),new THREE.LineBasicMaterial({color:'#55ab95',transparent:true,opacity:.42}));frame.position.y=.2;g.add(frame);g.userData.frame=frame;
    this.scene.add(g);return g;
  }
  trackingGeometry(){
    if(this.trackingGeo)return this.trackingGeo;
    const pts=[];for(const x of [-1.12,1.12])for(const z of [-2.1,2.1]){pts.push(x,.05,z,x-Math.sign(x)*.55,.05,z,x,.05,z,x,.05,z-Math.sign(z)*.6,x,.05,z,x,2.1,z,x,2.1,z,x-Math.sign(x)*.45,2.1,z,x,2.1,z,x,2.1,z-Math.sign(z)*.45);}
    this.trackingGeo=new THREE.BufferGeometry();this.trackingGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));return this.trackingGeo;
  }
  createPedestrian(p){
    const g=new THREE.Group();const shirt=['#c88c72','#7a9dae','#b3a57e','#899a7a'][p.id%4];
    cylinder(g,.2,.22,.7,shirt,0,1.3,0,8);sphere(g,.23,'#d6b296',0,1.95,0);sphere(g,.235,'#6b6455',0,2.05,-.03,1,.5,1);box(g,.18,.18,.18,'#d6b296',0,1.7,0,.05);
    g.userData.limbs=[];
    for(const s of [-1,1]){
      const leg=new THREE.Group();leg.position.set(s*.12,1,0);cylinder(leg,.09,.08,.72,'#526760',0,-.36,0,7);box(leg,.2,.12,.3,'#536258',0,-.76,.06,.04);g.add(leg);g.userData.limbs.push(leg);
      const arm=new THREE.Group();arm.position.set(s*.28,1.58,0);cylinder(arm,.07,.06,.65,shirt,0,-.3,0,7);sphere(arm,.08,'#d6b296',0,-.65,0);g.add(arm);g.userData.limbs.push(arm);
    }
    const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.69,32),new THREE.MeshBasicMaterial({color:'#a28abc',transparent:true,opacity:.7,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;g.add(ring);g.userData.ring=ring;
    this.scene.add(g);return g;
  }
  label(html,x,y,z,classes=''){
    const el=document.createElement('div');el.className=`scene-label ${classes}`;el.innerHTML=html;document.getElementById('scene-labels').append(el);this.labels.push({el,point:new THREE.Vector3(x,y,z)});return el;
  }
  createLabels(){
    this.nsLabel=this.label('<i></i>南北感知 <b>8 辆</b>',-3,2,-25);
    this.ewLabel=this.label('<i></i>东西感知 <b>6 辆</b>',25,2,-2);
    this.crosswalkLabels=CROSSWALKS.map(cw=>{
      const a=cw.id*Math.PI/2,x=-12.6,z=-10.2;
      const el=this.label(`<i></i>${cw.name}人行 · 红灯`,x*Math.cos(a)-z*Math.sin(a),2.5,x*Math.sin(a)+z*Math.cos(a),'purple-label crosswalk-label');
      el.dataset.crosswalk=cw.id;return el;
    });
    this.label('梧 桐 路',-2,.5,34,'road-label');this.label('云 杉 大 道',-32,.5,1,'road-label');
    this.phaseLabel=this.label('<i></i>南北方向通行',0,3,0);
  }
  view(mode){this.cameraTarget=mode==='top'?{pos:new THREE.Vector3(0,110,.1),target:new THREE.Vector3(0,2,0)}:{pos:new THREE.Vector3(64,67,76),target:new THREE.Vector3(0,2,0)};this.camera.zoom=1;this.camera.updateProjectionMatrix();}
  setSensors(on){this.sensorsOn=on;this.sensorGroup.visible=on;}
  setLabels(on){this.labelsOn=on;document.getElementById('scene-labels').style.opacity=on?'1':'0';}
  update(dt){
    const sim=this.sim,time=sim.time;
    if(this.cameraTarget){this.camera.position.lerp(this.cameraTarget.pos,.075);this.controls.target.lerp(this.cameraTarget.target,.075);if(this.camera.position.distanceTo(this.cameraTarget.pos)<.1)this.cameraTarget=null;}
    this.controls.update();
    const current=new Set(sim.cars.map(c=>c.id));this.carMeshes.forEach((m,id)=>{if(!current.has(id)){this.scene.remove(m);m.traverse(o=>{if(o.isMesh)o.geometry.dispose();if(o.isLineSegments)o.material.dispose();});this.carMeshes.delete(id);}});
    for(const c of sim.cars){let mesh=this.carMeshes.get(c.id);if(!mesh){mesh=this.createCar(c);this.carMeshes.set(c.id,mesh);}const {x,z,rot}=this.positionFor(c);mesh.position.set(x,.15,z);mesh.rotation.y=rot;mesh.visible=Math.abs(x)<42 && Math.abs(z)<42;mesh.userData.frame.visible=this.sensorsOn;}
    const pids=new Set(sim.pedestrians.map(p=>p.id));this.pedMeshes.forEach((m,id)=>{if(!pids.has(id)){this.scene.remove(m);m.userData.ring.geometry.dispose();m.userData.ring.material.dispose();this.pedMeshes.delete(id);}});
    for(const p of sim.pedestrians){
      let mesh=this.pedMeshes.get(p.id);if(!mesh){mesh=this.createPedestrian(p);this.pedMeshes.set(p.id,mesh);}
      const {x,z,rot}=pedestrianPose(p,time);mesh.position.set(x,.42,z);mesh.rotation.y=rot;
      const walking=p.state==='crossing'||p.state==='approach'||p.state==='done';
      mesh.userData.limbs.forEach((limb,n)=>{limb.rotation.x=walking?Math.sin(time*8+p.id)*(n<2?1:-1)*.4:0;});mesh.userData.ring.visible=this.sensorsOn;
    }
    const colors=['#de775f','#e7be61','#68c293'];
    this.signals.forEach(s=>{const state=sim.signal(s.axis),active=state==='red'?0:state==='yellow'?1:2;s.lamps.forEach((l,i)=>{l.material=i===active?material(colors[i],{emissive:colors[i],emissiveIntensity:.75,roughness:.4}):material('#43584a');});});
    this.pedSignals.forEach(({crosswalk,lamp})=>{
      const state=sim.crosswalkSignal(crosswalk),lit=state==='walk'||state==='clearance'&&Math.sin(time*8)>0;
      const color=state==='red'?'#cc8876':lit?'#6bc79a':'#43584a';lamp.material=material(color,{emissive:color,emissiveIntensity:lit?.6:.2});
      lamp.userData.signal=state;
    });
    this.crosswalks.forEach(m=>{
      const state=sim.crosswalkSignal(m.userData.crosswalk);
      m.material.opacity=state==='walk'?.3+(Math.sin(time*4)+1)*.04:state==='clearance'?.1+(Math.sin(time*8)+1)*.04:0;
      m.userData.signal=state;
    });
    this.crosswalkLabels.forEach((el,id)=>{
      const state=sim.crosswalkSignal(id),waiting=sim.pedestrians.filter(p=>p.crosswalk===id&&(p.state==='waiting'||p.state==='approach')).length;
      const status=state==='walk'?`可通行 ${sim.pedClock.text}`:state==='clearance'?`禁止进入 · ${sim.pedClock.text}`:waiting?`${waiting} 人等待`:'红灯等待';
      el.innerHTML=`<i></i>${CROSSWALKS[id].name}人行 <b>${status}</b>`;el.dataset.signal=state;el.classList.toggle('walk-label',state!=='red');
    });
    this.radarRings.forEach(r=>{if(r.userData.scan){r.position.z=-17-(time*3%17);}else{const phase=(time*.22+r.userData.phase)%1;r.scale.setScalar(.3+phase*1.3);r.material.opacity=(1-phase)*.2;}});
    this.nsLabel.innerHTML=`<i></i>南北感知 <b>${sim.metrics('ns').count} 辆</b>`;this.ewLabel.innerHTML=`<i></i>东西感知 <b>${sim.metrics('ew').count} 辆</b>`;
    this.phaseLabel.innerHTML=`<i></i>${sim.phaseLabel} <b>${sim.signalClock.text}</b>`;
    this.labels.forEach(l=>{const p=l.point.clone().project(this.camera);l.el.style.left=`${(p.x*.5+.5)*this.container.clientWidth}px`;l.el.style.top=`${(-p.y*.5+.5)*this.container.clientHeight}px`;l.el.style.display=Math.abs(p.x)>1.08||Math.abs(p.y)>1.08?'none':'flex';});
    this.renderer.render(this.scene,this.camera);
  }
}

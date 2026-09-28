import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createHeatPump } from './heatpump.js';
import { createPlumbing } from './plumbing.js';

const TAU = Math.PI * 2;
export function createMaterials() {
  const standard = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  return {
    shell: standard('#a8afae', .72, .3),
    steel: standard('#aab4b8', .92, .25),
    aluminum: standard('#cbd2d1', .83, .3),
    chrome: standard('#ece9e0', 1, .13),
    dark: standard('#20282c', .68, .3),
    graphite: standard('#454d50', .3, .48),
    rubber: standard('#242a2b', .02, .85),
    copper: standard('#c6814e', .85, .24),
    brass: standard('#b99b68', .82, .27),
    teal: standard('#86c9c0', .55, .28, { emissive: '#366e62', emissiveIntensity: .35 }),
    pcb: standard('#163b32', .22, .55),
    glass: new THREE.MeshPhysicalMaterial({ color: '#59747b', metalness: .12, roughness: .09, transmission: .25, transparent: true, opacity: .48, thickness: .16, clearcoat: 1, ior: 1.48, side: THREE.DoubleSide, depthWrite: false }),
  };
}

function mesh(group, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; group.add(object); return object;
}
const box = (g, w, h, d, m, x=0, y=0, z=0, r=.025) => mesh(g, new RoundedBoxGeometry(w, h, d, 2, Math.min(r,w/3,h/3,d/3)), m, x,y,z);
function cyl(g,r,h,m,x=0,y=0,z=0,axis='z',n=72){ const o=mesh(g,new THREE.CylinderGeometry(r,r,h,n,1,false),m,x,y,z); if(axis==='z') o.rotation.x=Math.PI/2; return o; }
const ring=(g,r,t,m,x=0,y=0,z=0)=>mesh(g,new THREE.TorusGeometry(r,t,12,112),m,x,y,z);
function tube(g, points, radius, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(g,new THREE.TubeGeometry(curve,Math.max(24,points.length*10),radius,8,false),mat);
}
function strut(g,a,b,r,mat) {
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b), delta=vb.clone().sub(va);
  const o=mesh(g,new THREE.CylinderGeometry(r,r,delta.length(),12),mat); o.position.copy(va.add(vb).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return o;
}
function bolts(g, points, mat, r=.024) {
  const geo=new THREE.CylinderGeometry(r,r,.021,6); geo.rotateX(Math.PI/2);
  const inst=new THREE.InstancedMesh(geo,mat,points.length); const matrix=new THREE.Matrix4();
  points.forEach((p,i)=>{matrix.makeTranslation(...p); inst.setMatrixAt(i,matrix);});
  inst.castShadow=true; g.add(inst); return inst;
}
function ringBolts(g, radius, z, count, mat, centerY=0) {
  return bolts(g,Array.from({length:count},(_,i)=>[Math.sin(i/count*TAU)*radius,centerY+Math.cos(i/count*TAU)*radius,z]),mat);
}
function canvasTexture(width,height,draw){ const c=document.createElement('canvas'); c.width=width;c.height=height;draw(c.getContext('2d'),width,height); const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

function fasciaShape(w,h,r,holeRadius=0,holes=[]) {
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  if(holeRadius){const hole=new THREE.Path();hole.absarc(0,0,holeRadius,0,TAU,true);s.holes.push(hole);}
  for(const [hx,hy,hr] of holes){const hole=new THREE.Path();hole.absarc(hx,hy,hr,0,TAU,true);s.holes.push(hole);}
  return new THREE.ExtrudeGeometry(s,{depth:.068,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:64});
}

export function createWasher(materials=createMaterials()) {
  const root=new THREE.Group(); root.name='ORBIT / HP–01';
  const parts=[];
  function part(id,name,base,offset,category='internal'){
    const group=new THREE.Group();group.name=name;group.position.set(...base);group.userData.partId=id;root.add(group);
    const p={id,group,base:new THREE.Vector3(...base),offset:new THREE.Vector3(...offset),category};parts.push(p);return group;
  }
  const m=materials;

  // Folded steel chassis with open rail construction, leveling feet and fasteners.
  const chassis=part('cabinet','Reinforced base chassis',[0,.17,0],[0,-.13,0],'base');
  box(chassis,2.36,.13,2.42,m.dark);box(chassis,2.3,.09,.12,m.steel,0,.08,1.13);box(chassis,2.3,.09,.12,m.steel,0,.08,-1.13);
  for(const x of [-1.02,1.02]){box(chassis,.12,.12,2.25,m.steel,x,.08,0);for(const z of [-1,1]){cyl(chassis,.12,.09,m.rubber,x,-.10,z,'y',32);cyl(chassis,.05,.11,m.steel,x,-.045,z,'y',24);}}
  for(const x of [-.72,.72])box(chassis,.065,.04,2.2,m.aluminum,x,.12,0);

  const rear=part('cabinet','Rear service panel',[0,1.78,-1.22],[0,0,-3.1],'shell');
  mesh(rear,fasciaShape(2.4,3.08,.035,0,[[-.78,1.13,.088],[.91,-1.18,.084]]),m.graphite,0,0,-.035);
  ring(rear,.89,.012,m.steel,0,-.22,.053);
  for(let i=0;i<8;i++)box(rear,.9,.018,.04,m.rubber,.48,1.05-i*.064,.06);
  bolts(rear,[[-1.06,1.4,.06],[1.06,1.4,.06],[-1.06,-1.4,.06],[1.06,-1.4,.06]],m.steel);

  for(const side of [-1,1]){
    const panel=part('cabinet',side===1?'Right folded side panel':'Left folded side panel',[side*1.19,1.77,0],[side*1.32,0,0],'shell');
    box(panel,.072,3.1,2.43,m.shell);
    for(const z of [-1.16,1.16])box(panel,.12,3.02,.06,m.steel,-side*.02,0,z);
    for(const y of [-.96,-.56,-.16,.24,.64]){
      box(panel,.026,.09,1.58,m.aluminum,side*.039,y,-.04,.03);
      box(panel,.019,.018,1.47,m.graphite,side*.054,y+.037,-.04,.008);
    }
    for(const y of [-1.39,1.39])for(const z of [-1.08,1.08]){
      const screw=cyl(panel,.027,.02,m.chrome,side*.05,y,z,'y',6);screw.rotation.z=Math.PI/2;
    }
  }

  const top=part('cabinet','Removable top cover',[0,3.36,0],[0,1.58,-.46],'shell');
  box(top,2.47,.11,2.55,m.shell,0,0,0,.05);box(top,2.31,.035,2.36,m.dark,0,-.064,0);
  box(top,2.39,.135,.065,m.shell,0,-.112,1.23,.015);
  for(const x of [-1.06,1.06])box(top,.04,.05,2.1,m.aluminum,x,-.09,0);

  const front=part('cabinet','Front aperture panel',[0,1.49,1.225],[0,0,1.33],'front');
  mesh(front,fasciaShape(2.4,2.45,.07,.963),m.shell);
  ring(front,.971,.019,m.chrome,0,0,.077);
  box(front,2.37,.19,.1,m.dark,0,-1.1,-.03);
  for(let i=0;i<24;i++)box(front,.047,.053,.018,m.rubber,-.98+i*.08,-1.095,.036,.005);
  cyl(front,.105,.016,m.graphite,.88,-1.083,.06);box(front,.073,.009,.008,m.steel,.88,-1.083,.072,.001);
  box(front,.13,.28,.05,m.dark,.98,.0,-.06);bolts(front,[[.98,.1,-.023],[.98,-.1,-.023]],m.steel,.016);

  // Porthole assembled from frame, bright retaining rings, dished glass and a concealed hinge.
  const door=part('door','Layered porthole',[0,1.49,1.41],[0,0,2.67]);
  ring(door,.907,.081,m.dark);ring(door,.958,.031,m.chrome,0,0,.01);ring(door,.84,.036,m.graphite,0,0,.02);
  ring(door,.785,.017,m.chrome,0,0,-.015);ring(door,.895,.007,m.brass,0,0,.081);
  const glassGeo=new THREE.SphereGeometry(.832,80,40,0,TAU,0,Math.PI/2);glassGeo.rotateX(Math.PI/2);glassGeo.scale(1,1,.28);
  mesh(door,glassGeo,m.glass,0,0,.04);
  ring(door,.79,.022,m.rubber,0,0,-.07);
  box(door,.13,.42,.15,m.steel,-.89,0,-.12,.04);for(const y of [-.13,.13])cyl(door,.045,.2,m.chrome,-.92,y,-.12,'y',24);
  box(door,.10,.31,.075,m.dark,.86,.02,.045,.035);ringBolts(door,.86,-.085,10,m.steel);

  const gasket=part('gasket','Bellows and front retainer',[0,1.49,1.13],[0,0,1.00]);
  for(let i=0;i<5;i++)ring(gasket,.85+i*.016,.026,m.rubber,0,0,-i*.044);
  ring(gasket,.925,.012,m.steel,0,0,-.19);ring(gasket,.852,.009,m.steel,0,0,.026);

  // Outer tub built as two circumferential shells so cutaway can remove the near-side sector.
  const tub=part('tub','Ribbed outer tub',[0,1.49,-.08],[0,0,-.38]);
  const tubMat=m.graphite.clone();tubMat.side=THREE.DoubleSide;
  for(let i=0;i<2;i++){
    const geo=new THREE.CylinderGeometry(.975,.975,1.83,100,1,true,i*Math.PI,Math.PI);
    geo.rotateX(Math.PI/2);
    const shell=mesh(tub,geo,tubMat);shell.name=i===0?'tub-near':'tub-far';shell.userData.cutawayHide=i===0;
  }
  cyl(tub,.975,.065,m.graphite,0,0,-.944);
  for(const z of [-.91,-.65,-.25,.2,.65,.91])ring(tub,.979,.025,m.dark,0,0,z);
  ring(tub,1.005,.026,m.aluminum,0,0,.0);ringBolts(tub,1.01,.045,24,m.steel);
  for(let i=0;i<16;i++){
    const angle=i/16*TAU;const rib=box(tub,.045,.063,1.78,m.graphite,Math.sin(angle)*.984,Math.cos(angle)*.984,0,.01);rib.rotation.z=-angle;
  }
  // Rear bearing boss and radial cast spokes.
  cyl(tub,.24,.19,m.dark,0,0,-1.04);cyl(tub,.13,.23,m.steel,0,0,-1.09);
  for(let i=0;i<6;i++){const a=i/6*TAU;strut(tub,[Math.sin(a)*.22,Math.cos(a)*.22,-.99],[Math.sin(a)*.85,Math.cos(a)*.85,-.96],.038,m.dark);}

  const drum=part('drum','Perforated stainless inner drum',[0,1.49,.03],[0,0,.66]);
  const perforation=canvasTexture(64,64,(ctx)=>{ctx.fillStyle='white';ctx.fillRect(0,0,64,64);for(const [x,y] of [[16,16],[48,48]]){ctx.fillStyle='#777';ctx.beginPath();ctx.arc(x,y,7.1,0,TAU);ctx.fill();ctx.fillStyle='black';ctx.beginPath();ctx.arc(x,y,5.9,0,TAU);ctx.fill();}});
  perforation.colorSpace=THREE.NoColorSpace;perforation.wrapS=perforation.wrapT=THREE.RepeatWrapping;perforation.repeat.set(42,13);perforation.anisotropy=8;
  const drumMat=m.steel.clone();drumMat.alphaMap=perforation;drumMat.alphaTest=.55;drumMat.side=THREE.DoubleSide;drumMat.roughness=.3;
  const drumGeo=new THREE.CylinderGeometry(.827,.827,1.57,160,1,true);drumGeo.rotateX(Math.PI/2);mesh(drum,drumGeo,drumMat);
  const spin=new THREE.Group();spin.name='drum-rotating-detail';drum.add(spin);
  cyl(spin,.828,.027,m.steel,0,0,-.798);
  for(const r of [.21,.42,.66,.806])ring(spin,r,.018,m.chrome,0,0,-.777);
  cyl(spin,.135,.07,m.chrome,0,0,-.753);
  ring(drum,.833,.031,m.chrome,0,0,.79);ring(drum,.846,.012,m.aluminum,0,0,.72);ring(drum,.833,.028,m.chrome,0,0,-.79);
  for(let i=0;i<3;i++){
    const a=i/3*TAU;const paddle=box(spin,.18,.12,1.25,m.aluminum,Math.sin(a)*.755,Math.cos(a)*.755,0,.05);paddle.rotation.z=-a;
    for(let j=0;j<8;j++){const slit=box(spin,.037,.009,.055,m.dark,Math.sin(a)*.686,Math.cos(a)*.686,-.49+j*.14,.006);slit.rotation.z=-a;}
    const spoke=box(spin,.09,.59,.032,m.aluminum,Math.sin(a)*.39,Math.cos(a)*.39,-.773,.025);spoke.rotation.z=-a;
  }
  ringBolts(spin,.19,-.706,6,m.dark,.0);

  const motor=part('motor','Direct-drive motor',[0,1.49,-1.10],[0,0,-1.82]);
  cyl(motor,.64,.12,m.dark);ring(motor,.61,.019,m.aluminum,0,0,.07);ring(motor,.28,.047,m.steel,0,0,.077);
  const coils=new THREE.InstancedMesh(new THREE.TorusGeometry(.048,.011,6,28),m.copper,150);const coilTransform=new THREE.Object3D();coils.castShadow=true;motor.add(coils);
  for(let i=0;i<30;i++){
    const a=i/30*TAU;
    const tooth=box(motor,.062,.16,.12,m.steel,Math.sin(a)*.455,Math.cos(a)*.455,.085,.013);tooth.rotation.z=-a;
    for(let j=0;j<5;j++){
      coilTransform.position.set(Math.sin(a)*(.405+j*.022),Math.cos(a)*(.405+j*.022),.117);coilTransform.scale.set(.6,1,1);coilTransform.rotation.z=-a;coilTransform.updateMatrix();coils.setMatrixAt(i*5+j,coilTransform.matrix);
    }
  }
  ring(motor,.645,.04,m.graphite,0,0,-.07);cyl(motor,.13,.22,m.chrome,0,0,.11);ringBolts(motor,.22,.135,6,m.steel);
  tube(motor,[[.5,-.1,.0],[.7,-.15,.0],[.73,-.46,.0]],.017,m.copper);

  const suspension=part('suspension','Suspension and counterweights',[0,0,0],[-.12,-.05,-.1]);
  for(const side of [-1,1]){
    const points=[];for(let i=0;i<=128;i++){const t=i/128;points.push([side*.88+.052*Math.cos(t*TAU*11),2.32+t*.77,.17+.052*Math.sin(t*TAU*11)]);}
    tube(suspension,points,.014,m.steel);box(suspension,.22,.045,.26,m.dark,side*.89,3.12,.17);
    strut(suspension,[side*.92,.31,.53],[side*.7,.78,.42],.055,m.dark);strut(suspension,[side*.7,.78,.42],[side*.54,1.05,.35],.027,m.chrome);
    for(const z of [-.38,.53])box(suspension,.15,.11,.17,m.graphite,side*.92,.34,z);
  }
  const concrete=new THREE.MeshStandardMaterial({color:'#93968d',roughness:.97,metalness:0});
  for(const side of [-1,1]){const weight=box(suspension,.28,.77,.30,concrete,side*.87,1.53,.64,.10);weight.rotation.z=side*-.12;bolts(suspension,[[side*.88,1.33,.80],[side*.86,1.76,.80]],m.steel,.037);}

  const hp=part('heatpump','Heat-pump refrigeration assembly',[0,2.94,-.07],[.05,1.01,-.3]);
  hp.add(createHeatPump(THREE,m));

  const control=part('control','Control fascia and detergent dosing',[0,2.94,1.24],[0,.4,1.02]);
  box(control,2.4,.47,.12,m.dark,0,0,0,.05);
  const screenTexture=canvasTexture(1024,256,(ctx,w,h)=>{
    ctx.fillStyle='#131b1f';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#e3e6df';ctx.font='500 54px Segoe UI';ctx.fillText('ORBIT',36,68);
    ctx.fillStyle='#9dadaf';ctx.font='18px Segoe UI';ctx.fillText('HEAT PUMP · CARE SYSTEM',38,105);
    ctx.fillStyle='#e0e8e4';ctx.font='300 108px Segoe UI';ctx.fillText('1:28',655,142);
    ctx.fillStyle='#96b7b1';ctx.font='21px Segoe UI';ctx.fillText('40°    1200    AUTO',675,198);
    ctx.fillStyle='#778881';ctx.font='21px Segoe UI';ctx.fillText('WASH + DRY',38,207);
  });
  const face=new THREE.MeshBasicMaterial({map:screenTexture});mesh(control,new THREE.PlaneGeometry(2.27,.41),face,0,0,.068);
  cyl(control,.145,.092,m.chrome,.12,.01,.12);cyl(control,.122,.097,m.dark,.12,.01,.13);box(control,.009,.036,.01,m.brass,.12,.1,.185,.002);
  box(control,.82,.018,.01,m.graphite,-.67,-.06,.079,.002);
  box(control,.66,.31,.65,m.aluminum,-.71,0,-.38);box(control,.6,.26,.58,m.rubber,-.71,.045,-.37);
  for(const x of [-.82,-.6])box(control,.018,.19,.52,m.aluminum,x,.08,-.37);
  const pcb=box(control,1.24,.30,.035,m.pcb,.38,-.02,-.115,.018);
  for(let i=0;i<9;i++)box(control,.07,.055,.048,m.dark,-.15+i*.127,-.02,-.157,.005);
  for(let i=0;i<7;i++)cyl(control,.026,.071,m.aluminum,-.12+i*.17,.086,-.17,'z',12);

  const pump=part('pump','Sump drain pump and hoses',[0,.42,.51],[-.35,-.13,.55]);
  cyl(pump,.175,.23,m.dark,.52,0,.27);cyl(pump,.13,.27,m.graphite,.52,0,.28);cyl(pump,.10,.05,m.aluminum,.52,0,.43);
  box(pump,.38,.15,.27,m.dark,.52,-.10,.05);box(pump,.22,.16,.23,m.pcb,.52,.04,-.06);
  tube(pump,[[0,.19,-.18],[.1,.08,-.2],[.36,.01,.05],[.52,.01,.10]],.057,m.rubber);
  for(let i=0;i<7;i++)ring(pump,.06,.008,m.dark,.20+i*.04,.07,-.11+i*.04);

  // Insulated air ducts: a rear return riser and a separate warm-air supply to the front tub.
  const ducts=part('heatpump','Air circulation and condensation drain',[0,0,0],[.2,.25,-.25]);
  tube(ducts,[[.74,1.95,-.79],[.91,2.18,-.91],[.91,2.61,-.9],[.67,2.72,-.61]],.105,m.dark);
  tube(ducts,[[-.82,2.81,.63],[-.95,2.72,.86],[-.75,2.45,.94],[-.47,2.19,.91]],.10,m.graphite);
  tube(ducts,[[-.60,2.71,-.25],[-1.02,2.47,-.62],[-1.02,.71,-.66],[-.15,.48,.23]],.014,m.teal);
  const plumbing=createPlumbing(THREE,m,part,parts);
  root.traverse(o=>{if(o.isMesh){o.userData.originalMaterial=o.material;}});
  return {root,parts,materials:m,spin,plumbing,anchors:{door:new THREE.Vector3(-.75,1.5,1.5),drum:new THREE.Vector3(.7,1.8,.4),heatpump:new THREE.Vector3(.8,3.12,.3),motor:new THREE.Vector3(.4,1.6,-1.2),control:new THREE.Vector3(0,2.94,1.3),cabinet:new THREE.Vector3(1.2,1.7,0)}};
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// A hand-built miniature: all decoration is geometry, no network assets.
export function createCampus(scene) {
  const root = new THREE.Group(); root.name = 'Sunny Side Campus'; scene.add(root);
  const C = { cream: '#fff3d8', white: '#fffdf0', yellow: '#f4c95e', mint: '#83bfa7', green: '#7da977', darkGreen: '#3c8068', coral: '#e9987c', rose: '#db7f77', blue: '#8ebfc9', navy: '#41686f', wood: '#be9060', sand: '#edcf91', ground: '#a8c18b', ink: '#4e6560' };
  const materials = new Map();
  const mat = color => { const c = C[color] || color; if (!materials.has(c)) materials.set(c, new THREE.MeshStandardMaterial({ color:c, roughness:.83 })); return materials.get(c); };
  const boxGeo = new RoundedBoxGeometry(1,1,1,2,.09);
  const sphereGeo = new THREE.IcosahedronGeometry(1,1);
  const cylGeo = new THREE.CylinderGeometry(1,1,1,12);
  function mesh(geo, color, x,y,z,sx=1,sy=1,sz=1,parent=root) { const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const box=(x,y,z,w,h,d,c,p=root)=>mesh(boxGeo,c,x,y,z,w,h,d,p);
  const ball=(x,y,z,r,c,p=root)=>mesh(sphereGeo,c,x,y,z,r,r,r,p);
  const cylinder=(x,y,z,r,h,c,p=root)=>mesh(cylGeo,c,x,y,z,r,h,r,p);
  function beam(a,b,r,c,p=root) { const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b); const m=cylinder(...av.clone().add(bv).multiplyScalar(.5).toArray(),r,av.distanceTo(bv),c,p); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize()); return m; }
  function line(points,color,r=.035,closed=false,parent=root) { const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed); const m=mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*3),r,5,closed),color,0,0,0,1,1,1,parent); return m; }
  function ellipse(cx,cz,rx,rz,y,color,r=.035) { return line(Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2;return [cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz];}),color,r,true); }
  function sign(text,sub,x,y,z,w,h,color='cream') {
    box(x,y,z,w,h,.12,color);
    if (typeof document === 'undefined') return;
    const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d'); if(!ctx)return;
    ctx.fillStyle=C.ink; ctx.textAlign='center'; ctx.textBaseline='middle';ctx.font='bold 74px "Microsoft YaHei",sans-serif';ctx.fillText(text,512,sub?97:128);
    if(sub){ctx.font='500 28px sans-serif';ctx.fillText(sub,512,177);}
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const face=new THREE.Mesh(new THREE.PlaneGeometry(w*.94,h*.94),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));face.position.set(x,y,z+.071);root.add(face);
  }

  // Thick bevelled display plinth, inset grass, and a clean strolling path.
  box(0,-.75,0,40,1.5,30,'cream'); box(0,-.085,0,39.3,.2,29.3,'ground');
  box(0,.035,11.2,34,.09,3.3,'#e6d3ac');
  box(.1,.045,4,3.4,.1,13.1,'#e6d3ac');
  for(let i=0;i<7;i++)box(-5.4+i*1.55,.09,-3.4,1.3,.1,1.35,'cream');
  for(let i=0;i<8;i++)box(-17.25,.06,-9+i*2.4,1.4,.09,1.8,'#e6d3ac');

  // A generous open-front two-storey school, with warm, visible interiors.
  box(0,.16,-8.5,25,.35,8,'cream');
  box(0,4.03,-8.5,24.7,.34,7.5,'cream');
  box(0,8.03,-8.5,24.7,.36,7.5,'cream');
  box(0,4.1,-12.05,24.1,8.1,.28,'cream');
  box(-12,4.1,-8.5,.3,8.1,7.4,'yellow');
  box(12,4.1,-8.5,.3,8.1,7.4,'mint');
  [-4,4].forEach(x=>{box(x,2.05,-8.5,.19,3.75,6.8,'cream');box(x,6.12,-8.5,.19,3.78,6.8,'cream');});
  for(const x of [-11.7,-4,4,11.7])box(x,4.12,-4.95,.36,8.2,.38,x<0?'yellow':'mint');
  box(0,4.19,-4.92,24.7,.22,.45,'coral');
  box(0,.49,-4.84,24.7,.48,.48,'coral');
  box(0,7.87,-4.92,24.7,.32,.48,'yellow');
  const glass=new THREE.MeshPhysicalMaterial({color:'#d9faf3',transparent:true,opacity:.10,roughness:.12,metalness:.05,depthWrite:false});
  for(const floor of [0,4.2])for(const x of [-8,0,8]) {
    box(x,floor+2.04,-5.05,7.25,3.35,.025,glass);
    box(x,floor+3.76,-5.02,7.45,.12,.15,'cream');
    // Fine vertical frames leave the interior legible like an architectural model.
    for(const dx of [-3.55,3.55])box(x+dx,floor+2.05,-5.03,.09,3.4,.11,'white');
    box(x,floor+.3,-8.5,7.4,.09,6.7,floor===0?'#eddbb4':'#f0dcae');
  }
  // Petite candy-striped canopies sit above the glazing, leaving rooms open.
  for(const y of [3.62,7.66])for(const x of [-8,0,8]) {
    for(let stripe=0;stripe<12;stripe++) {
      const color=stripe%2?'cream':(x<0?'coral':x>0?'mint':'yellow');
      const awning=box(x-3.3+stripe*.6,y,-4.7,.6,.1,1.03,color);
      awning.rotation.x=.15;
      box(x-3.3+stripe*.6,y-.13,-4.18,.59,.2,.12,color);
    }
    beam([x-3.45,y-.45,-5],[x-3.45,y-.07,-4.25],.035,'cream');
    beam([x+3.45,y-.45,-5],[x+3.45,y-.07,-4.25],.035,'cream');
  }
  // Blackboard, arts wall, shelves and six little work tables.
  box(-7.9,6.05,-11.84,5.6,2.15,.12,'darkGreen');
  sign('A B C   1 2 3','LEARN · PLAY · GROW',-7.9,6.07,-11.74,5.25,1.75,'darkGreen');
  for(const floor of [0,4.2])for(const x of [-9.7,-6.6,-1.9,1.2]) {
    box(x,floor+.92,-8.1,1.75,.18,1.28,x<-4?'yellow':'mint');
    for(const dx of [-.62,.62])for(const dz of [-.39,.39])box(x+dx,floor+.56,-8.1+dz,.10,.68,.10,'wood');
    for(const dz of [-1,1]){ box(x,floor+.56,-8.1+dz,.65,.12,.62,'coral'); box(x,floor+.85,-8.1+dz+Math.sign(dz)*.25,.65,.65,.1,'coral'); for(const dx of [-.22,.22])box(x+dx,floor+.3,-8.1+dz,.1,.5,.12,'wood'); }
    box(x+.2,floor+1.045,-8.1,.55,.06,.38,'cream');ball(x-.48,floor+1.08,-8.1,.12,'blue');
  }
  // Sleeping room below, reading nook above.
  for(const x of [6.1,8.3,10.5]) {
    box(x,.54,-9.3,1.5,.55,2.7,'wood');box(x,.86,-9.3,1.43,.25,2.62,'cream');
    box(x,1.03,-8.9,1.43,.17,1.68,'blue');box(x,1.06,-10.13,1.08,.25,.57,'white');
  }
  box(8,4.32,-8.2,5.6,.12,3.4,'#dfa786');
  for(const x of [6.4,8,9.6]){box(x,4.75,-8.3,1.2,.65,1.25,'mint');box(x,5.2,-8.85,1.2,.8,.23,'mint');}
  for(const x of [6.4,9.4]){
    box(x,5.58,-11.47,2.65,2.7,.7,'wood');
    for(const y of [4.35,5.25,6.2,6.9])box(x,y,-11.03,2.73,.13,.9,'cream');
    for(let row=0;row<3;row++)for(let j=0;j<8;j++)box(x-1.05+j*.29,4.65+row*.85,-11.02,.18,.5+(j%3)*.09,.5,['coral','mint','blue','yellow'][j%4]);
  }
  sign('故事小屋','LITTLE READERS',8,7.3,-11.75,4.5,.65);
  for(const x of [-2.3,0,2.3]){box(x,6.4,-11.8,1.6,1.5,.1,'white');ball(x,6.45,-11.68,.39,['coral','yellow','blue'][Math.round((x+2.3)/2.3)]);}

  // Flat dollhouse roof edged by a sunny parapet; back roof wings stay out of view into rooms.
  for(const x of [-8,8]) {
    const g=new THREE.ConeGeometry(5.8,1.9,4);const roof=mesh(g,x<0?'coral':'mint',x,9,-9,1,1,.64);roof.rotation.y=Math.PI/4;
    box(x,8.2,-9,8.2,.19,6.5,'cream');
  }
  box(0,8.65,-9,6.7,1.1,6,'yellow');
  sign('小小晴天幼儿园','SUNNY SIDE KINDERGARTEN',0,8.58,-5.55,7.4,1.35,'cream');
  // Little sun on the roof and a cream clock tower.
  box(0,10,-10.4,2.1,2.2,1.9,'cream');
  const clock=cylinder(0,10.35,-9.4,.7,.08,'white');clock.rotation.x=Math.PI/2;
  beam([0,10.35,-9.33],[0,10.78,-9.33],.035,'ink');beam([0,10.35,-9.32],[.3,10.17,-9.32],.035,'ink');
  const clockRoof=mesh(new THREE.ConeGeometry(1.75,1.1,4),'coral',0,11.55,-10.4);clockRoof.rotation.y=Math.PI/4;
  ball(-4.2,10,-10.5,.72,'yellow');
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;beam([-4.2+Math.cos(a)*.93,10+Math.sin(a)*.93,-10.5],[-4.2+Math.cos(a)*1.22,10+Math.sin(a)*1.22,-10.5],.075,'yellow');}
  for(const x of [-10,10]){beam([x,8.5,-11],[x,11,-11],.065,'wood');const flag=box(x+.5,10.6,-11,1,.6,.06,x<0?'yellow':'coral');flag.rotation.z=-.12;}
  // Three oversized colored pencils peek from a miniature rooftop pencil pot.
  cylinder(8.4,9.18,-10.3,.48,.65,'cream');
  for(let i=0;i<3;i++) {
    const x=8.1+i*.29,y=9.78+i*.14,z=-10.3+(i%2)*.18;
    cylinder(x,y,z,.12,1.15,['coral','yellow','blue'][i]);
    mesh(new THREE.ConeGeometry(.12,.28,6),'wood',x,y+.71,z);
    mesh(new THREE.ConeGeometry(.045,.11,6),'navy',x,y+.82,z);
  }
  // Right-side access stair and handrail.
  for(let i=0;i<12;i++)box(13.3,.17+i*.175,-2.1-i*.62,2.05,.34+i*.35,.64,'cream');
  beam([14.35,1.05,-1.6],[14.35,5,-9.5],.065,'mint');
  for(let i=0;i<6;i++)beam([14.35,.45+i*.72,-2-i*1.25],[14.35,1.27+i*.63,-2-i*1.25],.055,'mint');

  // Oval running track with proper continuous lane stripes.
  const oval=new THREE.Shape();oval.absellipse(0,0,7,4.5,0,Math.PI*2,false,0);
  const inner=new THREE.Path();inner.absellipse(0,0,5.5,3.0,0,Math.PI*2,true,0);oval.holes.push(inner);
  const track=mesh(new THREE.ShapeGeometry(oval,64),'#d89179',8,.075,5);track.rotation.x=-Math.PI/2;
  ellipse(8,5,6.82,4.32,.09,'cream',.033);ellipse(8,5,6.15,3.65,.095,'cream',.026);ellipse(8,5,5.53,3.03,.095,'cream',.03);
  box(8,.06,5,9.4,.12,4.8,'#7fab85');
  for(let i=0;i<6;i++)box(4.05+i*1.58,.13,5,1.56,.012,4.72,i%2?'#82b28a':'#89b890');
  line([[3.8,.16,2.9],[12.2,.16,2.9],[12.2,.16,7.1],[3.8,.16,7.1],[3.8,.16,2.9]],'white',.028);
  beam([8,.17,2.9],[8,.17,7.1],.027,'white');ellipse(8,5,1,1,.17,'white',.027);
  for(const x of [3.8,12.2]) {
    beam([x,.15,4.1],[x,1.2,4.1],.055,'white');beam([x,.15,5.9],[x,1.2,5.9],.055,'white');beam([x,1.2,4.1],[x,1.2,5.9],.055,'white');
    const back=x+(x<8?-.6:.6);for(let j=0;j<7;j++)beam([x,1.17,4.1+j*.3],[back,.16,4.1+j*.3],.014,'cream');
  }
  const football=new THREE.Group();root.add(football);ball(0,0,0,.26,'white',football);
  for(const a of [0,1.3,2.6,3.9,5.2])ball(Math.cos(a)*.22,.05,Math.sin(a)*.22,.095,'navy',football);

  // Play island: swung seat and ropes share exactly the same hinge as its rider.
  box(-10.6,.015,3.4,12,.12,8.3,'#d7bc8c');
  for(const x of [-15.3,-12.7]){beam([x,0,.8],[x,3,2],.10,'wood');beam([x,0,3.2],[x,3,2],.10,'wood');}
  beam([-15.7,3,2],[-12.3,3,2],.14,'mint');
  const swing=new THREE.Group();swing.position.set(-14,3,2);root.add(swing);
  for(const x of [-.49,.49])beam([x,0,0],[x,-2.2,0],.025,'cream',swing);
  box(0,-2.2,0,1.25,.16,.65,'coral',swing);
  // Rounded slide chute with raised colored edges and safe ladder.
  box(-9,2.48,0,1.65,.2,1.4,'yellow');
  for(const x of [-9.65,-8.35]){beam([x,0,-.5],[x,2.5,-.5],.09,'mint');beam([x,0,.5],[x,2.5,.5],.09,'mint');}
  const chutePoints=[[-9,2.58,.35],[-9,2.1,1.1],[-9,.8,2.7],[-9,.22,4]];
  const chuteCurve=new THREE.CatmullRomCurve3(chutePoints.map(p=>new THREE.Vector3(...p)));
  for(let i=0;i<24;i++){const p=chuteCurve.getPoint(i/24),q=chuteCurve.getPoint((i+1)/24);const mid=p.clone().add(q).multiplyScalar(.5);const s=box(mid.x,mid.y,mid.z,1.12,.1,p.distanceTo(q)+.06,'yellow');s.rotation.x=-Math.atan2(q.y-p.y,q.z-p.z);}
  for(const dx of [-.65,.65])line(chutePoints.map(p=>[p[0]+dx,p[1]+.18,p[2]]),'coral',.10);
  for(const x of [-9.57,-8.43])beam([x,.15,-1.8],[x,2.72,-.4],.075,'mint');
  for(let i=0;i<6;i++)beam([-9.58,.4+i*.4,-1.65+i*.23],[-8.42,.4+i*.4,-1.65+i*.23],.07,'cream');
  for(const x of [-9.7,-8.3]){beam([x,2.5,-.4],[x,3.3,-.4],.065,'mint');beam([x,3.3,-.4],[x,3.3,.48],.065,'mint');}
  box(-13,.16,8,5.2,.3,4.1,'wood');box(-13,.34,8,4.8,.14,3.7,'sand');
  for(let i=0;i<4;i++){cylinder(-14.3+i*.45,.55,8.2,.18,.38,'sand');mesh(new THREE.ConeGeometry(.22,.23,8),'sand',-14.3+i*.45,.85,8.2);}
  const bucket=cylinder(-11.7,.57,8.8,.28,.43,'coral');line([[-11.95,.74,8.8],[-11.7,1.02,8.8],[-11.45,.74,8.8]],'cream',.035);
  box(-5,.38,7,.65,.75,1,'mint');const seesaw=new THREE.Group();seesaw.position.set(-5,.75,7);root.add(seesaw);box(0,0,0,4.1,.22,.58,'yellow',seesaw);
  for(const x of [-1.5,1.5]){box(x,.18,0,.8,.2,.72,'coral',seesaw);beam([x*.76,.05,0],[x*.76,.7,0],.055,'navy',seesaw);beam([x*.76,.7,-.22],[x*.76,.7,.22],.055,'navy',seesaw);}
  // Circular balance stones and miniature garden beds.
  for(let i=0;i<6;i++){const a=i*.58; cylinder(-5.5+Math.cos(a)*2,.18,-.3+Math.sin(a)*1.7,.38,.3,['coral','yellow','mint'][i%3]);}

  // Picket perimeter, with a welcoming rainbow arch at the front.
  function fencePost(x,z){box(x,.67,z,.15,1.3,.17,'cream');const cap=mesh(new THREE.ConeGeometry(.13,.2,4),'cream',x,1.41,z);cap.rotation.y=Math.PI/4;}
  for(let i=0;i<37;i++){const x=-18+i;if(Math.abs(x)>2.5)fencePost(x,13.9);}
  for(const side of [-18.8,18.8]){for(let i=0;i<27;i++)fencePost(side,-13+i);box(side,.46,0,.11,.11,27,'cream');box(side,1.05,0,.11,.11,27,'cream');}
  for(const x of [-10.7,10.7])for(const y of [.46,1.05])box(x,y,13.9,16,.12,.1,'cream');
  for(let k=0;k<4;k++) {
    const radius=2.2-k*.23;
    line(Array.from({length:25},(_,i)=>{const a=i/24*Math.PI;return [Math.cos(a)*radius,2+Math.sin(a)*radius,13.85];}),['coral','yellow','mint','blue'][k],.13);
    for(const x of [-radius,radius])beam([x,0,13.85],[x,2,13.85],.13,['coral','yellow','mint','blue'][k]);
  }
  sign('HELLO, LITTLE SUNSHINE','',0,1.3,13.85,3.5,.42,'cream');
  // Benches with actual slats, tree canopy silhouettes, and clustered flowers.
  function bench(x,z,angle=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);for(const dz of [-.25,0,.25])box(0,.57,dz,2.6,.12,.18,'wood',g);for(const y of [.94,1.2])box(0,y,-.38,2.6,.19,.1,'wood',g);for(const dx of [-.93,.93]){box(dx,.3,0,.11,.6,.64,'navy',g);box(dx,.82,-.37,.1,.85,.1,'navy',g);}}
  bench(15.7,10.7);bench(-8.4,11.2);bench(16,-3.7,Math.PI/2);
  const foliage=[];
  function tree(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);beam([0,0,0],[0,2.8*s,0],.18*s,'wood',g);beam([0,1.7*s,0],[-.7*s,2.8*s,0],.105*s,'wood',g);const crown=new THREE.Group();crown.position.y=2.35*s;g.add(crown);ball(0,.9*s,0,1.25*s,'green',crown);ball(-.7*s,.35*s,.13*s,.88*s,'mint',crown);ball(.7*s,.4*s,.1*s,.95*s,'darkGreen',crown);ball(.05*s,.35*s,.6*s,.85*s,'green',crown);foliage.push(crown);cylinder(x,.08,z,1.0*s,.17,'#d0b890');}
  [[-17,-10,1.1],[-17,-4,.95],[-17,6,.8],[17,-10,1.1],[17,0,.8],[17,8,.85],[-17,11.5,.7],[17,12,.7]].forEach(p=>tree(...p));
  const shrubGeo=new THREE.IcosahedronGeometry(1,1);const shrubPositions=[];
  for(let i=0;i<28;i++)shrubPositions.push([-17.9+i*1.3,.36,-13.35]);
  for(let i=0;i<12;i++)shrubPositions.push([-15+i*.52,.27,11.95]);
  for(let i=0;i<15;i++)shrubPositions.push([6+i*.63,.29,11.95]);
  const shrubs=new THREE.InstancedMesh(shrubGeo,mat('green'),shrubPositions.length); const dummy=new THREE.Object3D();
  shrubPositions.forEach((p,i)=>{dummy.position.set(...p);dummy.scale.set(.55,.47+(i%3)*.05,.43);dummy.rotation.y=i;dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);});shrubs.castShadow=true;root.add(shrubs);
  const blossoms=new THREE.InstancedMesh(sphereGeo,mat('coral'),80);
  for(let i=0;i<80;i++){const right=i>39;dummy.position.set((right?6:-15)+(i%40)*.2,.5+Math.sin(i)*.07,12.1+Math.cos(i*2.4)*.32);dummy.scale.setScalar(.11);dummy.updateMatrix();blossoms.setMatrixAt(i,dummy.matrix);blossoms.setColorAt(i,new THREE.Color(['#ed9c7d','#f3cf60','#ffead5'][i%3]));}root.add(blossoms);
  for(const [x,z] of [[-2,-3],[2,-3],[15,9],[-16,10]]){cylinder(x,.3,z,.45,.6,'coral');for(let i=0;i<5;i++){const a=i*2.4;beam([x,.55,z],[x+Math.cos(a)*.25,1.1,z+Math.sin(a)*.25],.025,'darkGreen');ball(x+Math.cos(a)*.25,1.12,z+Math.sin(a)*.25,.17,i%2?'yellow':'white');}}

  // Small kinetic details: windmill, floating cotton clouds, birds, ball and leaves.
  const windmill=new THREE.Group();windmill.position.set(16,3.8,-11.7);root.add(windmill);beam([16,0,-11.7],[16,3.8,-11.7],.14,'cream');
  for(let i=0;i<4;i++){const blade=box(0,.67,0,.38,1.45,.1,i%2?'yellow':'coral',windmill);const pivot=new THREE.Group();windmill.add(pivot);windmill.remove(blade);pivot.add(blade);pivot.rotation.z=i*Math.PI/2;}ball(0,0,.1,.18,'white',windmill);
  const clouds=[];for(const [x,y,z,s] of [[-15,13,-12,1],[12,15,-15,.85],[-3,15,-18,.7]]){const g=new THREE.Group();g.position.set(x,y,z);root.add(g);ball(-1,0,0,.85*s,'white',g);ball(0,.3,0,1.18*s,'white',g);ball(1.1,0,0,.8*s,'white',g);box(0,-.25,0,2.6*s,.7*s,1.25*s,'white',g);clouds.push({g,x});}
  const birds=[];for(let i=0;i<3;i++){const g=new THREE.Group();root.add(g);const l=box(-.24,0,0,.52,.07,.19,'cream',g),r=box(.24,0,0,.52,.07,.19,'cream',g);ball(0,-.03,0,.105,'cream',g);birds.push({g,l,r});}
  const anchors={swingPivot:[-14,3,2],swingLength:2.2,slideStart:[-9,2.6,0],slideEnd:[-9,.22,4],seesawPivot:[-5,.75,7],fieldCenter:[8,0,5],upperFloor:4.2};
  function update(time){
    swing.rotation.x=Math.sin(time*1.6)*.42;
    seesaw.rotation.z=Math.sin(time*1.3)*.16;
    windmill.rotation.z=-time*.42;
    football.position.set(8.05+Math.sin(time*1.6)*.68,.39,4.5-Math.sin(time*1.6)*.19);football.rotation.set(time*.5,0,time*.7);
    foliage.forEach((g,i)=>{g.rotation.z=Math.sin(time*.8+i)*.018;});
    clouds.forEach(({g,x},i)=>{g.position.x=x+Math.sin(time*.035+i)*1.1;});
    birds.forEach(({g,l,r},i)=>{const a=time*.12+i*.65;g.position.set(Math.cos(a)*12,11.5+Math.sin(a*2+i)*.6,Math.sin(a)*5-5);g.rotation.y=-a;l.rotation.z=Math.sin(time*5+i)*.45;r.rotation.z=-l.rotation.z;});
  }
  update(0);
  // Only direct, opaque, static mesh children are batched. Animation transforms
  // live in nested groups, so their hinges and independently moving pieces stay intact.
  const batches=new Map();
  for(const child of root.children) {
    if(!child.isMesh || child.isInstancedMesh || Array.isArray(child.material) || child.material.transparent)continue;
    const key=`${child.geometry.uuid}:${child.material.uuid}:${child.castShadow}:${child.receiveShadow}`;
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(child);
  }
  let consolidatedMeshes=0,instanceBatches=0;
  for(const children of batches.values()) {
    if(children.length<3)continue;
    const first=children[0];
    const batch=new THREE.InstancedMesh(first.geometry,first.material,children.length);
    batch.name='Static campus details';batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
    children.forEach((child,index)=>{child.updateMatrix();batch.setMatrixAt(index,child.matrix);root.remove(child);});
    batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();root.add(batch);
    consolidatedMeshes+=children.length;instanceBatches++;
  }
  root.userData.batching={consolidatedMeshes,instanceBatches,drawCallsSaved:consolidatedMeshes-instanceBatches};
  return {update,anchors,root};
}

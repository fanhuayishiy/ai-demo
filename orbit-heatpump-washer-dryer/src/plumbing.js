// Real fittings and continuously connected flexible water lines; independent of refrigerant/air loops.
export function createPlumbing(T, m, addPart, parts) {
  const TAU=Math.PI*2;
  const blue=new T.MeshStandardMaterial({color:'#538baf',metalness:.35,roughness:.42});
  const hoseMat=new T.MeshStandardMaterial({color:'#576774',metalness:.08,roughness:.74,side:T.DoubleSide});
  const add=(g,geo,mat,p=[0,0,0],name='')=>{const o=new T.Mesh(geo,mat);o.position.set(...p);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
  const box=(g,w,h,d,mat,p,name)=>add(g,new T.BoxGeometry(w,h,d),mat,p,name);
  function cylinder(g,r,h,mat,p,name,open=false,n=48){const geo=new T.CylinderGeometry(r,r,h,n,1,open);geo.rotateX(Math.PI/2);return add(g,geo,mat,p,name);}
  const ring=(g,r,t,mat,p,name)=>add(g,new T.TorusGeometry(r,t,8,48),mat,p,name);
  function badge(group,text,subtitle,p){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#16262e';ctx.fillRect(0,0,512,160);ctx.strokeStyle='#7ca5b1';ctx.lineWidth=3;ctx.strokeRect(5,5,502,150);
    ctx.fillStyle='#dee5dd';ctx.font='500 48px Microsoft YaHei';ctx.fillText(text,22,68);ctx.fillStyle='#91acb5';ctx.font='23px Segoe UI';ctx.fillText(subtitle,23,119);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const plane=add(group,new T.PlaneGeometry(.51,.16),new T.MeshBasicMaterial({map:texture}),p,'Water service identification');plane.rotation.y=Math.PI;
  }

  // Both fittings stay seated in their actual rear-panel apertures during disassembly.
  const rear=parts.find(p=>p.group.name==='Rear service panel');
  const inlet=addPart('inlet','Cold-water inlet and solenoid valve',[-.78,2.91,-1.29],rear.offset.toArray());
  box(inlet,.25,.24,.018,m.steel,[0,0,.043],'Inlet mounting flange');
  cylinder(inlet,.083,.095,m.brass,[0,0,-.012],'Hex union',false,6);
  cylinder(inlet,.071,.23,m.steel,[0,0,-.097],'Hollow threaded water inlet',true);
  for(let i=0;i<7;i++)ring(inlet,.071,.004,m.chrome,[0,0,-.192+i*.017],'Thread crest');
  ring(inlet,.063,.012,blue,[0,0,-.214],'Blue cold-water seal');
  cylinder(inlet,.057,.005,m.rubber,[0,0,-.022],'Recessed inlet bore');
  // Recessed strainer visible inside the inlet mouth.
  for(let i=-3;i<=3;i++){const x=i*.014,len=Math.sqrt(.050**2-x*x)*2;box(inlet,.003,len,.002,m.steel,[x,0,-.051]);box(inlet,len,.003,.002,m.steel,[0,x,-.051]);}
  box(inlet,.19,.19,.21,blue,[0,-.05,.17],'Inlet valve solenoid');
  cylinder(inlet,.055,.15,m.aluminum,[0,-.10,.30],'Valve outlet nipple');
  for(const x of [-.09,.09])cylinder(inlet,.015,.012,m.chrome,[x,.086,.025],'Mount screw',false,6);
  badge(inlet,'冷水进水口','COLD WATER INLET',[.22,.22,-.024]);

  const outlet=addPart('outlet','Drain outlet and external hose',[.91,.60,-1.29],rear.offset.toArray());
  ring(outlet,.086,.024,m.rubber,[0,0,.02],'Rear drain grommet');
  cylinder(outlet,.066,.22,hoseMat,[0,0,-.02],'Drain bulkhead nozzle',true);
  ring(outlet,.069,.009,m.steel,[0,0,-.105],'Stainless hose clamp');
  box(outlet,.032,.035,.02,m.chrome,[.065,0,-.10],'Clamp screw');
  badge(outlet,'排水软管出口','DRAIN HOSE OUTLET',[-.30,-.22,-.024]);
  const hoseCurve=new T.CatmullRomCurve3([[0,0,-.12],[.02,-.02,-.32],[-.10,.15,-.57],[-.15,.76,-.63],[-.12,1.05,-.79],[.11,1.08,-.98],[.23,.86,-1.06]].map(p=>new T.Vector3(...p)));
  const externalGeo=new T.TubeGeometry(hoseCurve,192,.047,10,false);
  // Corrugation is geometry, so it remains readable when the hose is inspected closely.
  for(let i=0;i<=192;i++){const center=hoseCurve.getPointAt(i/192),ratio=1+.12*Math.cos(i/192*TAU*48);for(let j=0;j<=10;j++){const k=i*11+j,v=new T.Vector3().fromBufferAttribute(externalGeo.attributes.position,k).sub(center).multiplyScalar(ratio).add(center);externalGeo.attributes.position.setXYZ(k,v.x,v.y,v.z);}}
  externalGeo.computeVertexNormals();add(outlet,externalGeo,hoseMat,[0,0,0],'Corrugated external drain hose');
  const end=hoseCurve.getPointAt(1),lip=ring(outlet,.047,.008,m.rubber,end.toArray(),'Open drain hose mouth');lip.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),hoseCurve.getTangentAt(1));
  cylinder(outlet,.071,.09,m.graphite,[0,0,.10],'Internal drain hose nipple',true);

  const lines=addPart('waterlines','Flexible wash-water circuit',[0,0,0],[0,0,0]);
  const connections=[];
  const ref=(id,local)=>({part:parts.find(p=>p.id===id),local:new T.Vector3(...local)});
  const at=(ref,f)=>ref.part.base.clone().add(ref.local).addScaledVector(ref.part.offset,f);
  function connect(name,start,end,waypoints,material,radius){
    const geometryAt=f=>{
      const a=at(start,f),b=at(end,f);
      const middle=waypoints.map((p,i)=>new T.Vector3(...p).addScaledVector(start.part.offset,f*(1-(i+1)/(waypoints.length+1))).addScaledVector(end.part.offset,f*(i+1)/(waypoints.length+1)));
      return new T.TubeGeometry(new T.CatmullRomCurve3([a,...middle,b]),96,radius,10,false);
    };
    const geometry=geometryAt(0),expanded=geometryAt(1);
    geometry.morphAttributes.position=[expanded.attributes.position.clone()];geometry.morphAttributes.normal=[expanded.attributes.normal.clone()];
    const mesh=add(lines,geometry,material,[0,0,0],name);mesh.morphTargetInfluences[0]=0;expanded.dispose();
    function endpointError(){
      const f=mesh.morphTargetInfluences[0],attribute=geometry.attributes.position,morph=geometry.morphAttributes.position[0];
      const center=index=>{const sum=new T.Vector3();for(let j=0;j<10;j++){const k=index*11+j;sum.add(new T.Vector3().fromBufferAttribute(attribute,k).lerp(new T.Vector3().fromBufferAttribute(morph,k),f));}return sum.multiplyScalar(.1);};
      return Math.max(center(0).distanceTo(start.part.group.position.clone().add(start.local)),center(96).distanceTo(end.part.group.position.clone().add(end.local)));
    }
    connections.push({mesh,start,end,endpointError});
  }
  connect('Pressurized inlet to detergent drawer',ref('inlet',[0,-.10,.375]),ref('control',[-.71,.04,-.62]),[[-1.075,2.70,-.84],[-1.075,2.70,.18],[-.88,2.93,.45]],blue,.027);
  connect('Detergent drawer to outer tub',ref('control',[-.71,-.15,-.37]),ref('tub',[-.59,.76,.46]),[[-.76,2.66,.78],[-.66,2.40,.51]],hoseMat,.049);
  connect('Drain pump to rear drain outlet',ref('pump',[.64,.03,.17]),ref('outlet',[0,0,.15]),[[.96,.47,.51],[1.065,.50,-.22],[1.06,.60,-.82]],hoseMat,.044);
  const tub=parts.find(p=>p.id==='tub').group;
  const fill=cylinder(tub,.066,.12,m.graphite,[-.59,.76,.46],'Tub fill connection',true);fill.rotation.x=Math.PI/4;
  const update=f=>{for(const c of connections)c.mesh.morphTargetInfluences[0]=f;};
  return {inlet,outlet,lines,connections,update};
}

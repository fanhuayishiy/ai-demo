import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { keys } from './keyboard.js';

export function createKeyboardScene(host, initial, onPress) {
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  host.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-label','原创 104 键机械键盘 3D 模型，拖动旋转、滚轮缩放，点击键帽体验');
  const camera=new THREE.PerspectiveCamera(34,1,.1,150);
  const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.09; controls.minDistance=18;controls.maxDistance=47;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.06;controls.enablePan=false;
  scene.add(new THREE.HemisphereLight(0xffffff,0x7c8a80,1.8));
  const sun=new THREE.DirectionalLight(0xfffcf0,3);sun.position.set(-8,18,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=17;sun.shadow.camera.bottom=-17;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xd6e7f1,2);fill.position.set(14,8,-8);scene.add(fill);
  const root=new THREE.Group();scene.add(root);root.position.set(-11.5,0,-3.25);
  const material=(color,metalness=0,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const shellMat=material(initial.shell,.65,.36),plateMat=material('#687873',.6,.4),pcbMat=material('#377461',.2,.6),switchMat=material('#b5c8b8',.15,.3);
  const capMats={base:material(initial.base),mod:material(initial.mod),accent:material(initial.accent)};
  const testedMat=material('#79b49a'),pressedMat=material('#ecc47e');
  pressedMat.emissive.set('#5a3709');pressedMat.emissiveIntensity=.3;
  let detectionMode=false;
  function box(w,h,d,mat,x,y,z,r=.12){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
  const shell=box(23.6,.65,7.25,shellMat,11.5,.1,3.25,.22);
  const pcb=box(23.12,.12,6.84,pcbMat,11.5,.48,3.25,.09);
  const plate=box(23.14,.12,6.84,plateMat,11.5,.64,3.25,.09);
  // Individually modeled sockets and stems remain visible in the exploded assembly.
  const capLayer=new THREE.Group(),switchLayer=new THREE.Group();root.add(capLayer,switchLayer);
  const switches=new THREE.InstancedMesh(new RoundedBoxGeometry(.58,.3,.58,2,.05),switchMat,keys.length);
  switches.castShadow=true;switches.receiveShadow=true;switchLayer.add(switches);
  const stems=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.18,.18),material('#65816c'),keys.length);switchLayer.add(stems);
  const matrix=new THREE.Matrix4();
  const capMap=new Map(),targets=[];let legendMaterials=[];
  function legend(k,color){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font=`500 ${k.label.length>6?21:k.label.length>3?24:31}px Arial`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(k.label,22,23);if(k.code==='Space'){ctx.font='14px Arial';ctx.textAlign='center';ctx.fillText('A T E L I E R   /   1 0 4',128,78);}const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});legendMaterials.push(mat);return mat;}
  keys.forEach((k,i)=>{const x=k.x+k.w/2,z=k.y+k.h/2;matrix.makeTranslation(x,.85,z);switches.setMatrixAt(i,matrix);matrix.makeTranslation(x,1.05,z);stems.setMatrixAt(i,matrix);
    const group=new THREE.Group();group.position.set(x,1.12,z);capLayer.add(group);
    const cap=new THREE.Mesh(new RoundedBoxGeometry(k.w-.12,.42,k.h-.12,3,.09),capMats[k.kind]);cap.castShadow=true;cap.receiveShadow=true;cap.userData.code=k.code;group.add(cap);targets.push(cap);
    const top=new THREE.Mesh(new THREE.PlaneGeometry(k.w-.2,k.h-.2),legend(k,initial.ink));top.rotation.x=-Math.PI/2;top.position.y=.218;group.add(top);capMap.set(k.code,{group,cap,top,key:k,down:false,tested:false});
    if(['KeyF','KeyJ','Numpad5'].includes(k.code)){const bar=new THREE.Mesh(new THREE.BoxGeometry(.16,.018,.025),capMats[k.kind]);bar.position.set(0,.222,.22);group.add(bar);}
  });
  // Four visible fasteners and a recessed USB-C connector complete the housing.
  const screwMat=material('#9ca79f',.85,.22);
  [[.1,.05],[22.9,.05],[.1,6.45],[22.9,6.45]].forEach(([x,z])=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.025,12),screwMat);m.position.set(x,.444,z);root.add(m);});
  box(.85,.23,.14,material('#1d2925'),18.8,.1,-.39,.04);
  const ledMat=new THREE.MeshBasicMaterial({color:'#8db69c'});for(let i=0;i<3;i++)box(.15,.025,.055,ledMat,19.5+i*.75,.77,.57,.01);
  const underlight=new THREE.PointLight(0x70bfa0,0,12);underlight.position.set(0,.1,0);scene.add(underlight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.14}));ground.rotation.x=-Math.PI/2;ground.position.y=-.28;ground.receiveShadow=true;scene.add(ground);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const glowContext=glowCanvas.getContext('2d'),gradient=glowContext.createRadialGradient(64,64,15,64,64,64);gradient.addColorStop(0,'rgba(100,187,150,0.7)');gradient.addColorStop(1,'rgba(100,187,150,0)');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,128,128);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(30,12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,opacity:0,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=-.265;scene.add(glow);
  let exploded=0,amount=0,visible=true,frame=0,config=initial,needsRender=true,lastRender=0;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.addEventListener('change',()=>{needsRender=true;});
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null;
  renderer.domElement.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets)[0];if(hit)onPress(hit.object.userData.code);});
  let fitScale=1;
  function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();const nextFit=Math.max(1,1.95/camera.aspect);camera.position.sub(controls.target).multiplyScalar(nextFit/fitScale).add(controls.target);fitScale=nextFit;controls.maxDistance=47*fitScale;controls.update();needsRender=true;}
  const observer=new ResizeObserver(resize);observer.observe(host);
  function view(type='perspective'){controls.target.set(0,type==='top'?0:.5,0);if(type==='top')camera.position.set(0,30,.01);else if(type==='front')camera.position.set(1,9,29);else camera.position.set(5,18.5,21);camera.position.sub(controls.target).multiplyScalar(fitScale).add(controls.target);controls.update();needsRender=true;}
  view();resize();
  function applyDetectionColors(){capMap.forEach(c=>{const marked=detectionMode&&c.tested;c.cap.material=marked?(c.down?pressedMat:testedMat):capMats[c.key.kind];c.top.material.color.set(marked?'#263e32':'#ffffff');});needsRender=true;}
  function render(t){frame=requestAnimationFrame(render);if(!visible||document.hidden)return;
    if(Math.abs(amount-exploded)>.002){amount=reducedMotion?exploded:THREE.MathUtils.lerp(amount,exploded,.1);needsRender=true;}else if(amount!==exploded){amount=exploded;needsRender=true;}
    pcb.position.y=.48+amount*.8;plate.position.y=.64+amount*1.8;switchLayer.position.y=amount*2.8;capLayer.position.y=amount*4.5;
    for(const c of capMap.values()){const target=1.12-(c.down?.16:0);if(Math.abs(c.group.position.y-target)>.001){c.group.position.y=reducedMotion?target:THREE.MathUtils.lerp(c.group.position.y,target,.4);needsRender=true;}}
    underlight.intensity=config.light==='off'?0:config.light==='breathe'&&!reducedMotion?10+Math.sin(t*.002)*6:14;
    glow.material.opacity=config.light==='off'?0:config.light==='breathe'&&!reducedMotion?.3+Math.sin(t*.002)*.15:.4;
    if(config.light==='breathe'&&!reducedMotion&&t-lastRender>40)needsRender=true;
    controls.update();if(needsRender){renderer.render(scene,camera);lastRender=t;needsRender=false;}
  }render(0);
  return {update(c){config=c;needsRender=true;shellMat.color.set(c.shell);shellMat.metalness=c.material==='aluminum'?.65:.05;shellMat.roughness=c.material==='aluminum'?.36:.65;Object.entries(capMats).forEach(([k,m])=>m.color.set(c[k]));legendMaterials.forEach(m=>{m.map.dispose();m.dispose();});legendMaterials=[];capMap.forEach(({top,key})=>{top.material=legend(key,c.ink);});applyDetectionColors();},press(code,down){const c=capMap.get(code);if(c){c.down=down;applyDetectionColors();}},setDetection(enabled,tested){detectionMode=enabled;capMap.forEach(c=>{c.tested=tested.has(c.key.code);});applyDetectionColors();},explode(v){exploded=v;needsRender=true;},view,zoom(v){const delta=camera.position.clone().sub(controls.target).multiplyScalar(v);delta.setLength(THREE.MathUtils.clamp(delta.length(),controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(delta);controls.update();needsRender=true;},setVisible(v){visible=v;if(v)resize();},dispose(){cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();}};
}

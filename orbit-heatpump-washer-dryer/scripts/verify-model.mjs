import {launchBrowser} from './browser.mjs';
import assert from 'node:assert/strict';
const browser=await launchBrowser();
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(process.env.ORBIT_URL||'http://127.0.0.1:5173',{waitUntil:'networkidle'});
  await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
  const imported=await page.evaluate(async()=>{
    const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const {AnimationMixer,Box3,Vector3}=await import('/node_modules/three/build/three.module.js');
    const binary=await(await fetch('/output/ORBIT-heatpump-animated.glb')).arrayBuffer();
    const gltf=await new GLTFLoader().parseAsync(binary,'');
    gltf.scene.updateMatrixWorld(true);const a=new Box3().setFromObject(gltf.scene).getSize(new Vector3());
    const mixer=new AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations[0]).play();mixer.setTime(6);gltf.scene.updateMatrixWorld(true);
    const b=new Box3().setFromObject(gltf.scene).getSize(new Vector3());
    const find=name=>{let result;gltf.scene.traverse(o=>{if(o.name.replace(/[^a-z]/gi,'').toLowerCase()===name)result=o;});return result;};
    const axes=['directdrivemotor','perforatedstainlessinnerdrum','ribbedoutertub'].map(name=>find(name).position.toArray());
    const panelRotation=find('rightfoldedsidepanel').quaternion.toArray();
    const morphs=[];gltf.scene.traverse(o=>{if(o.morphTargetInfluences?.length)morphs.push(o.morphTargetInfluences[0]);});
    mixer.setTime(13);gltf.scene.updateMatrixWorld(true);const c=new Box3().setFromObject(gltf.scene).getSize(new Vector3());
    return {animations:gltf.animations.length,duration:gltf.animations[0].duration,tracks:gltf.animations[0].tracks.length,assembled:a.toArray(),exploded:b.toArray(),returned:c.toArray(),axes,panelRotation,morphs};
  });
  assert.equal(imported.animations,1);assert.equal(imported.duration,13);assert.equal(imported.tracks,22);
  for(const axis of imported.axes){assert.ok(Math.abs(axis[0])<1e-6);assert.ok(Math.abs(axis[1]-1.49)<1e-6);}
  assert.deepEqual(imported.panelRotation,[0,0,0,1]);assert.equal(imported.morphs.length,3);assert.ok(imported.morphs.every(v=>Math.abs(v-.82)<1e-6));
  assert.ok(imported.exploded[0]>imported.assembled[0]);assert.ok(imported.exploded[1]>imported.assembled[1]);
  imported.returned.forEach((v,i)=>assert.ok(Math.abs(v-imported.assembled[i])<.001));
  await page.locator('#tour-button').click();
  await page.waitForFunction(()=>window.__ORBIT__.state.tour===false,undefined,{timeout:20000});
  assert.equal(await page.evaluate(()=>window.__ORBIT__.state.target),62);
  assert.equal(await page.locator('[data-view="exploded"]').getAttribute('aria-pressed'),'true');
  console.log(JSON.stringify({imported,fullTour:true},null,2));
}finally{await browser.close();}

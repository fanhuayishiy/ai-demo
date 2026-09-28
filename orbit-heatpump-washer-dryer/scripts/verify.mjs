import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
await fs.mkdir('output',{recursive:true});
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const checks=[];
try{
  await page.goto(process.env.ORBIT_URL||'http://127.0.0.1:5173',{waitUntil:'networkidle'});
  await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
  assert.equal(await page.evaluate(()=>window.__ORBIT__.state.view),'exploded');
  const geometry=await page.evaluate(()=>{let meshes=0,triangles=0,invalid=0;const w=window.__ORBIT__.washer;w.root.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.count||1);if(!o.geometry.attributes.position.array.every(Number.isFinite))invalid++;});return {parts:w.parts.length,meshes,triangles,invalid};});
  assert.equal(geometry.parts,19);assert.equal(geometry.invalid,0);checks.push({geometry});
  for(const [view,target] of [['assembled',0],['exploded',62],['cutaway',18],['thermal',25]]){
    await page.locator(`[data-view="${view}"]`).click();await page.waitForFunction(t=>Math.abs(window.__ORBIT__.state.explosion-t)<.03,target);
    assert.equal(await page.locator(`[data-view="${view}"]`).getAttribute('aria-pressed'),'true');
    const visibility=await page.evaluate(()=>window.__ORBIT__.washer.parts.filter(p=>p.category==='shell').every(p=>p.group.visible));
    assert.equal(visibility,view==='assembled'||view==='exploded');checks.push({view,passed:true});
  }
  await page.locator('[data-view="exploded"]').click();
  await page.locator('#explode-range').fill('100');await page.locator('#explode-range').dispatchEvent('input');
  await page.waitForFunction(()=>window.__ORBIT__.state.explosion===100);assert.match(await page.locator('#explode-value').innerText(),/100/);
  await page.locator('#explode-range').fill('62');await page.locator('#explode-range').dispatchEvent('input');checks.push({range:true});
  await page.locator('[data-part="motor"]').click();assert.equal(await page.locator('#part-name').innerText(),'直驱变频电机');
  await page.locator('#focus-part').click();assert.equal(await page.evaluate(()=>window.__ORBIT__.state.focused),true);
  await page.locator('#reset-view').click();assert.equal(await page.evaluate(()=>window.__ORBIT__.state.focused),false);checks.push({selectionAndFocus:true});
  await page.locator('#toggle-labels').click();assert.equal(await page.locator('#toggle-labels').getAttribute('aria-pressed'),'false');await page.locator('#toggle-labels').click();
  await page.locator('#toggle-rotate').click();assert.equal(await page.evaluate(()=>window.__ORBIT__.controls.autoRotate),true);await page.locator('#toggle-rotate').click();checks.push({toggles:true});
  await page.locator('#tour-button').click();assert.equal(await page.evaluate(()=>window.__ORBIT__.state.tour),true);await page.locator('#tour-button').click();assert.equal(await page.evaluate(()=>window.__ORBIT__.state.tour),false);checks.push({tour:true});
  await page.locator('#info-button').click();assert.equal(await page.locator('#help-dialog').evaluate(el=>el.open),true);await page.locator('#close-help').click();checks.push({help:true});
  await page.evaluate(()=>{window.__ORBIT__.setView('exploded',{immediate:true});window.__ORBIT__.selectPart('heatpump',false);window.__ORBIT__.resetCamera(true);});
  // Let the renderer present a complete frame after UI mutations.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:'output/ORBIT-interactive-desktop.png'});
  if(process.argv.includes('--export')){
    for(const [view,name] of [['exploded','01-爆炸图'],['cutaway','02-内部拆解图'],['assembled','03-整机外观'],['thermal','04-热泵循环']]){
      await page.evaluate(v=>window.__ORBIT__.setView(v,{immediate:true}),view);
      const data=await page.evaluate(()=>window.__ORBIT__.exportPoster());
      const file=`output/${name}.png`;await fs.writeFile(file,Buffer.from(data.split(',')[1],'base64'));checks.push({export:file,bytes:(await fs.stat(file)).size});
    }
    await page.evaluate(()=>window.__ORBIT__.viewConnections('inlet',true));
    const rearPoster=await page.evaluate(()=>window.__ORBIT__.exportPoster());
    await fs.writeFile('output/05-背面进排水接口.png',Buffer.from(rearPoster.split(',')[1],'base64'));checks.push({rearPortsExport:true});
    await page.evaluate(()=>window.__ORBIT__.setView('assembled',{immediate:true}));
    const binary=await page.evaluate(async()=>{const {exportAnimatedModel}=await import('/src/export-model.js');const buf=await exportAnimatedModel(window.__ORBIT__.washer);let s='';const bytes=new Uint8Array(buf);for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);});
    const model=Buffer.from(binary,'base64');assert.equal(model.readUInt32LE(0),0x46546c67);assert.equal(model.readUInt32LE(4),2);
    await fs.writeFile('output/ORBIT-heatpump-animated.glb',model);checks.push({glbBytes:model.length});
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.__ORBIT__.setView('exploded',{immediate:true}));
  await page.screenshot({path:'output/ORBIT-interactive-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const view of ['assembled','exploded','cutaway','thermal'])assert.equal(await page.locator(`[data-view="${view}"]`).isVisible(),true);
  const mobileRects=await page.evaluate(()=>[...document.querySelectorAll('[data-view]')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,right:r.right};}));assert.ok(mobileRects.every(r=>r.x>=0&&r.right<=390));checks.push({mobile:true});
  assert.deepEqual(errors,[]);checks.push({browserErrors:0});
  await fs.writeFile('output/verification.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));console.log(JSON.stringify(checks,null,2));
} finally {await browser.close();}

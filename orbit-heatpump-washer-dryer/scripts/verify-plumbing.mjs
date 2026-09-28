import assert from 'node:assert/strict';
import {launchBrowser} from './browser.mjs';
const browser=await launchBrowser();
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message);};
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  await page.goto(process.env.ORBIT_URL||'http://127.0.0.1:5173',{waitUntil:'networkidle'});
  await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
  for(const amount of [0,18,62,100]){
    await page.locator('#explode-range').fill(String(amount));await page.locator('#explode-range').dispatchEvent('input');
    await page.waitForFunction(a=>window.__ORBIT__.state.explosion===a,amount);
    const data=await page.evaluate(()=>{
      const w=window.__ORBIT__.washer;
      const part=p=>({id:p.id,name:p.group.name,xyz:p.group.position.toArray(),base:p.base.toArray(),rotation:p.group.rotation.toArray().slice(0,3)});
      const sides=w.parts.filter(p=>p.group.name.includes('folded side panel')).map(part);
      const axes=w.parts.filter(p=>['motor','drum','tub'].includes(p.id)).map(part);
      const inlet=w.parts.find(p=>p.id==='inlet'),outlet=w.parts.find(p=>p.id==='outlet');
      return {sides,axes,water:!!inlet&&!!outlet,hoses:w.plumbing?.connections.map(c=>({name:c.mesh.name,error:c.endpointError()}))||[]};
    });
    for(const side of data.sides){check(side.rotation.every(v=>Math.abs(v)<1e-7),`${amount}% ${side.name}: rotation must remain zero`);check(Math.abs(side.xyz[1]-side.base[1])<1e-7&&Math.abs(side.xyz[2]-side.base[2])<1e-7,`${amount}% ${side.name}: translate only laterally`);}
    for(const axis of data.axes)check(Math.abs(axis.xyz[0])<1e-7&&Math.abs(axis.xyz[1]-1.49)<1e-7,`${amount}% ${axis.id}: must stay on drum center axis`);
    check(data.water,`${amount}% missing cold-water inlet / drain outlet`);
    check(data.hoses.length>=3,`${amount}% missing connected water lines`);
    for(const hose of data.hoses)check(hose.error<1e-4,`${amount}% ${hose.name}: detached endpoint ${hose.error}`);
  }
  if(failures.length)console.log(failures.join('\n'));
  assert.deepEqual(failures,[]);
  await page.locator('#view-connections').click();
  await page.locator('[data-part="inlet"]').click();assert.equal(await page.locator('#part-name').innerText(),'冷水进水口与进水阀');
  await page.locator('[data-part="outlet"]').click();assert.equal(await page.locator('#part-name').innerText(),'排水出口与排水软管');
  await page.screenshot({path:'output/ORBIT-rear-connections.png'});
  console.log('PASS: parallel panels, coaxial motor/drum/tub, water ports and hose continuity at 0/18/62/100%; rear controls.');
}finally{await browser.close();}

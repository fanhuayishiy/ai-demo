const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:1200},deviceScaleFactor:1});
  const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173/',{waitUntil:'networkidle'});
    for(let id=0;id<4;id++){
      await page.locator('#reset-button').click();await page.locator('#auto-button').click();await page.locator('#pause-button').click();
      await page.locator('#speed-button').click();await page.locator('#speed-button').click();
      await page.selectOption('#crosswalk-select',String(id));
      await page.evaluate(id=>{const s=__traffic.sim;s.cars=[];s.pedestrians=[];s.setDemand('ns',0);s.setDemand('ew',0);s.startGreen(id%2===0?'ew':'ns');for(const dir of ['N','S','E','W'])s.spawnCar(dir,-18);},id);
      await page.locator('#cross-button').click();await page.locator('#pause-button').click();
      await page.waitForFunction(()=>__traffic.sim.pedPhase==='WALK');await page.waitForTimeout(900);
      const snapshot=await page.evaluate(()=>{
        const s=__traffic.sim,scene=__traffic.scene;
        return{selected:s.selectedCrosswalk,axis:s.activeAxis,phase:s.phase,pedPhase:s.pedPhase,ns:s.signal('ns'),ew:s.signal('ew'),cars:s.cars.map(c=>({dir:c.dir,axis:c.axis,p:c.p})),overlays:scene.crosswalks.map(m=>({id:m.userData.crosswalk,on:m.material.opacity>0})),lamps:scene.pedSignals.map(l=>({id:l.crosswalk,signal:l.lamp.userData.signal})),rows:[0,1,2,3].map(i=>document.querySelector(`#crosswalk-status-${i}`).dataset.signal),stopLines:scene.stopLines,clock:s.signalClock.text,label:scene.phaseLabel.querySelector('b').textContent,ui:document.querySelector('#countdown').dataset.remaining};
      });
      const axis=id%2===0?'ew':'ns';assert.equal(snapshot.selected,id);assert.equal(snapshot[axis],'green');assert.equal(snapshot[axis==='ns'?'ew':'ns'],'red');
      for(const car of snapshot.cars)assert.ok(car.axis===axis?car.p>-14.65:car.p<=-14.65,`car ${car.dir} disobeyed ${axis} parallel green`);
      for(const overlay of snapshot.overlays)assert.equal(overlay.on,overlay.id%2===id%2);
      for(const lamp of snapshot.lamps)assert.equal(lamp.signal,lamp.id%2===id%2?'walk':'red');
      for(let i=0;i<4;i++)assert.equal(snapshot.rows[i],i%2===id%2?'walk':'red');
      assert.equal(snapshot.label,snapshot.clock);assert.equal(snapshot.ui,snapshot.clock.slice(0,-1));
      for(const line of snapshot.stopLines)assert.ok(line.axis==='ns'?line.x*line.z>0:line.x*line.z<0,'stop line must be on the incoming right-hand lane');
      assert.equal(snapshot.lamps.length,8);
      await page.locator('#pause-button').click();
      if(id===0||id===1)await page.screenshot({path:`artifacts/parallel-${axis}.png`,fullPage:true});
      results.push({crosswalk:id,parallelAxis:axis,movingCars:snapshot.cars.filter(c=>c.axis===axis).length,redCars:snapshot.cars.filter(c=>c.axis!==axis).length,pedestrianHeads:8,openCrosswalks:snapshot.overlays.filter(o=>o.on).map(o=>o.id)});
    }
    await page.locator('#camera-top').click();await page.waitForTimeout(700);await page.screenshot({path:'artifacts/parallel-top.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const selectRect=await page.locator('#crosswalk-select').boundingBox(),buttonRect=await page.locator('#cross-button').boundingBox();assert.ok(buttonRect.y>=selectRect.y+selectRect.height,'mobile controls must not cover the crossing selector');
    await page.screenshot({path:'artifacts/parallel-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);const report={passed:results.length,results,errors};fs.writeFileSync('artifacts/conflicts-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

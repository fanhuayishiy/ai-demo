const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
fs.mkdirSync('artifacts',{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.locator('#auto-button').click();
  await page.evaluate(()=>{window.countdownSamples=[];window.sampleCountdown=()=>{const s=__traffic.sim,c=s.signalClock,ui=document.querySelector('#countdown').dataset.remaining,label=__traffic.scene.phaseLabel.querySelector('b').textContent;countdownSamples.push({phase:s.phase,remaining:c.seconds,ui,scene:label,expected:c.text});window.sampleHandle=requestAnimationFrame(sampleCountdown);};requestAnimationFrame(sampleCountdown);});
  // Align a green with exactly three seconds remaining and force a higher allocation demand.
  await page.evaluate(()=>{const s=__traffic.sim;s.setDemand('ns',0);s.setDemand('ew',0);s.cars=[];for(let i=0;i<8;i++)s.spawnCar(i%2?'N':'S',-20-Math.floor(i/2)*6);s.enterPhase('NS_GREEN',12);s.elapsed=9;s.adaptTimer=1.5;window.countdownSamples=[];});
  await page.waitForFunction(()=>__traffic.sim.phase==='YELLOW',{},{timeout:5000});
  await page.waitForFunction(()=>__traffic.sim.phase==='ALL_RED',{},{timeout:5000});
  const samples=await page.evaluate(()=>{cancelAnimationFrame(sampleHandle);return countdownSamples});
  assert.ok(samples.length>120);
  assert.deepEqual(samples.filter(s=>s.ui!==(s.expected==='清空中'?'holding':String(s.remaining))||s.scene!==s.expected),[],'all frame snapshots must match the simulation and both displays');
  const sequence=phase=>[...new Set(samples.filter(s=>s.phase===phase).map(s=>s.remaining))];
  assert.deepEqual(sequence('NS_GREEN'),[3,2,1]);assert.deepEqual(sequence('YELLOW'),[3,2,1]);
  const drift=await page.evaluate(async()=>{const beforeTime=__traffic.sim.time,beforeWall=performance.now();while(performance.now()-beforeWall<500){}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{wall:(performance.now()-beforeWall)/1000,sim:__traffic.sim.time-beforeTime};});
  assert.ok(Math.abs(drift.wall-drift.sim)<.08,`visible frame catch-up failed ${JSON.stringify(drift)}`);
  await page.locator('#speed-button').click();await page.locator('#speed-button').click();
  const fast=await page.evaluate(async()=>{const t=__traffic.sim.time,n=performance.now();await new Promise(r=>setTimeout(r,500));return{wall:(performance.now()-n)/1000,sim:__traffic.sim.time-t};});
  assert.ok(Math.abs(fast.sim/fast.wall-4)<.25,`4x time ratio incorrect ${JSON.stringify(fast)}`);
  await page.evaluate(()=>{const s=__traffic.sim;s.autoDemo=false;s.cars=[];s.setDemand('ns',0);s.setDemand('ew',0);s.spawnCar('N',0);s.cars[0].speed=0;s.cars[0].desiredSpeed=0;s.enterPhase('ALL_RED',1.5);s.elapsed=3;});
  await page.waitForTimeout(700);
  assert.equal(await page.locator('#countdown').innerText(),'—');
  assert.ok((await page.locator('#signal-phase').innerText()).includes('等待车辆驶离'));
  assert.ok(await page.evaluate(()=>__traffic.scene.phaseLabel.textContent.includes('清空中')));
  assert.equal(await page.evaluate(()=>__traffic.sim.phaseDuration),1.5);
  await page.screenshot({path:'artifacts/countdown-holding.png',fullPage:true});
  await page.evaluate(()=>{__traffic.sim.cars=[]});await page.waitForFunction(()=>__traffic.sim.isGreen);
  await page.locator('#pause-button').click();const paused=await page.locator('#countdown').innerText();await page.waitForTimeout(350);assert.equal(await page.locator('#countdown').innerText(),paused);
  assert.deepEqual(errors,[]);
  const report={sampledFrames:samples.length,synchronized:true,greenSeconds:sequence('NS_GREEN'),yellowSeconds:sequence('YELLOW'),visibleFrameDriftSeconds:Math.abs(drift.wall-drift.sim),speedRatio:fast.sim/fast.wall,clearanceShowsHolding:true,pauseFreezesClock:true,errors};
  fs.writeFileSync('artifacts/countdown-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

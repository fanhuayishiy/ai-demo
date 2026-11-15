import test from 'node:test';
import assert from 'node:assert/strict';
const api = await import('../src/engine.js').catch(() => ({}));
function create(options) { assert.equal(typeof api.YardEngine, 'function', '需要独立的工程状态机'); return new api.YardEngine(options); }
function sample(stage, p) { assert.equal(typeof api.sampleWorld, 'function', '需要可重建的工程快照'); return api.sampleWorld(stage, p); }

test('八阶段可重建，主线分段编号与目标位置不变', () => {
  for(let stage=0;stage<8;stage++) { const s=sample(stage,.5); assert.equal(s.module.id,'B-07'); assert.deepEqual(s.module.target,[49.2,-1,-30]); assert.equal(s.stage,stage); }
});
test('分段从支墩交给转运车，再交给接驳支座和吊机', () => {
  assert.equal(sample(3,.03).module.carrier,'胎架');
  assert.equal(sample(3,.22).module.carrier,'转运车');
  assert.equal(sample(3,.50).module.carrier,'接驳支座');
  assert.equal(sample(3,.72).module.carrier,'龙门吊');
  assert.equal(sample(3,.98).module.carrier,'舰体支承');
});
test('分段全流程没有位置跳跃，起吊全程挂索，落稳后解钩', () => {
  let prev=sample(3,0).module.position;
  for(let i=1;i<=2000;i++) { const m=sample(3,i/2000).module; assert.ok(Math.hypot(...m.position.map((x,j)=>x-prev[j]))<2,'货物应连续移动'); if(i/2000>.57&&i/2000<.90) assert.ok(m.attached); prev=m.position; }
  assert.ok(sample(3,.91).module.installed); assert.ok(sample(3,.91).module.attached); assert.equal(sample(3,.96).module.attached,false);
});
test('未落稳时装配工留在警戒线外',()=>{ for(const p of [.58,.7,.86]) assert.equal(sample(3,p).workersAtSeam,false); assert.equal(sample(3,.98).workersAtSeam,true); });
test('挂索和解钩两端的吊具也连续，起升后吊具高于吊点',()=>{let old=sample(3,0).module.hook;for(let i=1;i<=2000;i++){const m=sample(3,i/2000).module;assert.ok(Math.hypot(...m.hook.map((x,j)=>x-old[j]))<2,'吊具不能跳位');if(i/2000>.57&&i/2000<.9)assert.ok(m.hook[1]-m.position[1]>=17);old=m.hook;}});
test('坞门仅在水位齐平且舰体起浮后打开，出坞时始终挂拖缆',()=>{
  for(let i=0;i<=1000;i++){const s=sample(5,i/1000); if(s.gate>0){assert.equal(s.water,0);assert.equal(s.ship.y,3);} if(s.ship.z < -16 && s.location!=='berth') assert.ok(s.towLines);}
});
test('完整移泊落在码头且系缆，跳回早期恢复干坞与关闭坞门',()=>{
  const berth=sample(5,1); assert.equal(berth.location,'berth');assert.ok(berth.mooring);assert.equal(berth.towLines,false);
  const early=sample(3,.3);assert.equal(early.water,-13.7);assert.equal(early.gate,0);assert.equal(early.ship.y,0);assert.equal(early.location,'dock');
});
test('岛体重吊连续，承重期间不解钩',()=>{ for(let p=.60;p<.91;p+=.01){ const s=sample(4,p);assert.ok(s.island.attached); } assert.ok(sample(4,.98).island.installed); });
test('暂停冻结工程、时钟和动画累计时间，允许手动定位',()=>{
  const e=create({stage:3,progress:.22,time:10});e.paused=true;const before=JSON.stringify(e.inspect());e.tick(25);assert.equal(JSON.stringify(e.inspect()),before);e.setTime(14);assert.equal(e.time,14);e.jump(6,.5);assert.equal(e.stage,6);assert.equal(e.paused,true);
});
test('工程播放不依赖日内时钟自动推进',()=>{const e=create({stage:1,time:10});e.clockAuto=false;e.tick(3);assert.equal(e.time,10);assert.ok(e.progress>0);});
test('夜间跳时把悬吊分段放回接驳支座，次日从该节点复工',()=>{
  const e=create({stage:3,progress:.75,time:10});e.setTime(22);assert.equal(e.progress,.5);assert.equal(e.world().module.carrier,'接驳支座');e.tick(1);assert.equal(e.progress,.5);e.setTime(8);e.tick(1);assert.ok(e.progress>.5);
});
test('夜间跳时在途拖带抵达系泊节点，坞门水位舰位一致',()=>{
  const e=create({stage:5,progress:.7,time:10});e.setTime(23);const s=e.world();assert.equal(s.location,'berth');assert.equal(s.water,0);assert.ok(s.mooring);assert.equal(s.towLines,false);
});
test('钢板吊运跳到夜间后落在切割台，空吊具撤回',()=>{const e=create({stage:1,progress:.2,time:10});e.setTime(23);assert.equal(e.progress,.32);});
test('海试转向连续，离泊先低速倒出，回港面向泊位',()=>{assert.equal(sample(7,.12).ship.heading,-Math.PI);let prev=sample(7,.31).ship.heading;for(let p=.3105;p<.84;p+=.0005){const h=sample(7,p).ship.heading;const d=Math.atan2(Math.sin(h-prev),Math.cos(h-prev));assert.ok(Math.abs(d)<.12,'连续航迹不应瞬间转向');prev=h;}assert.equal(sample(7,.92).ship.heading,-Math.PI);});
test('17点停止新任务，当前任务完成后停车；次日继续',()=>{
  const e=create({stage:1,progress:0,time:16.99});e.clockRate=.1;e.tick(.2);assert.ok(e.progress>0);for(let i=0;i<1000&&e.time<19;i++)e.tick(.1);const p=e.progress, stage=e.stage;e.tick(10);assert.equal(e.stage,stage);assert.equal(e.progress,p);e.setTime(8);e.tick(1);assert.ok(e.progress>0||e.stage>stage);
});
test('连续出坞任务在余下窗口不足时等待，次日开工',()=>{const e=create({stage:5,time:16.9});e.clockRate=.04;e.tick(1);assert.equal(e.progress,0);assert.equal(e.waiting,true);e.setTime(8);e.tick(1);assert.ok(e.progress>0);});
test('顺播八阶段一次，最终交付返港；暂停后的重播必须显式触发',()=>{
  const e=create({stage:0,time:8});e.clockAuto=false;e.rate=8;const seen=new Set();for(let i=0;i<1000;i++){seen.add(e.stage);e.tick(.2);}assert.equal(seen.size,8);assert.equal(e.stage,7);assert.equal(e.progress,1);assert.equal(e.auto,false);assert.equal(e.world().location,'berth');e.replay();assert.equal(e.progress,0);assert.equal(e.auto,true);
});
test('24 小时跨日不重置已经建造的结构，次日准备期不派发任务',()=>{const e=create({stage:4,progress:.54,time:23.99});e.clockSpeed=8;e.tick(.5);assert.equal(e.day,2);assert.ok(e.time<1);assert.equal(e.stage,4);assert.equal(e.progress,.54);e.setTime(7);e.tick(.5);assert.equal(e.progress,.54);e.setTime(8);e.tick(.5);assert.ok(e.progress>.54);});
test('起浮后夜间安全节点保留等水位、闭门和坞内系固',()=>{const e=create({stage:5,progress:.50,time:10});e.setTime(22);const s=e.world();assert.equal(e.progress,.44);assert.equal(s.water,0);assert.equal(s.gate,0);assert.equal(s.ship.y,3);assert.equal(s.dockMooring,true);assert.equal(s.towLines,false);});
test('手动选择的悬吊快照自动跨过 19 点，也要回到安全支座',()=>{const e=create({stage:3,progress:.75,time:18.99});e.clockRate=.1;e.taskActive=false;e.tick(.2);e.tick(.1);assert.equal(e.progress,.5);assert.equal(e.world().module.attached,false);});
test('正起吊时手动跳到早班准备，不在 08 点以前继续吊装',()=>{const e=create({stage:3,progress:.72,time:10});e.taskActive=true;e.setTime(7);e.tick(.5);assert.equal(e.progress,.5);assert.equal(e.world().module.carrier,'接驳支座');});
test('舰岛在 7.2 米支座上待吊，吊具和岛体全程连续',()=>{assert.equal(sample(4,.54).island.position[1],7.2);let old=sample(4,0).island;for(let i=1;i<=2000;i++){const s=sample(4,i/2000).island;assert.ok(Math.hypot(...s.position.map((v,j)=>v-old.position[j]))<2);assert.ok(Math.hypot(...s.hook.map((v,j)=>v-old.hook[j]))<2);old=s;}});
test('两座升降平台均从甲板出发并回平，试验中有下降行程',()=>{for(const p of[0,1]){assert.ok(Array.isArray(sample(6,p).elevatorOffsets));for(const y of sample(6,p).elevatorOffsets)assert.ok(Math.abs(y)<1e-8);}assert.ok(sample(6,.125).elevatorOffsets.every(y=>y>4));});

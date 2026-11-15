// Pure, deterministic engineering snapshots. All distances are metres.
export const VOXEL = .2;
export const GANGWAY={a:[272,4.2,-74],b:[255.6,18,-18]};
export const STAGES = [
  {name:'设计与放样', short:'设计放样', duration:20, verb:'从线条开始', detail:'蓝色包络是同一艘沧澜舰的目标轮廓。B-07 的排样、肋位与最终安装缺口一一对应。', area:'设计室 → 钢材车间'},
  {name:'钢材加工', short:'钢材加工', duration:28, verb:'让钢板有了形状', detail:'钢板经清理、划线与切割，送入成形工装。B-07 的外板、舱壁和加强材按同一编号配套。', area:'钢材堆场 → 加工车间'},
  {name:'分段制造与预舾装', short:'分段预制', duration:36, verb:'在封闭之前', detail:'胎架承托外板，肋骨与舱壁逐步组立。开口内的黄色管路、蓝色电缆托架先于封舱安装。', area:'加工车间 → 分段预制区'},
  {name:'干船坞合拢', short:'船坞合拢', duration:82, verb:'每一块，都有归处', detail:'跟随 B-07：转运车承接、接驳卸载、挂索起吊，最后缓缓落入左舷缺口。落稳解钩后才允许装配工接近。', area:'预制区 → 重载道 → 01 号船坞'},
  {name:'飞行甲板与舰岛安装', short:'甲板舰岛', duration:66, verb:'展开海上的平面', detail:'先装甲板下横梁，再依次铺设外飘甲板。舰岛从地面支座起吊，移至右舷基座并落座。', area:'甲板支承 → 右舷舰岛基座'},
  {name:'注水下水与拖带移泊', short:'注水出坞', duration:92, verb:'第一次，离开大地', detail:'撤除临时设施，关闭检查后注水。起浮、水位齐平、开门依次发生；拖轮挂缆，将舰体送至舾装码头。', area:'01 号船坞 → 港池 → 02 号泊位'},
  {name:'码头舾装与系泊试验', short:'码头舾装', duration:54, verb:'让钢铁开始呼吸', detail:'岸电和服务管线接入，甲板标线与舰岛设备逐项补齐。观察右舷升降平台空载往返和分区照明试验。', area:'02 号泊位 · 系泊状态'},
  {name:'海试与交付', short:'海试交付', duration:106, verb:'向海而生', detail:'解缆驶向近海，完成航行、转向与减速，再返港系泊。沧澜舰以完整舰容抵达交付节点。', area:'出港航道 → 近海试航区 → 返港'}
];
export const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix = (a,b,t)=>a+(b-a)*t;
export const smooth = t=>{t=clamp(t);return t*t*(3-2*t);};
const ramp=(p,a,b)=>smooth((p-a)/(b-a));
const lerp3=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export function path(points,t) {
  t=clamp(t)*(points.length-1);const i=Math.min(points.length-2,Math.floor(t));return lerp3(points[i],points[i+1],smooth(t-i));
}
export function curve(points,t){const f=clamp(t)*(points.length-1),i=Math.min(points.length-2,Math.floor(f)),u=f-i,u2=u*u,u3=u2*u;const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];return b.map((v,j)=>.5*(2*v+(-a[j]+c[j])*u+(2*a[j]-5*v+4*c[j]-d[j])*u2+(-a[j]+3*v-3*c[j]+d[j])*u3));}
export function shiftAt(h) {
  if(h>=6.5&&h<8)return {name:'准备班',mode:'prepare',work:false};
  if(h>=8&&h<17)return {name:'日班施工',mode:'work',work:true};
  if(h>=17&&h<19)return {name:'收尾退场',mode:'closing',work:false};
  return {name:'夜间值守',mode:'night',work:false};
}
export function safeProgress(stage,p) {
  if(stage===1&&p<.32)return p<.13?0:.32;
  if(stage===3) return p<.18?0:p<.90?.5:1;
  if(stage===4&&p>.56&&p<.94)return .54;
  if(stage===5) return p<.42?0:p<.54?.44:1;
  if(stage===7&&p>.08&&p<.98)return 1;
  return p;
}
function moduleState(stage,p) {
  const target=[49.2,-1,-30];let position=[-180,17,100],truck=[-227,4.6,100],lift=0,attached=false,installed=stage>3,carrier='胎架',hook=[-25,56,-30];
  let operation='胎架组立 · 预舾装';
  if(stage<3) {carrier=stage<2?'配套板件':'胎架';operation=stage===0?'排样放样':stage===1?'切割成形 · 配套码放':'肋骨组立 · 管路预装';}
  if(stage===3) {
    if(p<.10){truck=lerp3([-227,4.6,100],[-180,4.6,100],ramp(p,0,.10));operation='转运车进入支墩间隙';}
    else if(p<.18){truck=[-180,4.6,100];lift=ramp(p,.10,.18);position[1]+=lift*.8;carrier=p<.13?'胎架':'转运车';operation='货台抬升 · 承接分段';}
    else if(p<.39){truck=path([[-180,4.6,100],[-45,4.6,100],[-45,4.6,-30],[-25,4.6,-30]],(p-.18)/.21);position=[truck[0],17.8,truck[2]];lift=1;carrier='转运车';operation='重载道运输 · 转弯减速';}
    else if(p<.46){truck=[-25,4.6,-30];lift=1-ramp(p,.39,.46);position=[-25,17+lift*.8,-30];carrier=p<.43?'转运车':'接驳支座';operation='货台下降 · 接驳卸载';}
    else {truck=path([[-25,4.6,-30],[-45,4.6,-30],[-45,4.6,20],[-90,4.6,20]],ramp(p,.46,.56));position=[-25,17,-30];carrier='接驳支座';operation='空车退出 · 司索挂接';}
    if(p>=.52&&p<.57)hook=[-25,mix(56,35,ramp(p,.52,.57)),-30];
    if(p>=.56)attached=true;
    if(p>=.57&&p<.66){position=[-25,mix(17,36,ramp(p,.57,.66)),-30];carrier='龙门吊';operation='垂直起升 · 越过坞壁';}
    if(p>=.66&&p<.79){position=lerp3([-25,36,-30],[target[0],36,-30],ramp(p,.66,.79));carrier='龙门吊';operation='大车就位 · 横梁移载';}
    if(p>=.79&&p<.90){position=lerp3([target[0],36,-30],target,ramp(p,.79,.90));carrier='龙门吊';operation='低速下放 · 对位落座';}
    if(p>=.90){position=[...target];carrier='舰体支承';installed=true;operation=p<.94?'落稳确认 · 解除吊索':'接缝定位 · 检查焊接';}
    if(p>=.57&&p<.94)hook=[position[0],position[1]+18,position[2]];
    if(p>=.94){attached=false;hook=[target[0],mix(17,56,ramp(p,.94,1)),-30];}
  }
  if(stage>3){position=[...target];carrier='舰体支承';operation='B-07 已合拢 · 结构继承';}
  return {id:'B-07',target,position,carrier,operation,truck,lift,attached,installed,hook};
}
function islandState(stage,p) {
  let position=[-18,7.2,-110],attached=false,installed=stage>4,hook=[-18,56,-110];
  const target=[82,15.8,15];
  if(stage===4){
    attached=p>=.59&&p<.94;
    if(p>=.56&&p<.60)hook=[-18,mix(56,36.2,ramp(p,.56,.60)),-110];
    if(p>=.60&&p<.69)position=[-18,mix(7.2,29,ramp(p,.60,.69)),-110];
    if(p>=.69&&p<.82)position=lerp3([-18,29,-110],[82,29,15],ramp(p,.69,.82));
    if(p>=.82&&p<.94)position=lerp3([82,29,15],target,ramp(p,.82,.94));
    if(p>=.94){position=[...target];installed=true;}
    if(p>=.60&&p<.94)hook=[position[0],position[1]+29,position[2]];
    if(p>=.94)hook=[82,mix(44.8,59,ramp(p,.94,1)),15];
  }
  if(stage>4)position=[...target];
  return {position,attached,installed,hook};
}
export function sampleWorld(stage,p=0) {
  stage=clamp(Math.floor(stage),0,7);p=clamp(p);
  const module=moduleState(stage,p);let water=-13.7,gate=0,ship={x:60,y:0,z:-15,heading:0},location='dock',towLines=false,mooring=false,speed=0;
  if(stage===5){
    water=mix(-13.7,0,ramp(p,.12,.42));ship.y=clamp(water+3,0,3);gate=ramp(p,.45,.52);
    if(p>=.54&&p<.72){ship.z=mix(-15,-345,ramp(p,.54,.72));towLines=true;location='tow';}
    if(p>=.72&&p<.86){const a=ramp(p,.72,.86)*Math.PI;ship.x=60+80*(1-Math.cos(a));ship.z=-345-80*Math.sin(a);ship.heading=-a;towLines=true;location='tow';}
    if(p>=.86&&p<.99){ship.x=220;ship.z=mix(-345,-35,ramp(p,.86,.99));ship.heading=-Math.PI;towLines=true;location='tow';}
    if(p>=.52&&p<.54)towLines=true;
    if(p>=.99){ship={x:220,y:3,z:-35,heading:-Math.PI};mooring=true;location='berth';}
    speed=towLines?2.2*Math.sin(clamp((p-.54)/.45)*Math.PI):0;
  }
  if(stage>=6){water=0;gate=1;ship={x:220,y:3,z:-35,heading:-Math.PI};location='berth';mooring=true;}
  if(stage===7&&p>=.08&&p<.97){
    mooring=false;location='tow';towLines=true;
    if(p<.23){ship={x:220,y:3,z:mix(-35,-390,ramp(p,.08,.23)),heading:-Math.PI};speed=2.5;}
    else if(p<.30){ship={x:220,y:3,z:-390,heading:mix(-Math.PI,-.1974,ramp(p,.23,.30))};speed=.7;}
    else if(p<.84){
      const pts=[[220,3,-390],[250,3,-540],[80,3,-650],[-140,3,-590],[-225,3,-430],[-100,3,-335],[110,3,-360],[220,3,-450],[220,3,-350]];
      const t=clamp((p-.30)/.54),xyz=curve(pts,t),before=curve(pts,Math.max(0,t-.0005)),after=curve(pts,Math.min(1,t+.0005)),heading=Math.atan2(-(after[0]-before[0]),-(after[2]-before[2]));
      speed=14*Math.sin(Math.PI*t)**.6;ship={x:xyz[0],y:3,z:xyz[2],heading,pitch:-speed*.0005,roll:Math.sin(t*Math.PI*6)*speed*.0005};location='sea';towLines=false;
    } else{ship={x:220,y:3,z:mix(-350,-35,ramp(p,.84,.97)),heading:-Math.PI};speed=2;}
  }
  return {stage,p,module,island:islandState(stage,p),water,gate,ship,location,towLines,mooring,speed,
    hullCount:stage<3?0:stage===3?12+Math.floor(ramp(p,0,.9)*3):16,
    deck:stage<3?0:stage===3?.12:stage===4?mix(.12,1,ramp(p,0,.55)):1,
    fittings:stage<6?0:stage===6?p:1,
    elevatorOffsets:stage===6?[0,1].map(i=>Math.sin(p*Math.PI*4+i*.4*Math.sin(p*Math.PI))**2*8):[0,0],
    gangway:stage===6||(stage===7&&location==='berth'),
    scaffold:stage===3||stage===4||(stage===5&&p<.10),
    workersAtSeam:stage===3&&p>=.94,
    dockMooring:stage===5&&p>=.40&&p<.54,
    delivered:stage===7&&p>=.99};
}
export class YardEngine {
  constructor({stage=3,progress,time=10.5}={}) {this.stage=stage;this.progress=progress??(stage===3?.22:0);this.time=time;this.elapsed=0;this.day=1;this.rate=1;this.clockRate=1/60;this.clockSpeed=1;this.clockAuto=true;this.auto=true;this.paused=false;this.waiting=false;this.taskActive=false;this.notice='';}
  inspect(){return {stage:this.stage,progress:this.progress,time:this.time,elapsed:this.elapsed,day:this.day,auto:this.auto,paused:this.paused,waiting:this.waiting};}
  world(){return {...sampleWorld(this.stage,this.progress),shift:shiftAt(this.time)};}
  jump(stage,p=0){this.stage=clamp(stage,0,7);this.progress=clamp(p);this.taskActive=false;this.waiting=false;if(['night','prepare'].includes(shiftAt(this.time).mode))this.makeSafe();}
  makeSafe(){const next=safeProgress(this.stage,this.progress);if(next!==this.progress)this.notice='已转入安全支承或系泊节点';this.progress=next;this.taskActive=false;}
  setTime(h){this.time=((Number(h)%24)+24)%24;if(['night','prepare'].includes(shiftAt(this.time).mode))this.makeSafe();this.waiting=false;}
  replay(all=false){if(all)this.stage=0;this.progress=0;this.time=10;this.auto=true;this.paused=false;this.taskActive=false;this.waiting=false;this.notice='工序已从起点重播';}
  tick(dt){
    if(this.paused||dt<=0)return;
    this.elapsed+=dt;const shift=shiftAt(this.time);
    if(this.clockAuto){const next=this.time+dt*this.clockRate*this.clockSpeed;if(next>=24)this.day+=Math.floor(next/24);this.time=next%24;}
    if(shift.mode==='night'||shiftAt(this.time).mode==='night'){this.makeSafe();this.waiting=this.auto;return;}
    if(!this.auto)return;
    if(!this.taskActive){
      const remaining=STAGES[this.stage].duration*(1-this.progress)/this.rate;
      const reserved=remaining*this.clockRate*this.clockSpeed*(this.clockAuto?1:0);
      if(!shift.work||((this.stage===5||this.stage===7)&&this.time+reserved>19)){this.waiting=true;return;}
      this.taskActive=true;
    }
    this.waiting=false;this.progress=clamp(this.progress+dt*this.rate/STAGES[this.stage].duration);
    if(this.progress>=1){this.taskActive=false;if(this.stage<7){this.stage++;this.progress=0;}else {this.auto=false;this.notice='海试完成 · 沧澜舰已返港交付';}}
  }
}

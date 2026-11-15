import {THREE,Batch,C,group,box,sign,groundText,line,stand,rails} from './geometry.js';
export function buildYard(scene){
  const root=group(scene),land=new Batch(),detail=new Batch(),road=new Batch();
  land.box(0,-5,610,2000,16,550,0x92aba0);
  // Continuous land masses, with an actual opening for the sunken dry dock.
  land.box(-168,-5,65,368,18,550,C.concrete);
  land.box(60,-5,240,88,18,190,C.concrete);
  land.box(128,-5,65,48,18,160,C.concrete);
  land.box(128,-5,-112,48,18,154,C.concrete);
  land.box(246,-5,244,188,18,198,C.concrete);
  land.box(278,-5,-20,28,18,330,C.concrete);
  land.box(60,-14.6,-20,88,1.2,330,0x647879);
  land.box(15,-5,-20,3,18,330,0x899c9d);land.box(105,-5,-20,3,18,330,0x899c9d);
  land.box(60,-5,146,94,18,3,0x899c9d);
  // Top coping stones, stairs on the inner wall, keel and bilge blocks.
  for(const x of[12,108])detail.box(x,4.3,-20,5,.6,336,C.edge);
  for(let z=-176;z<143;z+=8){detail.box(15.1,-4,z,.4,16,.4,0x899385);detail.box(104.9,-4,z,.4,16,.4,0x899385);}
  const blocks=new Batch();for(let z=-140;z<122;z+=10){blocks.box(60,-12.8,z,3.8,1.6,3.2,0xa6a999);blocks.box(60,-11.5,z,3,1,3,0x72684d);for(const x of[48,72]){blocks.box(x,-12.4,z,3,2,2.8,0x929e95);blocks.box(x,-10.6,z,2.4,1.6,2.6,0x826c53);}}blocks.finish(root);
  for(let z=-160;z<130;z+=46) {for(let k=0;k<18;k++)detail.box(16.5+k*.55,-13.6+k,z,1.2,.6,4,C.edge);}
  // Main 32 m wide heavy haul road, connecting workshop doors to the handoff.
  road.box(-57,4.025,52,48,.05,472,C.asphalt);road.box(-153,4.03,100,192,.06,40,C.asphalt);
  road.box(-160,4.03,254,300,.06,26,C.asphalt);road.box(105,4.03,166,330,.06,24,C.asphalt);
  for(let z=-176;z<280;z+=16)detail.box(-57,4.09,z,.5,.06,7,C.white);
  for(const x of[-81,-33])detail.box(x,4.22,50,.4,.2,470,C.yellow);
  for(let x=-232;x<0;x+=12)detail.box(x,4.1,82,5,.08,.4,C.yellow);
  // Safe pedestrian network is separate from the route used by large loads.
  for(const [x,z,w,d] of[[-112,52,6,416],[-208,4,196,6],[-3,-15,8,330],[-59,158,120,8],[134,158,286,8],[276,-15,8,332]]){
    road.box(x,4.07,z,w,.06,d,0x668e86);for(const dx of[-1,1]){if(w<d)detail.box(x+dx*w/2,4.14,z,.2,.06,d,C.white);else detail.box(x,4.14,z+dx*d/2,w,.06,.2,C.white);}}
  // Gantry rail pair and a recessed transverse gate pocket.
  rails(detail,-85,126,-174,132,4.8);detail.box(-18,-5,-187,168,18,8,0x536a6d);
  const gate=group(root,60,-5,-184);box(gate,0,0,0,88,18,5.6,0x87988e);const gb=new Batch();for(let x=-40;x<=40;x+=8)gb.box(x,0,-3,1,15,1,0x61787b);gb.box(0,8.4,0,88,1.2,6.5,C.yellow);gb.finish(gate);sign(gate,'01  ·  坞门',0,3,-3.04,20,{fg:'#e6edce'}).rotation.y=Math.PI;
  // Warning line, flange seats and load handoff supports.
  for(let i=0;i<12;i++){detail.box(-25,4.12,-49+i*3.2,29,.08,.25,C.yellow);}
  stand(root,-25,-30);stand(root,-180,100);stand(root,-18,-110,10,22);
  // Access tower for riggers to reach the upper lifting eyes before clearance.
  const rigTower=new Batch();for(const x of[-42,-38])for(const z of[-47,-13])rigTower.box(x,16,z,.4,24,.4,C.light);rigTower.box(-40,28.6,-30,4,.4,36,C.dark);for(let y=5;y<29;y+=.6)rigTower.box(-42,y,-48,2,.2,.4,C.yellow);rigTower.box(-40,30,-48,4,.2,.2,C.yellow);rigTower.finish(root);
  for(const x of[-45,-5])for(const z of[-50,-10])detail.box(x,4.3,z,2,.5,2,C.red);
  groundText(root,'重载转运道  /  SPMT',-58,216,27);groundText(root,'B-07  接驳位',-25,-58,26,{fg:'#665c37'});
  groundText(root,'01  DRY DOCK',59,159,58,{fg:'#3e6269'});groundText(root,'02  OUTFITTING',278,119,20,{fg:'#42676a'}).rotation.z=Math.PI/2;
  // Machine shop. Open observation side exposes the cutting bed and plate racks.
  const machine=group(root,-254,4,-53);const m=new Batch();
  m.box(0,0,0,108,.2,126,0xa0ada7);m.box(-52,14,0,4,28,126,0x9fafa8);m.box(0,14,-61,104,28,4,0x91a5a1);
  for(const z of[-54,-24,6,54])for(const x of[-51,51])m.box(x,16,z,1.6,32,1.6,C.dark);
  m.box(0,31,-24,112,2,82,0x728e92);m.box(-36,31,34,40,2,38,0x728e92);
  for(let x=-52;x<54;x+=5)m.box(x,32,-24,.5,.5,82,0xa6bbba);
  for(let z=-52;z<20;z+=18)m.box(10,32.2,z,20,.6,6,0xafc6c6);
  m.box(0,.6,27,56,1.2,26,C.dark);for(let z=16;z<39;z+=2)m.box(0,1.2,z,54,.2,.4,C.light);
  m.box(0,1.4,26,50,.2,20,C.dark);m.box(4,3,27,2,4,28,C.yellow);m.box(4,4.2,27,58,2,1.2,C.orange);
  for(const x of[-29,29])m.box(x,2.2,27,1.6,4.4,1.6,C.dark);m.box(0,2.2,-30,30,4.4,14,0x7c9c92);
  m.box(30,.8,48,2,1.6,2,C.dark);m.box(30,1.8,48,2,.4,2,C.blue);
  for(let j=0;j<3;j++)m.box(-30+j*28,3,56,22,3,8,C.red);
  m.finish(machine);sign(machine,'01  钢材加工车间',-4,25,63.2,65,{fg:'#e3e7cc'});
  const nesting=group(machine,0,1.86,26);const outline=new Batch();for(const z of[-8,8])outline.box(0,.05,z,42,.08,.14,C.yellow);for(const x of[-21,21])outline.box(x,.05,0,.14,.08,16,C.yellow);for(let x=-14;x<20;x+=7)outline.box(x,.05,0,.12,.08,16,C.yellow);outline.finish(nesting,false);groundText(machine,'B-07',0,26,14,{fg:'#ffdf88'}).position.y=1.9;
  const cutter=group(machine,0,3.8,27);box(cutter,0,0,0,2,2,2,C.yellow);box(cutter,0,-1.2,0,.4,1,.4,C.dark);
  // Prefabrication hall and its open-sided assembly bay. 38m clear height.
  const prefab=group(root,-193,4,187),f=new Batch();
  f.box(0,0,0,118,.2,150,0xa3b1a9);f.box(0,17,73,118,34,3,0x97a8a2);f.box(-58,17,24,3,34,100,0x92a39d);
  for(const z of[-112,-60,-20,24,72])for(const x of[-57,57])f.box(x,20,z,2,40,2,C.dark);
  f.box(0,39,-16,122,2,184,0x68858b);for(let x=-60;x<61;x+=6)f.box(x,40.2,-16,.5,.5,184,0x9db2af);
  for(let z=-82;z<65;z+=24)f.box(-17,40.4,z,35,.5,8,0xaac8c7);
  f.box(0,33,-108,122,4,2,C.dark);f.finish(prefab);sign(prefab,'02  分段组立 · 预舾装',0,32.5,-109.2,95,{fg:'#f0dba3'}).rotation.y=Math.PI;
  const assemblyRacks=new Batch();for(let z=160;z<=220;z+=28){for(let y=0;y<5;y++)assemblyRacks.box(-170,5+y*.65,z,26,.5,20,y%2?C.light:C.red);}assemblyRacks.finish(root);
  groundText(root,'B-07  分段组立',-180,70,45,{fg:'#4e6563'});
  // Plate stock yard, matched cut parts and a moving entry truck.
  const stock=new Batch();for(let row=0;row<3;row++)for(let col=0;col<3;col++){let x=-309+col*24,z=-168+row*20;stock.box(x,4.6,z,22,1,16,0x786b56);for(let k=0;k<4+col;k++)stock.box(x,5.3+k*.5,z,20,.4,14,(row+col+k)%3?0x8a7163:0x927b6b);}
  for(let x=-328;x<-237;x+=18)stock.box(x,8,-199,1,8,1,C.dark);stock.box(-285,12,-199,100,2,2,C.orange);stock.finish(root);
  groundText(root,'钢材堆场',-283,-126,61,{fg:'#4b6966'});
  const parts=group(root,-191,4,33),p=new Batch();for(let i=0;i<6;i++){p.box(-12+i*4,2,0,2,4,17,i%2?C.red:C.light);for(let z=-6;z<8;z+=5)p.box(-12+i*4,4.4,z,1.2,.6,1,C.yellow);}p.finish(parts);sign(parts,'B-07  配套板件',0,6,9,29,{fg:'#503f27',bg:'#eac466'});
  // Quayside bollards, rubber fenders and electric services.
  for(let z=-172;z<142;z+=22){for(const x of[9,111,266,289]){detail.box(x,4.5,z,1,1,1,C.dark);detail.box(x,5,z,2,.4,1.2,C.dark);}detail.box(264,0,z,1.2,5,4,0x283d40);}
  for(let z=-160;z<130;z+=58){detail.box(280,5,z,2.5,2,2,C.blue);detail.box(281,7,z,2,.8,1,C.white);}
  // Back-of-yard service buildings, parked vehicles, perimeter and trees.
  for(const [x,z,w,d,h] of[[-283,212,44,48,12],[-285,286,48,28,8],[-195,293,75,30,10],[188,263,82,36,14],[289,257,48,46,11]]){
    land.box(x,4+h/2,z,w,h,d,0x9baea4);land.box(x,4+h,z,w+2,.8,d+2,0x607d82);for(let xx=x-w/2+5;xx<x+w/2;xx+=7)detail.box(xx,9,z-d/2-.1,3,2,.2,C.blue);}
  sign(root,'海 岬 造 船',-194,16,276.7,48,{fg:'#dfe9d6'});groundText(root,'陆侧进场  →',-247,254,55);
  const fence=new Batch();for(let z=-202;z<330;z+=10)fence.box(-344,6,z,.4,4,.4,C.dark);fence.box(-344,7,60,.25,.3,534,C.dark);for(let x=-340;x<342;x+=10)fence.box(x,6,334,.4,4,.4,C.dark);fence.box(0,7,334,680,.3,.3,C.dark);
  for(let i=0;i<32;i++){const x=-330+i*20,z=310+(i%3)*5;fence.box(x,8,z,1.2,8,1.2,0x716f56);fence.box(x,14,z,7,7,7,0x638476);fence.box(x+1,18,z,5,4,5,0x7d9980);}
  fence.finish(root);land.finish(root);road.finish(root);detail.finish(root);
  // Small jib crane on the outfitting pier.
  const qc=new Batch();qc.box(278,12,-96,5,16,5,C.dark);qc.box(278,30,-96,3,24,3,C.orange);qc.beam([278,39,-96],[246,48,-94],2,C.orange);qc.beam([278,32,-96],[246,48,-94],1,C.yellow);qc.finish(root);line(root,[[246,48,-94],[246,20,-94]],0x263f47);
  // Simple industrial skyline gives the port a second scale.
  const skyline=new Batch();for(let i=0;i<18;i++){const x=-720+i*65,h=12+(i*17%45);skyline.box(x,h/2-2,560,30+(i%4)*12,h,30,0x98b0b1);if(i%3===0){skyline.box(x,h+12,560,2,24,2,0x839d9f);skyline.box(x+16,h+24,560,40,2,2,0x839d9f);}}skyline.finish(root,false);
  return {root,gate,machine,prefab,cutter,parts,nesting};
}

export function makeGantry(scene,{z=-30,height=64,secondary=false}={}) {
  const root=group(scene,0,0,z),b=new Batch();const xs=[-85,126],span=xs[1]-xs[0],center=(xs[0]+xs[1])/2;
  for(const x of xs){b.box(x,8.4,0,8,4,22,C.orange);b.box(x,height/2+5,0,5,height-10,9,C.orange);b.box(x,height-6,0,9,12,10,C.orange);for(const dz of[-9,9]){b.box(x,6.6,dz,7,1.2,4,C.dark);for(const dx of[-3,3])b.box(x+dx,5.8,dz,1,1.6,3,0x354a50);}b.beam([x,12,-9],[x,height-12,0],1.5,C.yellow);b.beam([x,12,9],[x,height-12,0],1.5,C.yellow);}
  for(const dz of[-4.6,4.6]){b.box(center,height,dz,span+12,7,3.2,C.orange);b.box(center,height+4,dz,span+16,1.2,4,C.yellow);}
  for(let x=-86;x<131;x+=12)b.box(x,height,-0,1.5,3,7,C.yellow);
  b.box(-80,height-8,0,7,8,8,C.orange);b.box(-80,height-7,-4.1,5,3,.3,C.blue);
  // Maintenance ladder and gallery use the same .2m grid.
  for(let y=7;y<height-2;y+=1)b.box(-88,y,4,1.4,.2,.3,C.dark);
  for(let x=-85;x<127;x+=4)b.box(x,height+6,-6,.2,2,.2,C.white);b.box(center,height+7,-6,216,.2,.2,C.white);
  b.finish(root);sign(root,secondary?'海岬 02':'海 岬 造 船  ·  01',center,height,-6.22,secondary?40:88,{fg:'#604c2d',font:64}).rotation.y=Math.PI;sign(root,secondary?'海岬 02':'海 岬 造 船  ·  01',center,height,6.22,secondary?40:88,{fg:'#604c2d',font:64});
  const trolley=group(root,0,height-4,0);box(trolley,0,0,0,15,3,12,C.dark);box(trolley,0,2,0,9,1,10,C.yellow);
  const spreader=group(scene);const sp=new Batch();for(const x of[-7,7])sp.box(x,0,0,.6,.8,26,C.orange);for(const dz of[-12,12])sp.box(0,0,dz,15,.8,.8,C.orange);sp.box(0,1,0,2,2,2,C.dark);sp.finish(spreader);
  return {root,trolley,spreader,height};
}

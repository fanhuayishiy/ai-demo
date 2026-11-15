import {THREE,Batch,C,group,box,sign,line} from './geometry.js';
import {clamp,mix,GANGWAY} from './engine.js';
const CENTERS=[-117,-83,-49,-15,19,53,87,119];
export function hullWidth(z){if(z<-105)return Math.round(mix(3.2,20.4,clamp((z+134)/29))*5)/5;if(z>108)return Math.round(mix(20.4,14.6,clamp((z-108)/27))*5)/5;return 20.4;}
function section(parent,index){
  const half=index%2===0?-1:1,zc=CENTERS[Math.floor(index/2)],pivot=[half*10.8,-1,zc],root=group(parent,...pivot),skin=new Batch(),ribs=new Batch();
  const add=(b,x,y,z,w,h,d,color)=>b.box(x-pivot[0],y-pivot[1],z-pivot[2],w,h,d,color);
  const za=Math.max(-134,zc-17),zb=Math.min(135,zc+17);
  for(let z=za+1;z<zb;z+=2){const w=hullWidth(z);add(skin,half*w*.28,-10.6,z,w*.56,.8,1.96,C.red);
    for(let y=-9;y<11;y+=2){const factor=y<-7?.60:y<-3?.78:y<1?.92:1;const xx=half*w*factor;add(skin,xx,y,z,1,1.96,1.96,y===-3?C.dark:y<-3?((Math.floor(z/2)%3)===0?0xa9604c:C.red):((Math.floor(z/4)%4)===0?0x80939b:C.steel));}
  }
  for(let z=za+1;z<zb;z+=4){const w=hullWidth(z);for(const y of[-8,-2,5,10]){const factor=y<-7?.60:y<0?.80:1;add(ribs,half*w*factor/2,y,z,w*factor,.6,.8,0xaab4b0);}for(let y=-8;y<10;y+=3){const factor=y<-7?.60:y<0?.80:1;add(ribs,half*w*factor,y,z,.8,3,.8,0xa9b2ac);}add(ribs,half*.6,0,z,.8,21,.8,C.light);}
  for(const x of[half*4,half*10,half*16]){add(ribs,x,-6,zc,.6,.6,zb-za,C.light);add(ribs,x,6,zc,.4,.6,zb-za,0x92a8aa);}
  // Partial bulkheads leave a real opening into the pre-outfitted compartment.
  for(const z of[za+.3,zb-.3]){const w=hullWidth(z);add(ribs,half*w/2,4,z,w,4,.6,C.light);add(ribs,half*w/2,-7,z,w,5,.6,C.light);add(ribs,half*w*.85,-1,z,w*.25,8,.6,C.light);}
  for(const dz of[-12,12])for(const x of[half*3,half*17])add(ribs,x,11.4,zc+dz,1,.8,1.2,C.yellow);
  const skinMesh=skin.finish(root),ribMesh=ribs.finish(root);root.userData={name:index===6?'左舷主线分段':'舰体分段',id:`B-${String(index+1).padStart(2,'0')}`,pivot};
  const s=sign(root,root.userData.id,half*(hullWidth(zc)+.6)-pivot[0],5-pivot[1],0,index===6?12:8,{fg:index===6?'#253c3e':'#e1e0c9',bg:index===6?'#edc04f':'',font:60});s.rotation.y=half<0?-Math.PI/2:Math.PI/2;
  if(index===6){const fittings=new Batch();for(const x of[-17,-14]){add(fittings,x,-1,zc,.4,.4,28,C.yellow);add(fittings,x,-.4,zc+12,.4,1.2,.4,C.yellow);}add(fittings,-6,1.2,zc,1.6,.4,27,C.blue);for(let z=zc-13;z<zc+14;z+=2)add(fittings,-6,1.6,z,1.8,.3,.4,C.light);add(fittings,-9,-4,zc+3,4,.8,5,C.dark);add(fittings,-9,-3.2,zc+3,2,.8,3,C.green);fittings.finish(root);}
  return {root,skin:skinMesh,ribs:ribMesh,label:s,index,pivot};
}
export function makeShip(scene){
  const root=group(scene,60,0,-15),chunks=[];
  for(let i=0;i<16;i++){if(i===6)continue;chunks.push(section(root,i));}
  const module=section(scene,6);
  const keel=new Batch();keel.box(0,-10,0,2,2,265,C.red);for(let z=-130;z<135;z+=6){keel.box(0,-8,z,18,.5,.8,C.light);keel.box(0,1.6,z,.8,20,.8,C.light);}keel.finish(root);
  const keelMesh=root.children[root.children.length-1];
  // Deck strip panels: flat, stepped and with a port-side angled landing area.
  const deck=[],deckSupports=group(root),db=new Batch();
  const deckHalf=z=>z<-105?mix(24,31,(z+134)/29):z>110?30.4:31.6;
  for(let z=-130;z<132;z+=8.4){const w=deckHalf(z);let left=-w-(z>-70&&z<112?4.4:0);const panel=group(root);const b=new Batch();b.box((left+w)/2,14.4,z,w-left,1.2,8.2,Math.round(z)%3?0x5d747f:0x667d87);for(const x of[left+.5,w-.5])b.box(x,15.1,z,.4,.2,8,C.white);b.finish(panel);deck.push(panel);
    db.box(0,12.5,z,w*2,1,1,C.light);for(const side of[-1,1])db.beam([side*19,7,z],[side*(w-1),13.8,z],.8,0x839ca2);
  }db.finish(deckSupports);
  // Landing marks and two forward launch lanes. All appear during outfitting.
  const marks=group(root),mb=new Batch();for(let z=-105;z<109;z+=12){const x=mix(3,-26,(z+105)/213);mb.box(x,15.07,z,.4,.2,6,C.white,.135);}
  for(const off of[-7,7]){mb.beam([off+3,15.08,-105],[off-26,15.08,108],.2,C.white);}
  for(const x of[10,22]){mb.box(x,15.08,-58,.4,.08,108,C.yellow);for(let z=-105;z<-10;z+=10)mb.box(x+1.2,15.08,z,.2,.08,4,C.white);}
  for(let z=75;z<110;z+=4)mb.box(-8,15.1,z,24,.08,.3,C.white);mb.finish(marks,false);
  const n=sign(marks,'08',14,15.18,-118,13,{fg:'#e6e8d9',font:90});n.rotation.x=-Math.PI/2;
  // Complete deck edge rails, catwalks and grouped night fixtures.
  const edge=group(root),eb=new Batch();for(let z=-124;z<128;z+=4){const w=deckHalf(z);for(const x of[-w-4.4,w]){if(x<0&&z<-70)continue;eb.box(x,15.5,z,.2,1.2,.2,C.light);eb.box(x,16.1,z,.2,.2,4,C.light);}}
  for(let z=-90;z<115;z+=20){eb.box(33,11,z,3,1.2,7,C.dark);eb.box(34,12,z,.2,1.4,6,C.light);}eb.finish(edge);
  // Starboard lifts move vertically in their own guide rails.
  const elevators=[],elevatorGuides=[];for(const z of[-45,82]){const el=group(root,33.2,14.4,z),b=new Batch();b.box(0,0,0,12,1.2,18,0x708993);for(const zz of[-8,8])b.box(0,.7,zz,11,.12,.2,C.yellow);b.finish(el);const guideRoot=group(root),guide=new Batch();for(const zz of[-9,9])guide.box(27,7.5,z+zz,.8,15,.8,C.dark);guide.finish(guideRoot);elevatorGuides.push(guideRoot);elevators.push(el);}
  const island=makeIsland(scene);
  const islandSeat=group(root),seat=new Batch();seat.box(22,15.4,30,12.4,.8,34.4,C.dark);for(const z of[14,46])for(const x of[17,27])seat.box(x,15.9,z,.8,.2,1.2,C.yellow);seat.finish(islandSeat);
  const ghost=group(root),gm=new THREE.MeshBasicMaterial({color:0x7ac8cf,wireframe:true,transparent:true,opacity:.27,depthWrite:false});
  for(let z=-126;z<130;z+=17){const w=hullWidth(z);const mesh=new THREE.Mesh(new THREE.BoxGeometry(w*2,22,16.8),gm);mesh.position.set(0,1,z);ghost.add(mesh);}
  for(let z=-126;z<130;z+=17){const w=deckHalf(z);const mesh=new THREE.Mesh(new THREE.BoxGeometry(w*2,1,16.8),gm);mesh.position.set(0,14.4,z);ghost.add(mesh);}
  // Ground-supported scaffold galleries, removed before flooding.
  const scaffold=group(scene),sb=new Batch();for(let z=-64;z<5;z+=12){for(const x of[36,84]){for(const y of[5,11]){sb.box(x,y,z,5.6,.4,10,C.light);for(const dx of[-2.6,2.6]){sb.box(x+dx,y+1,z,.2,2,.2,0xa79c74);sb.box(x+dx,y+2,z,.2,.2,10,0xa79c74);}}for(const dz of[-4,4])sb.box(x,-1,z+dz,.4,26,.4,C.light);sb.box(x<60?39:81,11,z,2,.4,4,C.yellow);}}
  for(let k=0;k<24;k++)sb.box(16+k*.8,4+k*.3,-64,1.4,.4,3,C.yellow);sb.finish(scaffold);
  const gangway=group(scene),gb=new Batch(),ga=GANGWAY.a,gz=GANGWAY.b,angle=Math.atan2(gz[0]-ga[0],gz[2]-ga[2]);for(let i=0;i<=48;i++){const t=i/48,x=mix(ga[0],gz[0],t),y=mix(ga[1],gz[1],t),z=mix(ga[2],gz[2],t);gb.box(x,y,z,3,.2,1.4,C.light,angle);if(i%3===0)for(const side of[-1,1])gb.box(x+Math.cos(angle)*1.6*side,y+1,z-Math.sin(angle)*1.6*side,.2,2,.2,C.white);}for(const side of[-1,1]){const ox=Math.cos(angle)*1.6*side,oz=-Math.sin(angle)*1.6*side;gb.beam([ga[0]+ox,ga[1]+2,ga[2]+oz],[gz[0]+ox,gz[1]+2,gz[2]+oz],.2,C.white);gb.beam([ga[0]+ox,ga[1]-.6,ga[2]+oz],[gz[0]+ox,gz[1]-.6,gz[2]+oz],.6,C.dark);}gb.finish(gangway);
  const jets=group(root);for(const [x,z] of[[19,90],[20,60],[-24,88]]){const g=group(jets,x,16,z),b=new Batch();b.box(0,.3,0,2,1.2,10,C.light);b.box(0,.4,-4,1.2,.8,3,C.dark);b.box(0,.3,1,9,.4,3,C.light);b.box(0,1.7,4,.4,3,2,C.light);for(const xx of[-3.8,3.8])b.box(xx,1.5,1,.5,2.4,2.6,C.light);for(const xx of[-.8,.8])b.box(xx,-.4,2,.4,1.2,.8,C.dark);b.box(0,-.4,-3,.4,1.2,.8,C.dark);b.finish(g);}
  const zoneLights=[];for(let i=0;i<4;i++){const zgroup=group(root),lb=new Batch();for(let z=-120+i*60;z<-60+i*60;z+=6)for(const x of[-31,30])lb.box(x,15.4,z,.4,.2,.6,C.white);const mesh=lb.finish(zgroup,false);mesh.material=new THREE.MeshBasicMaterial({color:0xffdfa2});zoneLights.push(zgroup);}
  return {root,chunks,module,keel:keelMesh,deck,deckSupports,marks,edge,elevators,elevatorGuides,island,islandSeat,ghost,scaffold,gangway,jets,zoneLights};
}
export function makeIsland(scene){
  const root=group(scene),b=new Batch();
  b.box(0,4,0,12,8,34,C.light);b.box(0,11,-4,11,6,28,0x93a6ad);b.box(-1,16.6,-8,12,5.2,20,0xa4b7ba);b.box(-2,20,-11,14,2,15,0x697f8b);
  // Wrap-around bridge windows and conventional exhaust trunks.
  for(let z=-16;z<-1;z+=2){b.box(-7.1,17,z,.2,2,1.6,C.dark);b.box(5.1,17,z,.2,2,1.6,C.dark);}for(let x=-6;x<6;x+=2)b.box(x,17,-18.1,1.6,2,.2,C.dark);
  for(const z of[6,12]){b.box(1,15,z,6,14,4,0x697f86);b.box(1,22.2,z,6.4,1.2,4.4,C.dark);}
  b.box(-1,24,-5,1.4,8,1.4,C.dark);b.box(-1,27,-5,12,.6,2,C.light);b.box(-1,29,-5,.6,3,.6,C.light);b.box(2,22,-14,.8,6,.8,C.dark);b.box(-4,22,-15,.4,7,.4,C.light);
  for(let z=-16;z<16;z+=3)b.box(-6.2,9,z,.2,2,.2,C.white);b.box(-6.2,10,0,.2,.2,33,C.white);b.finish(root);sign(root,'08',-6.1,5,7,5,{fg:'#edf0db'}).rotation.y=-Math.PI/2;
  root.userData={name:'右舷舰岛',id:'IS-01'};
  const radar=group(root,-1,28,-5),r=new Batch();r.box(0,0,0,7,3,.8,C.light);r.box(0,0,-.5,6.4,2.4,.2,C.dark);r.finish(radar);
  const extras=group(root),e=new Batch();for(const z of[-13,-4,4]){e.box(5.6,13,z,1.2,3,2,C.dark);e.box(6.5,13,z,.6,2,3,C.light);}e.box(1,30,-5,.3,4,.3,C.white);e.finish(extras);
  return {root,radar,extras};
}
export function makeTruck(scene){
  const root=group(scene),b=new Batch();b.box(0,1.4,0,20,1.4,31,0xc99a39);for(const x of[-9,9])b.box(x,1.5,0,1,1.8,31,C.yellow);b.box(0,1.1,16.5,5,2.2,3,C.dark);b.box(0,1.8,18.1,3,1,.2,C.blue);b.finish(root);
  const platform=group(root),pb=new Batch();pb.box(0,2.2,0,19.2,.6,30.4,C.dark);for(let z=-13;z<15;z+=4)pb.box(0,2.6,z,17,.2,1,C.orange);pb.finish(platform);
  const wheels=[];for(const x of[-9.2,9.2])for(let z=-13;z<=13;z+=3.2){const w=group(root,x,.3,z);const wb=new Batch();for(const dx of[-.4,.4]){wb.box(dx,0,0,.6,1.6,1.2,0x263c43);wb.box(dx+Math.sign(dx)*.31,0,0,.1,.6,.6,C.light);}wb.finish(w);wheels.push(w);}
  sign(root,'SPMT 07',-10.1,1.5,0,8,{fg:'#3e4130'}).rotation.y=-Math.PI/2;
  return {root,platform,wheels};
}
export function makeTug(scene,number){
  const root=group(scene),b=new Batch();b.box(0,.1,0,8,2,18,C.dark);b.box(0,1.4,0,7,1,17,C.red);b.box(0,2.4,2,7,1,13,C.white);b.box(0,4,2,5,3,7,C.orange);b.box(0,5.8,1,5,1,6,C.light);b.box(0,4.3,-1.6,4,1,.2,C.blue);b.box(0,7,3,.6,3,.6,C.dark);for(const z of[-7,7])for(const x of[-3.8,3.8])b.box(x,1,z,1,1.4,2,C.dark);b.finish(root);sign(root,`港拖 ${number}`,0,2,-9.1,6,{fg:'#e5ead3'});return root;
}

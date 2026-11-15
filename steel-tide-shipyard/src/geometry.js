import * as THREE from 'three';
export {THREE};
export const C={concrete:0xb5c0bd,edge:0xd5ded6,asphalt:0x768888,steel:0x738994,light:0xa6b5b9,dark:0x334953,red:0x9d5446,orange:0xe5a431,yellow:0xf3c35b,water:0x4b929a,blue:0x457c92,white:0xe4e9d9,green:0x57816d};
const cube=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),vec=new THREE.Vector3(),scale=new THREE.Vector3();
// InstancedMesh supplies instanceColor itself; the box has no vertex color attribute.
export const material=new THREE.MeshStandardMaterial({roughness:.87,metalness:.08});
export class Batch {
  constructor(){this.items=[];}
  box(x,y,z,w,h,d,color=C.steel,ry=0){const grid=v=>Math.round(v*5)/5;this.items.push({x:grid(x),y:grid(y),z:grid(z),w:Math.max(.2,grid(w)),h:Math.max(.2,grid(h)),d:Math.max(.2,grid(d)),color,ry});return this;}
  beam(a,b,width,color=C.steel){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);this.items.push({x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,w:width,h:delta.length(),d:width,color,quat:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())});return this;}
  finish(parent,shadow=true){if(!this.items.length)return;const mesh=new THREE.InstancedMesh(cube,material,this.items.length);for(let i=0;i<this.items.length;i++){const b=this.items[i];vec.set(b.x,b.y,b.z);scale.set(b.w,b.h,b.d);q.copy(b.quat||new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),b.ry||0));matrix.compose(vec,q,scale);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new THREE.Color(b.color));}mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;}
}
export function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
export function box(parent,x,y,z,w,h,d,color=C.steel){return new Batch().box(x,y,z,w,h,d,color).finish(parent);}
const textCache=new Map();
export function textTexture(text,{fg='#f5e9bb',bg='',font=52,pad=22}={}) {
  const key=[text,fg,bg,font,pad].join('|');if(textCache.has(key))return textCache.get(key);
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=`600 ${font}px "Microsoft YaHei",sans-serif`;canvas.width=Math.ceil(ctx.measureText(text).width)+pad*2;canvas.height=font+pad*2;ctx.font=`600 ${font}px "Microsoft YaHei",sans-serif`;if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.fillStyle=fg;ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(text,canvas.width/2,canvas.height/2+2);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;textCache.set(key,tex);return tex;
}
export function sign(parent,text,x,y,z,width,options={}) {
  const tex=textTexture(text,options),height=width*tex.image.height/tex.image.width;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
export function groundText(parent,text,x,z,width,options={}){const m=sign(parent,text,x,4.34,z,width,{fg:'#e3e5c7',...options});m.rotation.x=-Math.PI/2;return m;}
export function line(parent,points,color=0x273b42){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const l=new THREE.Line(geometry,new THREE.LineBasicMaterial({color}));parent.add(l);return l;}
export function dynamicLines(parent,count,color){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*6),3));const mesh=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color}));mesh.frustumCulled=false;parent.add(mesh);return {mesh,set(segments){const p=geo.attributes.position.array;p.fill(0);segments.forEach((s,i)=>p.set(s.flat(),i*6));geo.attributes.position.needsUpdate=true;}};}
export function stand(parent,x,z,w=18,d=30){const b=new Batch();for(const dx of[-w/2,w/2])for(const dz of[-d/2,d/2]){b.box(x+dx,5.4,z+dz,2.4,2.8,3.6,C.dark);b.box(x+dx,7,z+dz,3.2,.4,4.4,C.yellow);}b.finish(parent);}
export function human(parent,role,index){const g=group(parent),b=new Batch(),color=[0xcc7d30,0xf0b948,0xc88839,0x507e91,0xdc9744][role];b.box(-.23,.45,0,.32,.9,.42,C.dark);b.box(.23,.45,0,.32,.9,.42,C.dark);b.box(0,1.12,0,.9,.66,.5,color);b.box(0,1.25,-.27,.68,.14,.05,C.white);b.box(0,1.65,0,.44,.4,.44,0xc49f7c);b.box(0,1.9,0,.62,.2,.6,role===2?C.white:C.yellow);b.finish(g);const arm=group(g,.56,1.35,0);box(arm,0,-.3,0,.24,.68,.3,color);const other=group(g,-.56,1.35,0);box(other,0,-.3,0,.24,.68,.3,color);g.userData={name:['车间工人','转运指挥员','吊装司索工','装配工','码头系缆员'][role],id:`W-${String(index+1).padStart(2,'0')}`,role,arm,other};return g;}
export function rails(b,x1,x2,z1,z2,y=5){for(const x of[x1,x2]){b.box(x,y,z1+(z2-z1)/2,.6,.5,z2-z1,C.dark);for(let z=z1;z<z2;z+=6)b.box(x,y-.4,z,3,.4,1.2,C.steel);}}

(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ua="172",Qi={ROTATE:0,DOLLY:1,PAN:2},ji={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},rh=0,za=1,oh=2,ec=1,nc=2,Vn=3,Zn=0,Je=1,on=2,Yn=0,ts=1,br=2,Ga=3,ka=4,ah=5,vi=100,lh=101,ch=102,hh=103,uh=104,dh=200,fh=201,ph=202,mh=203,yo=204,So=205,gh=206,_h=207,vh=208,xh=209,Mh=210,wh=211,yh=212,Sh=213,bh=214,bo=0,Eo=1,To=2,ss=3,Ao=4,Co=5,Ro=6,Po=7,ic=0,Eh=1,Th=2,ai=0,sc=1,rc=2,oc=3,da=4,Ah=5,ac=6,lc=7,cc=300,rs=301,os=302,Er=303,Lo=304,Lr=306,Ns=1e3,Mi=1001,Do=1002,un=1003,Ch=1004,Vs=1005,En=1006,Br=1007,wi=1008,$n=1009,hc=1010,uc=1011,Fs=1012,fa=1013,yi=1014,Tn=1015,An=1016,pa=1017,ma=1018,as=1020,dc=35902,fc=1021,pc=1022,yn=1023,mc=1024,gc=1025,es=1026,ls=1027,ga=1028,_a=1029,_c=1030,va=1031,xa=1033,vr=33776,xr=33777,Mr=33778,wr=33779,Io=35840,Uo=35841,No=35842,Fo=35843,Oo=36196,Bo=37492,zo=37496,Go=37808,ko=37809,Ho=37810,Vo=37811,Wo=37812,Xo=37813,Yo=37814,qo=37815,Zo=37816,$o=37817,jo=37818,Ko=37819,Jo=37820,Qo=37821,yr=36492,ta=36494,ea=36495,vc=36283,na=36284,ia=36285,sa=36286,Rh=3200,Ph=3201,xc=0,Lh=1,Wn="",Ie="srgb",cs="srgb-linear",Tr="linear",de="srgb",Pi=7680,Ha=519,Dh=512,Ih=513,Uh=514,Mc=515,Nh=516,Fh=517,Oh=518,Bh=519,ra=35044,Va="300 es",Xn=2e3,Ar=2001;class Ei{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}}const je=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Wa=1234567;const Ps=Math.PI/180,Os=180/Math.PI;function Cn(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(je[i&255]+je[i>>8&255]+je[i>>16&255]+je[i>>24&255]+"-"+je[t&255]+je[t>>8&255]+"-"+je[t>>16&15|64]+je[t>>24&255]+"-"+je[e&63|128]+je[e>>8&255]+"-"+je[e>>16&255]+je[e>>24&255]+je[n&255]+je[n>>8&255]+je[n>>16&255]+je[n>>24&255]).toLowerCase()}function ne(i,t,e){return Math.max(t,Math.min(e,i))}function Ma(i,t){return(i%t+t)%t}function zh(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Gh(i,t,e){return i!==t?(e-i)/(t-i):0}function Ls(i,t,e){return(1-e)*i+e*t}function kh(i,t,e,n){return Ls(i,t,1-Math.exp(-e*n))}function Hh(i,t=1){return t-Math.abs(Ma(i,t*2)-t)}function Vh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Wh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Xh(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Yh(i,t){return i+Math.random()*(t-i)}function qh(i){return i*(.5-Math.random())}function Zh(i){i!==void 0&&(Wa=i);let t=Wa+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function $h(i){return i*Ps}function jh(i){return i*Os}function Kh(i){return(i&i-1)===0&&i!==0}function Jh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Qh(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function tu(i,t,e,n,s){const r=Math.cos,o=Math.sin,a=r(e/2),l=o(e/2),c=r((t+n)/2),h=o((t+n)/2),u=r((t-n)/2),d=o((t-n)/2),p=r((n-t)/2),g=o((n-t)/2);switch(s){case"XYX":i.set(a*h,l*u,l*d,a*c);break;case"YZY":i.set(l*d,a*h,l*u,a*c);break;case"ZXZ":i.set(l*u,l*d,a*h,a*c);break;case"XZX":i.set(a*h,l*g,l*p,a*c);break;case"YXY":i.set(l*p,a*h,l*g,a*c);break;case"ZYZ":i.set(l*g,l*p,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function wn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function fe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Ae={DEG2RAD:Ps,RAD2DEG:Os,generateUUID:Cn,clamp:ne,euclideanModulo:Ma,mapLinear:zh,inverseLerp:Gh,lerp:Ls,damp:kh,pingpong:Hh,smoothstep:Vh,smootherstep:Wh,randInt:Xh,randFloat:Yh,randFloatSpread:qh,seededRandom:Zh,degToRad:$h,radToDeg:jh,isPowerOfTwo:Kh,ceilPowerOfTwo:Jh,floorPowerOfTwo:Qh,setQuaternionFromProperEuler:tu,normalize:fe,denormalize:wn};class lt{constructor(t=0,e=0){lt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ne(this.x,t.x,e.x),this.y=ne(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ne(this.x,t,e),this.y=ne(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ne(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ne(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class te{constructor(t,e,n,s,r,o,a,l,c){te.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],p=n[5],g=n[8],x=s[0],m=s[3],f=s[6],y=s[1],M=s[4],_=s[7],L=s[2],T=s[5],D=s[8];return r[0]=o*x+a*y+l*L,r[3]=o*m+a*M+l*T,r[6]=o*f+a*_+l*D,r[1]=c*x+h*y+u*L,r[4]=c*m+h*M+u*T,r[7]=c*f+h*_+u*D,r[2]=d*x+p*y+g*L,r[5]=d*m+p*M+g*T,r[8]=d*f+p*_+g*D,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,d=a*l-h*r,p=c*r-o*l,g=e*u+n*d+s*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return t[0]=u*x,t[1]=(s*c-h*n)*x,t[2]=(a*n-s*o)*x,t[3]=d*x,t[4]=(h*e-s*l)*x,t[5]=(s*r-a*e)*x,t[6]=p*x,t[7]=(n*l-c*e)*x,t[8]=(o*e-n*r)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(zr.makeScale(t,e)),this}rotate(t){return this.premultiply(zr.makeRotation(-t)),this}translate(t,e){return this.premultiply(zr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const zr=new te;function wc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Cr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function eu(){const i=Cr("canvas");return i.style.display="block",i}const Xa={};function $i(i){i in Xa||(Xa[i]=!0,console.warn(i))}function nu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function iu(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function su(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Ya=new te().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),qa=new te().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function ru(){const i={enabled:!0,workingColorSpace:cs,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===de&&(s.r=qn(s.r),s.g=qn(s.g),s.b=qn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===de&&(s.r=ns(s.r),s.g=ns(s.g),s.b=ns(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Wn?Tr:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[cs]:{primaries:t,whitePoint:n,transfer:Tr,toXYZ:Ya,fromXYZ:qa,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ie},outputColorSpaceConfig:{drawingBufferColorSpace:Ie}},[Ie]:{primaries:t,whitePoint:n,transfer:de,toXYZ:Ya,fromXYZ:qa,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ie}}}),i}const ce=ru();function qn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ns(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Li;class ou{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Li===void 0&&(Li=Cr("canvas")),Li.width=t.width,Li.height=t.height;const n=Li.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Li}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Cr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=qn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(qn(e[n]/255)*255):e[n]=qn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let au=0;class yc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:au++}),this.uuid=Cn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Gr(s[o].image)):r.push(Gr(s[o]))}else r=Gr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Gr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ou.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let lu=0;class Qe extends Ei{constructor(t=Qe.DEFAULT_IMAGE,e=Qe.DEFAULT_MAPPING,n=Mi,s=Mi,r=En,o=wi,a=yn,l=$n,c=Qe.DEFAULT_ANISOTROPY,h=Wn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:lu++}),this.uuid=Cn(),this.name="",this.source=new yc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new lt(0,0),this.repeat=new lt(1,1),this.center=new lt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new te,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==cc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ns:t.x=t.x-Math.floor(t.x);break;case Mi:t.x=t.x<0?0:1;break;case Do:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ns:t.y=t.y-Math.floor(t.y);break;case Mi:t.y=t.y<0?0:1;break;case Do:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Qe.DEFAULT_IMAGE=null;Qe.DEFAULT_MAPPING=cc;Qe.DEFAULT_ANISOTROPY=1;class ge{constructor(t=0,e=0,n=0,s=1){ge.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],g=l[9],x=l[2],m=l[6],f=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,_=(p+1)/2,L=(f+1)/2,T=(h+d)/4,D=(u+x)/4,I=(g+m)/4;return M>_&&M>L?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=T/n,r=D/n):_>L?_<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(_),n=T/s,r=I/s):L<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(L),n=D/r,s=I/r),this.set(n,s,r,e),this}let y=Math.sqrt((m-g)*(m-g)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(y)<.001&&(y=1),this.x=(m-g)/y,this.y=(u-x)/y,this.z=(d-h)/y,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ne(this.x,t.x,e.x),this.y=ne(this.y,t.y,e.y),this.z=ne(this.z,t.z,e.z),this.w=ne(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ne(this.x,t,e),this.y=ne(this.y,t,e),this.z=ne(this.z,t,e),this.w=ne(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ne(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class cu extends Ei{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ge(0,0,t,e),this.scissorTest=!1,this.viewport=new ge(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:En,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Qe(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;const e=Object.assign({},t.texture.image);return this.texture.source=new yc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class gn extends cu{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Sc extends Qe{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=un,this.minFilter=un,this.wrapR=Mi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class hu extends Qe{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=un,this.minFilter=un,this.wrapR=Mi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Si{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3];const d=r[o+0],p=r[o+1],g=r[o+2],x=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=d,t[e+1]=p,t[e+2]=g,t[e+3]=x;return}if(u!==x||l!==d||c!==p||h!==g){let m=1-a;const f=l*d+c*p+h*g+u*x,y=f>=0?1:-1,M=1-f*f;if(M>Number.EPSILON){const L=Math.sqrt(M),T=Math.atan2(L,f*y);m=Math.sin(m*T)/L,a=Math.sin(a*T)/L}const _=a*y;if(l=l*m+d*_,c=c*m+p*_,h=h*m+g*_,u=u*m+x*_,m===1-a){const L=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=L,c*=L,h*=L,u*=L}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){const a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],d=r[o+1],p=r[o+2],g=r[o+3];return t[e]=a*g+h*u+l*p-c*d,t[e+1]=l*g+h*d+c*u-a*p,t[e+2]=c*g+h*p+a*d-l*u,t[e+3]=h*g-a*u-l*d-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),d=l(n/2),p=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*h*u+c*p*g,this._y=c*p*u-d*h*g,this._z=c*h*g+d*p*u,this._w=c*h*u-d*p*g;break;case"YXZ":this._x=d*h*u+c*p*g,this._y=c*p*u-d*h*g,this._z=c*h*g-d*p*u,this._w=c*h*u+d*p*g;break;case"ZXY":this._x=d*h*u-c*p*g,this._y=c*p*u+d*h*g,this._z=c*h*g+d*p*u,this._w=c*h*u-d*p*g;break;case"ZYX":this._x=d*h*u-c*p*g,this._y=c*p*u+d*h*g,this._z=c*h*g-d*p*u,this._w=c*h*u+d*p*g;break;case"YZX":this._x=d*h*u+c*p*g,this._y=c*p*u+d*h*g,this._z=c*h*g-d*p*u,this._w=c*h*u-d*p*g;break;case"XZY":this._x=d*h*u-c*p*g,this._y=c*p*u-d*h*g,this._z=c*h*g+d*p*u,this._w=c*h*u+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=n+a+u;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(o-s)*p}else if(n>a&&n>u){const p=2*Math.sqrt(1+n-a-u);this._w=(h-l)/p,this._x=.25*p,this._y=(s+o)/p,this._z=(r+c)/p}else if(a>u){const p=2*Math.sqrt(1+a-n-u);this._w=(r-c)/p,this._x=(s+o)/p,this._y=.25*p,this._z=(l+h)/p}else{const p=2*Math.sqrt(1+u-n-a);this._w=(o-s)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ne(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const l=1-a*a;if(l<=Number.EPSILON){const p=1-e;return this._w=p*o+e*this._w,this._x=p*n+e*this._x,this._y=p*s+e*this._y,this._z=p*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,d=Math.sin(e*h)/c;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class A{constructor(t=0,e=0,n=0){A.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Za.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Za.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),h=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ne(this.x,t.x,e.x),this.y=ne(this.y,t.y,e.y),this.z=ne(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ne(this.x,t,e),this.y=ne(this.y,t,e),this.z=ne(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ne(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return kr.copy(this).projectOnVector(t),this.sub(kr)}reflect(t){return this.sub(kr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ne(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const kr=new A,Za=new Si;class Ti{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(vn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(vn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=vn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,vn):vn.fromBufferAttribute(r,o),vn.applyMatrix4(t.matrixWorld),this.expandByPoint(vn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ws.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ws.copy(n.boundingBox)),Ws.applyMatrix4(t.matrixWorld),this.union(Ws)}const s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,vn),vn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(vs),Xs.subVectors(this.max,vs),Di.subVectors(t.a,vs),Ii.subVectors(t.b,vs),Ui.subVectors(t.c,vs),Qn.subVectors(Ii,Di),ti.subVectors(Ui,Ii),ui.subVectors(Di,Ui);let e=[0,-Qn.z,Qn.y,0,-ti.z,ti.y,0,-ui.z,ui.y,Qn.z,0,-Qn.x,ti.z,0,-ti.x,ui.z,0,-ui.x,-Qn.y,Qn.x,0,-ti.y,ti.x,0,-ui.y,ui.x,0];return!Hr(e,Di,Ii,Ui,Xs)||(e=[1,0,0,0,1,0,0,0,1],!Hr(e,Di,Ii,Ui,Xs))?!1:(Ys.crossVectors(Qn,ti),e=[Ys.x,Ys.y,Ys.z],Hr(e,Di,Ii,Ui,Xs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,vn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(vn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Bn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Bn=[new A,new A,new A,new A,new A,new A,new A,new A],vn=new A,Ws=new Ti,Di=new A,Ii=new A,Ui=new A,Qn=new A,ti=new A,ui=new A,vs=new A,Xs=new A,Ys=new A,di=new A;function Hr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){di.fromArray(i,r);const a=s.x*Math.abs(di.x)+s.y*Math.abs(di.y)+s.z*Math.abs(di.z),l=t.dot(di),c=e.dot(di),h=n.dot(di);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}const uu=new Ti,xs=new A,Vr=new A;class Hs{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):uu.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;xs.subVectors(t,this.center);const e=xs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(xs,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Vr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(xs.copy(t.center).add(Vr)),this.expandByPoint(xs.copy(t.center).sub(Vr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const zn=new A,Wr=new A,qs=new A,ei=new A,Xr=new A,Zs=new A,Yr=new A;class bc{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,zn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=zn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(zn.copy(this.origin).addScaledVector(this.direction,e),zn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Wr.copy(t).add(e).multiplyScalar(.5),qs.copy(e).sub(t).normalize(),ei.copy(this.origin).sub(Wr);const r=t.distanceTo(e)*.5,o=-this.direction.dot(qs),a=ei.dot(this.direction),l=-ei.dot(qs),c=ei.lengthSq(),h=Math.abs(1-o*o);let u,d,p,g;if(h>0)if(u=o*l-a,d=o*a-l,g=r*h,u>=0)if(d>=-g)if(d<=g){const x=1/h;u*=x,d*=x,p=u*(u+o*d+2*a)+d*(o*u+d+2*l)+c}else d=r,u=Math.max(0,-(o*d+a)),p=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(o*d+a)),p=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),p=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Wr).addScaledVector(qs,d),p}intersectSphere(t,e){zn.subVectors(t.center,this.origin);const n=zn.dot(this.direction),s=zn.dot(zn)-n*n,r=t.radius*t.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),h>=0?(r=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(r=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,zn)!==null}intersectTriangle(t,e,n,s,r){Xr.subVectors(e,t),Zs.subVectors(n,t),Yr.crossVectors(Xr,Zs);let o=this.direction.dot(Yr),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ei.subVectors(this.origin,t);const l=a*this.direction.dot(Zs.crossVectors(ei,Zs));if(l<0)return null;const c=a*this.direction.dot(Xr.cross(ei));if(c<0||l+c>o)return null;const h=-a*ei.dot(Yr);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class _e{constructor(t,e,n,s,r,o,a,l,c,h,u,d,p,g,x,m){_e.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,h,u,d,p,g,x,m)}set(t,e,n,s,r,o,a,l,c,h,u,d,p,g,x,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=r,f[5]=o,f[9]=a,f[13]=l,f[2]=c,f[6]=h,f[10]=u,f[14]=d,f[3]=p,f[7]=g,f[11]=x,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new _e().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Ni.setFromMatrixColumn(t,0).length(),r=1/Ni.setFromMatrixColumn(t,1).length(),o=1/Ni.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){const d=o*h,p=o*u,g=a*h,x=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=p+g*c,e[5]=d-x*c,e[9]=-a*l,e[2]=x-d*c,e[6]=g+p*c,e[10]=o*l}else if(t.order==="YXZ"){const d=l*h,p=l*u,g=c*h,x=c*u;e[0]=d+x*a,e[4]=g*a-p,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=p*a-g,e[6]=x+d*a,e[10]=o*l}else if(t.order==="ZXY"){const d=l*h,p=l*u,g=c*h,x=c*u;e[0]=d-x*a,e[4]=-o*u,e[8]=g+p*a,e[1]=p+g*a,e[5]=o*h,e[9]=x-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const d=o*h,p=o*u,g=a*h,x=a*u;e[0]=l*h,e[4]=g*c-p,e[8]=d*c+x,e[1]=l*u,e[5]=x*c+d,e[9]=p*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const d=o*l,p=o*c,g=a*l,x=a*c;e[0]=l*h,e[4]=x-d*u,e[8]=g*u+p,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=p*u+g,e[10]=d-x*u}else if(t.order==="XZY"){const d=o*l,p=o*c,g=a*l,x=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+x,e[5]=o*h,e[9]=p*u-g,e[2]=g*u-p,e[6]=a*h,e[10]=x*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(du,t,fu)}lookAt(t,e,n){const s=this.elements;return ln.subVectors(t,e),ln.lengthSq()===0&&(ln.z=1),ln.normalize(),ni.crossVectors(n,ln),ni.lengthSq()===0&&(Math.abs(n.z)===1?ln.x+=1e-4:ln.z+=1e-4,ln.normalize(),ni.crossVectors(n,ln)),ni.normalize(),$s.crossVectors(ln,ni),s[0]=ni.x,s[4]=$s.x,s[8]=ln.x,s[1]=ni.y,s[5]=$s.y,s[9]=ln.y,s[2]=ni.z,s[6]=$s.z,s[10]=ln.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],p=n[13],g=n[2],x=n[6],m=n[10],f=n[14],y=n[3],M=n[7],_=n[11],L=n[15],T=s[0],D=s[4],I=s[8],S=s[12],v=s[1],C=s[5],N=s[9],F=s[13],O=s[2],G=s[6],W=s[10],q=s[14],V=s[3],ct=s[7],dt=s[11],_t=s[15];return r[0]=o*T+a*v+l*O+c*V,r[4]=o*D+a*C+l*G+c*ct,r[8]=o*I+a*N+l*W+c*dt,r[12]=o*S+a*F+l*q+c*_t,r[1]=h*T+u*v+d*O+p*V,r[5]=h*D+u*C+d*G+p*ct,r[9]=h*I+u*N+d*W+p*dt,r[13]=h*S+u*F+d*q+p*_t,r[2]=g*T+x*v+m*O+f*V,r[6]=g*D+x*C+m*G+f*ct,r[10]=g*I+x*N+m*W+f*dt,r[14]=g*S+x*F+m*q+f*_t,r[3]=y*T+M*v+_*O+L*V,r[7]=y*D+M*C+_*G+L*ct,r[11]=y*I+M*N+_*W+L*dt,r[15]=y*S+M*F+_*q+L*_t,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],p=t[14],g=t[3],x=t[7],m=t[11],f=t[15];return g*(+r*l*u-s*c*u-r*a*d+n*c*d+s*a*p-n*l*p)+x*(+e*l*p-e*c*d+r*o*d-s*o*p+s*c*h-r*l*h)+m*(+e*c*u-e*a*p-r*o*u+n*o*p+r*a*h-n*c*h)+f*(-s*a*h-e*l*u+e*a*d+s*o*u-n*o*d+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],p=t[11],g=t[12],x=t[13],m=t[14],f=t[15],y=u*m*c-x*d*c+x*l*p-a*m*p-u*l*f+a*d*f,M=g*d*c-h*m*c-g*l*p+o*m*p+h*l*f-o*d*f,_=h*x*c-g*u*c+g*a*p-o*x*p-h*a*f+o*u*f,L=g*u*l-h*x*l-g*a*d+o*x*d+h*a*m-o*u*m,T=e*y+n*M+s*_+r*L;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const D=1/T;return t[0]=y*D,t[1]=(x*d*r-u*m*r-x*s*p+n*m*p+u*s*f-n*d*f)*D,t[2]=(a*m*r-x*l*r+x*s*c-n*m*c-a*s*f+n*l*f)*D,t[3]=(u*l*r-a*d*r-u*s*c+n*d*c+a*s*p-n*l*p)*D,t[4]=M*D,t[5]=(h*m*r-g*d*r+g*s*p-e*m*p-h*s*f+e*d*f)*D,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*f-e*l*f)*D,t[7]=(o*d*r-h*l*r+h*s*c-e*d*c-o*s*p+e*l*p)*D,t[8]=_*D,t[9]=(g*u*r-h*x*r-g*n*p+e*x*p+h*n*f-e*u*f)*D,t[10]=(o*x*r-g*a*r+g*n*c-e*x*c-o*n*f+e*a*f)*D,t[11]=(h*a*r-o*u*r-h*n*c+e*u*c+o*n*p-e*a*p)*D,t[12]=L*D,t[13]=(h*x*s-g*u*s+g*n*d-e*x*d-h*n*m+e*u*m)*D,t[14]=(g*a*s-o*x*s-g*n*l+e*x*l+o*n*m-e*a*m)*D,t[15]=(o*u*s-h*a*s+h*n*l-e*u*l-o*n*d+e*a*d)*D,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,d=r*c,p=r*h,g=r*u,x=o*h,m=o*u,f=a*u,y=l*c,M=l*h,_=l*u,L=n.x,T=n.y,D=n.z;return s[0]=(1-(x+f))*L,s[1]=(p+_)*L,s[2]=(g-M)*L,s[3]=0,s[4]=(p-_)*T,s[5]=(1-(d+f))*T,s[6]=(m+y)*T,s[7]=0,s[8]=(g+M)*D,s[9]=(m-y)*D,s[10]=(1-(d+x))*D,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Ni.set(s[0],s[1],s[2]).length();const o=Ni.set(s[4],s[5],s[6]).length(),a=Ni.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],xn.copy(this);const c=1/r,h=1/o,u=1/a;return xn.elements[0]*=c,xn.elements[1]*=c,xn.elements[2]*=c,xn.elements[4]*=h,xn.elements[5]*=h,xn.elements[6]*=h,xn.elements[8]*=u,xn.elements[9]*=u,xn.elements[10]*=u,e.setFromRotationMatrix(xn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=Xn){const l=this.elements,c=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),d=(n+s)/(n-s);let p,g;if(a===Xn)p=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Ar)p=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=Xn){const l=this.elements,c=1/(e-t),h=1/(n-s),u=1/(o-r),d=(e+t)*c,p=(n+s)*h;let g,x;if(a===Xn)g=(o+r)*u,x=-2*u;else if(a===Ar)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ni=new A,xn=new _e,du=new A(0,0,0),fu=new A(1,1,1),ni=new A,$s=new A,ln=new A,$a=new _e,ja=new Si;class Pn{constructor(t=0,e=0,n=0,s=Pn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin(ne(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ne(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(ne(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ne(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(ne(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-ne(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return $a.makeRotationFromQuaternion(t),this.setFromRotationMatrix($a,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ja.setFromEuler(this),this.setFromQuaternion(ja,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Pn.DEFAULT_ORDER="XYZ";class Ec{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let pu=0;const Ka=new A,Fi=new Si,Gn=new _e,js=new A,Ms=new A,mu=new A,gu=new Si,Ja=new A(1,0,0),Qa=new A(0,1,0),tl=new A(0,0,1),el={type:"added"},_u={type:"removed"},Oi={type:"childadded",child:null},qr={type:"childremoved",child:null};class Le extends Ei{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:pu++}),this.uuid=Cn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Le.DEFAULT_UP.clone();const t=new A,e=new Pn,n=new Si,s=new A(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new _e},normalMatrix:{value:new te}}),this.matrix=new _e,this.matrixWorld=new _e,this.matrixAutoUpdate=Le.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ec,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Fi.setFromAxisAngle(t,e),this.quaternion.multiply(Fi),this}rotateOnWorldAxis(t,e){return Fi.setFromAxisAngle(t,e),this.quaternion.premultiply(Fi),this}rotateX(t){return this.rotateOnAxis(Ja,t)}rotateY(t){return this.rotateOnAxis(Qa,t)}rotateZ(t){return this.rotateOnAxis(tl,t)}translateOnAxis(t,e){return Ka.copy(t).applyQuaternion(this.quaternion),this.position.add(Ka.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ja,t)}translateY(t){return this.translateOnAxis(Qa,t)}translateZ(t){return this.translateOnAxis(tl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Gn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?js.copy(t):js.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ms.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Gn.lookAt(Ms,js,this.up):Gn.lookAt(js,Ms,this.up),this.quaternion.setFromRotationMatrix(Gn),s&&(Gn.extractRotation(s.matrixWorld),Fi.setFromRotationMatrix(Gn),this.quaternion.premultiply(Fi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(el),Oi.child=t,this.dispatchEvent(Oi),Oi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(_u),qr.child=t,this.dispatchEvent(qr),qr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Gn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Gn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Gn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(el),Oi.child=t,this.dispatchEvent(Oi),Oi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ms,t,mu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ms,gu,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),p=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const l=[];for(const c in a){const h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Le.DEFAULT_UP=new A(0,1,0);Le.DEFAULT_MATRIX_AUTO_UPDATE=!0;Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Mn=new A,kn=new A,Zr=new A,Hn=new A,Bi=new A,zi=new A,nl=new A,$r=new A,jr=new A,Kr=new A,Jr=new ge,Qr=new ge,to=new ge;class mn{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Mn.subVectors(t,e),s.cross(Mn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Mn.subVectors(s,e),kn.subVectors(n,e),Zr.subVectors(t,e);const o=Mn.dot(Mn),a=Mn.dot(kn),l=Mn.dot(Zr),c=kn.dot(kn),h=kn.dot(Zr),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;const d=1/u,p=(c*l-a*h)*d,g=(o*h-a*l)*d;return r.set(1-p-g,g,p)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Hn)===null?!1:Hn.x>=0&&Hn.y>=0&&Hn.x+Hn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Hn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Hn.x),l.addScaledVector(o,Hn.y),l.addScaledVector(a,Hn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return Jr.setScalar(0),Qr.setScalar(0),to.setScalar(0),Jr.fromBufferAttribute(t,e),Qr.fromBufferAttribute(t,n),to.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Jr,r.x),o.addScaledVector(Qr,r.y),o.addScaledVector(to,r.z),o}static isFrontFacing(t,e,n,s){return Mn.subVectors(n,e),kn.subVectors(t,e),Mn.cross(kn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Mn.subVectors(this.c,this.b),kn.subVectors(this.a,this.b),Mn.cross(kn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return mn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return mn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return mn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return mn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return mn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let o,a;Bi.subVectors(s,n),zi.subVectors(r,n),$r.subVectors(t,n);const l=Bi.dot($r),c=zi.dot($r);if(l<=0&&c<=0)return e.copy(n);jr.subVectors(t,s);const h=Bi.dot(jr),u=zi.dot(jr);if(h>=0&&u<=h)return e.copy(s);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(Bi,o);Kr.subVectors(t,r);const p=Bi.dot(Kr),g=zi.dot(Kr);if(g>=0&&p<=g)return e.copy(r);const x=p*c-l*g;if(x<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(n).addScaledVector(zi,a);const m=h*g-p*u;if(m<=0&&u-h>=0&&p-g>=0)return nl.subVectors(r,s),a=(u-h)/(u-h+(p-g)),e.copy(s).addScaledVector(nl,a);const f=1/(m+x+d);return o=x*f,a=d*f,e.copy(n).addScaledVector(Bi,o).addScaledVector(zi,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Tc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ii={h:0,s:0,l:0},Ks={h:0,s:0,l:0};function eo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class gt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ie){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ce.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ce.workingColorSpace){return this.r=t,this.g=e,this.b=n,ce.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ce.workingColorSpace){if(t=Ma(t,1),e=ne(e,0,1),n=ne(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=eo(o,r,t+1/3),this.g=eo(o,r,t),this.b=eo(o,r,t-1/3)}return ce.toWorkingColorSpace(this,s),this}setStyle(t,e=Ie){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ie){const n=Tc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=qn(t.r),this.g=qn(t.g),this.b=qn(t.b),this}copyLinearToSRGB(t){return this.r=ns(t.r),this.g=ns(t.g),this.b=ns(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ie){return ce.fromWorkingColorSpace(Ke.copy(this),t),Math.round(ne(Ke.r*255,0,255))*65536+Math.round(ne(Ke.g*255,0,255))*256+Math.round(ne(Ke.b*255,0,255))}getHexString(t=Ie){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ce.workingColorSpace){ce.fromWorkingColorSpace(Ke.copy(this),e);const n=Ke.r,s=Ke.g,r=Ke.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let l,c;const h=(a+o)/2;if(a===o)l=0,c=0;else{const u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=ce.workingColorSpace){return ce.fromWorkingColorSpace(Ke.copy(this),e),t.r=Ke.r,t.g=Ke.g,t.b=Ke.b,t}getStyle(t=Ie){ce.fromWorkingColorSpace(Ke.copy(this),t);const e=Ke.r,n=Ke.g,s=Ke.b;return t!==Ie?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(ii),this.setHSL(ii.h+t,ii.s+e,ii.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(ii),t.getHSL(Ks);const n=Ls(ii.h,Ks.h,e),s=Ls(ii.s,Ks.s,e),r=Ls(ii.l,Ks.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ke=new gt;gt.NAMES=Tc;let vu=0;class fs extends Ei{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:vu++}),this.uuid=Cn(),this.name="",this.type="Material",this.blending=ts,this.side=Zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=yo,this.blendDst=So,this.blendEquation=vi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new gt(0,0,0),this.blendAlpha=0,this.depthFunc=ss,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ha,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Pi,this.stencilZFail=Pi,this.stencilZPass=Pi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ts&&(n.blending=this.blending),this.side!==Zn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==yo&&(n.blendSrc=this.blendSrc),this.blendDst!==So&&(n.blendDst=this.blendDst),this.blendEquation!==vi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ss&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ha&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Pi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Pi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Pi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const l=r[a];delete l.metadata,o.push(l)}return o}if(e){const r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class jn extends fs{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new gt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Pn,this.combine=ic,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Ue=new A,Js=new lt;class _n{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=ra,this.updateRanges=[],this.gpuType=Tn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Js.fromBufferAttribute(this,e),Js.applyMatrix3(t),this.setXY(e,Js.x,Js.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix3(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix4(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyNormalMatrix(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.transformDirection(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=wn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=fe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=wn(e,this.array)),e}setX(t,e){return this.normalized&&(e=fe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=wn(e,this.array)),e}setY(t,e){return this.normalized&&(e=fe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=wn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=fe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=wn(e,this.array)),e}setW(t,e){return this.normalized&&(e=fe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=fe(e,this.array),n=fe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=fe(e,this.array),n=fe(n,this.array),s=fe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=fe(e,this.array),n=fe(n,this.array),s=fe(s,this.array),r=fe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ra&&(t.usage=this.usage),t}}class Ac extends _n{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Cc extends _n{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class pe extends _n{constructor(t,e,n){super(new Float32Array(t),e,n)}}let xu=0;const pn=new _e,no=new Le,Gi=new A,cn=new Ti,ws=new Ti,We=new A;class tn extends Ei{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:xu++}),this.uuid=Cn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(wc(t)?Cc:Ac)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new te().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return pn.makeRotationFromQuaternion(t),this.applyMatrix4(pn),this}rotateX(t){return pn.makeRotationX(t),this.applyMatrix4(pn),this}rotateY(t){return pn.makeRotationY(t),this.applyMatrix4(pn),this}rotateZ(t){return pn.makeRotationZ(t),this.applyMatrix4(pn),this}translate(t,e,n){return pn.makeTranslation(t,e,n),this.applyMatrix4(pn),this}scale(t,e,n){return pn.makeScale(t,e,n),this.applyMatrix4(pn),this}lookAt(t){return no.lookAt(t),no.updateMatrix(),this.applyMatrix4(no.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Gi).negate(),this.translate(Gi.x,Gi.y,Gi.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new pe(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ti);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];cn.setFromBufferAttribute(r),this.morphTargetsRelative?(We.addVectors(this.boundingBox.min,cn.min),this.boundingBox.expandByPoint(We),We.addVectors(this.boundingBox.max,cn.max),this.boundingBox.expandByPoint(We)):(this.boundingBox.expandByPoint(cn.min),this.boundingBox.expandByPoint(cn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Hs);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){const n=this.boundingSphere.center;if(cn.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];ws.setFromBufferAttribute(a),this.morphTargetsRelative?(We.addVectors(cn.min,ws.min),cn.expandByPoint(We),We.addVectors(cn.max,ws.max),cn.expandByPoint(We)):(cn.expandByPoint(ws.min),cn.expandByPoint(ws.max))}cn.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)We.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(We));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)We.fromBufferAttribute(a,c),l&&(Gi.fromBufferAttribute(t,c),We.add(Gi)),s=Math.max(s,n.distanceToSquared(We))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new _n(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let I=0;I<n.count;I++)a[I]=new A,l[I]=new A;const c=new A,h=new A,u=new A,d=new lt,p=new lt,g=new lt,x=new A,m=new A;function f(I,S,v){c.fromBufferAttribute(n,I),h.fromBufferAttribute(n,S),u.fromBufferAttribute(n,v),d.fromBufferAttribute(r,I),p.fromBufferAttribute(r,S),g.fromBufferAttribute(r,v),h.sub(c),u.sub(c),p.sub(d),g.sub(d);const C=1/(p.x*g.y-g.x*p.y);isFinite(C)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(C),m.copy(u).multiplyScalar(p.x).addScaledVector(h,-g.x).multiplyScalar(C),a[I].add(x),a[S].add(x),a[v].add(x),l[I].add(m),l[S].add(m),l[v].add(m))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let I=0,S=y.length;I<S;++I){const v=y[I],C=v.start,N=v.count;for(let F=C,O=C+N;F<O;F+=3)f(t.getX(F+0),t.getX(F+1),t.getX(F+2))}const M=new A,_=new A,L=new A,T=new A;function D(I){L.fromBufferAttribute(s,I),T.copy(L);const S=a[I];M.copy(S),M.sub(L.multiplyScalar(L.dot(S))).normalize(),_.crossVectors(T,S);const C=_.dot(l[I])<0?-1:1;o.setXYZW(I,M.x,M.y,M.z,C)}for(let I=0,S=y.length;I<S;++I){const v=y[I],C=v.start,N=v.count;for(let F=C,O=C+N;F<O;F+=3)D(t.getX(F+0)),D(t.getX(F+1)),D(t.getX(F+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new _n(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);const s=new A,r=new A,o=new A,a=new A,l=new A,c=new A,h=new A,u=new A;if(t)for(let d=0,p=t.count;d<p;d+=3){const g=t.getX(d+0),x=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,x),o.fromBufferAttribute(e,m),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),a.add(h),l.add(h),c.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=e.count;d<p;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)We.fromBufferAttribute(t,e),We.normalize(),t.setXYZ(e,We.x,We.y,We.z)}toNonIndexed(){function t(a,l){const c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h);let p=0,g=0;for(let x=0,m=l.length;x<m;x++){a.isInterleavedBufferAttribute?p=l[x]*a.data.stride+a.offset:p=l[x]*h;for(let f=0;f<h;f++)d[g++]=c[p++]}return new _n(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new tn,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const r=this.morphAttributes;for(const a in r){const l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){const d=c[h],p=t(d,n);l.push(p)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const p=c[u];h.push(p.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],u=r[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,h=o.length;c<h;c++){const u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const il=new _e,fi=new bc,Qs=new Hs,sl=new A,tr=new A,er=new A,nr=new A,io=new A,ir=new A,rl=new A,sr=new A;class b extends Le{constructor(t=new tn,e=new jn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(r&&a){ir.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=a[l],u=r[l];h!==0&&(io.fromBufferAttribute(u,t),o?ir.addScaledVector(io,h):ir.addScaledVector(io.sub(e),h))}e.add(ir)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Qs.copy(n.boundingSphere),Qs.applyMatrix4(r),fi.copy(t.ray).recast(t.near),!(Qs.containsPoint(fi.origin)===!1&&(fi.intersectSphere(Qs,sl)===null||fi.origin.distanceToSquared(sl)>(t.far-t.near)**2))&&(il.copy(r).invert(),fi.copy(t.ray).applyMatrix4(il),!(n.boundingBox!==null&&fi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,fi)))}_computeIntersections(t,e,n){let s;const r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){const m=d[g],f=o[m.materialIndex],y=Math.max(m.start,p.start),M=Math.min(a.count,Math.min(m.start+m.count,p.start+p.count));for(let _=y,L=M;_<L;_+=3){const T=a.getX(_),D=a.getX(_+1),I=a.getX(_+2);s=rr(this,f,t,n,c,h,u,T,D,I),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,p.start),x=Math.min(a.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){const y=a.getX(m),M=a.getX(m+1),_=a.getX(m+2);s=rr(this,o,t,n,c,h,u,y,M,_),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){const m=d[g],f=o[m.materialIndex],y=Math.max(m.start,p.start),M=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let _=y,L=M;_<L;_+=3){const T=_,D=_+1,I=_+2;s=rr(this,f,t,n,c,h,u,T,D,I),s&&(s.faceIndex=Math.floor(_/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,p.start),x=Math.min(l.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){const y=m,M=m+1,_=m+2;s=rr(this,o,t,n,c,h,u,y,M,_),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function Mu(i,t,e,n,s,r,o,a){let l;if(t.side===Je?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===Zn,a),l===null)return null;sr.copy(a),sr.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(sr);return c<e.near||c>e.far?null:{distance:c,point:sr.clone(),object:i}}function rr(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,tr),i.getVertexPosition(l,er),i.getVertexPosition(c,nr);const h=Mu(i,t,e,n,tr,er,nr,rl);if(h){const u=new A;mn.getBarycoord(rl,tr,er,nr,u),s&&(h.uv=mn.getInterpolatedAttribute(s,a,l,c,u,new lt)),r&&(h.uv1=mn.getInterpolatedAttribute(r,a,l,c,u,new lt)),o&&(h.normal=mn.getInterpolatedAttribute(o,a,l,c,u,new A),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new A,materialIndex:0};mn.getNormal(tr,er,nr,d.normal),h.face=d,h.barycoord=u}return h}class U extends tn{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],h=[],u=[];let d=0,p=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new pe(c,3)),this.setAttribute("normal",new pe(h,3)),this.setAttribute("uv",new pe(u,2));function g(x,m,f,y,M,_,L,T,D,I,S){const v=_/D,C=L/I,N=_/2,F=L/2,O=T/2,G=D+1,W=I+1;let q=0,V=0;const ct=new A;for(let dt=0;dt<W;dt++){const _t=dt*C-F;for(let Wt=0;Wt<G;Wt++){const Vt=Wt*v-N;ct[x]=Vt*y,ct[m]=_t*M,ct[f]=O,c.push(ct.x,ct.y,ct.z),ct[x]=0,ct[m]=0,ct[f]=T>0?1:-1,h.push(ct.x,ct.y,ct.z),u.push(Wt/D),u.push(1-dt/I),q+=1}}for(let dt=0;dt<I;dt++)for(let _t=0;_t<D;_t++){const Wt=d+_t+G*dt,Vt=d+_t+G*(dt+1),Q=d+(_t+1)+G*(dt+1),pt=d+(_t+1)+G*dt;l.push(Wt,Vt,pt),l.push(Vt,Q,pt),V+=6}a.addGroup(p,V,S),p+=V,d+=q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new U(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function hs(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function nn(i){const t={};for(let e=0;e<i.length;e++){const n=hs(i[e]);for(const s in n)t[s]=n[s]}return t}function wu(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Rc(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ce.workingColorSpace}const Bs={clone:hs,merge:nn};var yu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Su=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ze extends fs{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=yu,this.fragmentShader=Su,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=hs(t.uniforms),this.uniformsGroups=wu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Pc extends Le{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new _e,this.projectionMatrix=new _e,this.projectionMatrixInverse=new _e,this.coordinateSystem=Xn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const si=new A,ol=new lt,al=new lt;class hn extends Pc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Os*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Ps*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Os*2*Math.atan(Math.tan(Ps*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){si.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(si.x,si.y).multiplyScalar(-t/si.z),si.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(si.x,si.y).multiplyScalar(-t/si.z)}getViewSize(t,e){return this.getViewBounds(t,ol,al),e.subVectors(al,ol)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Ps*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const ki=-90,Hi=1;class bu extends Le{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new hn(ki,Hi,t,e);s.layers=this.layers,this.add(s);const r=new hn(ki,Hi,t,e);r.layers=this.layers,this.add(r);const o=new hn(ki,Hi,t,e);o.layers=this.layers,this.add(o);const a=new hn(ki,Hi,t,e);a.layers=this.layers,this.add(a);const l=new hn(ki,Hi,t,e);l.layers=this.layers,this.add(l);const c=new hn(ki,Hi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(const c of e)this.remove(c);if(t===Xn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Ar)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,d,p),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Lc extends Qe{constructor(t,e,n,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:rs,super(t,e,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Eu extends gn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Lc(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:En}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new U(5,5,5),r=new ze({name:"CubemapFromEquirect",uniforms:hs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Je,blending:Yn});r.uniforms.tEquirect.value=e;const o=new b(s,r),a=e.minFilter;return e.minFilter===wi&&(e.minFilter=En),new bu(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}}class Dr{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new gt(t),this.density=e}clone(){return new Dr(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Tu extends Le{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Pn,this.environmentIntensity=1,this.environmentRotation=new Pn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Au{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=ra,this.updateRanges=[],this.version=0,this.uuid=Cn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let s=0,r=this.stride;s<r;s++)this.array[t+s]=e.array[n+s];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Cn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Cn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const en=new A;class Rr{constructor(t,e,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)en.fromBufferAttribute(this,e),en.applyMatrix4(t),this.setXYZ(e,en.x,en.y,en.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)en.fromBufferAttribute(this,e),en.applyNormalMatrix(t),this.setXYZ(e,en.x,en.y,en.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)en.fromBufferAttribute(this,e),en.transformDirection(t),this.setXYZ(e,en.x,en.y,en.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=wn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=fe(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=fe(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=fe(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=fe(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=fe(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=wn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=wn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=wn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=wn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=fe(e,this.array),n=fe(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=fe(e,this.array),n=fe(n,this.array),s=fe(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=fe(e,this.array),n=fe(n,this.array),s=fe(s,this.array),r=fe(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this.data.array[t+3]=r,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return new _n(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Rr(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Dc extends fs{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new gt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let Vi;const ys=new A,Wi=new A,Xi=new A,Yi=new lt,Ss=new lt,Ic=new _e,or=new A,bs=new A,ar=new A,ll=new lt,so=new lt,cl=new lt;class Cu extends Le{constructor(t=new Dc){if(super(),this.isSprite=!0,this.type="Sprite",Vi===void 0){Vi=new tn;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Au(e,5);Vi.setIndex([0,1,2,0,2,3]),Vi.setAttribute("position",new Rr(n,3,0,!1)),Vi.setAttribute("uv",new Rr(n,2,3,!1))}this.geometry=Vi,this.material=t,this.center=new lt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Wi.setFromMatrixScale(this.matrixWorld),Ic.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Xi.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Wi.multiplyScalar(-Xi.z);const n=this.material.rotation;let s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));const o=this.center;lr(or.set(-.5,-.5,0),Xi,o,Wi,s,r),lr(bs.set(.5,-.5,0),Xi,o,Wi,s,r),lr(ar.set(.5,.5,0),Xi,o,Wi,s,r),ll.set(0,0),so.set(1,0),cl.set(1,1);let a=t.ray.intersectTriangle(or,bs,ar,!1,ys);if(a===null&&(lr(bs.set(-.5,.5,0),Xi,o,Wi,s,r),so.set(0,1),a=t.ray.intersectTriangle(or,ar,bs,!1,ys),a===null))return;const l=t.ray.origin.distanceTo(ys);l<t.near||l>t.far||e.push({distance:l,point:ys.clone(),uv:mn.getInterpolation(ys,or,bs,ar,ll,so,cl,new lt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function lr(i,t,e,n,s,r){Yi.subVectors(i,e).addScalar(.5).multiply(n),s!==void 0?(Ss.x=r*Yi.x-s*Yi.y,Ss.y=s*Yi.x+r*Yi.y):Ss.copy(Yi),i.copy(t),i.x+=Ss.x,i.y+=Ss.y,i.applyMatrix4(Ic)}class Ru extends Qe{constructor(t=null,e=1,n=1,s,r,o,a,l,c=un,h=un,u,d){super(null,o,a,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class hl extends _n{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const qi=new _e,ul=new _e,cr=[],dl=new Ti,Pu=new _e,Es=new b,Ts=new Hs;class us extends b{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new hl(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Pu)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Ti),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,qi),dl.copy(t.boundingBox).applyMatrix4(qi),this.boundingBox.union(dl)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Hs),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,qi),Ts.copy(t.boundingSphere).applyMatrix4(qi),this.boundingSphere.union(Ts)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(Es.geometry=this.geometry,Es.material=this.material,Es.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ts.copy(this.boundingSphere),Ts.applyMatrix4(n),t.ray.intersectsSphere(Ts)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,qi),ul.multiplyMatrices(n,qi),Es.matrixWorld=ul,Es.raycast(t,cr);for(let o=0,a=cr.length;o<a;o++){const l=cr[o];l.instanceId=r,l.object=this,e.push(l)}cr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new hl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ru(new Float32Array(s*this.count),s,this.count,ga,Tn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<n.length;c++)o+=n[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}const ro=new A,Lu=new A,Du=new te;class ri{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=ro.subVectors(n,e).cross(Lu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(ro),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Du.getNormalMatrix(t),s=this.coplanarPoint(ro).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const pi=new Hs,hr=new A;class wa{constructor(t=new ri,e=new ri,n=new ri,s=new ri,r=new ri,o=new ri){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Xn){const n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],p=s[8],g=s[9],x=s[10],m=s[11],f=s[12],y=s[13],M=s[14],_=s[15];if(n[0].setComponents(l-r,d-c,m-p,_-f).normalize(),n[1].setComponents(l+r,d+c,m+p,_+f).normalize(),n[2].setComponents(l+o,d+h,m+g,_+y).normalize(),n[3].setComponents(l-o,d-h,m-g,_-y).normalize(),n[4].setComponents(l-a,d-u,m-x,_-M).normalize(),e===Xn)n[5].setComponents(l+a,d+u,m+x,_+M).normalize();else if(e===Ar)n[5].setComponents(a,u,x,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),pi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),pi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(pi)}intersectsSprite(t){return pi.center.set(0,0,0),pi.radius=.7071067811865476,pi.applyMatrix4(t.matrixWorld),this.intersectsSphere(pi)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(hr.x=s.normal.x>0?t.max.x:t.min.x,hr.y=s.normal.y>0?t.max.y:t.min.y,hr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(hr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Jt extends Le{constructor(){super(),this.isGroup=!0,this.type="Group"}}class ci extends Qe{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Uc extends Qe{constructor(t,e,n,s,r,o,a,l,c,h=es){if(h!==es&&h!==ls)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===es&&(n=yi),n===void 0&&h===ls&&(n=as),super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:un,this.minFilter=l!==void 0?l:un,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class Ln{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);const h=n[s],d=n[s+1]-h,p=(o-h)/d;return(s+p)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new lt:new A);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new A,s=[],r=[],o=[],a=new A,l=new _e;for(let p=0;p<=t;p++){const g=p/t;s[p]=this.getTangentAt(g,new A)}r[0]=new A,o[0]=new A;let c=Number.MAX_VALUE;const h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let p=1;p<=t;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),a.crossVectors(s[p-1],s[p]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(ne(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(a,g))}o[p].crossVectors(s[p],r[p])}if(e===!0){let p=Math.acos(ne(r[0].dot(r[t]),-1,1));p/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(p=-p);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],p*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class ya extends Ln{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new lt){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);const a=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Iu extends ya{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Sa(){let i=0,t=0,e=0,n=0;function s(r,o,a,l){i=r,t=a,e=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let d=(o-r)/c-(a-r)/(c+h)+(a-o)/h,p=(a-o)/h-(l-o)/(h+u)+(l-a)/u;d*=h,p*=h,s(o,a,d,p)},calc:function(r){const o=r*r,a=o*r;return i+t*r+e*o+n*a}}}const ur=new A,oo=new Sa,ao=new Sa,lo=new Sa;class Rn extends Ln{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new A){const n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(ur.subVectors(s[0],s[1]).add(s[0]),c=ur);const u=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(ur.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=ur),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(u),p),x=Math.pow(u.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(h),p);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),oo.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,g,x,m),ao.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,g,x,m),lo.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,g,x,m)}else this.curveType==="catmullrom"&&(oo.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),ao.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),lo.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(oo.calc(l),ao.calc(l),lo.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new A().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function fl(i,t,e,n,s){const r=(n-t)*.5,o=(s-e)*.5,a=i*i,l=i*a;return(2*e-2*n+r+o)*l+(-3*e+3*n-2*r-o)*a+r*i+e}function Uu(i,t){const e=1-i;return e*e*t}function Nu(i,t){return 2*(1-i)*i*t}function Fu(i,t){return i*i*t}function Ds(i,t,e,n){return Uu(i,t)+Nu(i,e)+Fu(i,n)}function Ou(i,t){const e=1-i;return e*e*e*t}function Bu(i,t){const e=1-i;return 3*e*e*i*t}function zu(i,t){return 3*(1-i)*i*i*t}function Gu(i,t){return i*i*i*t}function Is(i,t,e,n,s){return Ou(i,t)+Bu(i,e)+zu(i,n)+Gu(i,s)}class Nc extends Ln{constructor(t=new lt,e=new lt,n=new lt,s=new lt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new lt){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Is(t,s.x,r.x,o.x,a.x),Is(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class ku extends Ln{constructor(t=new A,e=new A,n=new A,s=new A){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new A){const n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Is(t,s.x,r.x,o.x,a.x),Is(t,s.y,r.y,o.y,a.y),Is(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Fc extends Ln{constructor(t=new lt,e=new lt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new lt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new lt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class is extends Ln{constructor(t=new A,e=new A){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new A){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new A){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Oc extends Ln{constructor(t=new lt,e=new lt,n=new lt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new lt){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ds(t,s.x,r.x,o.x),Ds(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class ba extends Ln{constructor(t=new A,e=new A,n=new A){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new A){const n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(Ds(t,s.x,r.x,o.x),Ds(t,s.y,r.y,o.y),Ds(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Bc extends Ln{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new lt){const n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return n.set(fl(a,l.x,c.x,h.x,u.x),fl(a,l.y,c.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new lt().fromArray(s))}return this}}var Pr=Object.freeze({__proto__:null,ArcCurve:Iu,CatmullRomCurve3:Rn,CubicBezierCurve:Nc,CubicBezierCurve3:ku,EllipseCurve:ya,LineCurve:Fc,LineCurve3:is,QuadraticBezierCurve:Oc,QuadraticBezierCurve3:ba,SplineCurve:Bc});class Hu extends Ln{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Pr[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Pr[s.type]().fromJSON(s))}return this}}class pl extends Hu{constructor(t){super(),this.type="Path",this.currentPoint=new lt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Fc(this.currentPoint.clone(),new lt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Oc(this.currentPoint.clone(),new lt(t,e),new lt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){const a=new Nc(this.currentPoint.clone(),new lt(t,e),new lt(n,s),new lt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Bc(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){const a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,s,r,o,a,l),this}absellipse(t,e,n,s,r,o,a,l){const c=new ya(t,e,n,s,r,o,a,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class zt extends tn{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const h=[],u=[],d=[],p=[];let g=0;const x=[],m=n/2;let f=0;y(),o===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new pe(u,3)),this.setAttribute("normal",new pe(d,3)),this.setAttribute("uv",new pe(p,2));function y(){const _=new A,L=new A;let T=0;const D=(e-t)/n;for(let I=0;I<=r;I++){const S=[],v=I/r,C=v*(e-t)+t;for(let N=0;N<=s;N++){const F=N/s,O=F*l+a,G=Math.sin(O),W=Math.cos(O);L.x=C*G,L.y=-v*n+m,L.z=C*W,u.push(L.x,L.y,L.z),_.set(G,D,W).normalize(),d.push(_.x,_.y,_.z),p.push(F,1-v),S.push(g++)}x.push(S)}for(let I=0;I<s;I++)for(let S=0;S<r;S++){const v=x[S][I],C=x[S+1][I],N=x[S+1][I+1],F=x[S][I+1];(t>0||S!==0)&&(h.push(v,C,F),T+=3),(e>0||S!==r-1)&&(h.push(C,N,F),T+=3)}c.addGroup(f,T,0),f+=T}function M(_){const L=g,T=new lt,D=new A;let I=0;const S=_===!0?t:e,v=_===!0?1:-1;for(let N=1;N<=s;N++)u.push(0,m*v,0),d.push(0,v,0),p.push(.5,.5),g++;const C=g;for(let N=0;N<=s;N++){const O=N/s*l+a,G=Math.cos(O),W=Math.sin(O);D.x=S*W,D.y=m*v,D.z=S*G,u.push(D.x,D.y,D.z),d.push(0,v,0),T.x=G*.5+.5,T.y=W*.5*v+.5,p.push(T.x,T.y),g++}for(let N=0;N<s;N++){const F=L+N,O=C+N;_===!0?h.push(O,O+1,F):h.push(O+1,O,F),I+=3}c.addGroup(f,I,_===!0?1:2),f+=I}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new zt(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class li extends zt{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new li(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ir extends tn{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],o=[];a(s),c(n),h(),this.setAttribute("position",new pe(r,3)),this.setAttribute("normal",new pe(r.slice(),3)),this.setAttribute("uv",new pe(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(y){const M=new A,_=new A,L=new A;for(let T=0;T<e.length;T+=3)p(e[T+0],M),p(e[T+1],_),p(e[T+2],L),l(M,_,L,y)}function l(y,M,_,L){const T=L+1,D=[];for(let I=0;I<=T;I++){D[I]=[];const S=y.clone().lerp(_,I/T),v=M.clone().lerp(_,I/T),C=T-I;for(let N=0;N<=C;N++)N===0&&I===T?D[I][N]=S:D[I][N]=S.clone().lerp(v,N/C)}for(let I=0;I<T;I++)for(let S=0;S<2*(T-I)-1;S++){const v=Math.floor(S/2);S%2===0?(d(D[I][v+1]),d(D[I+1][v]),d(D[I][v])):(d(D[I][v+1]),d(D[I+1][v+1]),d(D[I+1][v]))}}function c(y){const M=new A;for(let _=0;_<r.length;_+=3)M.x=r[_+0],M.y=r[_+1],M.z=r[_+2],M.normalize().multiplyScalar(y),r[_+0]=M.x,r[_+1]=M.y,r[_+2]=M.z}function h(){const y=new A;for(let M=0;M<r.length;M+=3){y.x=r[M+0],y.y=r[M+1],y.z=r[M+2];const _=m(y)/2/Math.PI+.5,L=f(y)/Math.PI+.5;o.push(_,1-L)}g(),u()}function u(){for(let y=0;y<o.length;y+=6){const M=o[y+0],_=o[y+2],L=o[y+4],T=Math.max(M,_,L),D=Math.min(M,_,L);T>.9&&D<.1&&(M<.2&&(o[y+0]+=1),_<.2&&(o[y+2]+=1),L<.2&&(o[y+4]+=1))}}function d(y){r.push(y.x,y.y,y.z)}function p(y,M){const _=y*3;M.x=t[_+0],M.y=t[_+1],M.z=t[_+2]}function g(){const y=new A,M=new A,_=new A,L=new A,T=new lt,D=new lt,I=new lt;for(let S=0,v=0;S<r.length;S+=9,v+=6){y.set(r[S+0],r[S+1],r[S+2]),M.set(r[S+3],r[S+4],r[S+5]),_.set(r[S+6],r[S+7],r[S+8]),T.set(o[v+0],o[v+1]),D.set(o[v+2],o[v+3]),I.set(o[v+4],o[v+5]),L.copy(y).add(M).add(_).divideScalar(3);const C=m(L);x(T,v+0,y,C),x(D,v+2,M,C),x(I,v+4,_,C)}}function x(y,M,_,L){L<0&&y.x===1&&(o[M]=y.x-1),_.x===0&&_.z===0&&(o[M]=L/2/Math.PI+.5)}function m(y){return Math.atan2(y.z,-y.x)}function f(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ir(t.vertices,t.indices,t.radius,t.details)}}class Ea extends Ir{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ea(t.radius,t.detail)}}class zc extends pl{constructor(t){super(t),this.uuid=Cn(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new pl().fromJSON(s))}return this}}const Vu={triangulate:function(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=Gc(i,0,s,e,!0);const o=[];if(!r||r.next===r.prev)return o;let a,l,c,h,u,d,p;if(n&&(r=Zu(i,t,r,e)),i.length>80*e){a=c=i[0],l=h=i[1];for(let g=e;g<s;g+=e)u=i[g],d=i[g+1],u<a&&(a=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-a,h-l),p=p!==0?32767/p:0}return zs(r,o,e,a,l,p,0),o}};function Gc(i,t,e,n,s){let r,o;if(s===rd(i,t,e,n)>0)for(r=t;r<e;r+=n)o=ml(r,i[r],i[r+1],o);else for(r=e-n;r>=t;r-=n)o=ml(r,i[r],i[r+1],o);return o&&Ur(o,o.next)&&(ks(o),o=o.next),o}function bi(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Ur(e,e.next)||Re(e.prev,e,e.next)===0)){if(ks(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function zs(i,t,e,n,s,r,o){if(!i)return;!o&&r&&Qu(i,n,s,r);let a=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?Xu(i,n,s,r):Wu(i)){t.push(l.i/e|0),t.push(i.i/e|0),t.push(c.i/e|0),ks(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=Yu(bi(i),t,e),zs(i,t,e,n,s,r,2)):o===2&&qu(i,t,e,n,s,r):zs(bi(i),t,e,n,s,r,1);break}}}function Wu(i){const t=i.prev,e=i,n=i.next;if(Re(t,e,n)>=0)return!1;const s=t.x,r=e.x,o=n.x,a=t.y,l=e.y,c=n.y,h=s<r?s<o?s:o:r<o?r:o,u=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,p=a>l?a>c?a:c:l>c?l:c;let g=n.next;for(;g!==t;){if(g.x>=h&&g.x<=d&&g.y>=u&&g.y<=p&&Ki(s,a,r,l,o,c,g.x,g.y)&&Re(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Xu(i,t,e,n){const s=i.prev,r=i,o=i.next;if(Re(s,r,o)>=0)return!1;const a=s.x,l=r.x,c=o.x,h=s.y,u=r.y,d=o.y,p=a<l?a<c?a:c:l<c?l:c,g=h<u?h<d?h:d:u<d?u:d,x=a>l?a>c?a:c:l>c?l:c,m=h>u?h>d?h:d:u>d?u:d,f=oa(p,g,t,e,n),y=oa(x,m,t,e,n);let M=i.prevZ,_=i.nextZ;for(;M&&M.z>=f&&_&&_.z<=y;){if(M.x>=p&&M.x<=x&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Ki(a,h,l,u,c,d,M.x,M.y)&&Re(M.prev,M,M.next)>=0||(M=M.prevZ,_.x>=p&&_.x<=x&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&Ki(a,h,l,u,c,d,_.x,_.y)&&Re(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;M&&M.z>=f;){if(M.x>=p&&M.x<=x&&M.y>=g&&M.y<=m&&M!==s&&M!==o&&Ki(a,h,l,u,c,d,M.x,M.y)&&Re(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;_&&_.z<=y;){if(_.x>=p&&_.x<=x&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&Ki(a,h,l,u,c,d,_.x,_.y)&&Re(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function Yu(i,t,e){let n=i;do{const s=n.prev,r=n.next.next;!Ur(s,r)&&kc(s,n,n.next,r)&&Gs(s,r)&&Gs(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),ks(n),ks(n.next),n=i=r),n=n.next}while(n!==i);return bi(n)}function qu(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&nd(o,a)){let l=Hc(o,a);o=bi(o,o.next),l=bi(l,l.next),zs(o,t,e,n,s,r,0),zs(l,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function Zu(i,t,e,n){const s=[];let r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*n,l=r<o-1?t[r+1]*n:i.length,c=Gc(i,a,l,n,!1),c===c.next&&(c.steiner=!0),s.push(ed(c));for(s.sort($u),r=0;r<s.length;r++)e=ju(s[r],e);return e}function $u(i,t){return i.x-t.x}function ju(i,t){const e=Ku(i,t);if(!e)return t;const n=Hc(e,i);return bi(n,n.next),bi(e,e.next)}function Ku(i,t){let e=t,n=-1/0,s;const r=i.x,o=i.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){const d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>n&&(n=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;const a=s,l=s.x,c=s.y;let h=1/0,u;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Ki(o<c?r:n,o,l,c,o<c?n:r,o,e.x,e.y)&&(u=Math.abs(o-e.y)/(r-e.x),Gs(e,i)&&(u<h||u===h&&(e.x>s.x||e.x===s.x&&Ju(s,e)))&&(s=e,h=u)),e=e.next;while(e!==a);return s}function Ju(i,t){return Re(i.prev,i,t.prev)<0&&Re(t.next,i,i.next)<0}function Qu(i,t,e,n){let s=i;do s.z===0&&(s.z=oa(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,td(s)}function td(i){let t,e,n,s,r,o,a,l,c=1;do{for(e=i,i=null,r=null,o=0;e;){for(o++,n=e,a=0,t=0;t<c&&(a++,n=n.nextZ,!!n);t++);for(l=c;a>0||l>0&&n;)a!==0&&(l===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,a--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,c*=2}while(o>1);return i}function oa(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function ed(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Ki(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function nd(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!id(i,t)&&(Gs(i,t)&&Gs(t,i)&&sd(i,t)&&(Re(i.prev,i,t.prev)||Re(i,t.prev,t))||Ur(i,t)&&Re(i.prev,i,i.next)>0&&Re(t.prev,t,t.next)>0)}function Re(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Ur(i,t){return i.x===t.x&&i.y===t.y}function kc(i,t,e,n){const s=fr(Re(i,t,e)),r=fr(Re(i,t,n)),o=fr(Re(e,n,i)),a=fr(Re(e,n,t));return!!(s!==r&&o!==a||s===0&&dr(i,e,t)||r===0&&dr(i,n,t)||o===0&&dr(e,i,n)||a===0&&dr(e,t,n))}function dr(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function fr(i){return i>0?1:i<0?-1:0}function id(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&kc(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function Gs(i,t){return Re(i.prev,i,i.next)<0?Re(i,t,i.next)>=0&&Re(i,i.prev,t)>=0:Re(i,t,i.prev)<0||Re(i,i.next,t)<0}function sd(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function Hc(i,t){const e=new aa(i.i,i.x,i.y),n=new aa(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function ml(i,t,e,n){const s=new aa(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function ks(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function aa(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function rd(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}class Us{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return Us.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];gl(t),_l(n,t);let o=t.length;e.forEach(gl);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,_l(n,e[l]);const a=Vu.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}}function gl(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function _l(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Ta extends tn{constructor(t=new zc([new lt(.5,.5),new lt(-.5,.5),new lt(-.5,-.5),new lt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){const c=t[a];o(c)}this.setAttribute("position",new pe(s,3)),this.setAttribute("uv",new pe(r,2)),this.computeVertexNormals();function o(a){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1;let d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,p=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:p-.1,x=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const f=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:od;let M,_=!1,L,T,D,I;f&&(M=f.getSpacedPoints(h),_=!0,d=!1,L=f.computeFrenetFrames(h,!1),T=new A,D=new A,I=new A),d||(m=0,p=0,g=0,x=0);const S=a.extractPoints(c);let v=S.shape;const C=S.holes;if(!Us.isClockWise(v)){v=v.reverse();for(let $=0,ot=C.length;$<ot;$++){const R=C[$];Us.isClockWise(R)&&(C[$]=R.reverse())}}const F=Us.triangulateShape(v,C),O=v;for(let $=0,ot=C.length;$<ot;$++){const R=C[$];v=v.concat(R)}function G($,ot,R){return ot||console.error("THREE.ExtrudeGeometry: vec does not exist"),$.clone().addScaledVector(ot,R)}const W=v.length,q=F.length;function V($,ot,R){let Mt,et,ht;const st=$.x-ot.x,Ft=$.y-ot.y,ut=R.x-$.x,P=R.y-$.y,w=st*st+Ft*Ft,H=st*P-Ft*ut;if(Math.abs(H)>Number.EPSILON){const J=Math.sqrt(w),rt=Math.sqrt(ut*ut+P*P),tt=ot.x-Ft/J,Lt=ot.y+st/J,K=R.x-P/rt,nt=R.y+ut/rt,Dt=((K-tt)*P-(nt-Lt)*ut)/(st*P-Ft*ut);Mt=tt+st*Dt-$.x,et=Lt+Ft*Dt-$.y;const it=Mt*Mt+et*et;if(it<=2)return new lt(Mt,et);ht=Math.sqrt(it/2)}else{let J=!1;st>Number.EPSILON?ut>Number.EPSILON&&(J=!0):st<-Number.EPSILON?ut<-Number.EPSILON&&(J=!0):Math.sign(Ft)===Math.sign(P)&&(J=!0),J?(Mt=-Ft,et=st,ht=Math.sqrt(w)):(Mt=st,et=Ft,ht=Math.sqrt(w/2))}return new lt(Mt/ht,et/ht)}const ct=[];for(let $=0,ot=O.length,R=ot-1,Mt=$+1;$<ot;$++,R++,Mt++)R===ot&&(R=0),Mt===ot&&(Mt=0),ct[$]=V(O[$],O[R],O[Mt]);const dt=[];let _t,Wt=ct.concat();for(let $=0,ot=C.length;$<ot;$++){const R=C[$];_t=[];for(let Mt=0,et=R.length,ht=et-1,st=Mt+1;Mt<et;Mt++,ht++,st++)ht===et&&(ht=0),st===et&&(st=0),_t[Mt]=V(R[Mt],R[ht],R[st]);dt.push(_t),Wt=Wt.concat(_t)}for(let $=0;$<m;$++){const ot=$/m,R=p*Math.cos(ot*Math.PI/2),Mt=g*Math.sin(ot*Math.PI/2)+x;for(let et=0,ht=O.length;et<ht;et++){const st=G(O[et],ct[et],Mt);mt(st.x,st.y,-R)}for(let et=0,ht=C.length;et<ht;et++){const st=C[et];_t=dt[et];for(let Ft=0,ut=st.length;Ft<ut;Ft++){const P=G(st[Ft],_t[Ft],Mt);mt(P.x,P.y,-R)}}}const Vt=g+x;for(let $=0;$<W;$++){const ot=d?G(v[$],Wt[$],Vt):v[$];_?(D.copy(L.normals[0]).multiplyScalar(ot.x),T.copy(L.binormals[0]).multiplyScalar(ot.y),I.copy(M[0]).add(D).add(T),mt(I.x,I.y,I.z)):mt(ot.x,ot.y,0)}for(let $=1;$<=h;$++)for(let ot=0;ot<W;ot++){const R=d?G(v[ot],Wt[ot],Vt):v[ot];_?(D.copy(L.normals[$]).multiplyScalar(R.x),T.copy(L.binormals[$]).multiplyScalar(R.y),I.copy(M[$]).add(D).add(T),mt(I.x,I.y,I.z)):mt(R.x,R.y,u/h*$)}for(let $=m-1;$>=0;$--){const ot=$/m,R=p*Math.cos(ot*Math.PI/2),Mt=g*Math.sin(ot*Math.PI/2)+x;for(let et=0,ht=O.length;et<ht;et++){const st=G(O[et],ct[et],Mt);mt(st.x,st.y,u+R)}for(let et=0,ht=C.length;et<ht;et++){const st=C[et];_t=dt[et];for(let Ft=0,ut=st.length;Ft<ut;Ft++){const P=G(st[Ft],_t[Ft],Mt);_?mt(P.x,P.y+M[h-1].y,M[h-1].x+R):mt(P.x,P.y,u+R)}}}Q(),pt();function Q(){const $=s.length/3;if(d){let ot=0,R=W*ot;for(let Mt=0;Mt<q;Mt++){const et=F[Mt];Ut(et[2]+R,et[1]+R,et[0]+R)}ot=h+m*2,R=W*ot;for(let Mt=0;Mt<q;Mt++){const et=F[Mt];Ut(et[0]+R,et[1]+R,et[2]+R)}}else{for(let ot=0;ot<q;ot++){const R=F[ot];Ut(R[2],R[1],R[0])}for(let ot=0;ot<q;ot++){const R=F[ot];Ut(R[0]+W*h,R[1]+W*h,R[2]+W*h)}}n.addGroup($,s.length/3-$,0)}function pt(){const $=s.length/3;let ot=0;vt(O,ot),ot+=O.length;for(let R=0,Mt=C.length;R<Mt;R++){const et=C[R];vt(et,ot),ot+=et.length}n.addGroup($,s.length/3-$,1)}function vt($,ot){let R=$.length;for(;--R>=0;){const Mt=R;let et=R-1;et<0&&(et=$.length-1);for(let ht=0,st=h+m*2;ht<st;ht++){const Ft=W*ht,ut=W*(ht+1),P=ot+Mt+Ft,w=ot+et+Ft,H=ot+et+ut,J=ot+Mt+ut;Nt(P,w,H,J)}}}function mt($,ot,R){l.push($),l.push(ot),l.push(R)}function Ut($,ot,R){kt($),kt(ot),kt(R);const Mt=s.length/3,et=y.generateTopUV(n,s,Mt-3,Mt-2,Mt-1);Bt(et[0]),Bt(et[1]),Bt(et[2])}function Nt($,ot,R,Mt){kt($),kt(ot),kt(Mt),kt(ot),kt(R),kt(Mt);const et=s.length/3,ht=y.generateSideWallUV(n,s,et-6,et-3,et-2,et-1);Bt(ht[0]),Bt(ht[1]),Bt(ht[3]),Bt(ht[1]),Bt(ht[2]),Bt(ht[3])}function kt($){s.push(l[$*3+0]),s.push(l[$*3+1]),s.push(l[$*3+2])}function Bt($){r.push($.x),r.push($.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return ad(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,o=t.shapes.length;r<o;r++){const a=e[t.shapes[r]];n.push(a)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Pr[s.type]().fromJSON(s)),new Ta(n,t.options)}}const od={generateTopUV:function(i,t,e,n,s){const r=t[e*3],o=t[e*3+1],a=t[n*3],l=t[n*3+1],c=t[s*3],h=t[s*3+1];return[new lt(r,o),new lt(a,l),new lt(c,h)]},generateSideWallUV:function(i,t,e,n,s,r){const o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[n*3],h=t[n*3+1],u=t[n*3+2],d=t[s*3],p=t[s*3+1],g=t[s*3+2],x=t[r*3],m=t[r*3+1],f=t[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new lt(o,1-l),new lt(c,1-u),new lt(d,1-g),new lt(x,1-f)]:[new lt(a,1-l),new lt(h,1-u),new lt(p,1-g),new lt(m,1-f)]}};function ad(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class Aa extends Ir{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Aa(t.radius,t.detail)}}class Ce extends tn{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=t/a,d=e/l,p=[],g=[],x=[],m=[];for(let f=0;f<h;f++){const y=f*d-o;for(let M=0;M<c;M++){const _=M*u-r;g.push(_,-y,0),x.push(0,0,1),m.push(M/a),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let y=0;y<a;y++){const M=y+c*f,_=y+c*(f+1),L=y+1+c*(f+1),T=y+1+c*f;p.push(M,_,T),p.push(_,L,T)}this.setIndex(p),this.setAttribute("position",new pe(g,3)),this.setAttribute("normal",new pe(x,3)),this.setAttribute("uv",new pe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ce(t.width,t.height,t.widthSegments,t.heightSegments)}}class qe extends tn{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const h=[],u=new A,d=new A,p=[],g=[],x=[],m=[];for(let f=0;f<=n;f++){const y=[],M=f/n;let _=0;f===0&&o===0?_=.5/e:f===n&&l===Math.PI&&(_=-.5/e);for(let L=0;L<=e;L++){const T=L/e;u.x=-t*Math.cos(s+T*r)*Math.sin(o+M*a),u.y=t*Math.cos(o+M*a),u.z=t*Math.sin(s+T*r)*Math.sin(o+M*a),g.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),m.push(T+_,1-M),y.push(c++)}h.push(y)}for(let f=0;f<n;f++)for(let y=0;y<e;y++){const M=h[f][y+1],_=h[f][y],L=h[f+1][y],T=h[f+1][y+1];(f!==0||o>0)&&p.push(M,_,T),(f!==n-1||l<Math.PI)&&p.push(_,L,T)}this.setIndex(p),this.setAttribute("position",new pe(g,3)),this.setAttribute("normal",new pe(x,3)),this.setAttribute("uv",new pe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new qe(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Ai extends tn{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);const o=[],a=[],l=[],c=[],h=new A,u=new A,d=new A;for(let p=0;p<=n;p++)for(let g=0;g<=s;g++){const x=g/s*r,m=p/n*Math.PI*2;u.x=(t+e*Math.cos(m))*Math.cos(x),u.y=(t+e*Math.cos(m))*Math.sin(x),u.z=e*Math.sin(m),a.push(u.x,u.y,u.z),h.x=t*Math.cos(x),h.y=t*Math.sin(x),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(g/s),c.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=s;g++){const x=(s+1)*p+g-1,m=(s+1)*(p-1)+g-1,f=(s+1)*(p-1)+g,y=(s+1)*p+g;o.push(x,m,y),o.push(m,f,y)}this.setIndex(o),this.setAttribute("position",new pe(a,3)),this.setAttribute("normal",new pe(l,3)),this.setAttribute("uv",new pe(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ai(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Xe extends tn{constructor(t=new ba(new A(-1,-1,0),new A(-1,1,0),new A(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};const o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new A,l=new A,c=new lt;let h=new A;const u=[],d=[],p=[],g=[];x(),this.setIndex(g),this.setAttribute("position",new pe(u,3)),this.setAttribute("normal",new pe(d,3)),this.setAttribute("uv",new pe(p,2));function x(){for(let M=0;M<e;M++)m(M);m(r===!1?e:0),y(),f()}function m(M){h=t.getPointAt(M/e,h);const _=o.normals[M],L=o.binormals[M];for(let T=0;T<=s;T++){const D=T/s*Math.PI*2,I=Math.sin(D),S=-Math.cos(D);l.x=S*_.x+I*L.x,l.y=S*_.y+I*L.y,l.z=S*_.z+I*L.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=h.x+n*l.x,a.y=h.y+n*l.y,a.z=h.z+n*l.z,u.push(a.x,a.y,a.z)}}function f(){for(let M=1;M<=e;M++)for(let _=1;_<=s;_++){const L=(s+1)*(M-1)+(_-1),T=(s+1)*M+(_-1),D=(s+1)*M+_,I=(s+1)*(M-1)+_;g.push(L,T,I),g.push(T,D,I)}}function y(){for(let M=0;M<=e;M++)for(let _=0;_<=s;_++)c.x=M/e,c.y=_/s,p.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new Xe(new Pr[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class ld extends ze{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Y extends fs{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new gt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new gt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=xc,this.normalScale=new lt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Pn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class cd extends fs{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Rh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class hd extends fs{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class Ca extends Le{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new gt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class ud extends Ca{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Le.DEFAULT_UP),this.updateMatrix(),this.groundColor=new gt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const co=new _e,vl=new A,xl=new A;class Vc{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new lt(512,512),this.map=null,this.mapPass=null,this.matrix=new _e,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new wa,this._frameExtents=new lt(1,1),this._viewportCount=1,this._viewports=[new ge(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;vl.setFromMatrixPosition(t.matrixWorld),e.position.copy(vl),xl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(xl),e.updateMatrixWorld(),co.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(co),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(co)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Ml=new _e,As=new A,ho=new A;class dd extends Vc{constructor(){super(new hn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new lt(4,2),this._viewportCount=6,this._viewports=[new ge(2,1,1,1),new ge(0,1,1,1),new ge(3,1,1,1),new ge(1,1,1,1),new ge(3,0,1,1),new ge(1,0,1,1)],this._cubeDirections=[new A(1,0,0),new A(-1,0,0),new A(0,0,1),new A(0,0,-1),new A(0,1,0),new A(0,-1,0)],this._cubeUps=[new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,0,1),new A(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),As.setFromMatrixPosition(t.matrixWorld),n.position.copy(As),ho.copy(n.position),ho.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(ho),n.updateMatrixWorld(),s.makeTranslation(-As.x,-As.y,-As.z),Ml.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ml)}}class oi extends Ca{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new dd}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Ra extends Pc{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class fd extends Vc{constructor(){super(new Ra(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class wl extends Ca{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Le.DEFAULT_UP),this.updateMatrix(),this.target=new Le,this.shadow=new fd}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class pd extends hn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class md{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=yl(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=yl();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function yl(){return performance.now()}class Sl{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=ne(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(ne(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class gd extends Ei{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}function bl(i,t,e,n){const s=_d(n);switch(e){case fc:return i*t;case mc:return i*t;case gc:return i*t*2;case ga:return i*t/s.components*s.byteLength;case _a:return i*t/s.components*s.byteLength;case _c:return i*t*2/s.components*s.byteLength;case va:return i*t*2/s.components*s.byteLength;case pc:return i*t*3/s.components*s.byteLength;case yn:return i*t*4/s.components*s.byteLength;case xa:return i*t*4/s.components*s.byteLength;case vr:case xr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Mr:case wr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Uo:case Fo:return Math.max(i,16)*Math.max(t,8)/4;case Io:case No:return Math.max(i,8)*Math.max(t,8)/2;case Oo:case Bo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case zo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Go:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ko:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ho:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Vo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Wo:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Xo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Yo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case qo:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Zo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case $o:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case jo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ko:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Jo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Qo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case yr:case ta:case ea:return Math.ceil(i/4)*Math.ceil(t/4)*16;case vc:case na:return Math.ceil(i/4)*Math.ceil(t/4)*8;case ia:case sa:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function _d(i){switch(i){case $n:case hc:return{byteLength:1,components:1};case Fs:case uc:case An:return{byteLength:2,components:1};case pa:case ma:return{byteLength:2,components:4};case yi:case fa:case Tn:return{byteLength:4,components:1};case dc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ua}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ua);/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Wc(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function vd(i){const t=new WeakMap;function e(a,l){const c=a.array,h=a.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),a.onUploadCallback();let p;if(c instanceof Float32Array)p=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=i.SHORT;else if(c instanceof Uint32Array)p=i.UNSIGNED_INT;else if(c instanceof Int32Array)p=i.INT;else if(c instanceof Int8Array)p=i.BYTE;else if(c instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){const h=l.array,u=l.updateRanges;if(i.bindBuffer(c,a),u.length===0)i.bufferSubData(c,0,h);else{u.sort((p,g)=>p.start-g.start);let d=0;for(let p=1;p<u.length;p++){const g=u[d],x=u[p];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let p=0,g=u.length;p<g;p++){const x=u[p];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var xd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Md=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,wd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,yd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Sd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,bd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ed=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Td=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ad=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Cd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Rd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Pd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ld=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Dd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Id=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Ud=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Nd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Fd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Od=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Bd=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,zd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Gd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,kd=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Hd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Vd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Wd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Xd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Yd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,qd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Zd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,$d="gl_FragColor = linearToOutputTexel( gl_FragColor );",jd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Kd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Jd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Qd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,tf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ef=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,nf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,sf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,rf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,of=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,af=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,cf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,hf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,uf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,df=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,ff=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,pf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,mf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,gf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,_f=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,vf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,xf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Mf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,wf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,yf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Sf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,bf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ef=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Tf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Af=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Cf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Rf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Lf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Df=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,If=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Uf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Nf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Ff=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Of=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Bf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,zf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,kf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Hf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Vf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Wf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Xf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Yf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,qf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Zf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,$f=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,jf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Kf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Qf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ep=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,np=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,ip=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,sp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,rp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,op=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,ap=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,lp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,cp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,hp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,up=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,dp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,fp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,pp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,mp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,gp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_p=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,vp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const xp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Mp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,yp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ep=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Tp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ap=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Cp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Rp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Pp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lp=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Dp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ip=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Up=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Np=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Op=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Bp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Gp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,kp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Hp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Wp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Yp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qp=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Zp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$p=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Kp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Jp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ee={alphahash_fragment:xd,alphahash_pars_fragment:Md,alphamap_fragment:wd,alphamap_pars_fragment:yd,alphatest_fragment:Sd,alphatest_pars_fragment:bd,aomap_fragment:Ed,aomap_pars_fragment:Td,batching_pars_vertex:Ad,batching_vertex:Cd,begin_vertex:Rd,beginnormal_vertex:Pd,bsdfs:Ld,iridescence_fragment:Dd,bumpmap_pars_fragment:Id,clipping_planes_fragment:Ud,clipping_planes_pars_fragment:Nd,clipping_planes_pars_vertex:Fd,clipping_planes_vertex:Od,color_fragment:Bd,color_pars_fragment:zd,color_pars_vertex:Gd,color_vertex:kd,common:Hd,cube_uv_reflection_fragment:Vd,defaultnormal_vertex:Wd,displacementmap_pars_vertex:Xd,displacementmap_vertex:Yd,emissivemap_fragment:qd,emissivemap_pars_fragment:Zd,colorspace_fragment:$d,colorspace_pars_fragment:jd,envmap_fragment:Kd,envmap_common_pars_fragment:Jd,envmap_pars_fragment:Qd,envmap_pars_vertex:tf,envmap_physical_pars_fragment:df,envmap_vertex:ef,fog_vertex:nf,fog_pars_vertex:sf,fog_fragment:rf,fog_pars_fragment:of,gradientmap_pars_fragment:af,lightmap_pars_fragment:lf,lights_lambert_fragment:cf,lights_lambert_pars_fragment:hf,lights_pars_begin:uf,lights_toon_fragment:ff,lights_toon_pars_fragment:pf,lights_phong_fragment:mf,lights_phong_pars_fragment:gf,lights_physical_fragment:_f,lights_physical_pars_fragment:vf,lights_fragment_begin:xf,lights_fragment_maps:Mf,lights_fragment_end:wf,logdepthbuf_fragment:yf,logdepthbuf_pars_fragment:Sf,logdepthbuf_pars_vertex:bf,logdepthbuf_vertex:Ef,map_fragment:Tf,map_pars_fragment:Af,map_particle_fragment:Cf,map_particle_pars_fragment:Rf,metalnessmap_fragment:Pf,metalnessmap_pars_fragment:Lf,morphinstance_vertex:Df,morphcolor_vertex:If,morphnormal_vertex:Uf,morphtarget_pars_vertex:Nf,morphtarget_vertex:Ff,normal_fragment_begin:Of,normal_fragment_maps:Bf,normal_pars_fragment:zf,normal_pars_vertex:Gf,normal_vertex:kf,normalmap_pars_fragment:Hf,clearcoat_normal_fragment_begin:Vf,clearcoat_normal_fragment_maps:Wf,clearcoat_pars_fragment:Xf,iridescence_pars_fragment:Yf,opaque_fragment:qf,packing:Zf,premultiplied_alpha_fragment:$f,project_vertex:jf,dithering_fragment:Kf,dithering_pars_fragment:Jf,roughnessmap_fragment:Qf,roughnessmap_pars_fragment:tp,shadowmap_pars_fragment:ep,shadowmap_pars_vertex:np,shadowmap_vertex:ip,shadowmask_pars_fragment:sp,skinbase_vertex:rp,skinning_pars_vertex:op,skinning_vertex:ap,skinnormal_vertex:lp,specularmap_fragment:cp,specularmap_pars_fragment:hp,tonemapping_fragment:up,tonemapping_pars_fragment:dp,transmission_fragment:fp,transmission_pars_fragment:pp,uv_pars_fragment:mp,uv_pars_vertex:gp,uv_vertex:_p,worldpos_vertex:vp,background_vert:xp,background_frag:Mp,backgroundCube_vert:wp,backgroundCube_frag:yp,cube_vert:Sp,cube_frag:bp,depth_vert:Ep,depth_frag:Tp,distanceRGBA_vert:Ap,distanceRGBA_frag:Cp,equirect_vert:Rp,equirect_frag:Pp,linedashed_vert:Lp,linedashed_frag:Dp,meshbasic_vert:Ip,meshbasic_frag:Up,meshlambert_vert:Np,meshlambert_frag:Fp,meshmatcap_vert:Op,meshmatcap_frag:Bp,meshnormal_vert:zp,meshnormal_frag:Gp,meshphong_vert:kp,meshphong_frag:Hp,meshphysical_vert:Vp,meshphysical_frag:Wp,meshtoon_vert:Xp,meshtoon_frag:Yp,points_vert:qp,points_frag:Zp,shadow_vert:$p,shadow_frag:jp,sprite_vert:Kp,sprite_frag:Jp},Tt={common:{diffuse:{value:new gt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new te}},envmap:{envMap:{value:null},envMapRotation:{value:new te},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new te},normalScale:{value:new lt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new gt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new gt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0},uvTransform:{value:new te}},sprite:{diffuse:{value:new gt(16777215)},opacity:{value:1},center:{value:new lt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}}},bn={basic:{uniforms:nn([Tt.common,Tt.specularmap,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.fog]),vertexShader:ee.meshbasic_vert,fragmentShader:ee.meshbasic_frag},lambert:{uniforms:nn([Tt.common,Tt.specularmap,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.fog,Tt.lights,{emissive:{value:new gt(0)}}]),vertexShader:ee.meshlambert_vert,fragmentShader:ee.meshlambert_frag},phong:{uniforms:nn([Tt.common,Tt.specularmap,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.fog,Tt.lights,{emissive:{value:new gt(0)},specular:{value:new gt(1118481)},shininess:{value:30}}]),vertexShader:ee.meshphong_vert,fragmentShader:ee.meshphong_frag},standard:{uniforms:nn([Tt.common,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.roughnessmap,Tt.metalnessmap,Tt.fog,Tt.lights,{emissive:{value:new gt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ee.meshphysical_vert,fragmentShader:ee.meshphysical_frag},toon:{uniforms:nn([Tt.common,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.gradientmap,Tt.fog,Tt.lights,{emissive:{value:new gt(0)}}]),vertexShader:ee.meshtoon_vert,fragmentShader:ee.meshtoon_frag},matcap:{uniforms:nn([Tt.common,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.fog,{matcap:{value:null}}]),vertexShader:ee.meshmatcap_vert,fragmentShader:ee.meshmatcap_frag},points:{uniforms:nn([Tt.points,Tt.fog]),vertexShader:ee.points_vert,fragmentShader:ee.points_frag},dashed:{uniforms:nn([Tt.common,Tt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ee.linedashed_vert,fragmentShader:ee.linedashed_frag},depth:{uniforms:nn([Tt.common,Tt.displacementmap]),vertexShader:ee.depth_vert,fragmentShader:ee.depth_frag},normal:{uniforms:nn([Tt.common,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,{opacity:{value:1}}]),vertexShader:ee.meshnormal_vert,fragmentShader:ee.meshnormal_frag},sprite:{uniforms:nn([Tt.sprite,Tt.fog]),vertexShader:ee.sprite_vert,fragmentShader:ee.sprite_frag},background:{uniforms:{uvTransform:{value:new te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ee.background_vert,fragmentShader:ee.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new te}},vertexShader:ee.backgroundCube_vert,fragmentShader:ee.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ee.cube_vert,fragmentShader:ee.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ee.equirect_vert,fragmentShader:ee.equirect_frag},distanceRGBA:{uniforms:nn([Tt.common,Tt.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ee.distanceRGBA_vert,fragmentShader:ee.distanceRGBA_frag},shadow:{uniforms:nn([Tt.lights,Tt.fog,{color:{value:new gt(0)},opacity:{value:1}}]),vertexShader:ee.shadow_vert,fragmentShader:ee.shadow_frag}};bn.physical={uniforms:nn([bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new te},clearcoatNormalScale:{value:new lt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new te},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new te},sheen:{value:0},sheenColor:{value:new gt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new te},transmissionSamplerSize:{value:new lt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new te},attenuationDistance:{value:0},attenuationColor:{value:new gt(0)},specularColor:{value:new gt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new te},anisotropyVector:{value:new lt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new te}}]),vertexShader:ee.meshphysical_vert,fragmentShader:ee.meshphysical_frag};const pr={r:0,b:0,g:0},mi=new Pn,Qp=new _e;function tm(i,t,e,n,s,r,o){const a=new gt(0);let l=r===!0?0:1,c,h,u=null,d=0,p=null;function g(M){let _=M.isScene===!0?M.background:null;return _&&_.isTexture&&(_=(M.backgroundBlurriness>0?e:t).get(_)),_}function x(M){let _=!1;const L=g(M);L===null?f(a,l):L&&L.isColor&&(f(L,1),_=!0);const T=i.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,o):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||_)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(M,_){const L=g(_);L&&(L.isCubeTexture||L.mapping===Lr)?(h===void 0&&(h=new b(new U(1,1,1),new ze({name:"BackgroundCubeMaterial",uniforms:hs(bn.backgroundCube.uniforms),vertexShader:bn.backgroundCube.vertexShader,fragmentShader:bn.backgroundCube.fragmentShader,side:Je,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(T,D,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),mi.copy(_.backgroundRotation),mi.x*=-1,mi.y*=-1,mi.z*=-1,L.isCubeTexture&&L.isRenderTargetTexture===!1&&(mi.y*=-1,mi.z*=-1),h.material.uniforms.envMap.value=L,h.material.uniforms.flipEnvMap.value=L.isCubeTexture&&L.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Qp.makeRotationFromEuler(mi)),h.material.toneMapped=ce.getTransfer(L.colorSpace)!==de,(u!==L||d!==L.version||p!==i.toneMapping)&&(h.material.needsUpdate=!0,u=L,d=L.version,p=i.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):L&&L.isTexture&&(c===void 0&&(c=new b(new Ce(2,2),new ze({name:"BackgroundMaterial",uniforms:hs(bn.background.uniforms),vertexShader:bn.background.vertexShader,fragmentShader:bn.background.fragmentShader,side:Zn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=L,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.toneMapped=ce.getTransfer(L.colorSpace)!==de,L.matrixAutoUpdate===!0&&L.updateMatrix(),c.material.uniforms.uvTransform.value.copy(L.matrix),(u!==L||d!==L.version||p!==i.toneMapping)&&(c.material.needsUpdate=!0,u=L,d=L.version,p=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function f(M,_){M.getRGB(pr,Rc(i)),n.buffers.color.setClear(pr.r,pr.g,pr.b,_,o)}function y(){h!==void 0&&(h.geometry.dispose(),h.material.dispose()),c!==void 0&&(c.geometry.dispose(),c.material.dispose())}return{getClearColor:function(){return a},setClearColor:function(M,_=1){a.set(M),l=_,f(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,f(a,l)},render:x,addToRenderList:m,dispose:y}}function em(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,o=!1;function a(v,C,N,F,O){let G=!1;const W=u(F,N,C);r!==W&&(r=W,c(r.object)),G=p(v,F,N,O),G&&g(v,F,N,O),O!==null&&t.update(O,i.ELEMENT_ARRAY_BUFFER),(G||o)&&(o=!1,_(v,C,N,F),O!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(O).buffer))}function l(){return i.createVertexArray()}function c(v){return i.bindVertexArray(v)}function h(v){return i.deleteVertexArray(v)}function u(v,C,N){const F=N.wireframe===!0;let O=n[v.id];O===void 0&&(O={},n[v.id]=O);let G=O[C.id];G===void 0&&(G={},O[C.id]=G);let W=G[F];return W===void 0&&(W=d(l()),G[F]=W),W}function d(v){const C=[],N=[],F=[];for(let O=0;O<e;O++)C[O]=0,N[O]=0,F[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:N,attributeDivisors:F,object:v,attributes:{},index:null}}function p(v,C,N,F){const O=r.attributes,G=C.attributes;let W=0;const q=N.getAttributes();for(const V in q)if(q[V].location>=0){const dt=O[V];let _t=G[V];if(_t===void 0&&(V==="instanceMatrix"&&v.instanceMatrix&&(_t=v.instanceMatrix),V==="instanceColor"&&v.instanceColor&&(_t=v.instanceColor)),dt===void 0||dt.attribute!==_t||_t&&dt.data!==_t.data)return!0;W++}return r.attributesNum!==W||r.index!==F}function g(v,C,N,F){const O={},G=C.attributes;let W=0;const q=N.getAttributes();for(const V in q)if(q[V].location>=0){let dt=G[V];dt===void 0&&(V==="instanceMatrix"&&v.instanceMatrix&&(dt=v.instanceMatrix),V==="instanceColor"&&v.instanceColor&&(dt=v.instanceColor));const _t={};_t.attribute=dt,dt&&dt.data&&(_t.data=dt.data),O[V]=_t,W++}r.attributes=O,r.attributesNum=W,r.index=F}function x(){const v=r.newAttributes;for(let C=0,N=v.length;C<N;C++)v[C]=0}function m(v){f(v,0)}function f(v,C){const N=r.newAttributes,F=r.enabledAttributes,O=r.attributeDivisors;N[v]=1,F[v]===0&&(i.enableVertexAttribArray(v),F[v]=1),O[v]!==C&&(i.vertexAttribDivisor(v,C),O[v]=C)}function y(){const v=r.newAttributes,C=r.enabledAttributes;for(let N=0,F=C.length;N<F;N++)C[N]!==v[N]&&(i.disableVertexAttribArray(N),C[N]=0)}function M(v,C,N,F,O,G,W){W===!0?i.vertexAttribIPointer(v,C,N,O,G):i.vertexAttribPointer(v,C,N,F,O,G)}function _(v,C,N,F){x();const O=F.attributes,G=N.getAttributes(),W=C.defaultAttributeValues;for(const q in G){const V=G[q];if(V.location>=0){let ct=O[q];if(ct===void 0&&(q==="instanceMatrix"&&v.instanceMatrix&&(ct=v.instanceMatrix),q==="instanceColor"&&v.instanceColor&&(ct=v.instanceColor)),ct!==void 0){const dt=ct.normalized,_t=ct.itemSize,Wt=t.get(ct);if(Wt===void 0)continue;const Vt=Wt.buffer,Q=Wt.type,pt=Wt.bytesPerElement,vt=Q===i.INT||Q===i.UNSIGNED_INT||ct.gpuType===fa;if(ct.isInterleavedBufferAttribute){const mt=ct.data,Ut=mt.stride,Nt=ct.offset;if(mt.isInstancedInterleavedBuffer){for(let kt=0;kt<V.locationSize;kt++)f(V.location+kt,mt.meshPerAttribute);v.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=mt.meshPerAttribute*mt.count)}else for(let kt=0;kt<V.locationSize;kt++)m(V.location+kt);i.bindBuffer(i.ARRAY_BUFFER,Vt);for(let kt=0;kt<V.locationSize;kt++)M(V.location+kt,_t/V.locationSize,Q,dt,Ut*pt,(Nt+_t/V.locationSize*kt)*pt,vt)}else{if(ct.isInstancedBufferAttribute){for(let mt=0;mt<V.locationSize;mt++)f(V.location+mt,ct.meshPerAttribute);v.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=ct.meshPerAttribute*ct.count)}else for(let mt=0;mt<V.locationSize;mt++)m(V.location+mt);i.bindBuffer(i.ARRAY_BUFFER,Vt);for(let mt=0;mt<V.locationSize;mt++)M(V.location+mt,_t/V.locationSize,Q,dt,_t*pt,_t/V.locationSize*mt*pt,vt)}}else if(W!==void 0){const dt=W[q];if(dt!==void 0)switch(dt.length){case 2:i.vertexAttrib2fv(V.location,dt);break;case 3:i.vertexAttrib3fv(V.location,dt);break;case 4:i.vertexAttrib4fv(V.location,dt);break;default:i.vertexAttrib1fv(V.location,dt)}}}}y()}function L(){I();for(const v in n){const C=n[v];for(const N in C){const F=C[N];for(const O in F)h(F[O].object),delete F[O];delete C[N]}delete n[v]}}function T(v){if(n[v.id]===void 0)return;const C=n[v.id];for(const N in C){const F=C[N];for(const O in F)h(F[O].object),delete F[O];delete C[N]}delete n[v.id]}function D(v){for(const C in n){const N=n[C];if(N[v.id]===void 0)continue;const F=N[v.id];for(const O in F)h(F[O].object),delete F[O];delete N[v.id]}}function I(){S(),o=!0,r!==s&&(r=s,c(r.object))}function S(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:I,resetDefaultState:S,dispose:L,releaseStatesOfGeometry:T,releaseStatesOfProgram:D,initAttributes:x,enableAttribute:m,disableUnusedAttributes:y}}function nm(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function o(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function a(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let p=0;for(let g=0;g<u;g++)p+=h[g];e.update(p,n,1)}function l(c,h,u,d){if(u===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)o(c[g],h[g],d[g]);else{p.multiDrawArraysInstancedWEBGL(n,c,0,h,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=h[x]*d[x];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function im(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const D=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(D.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(D){return!(D!==yn&&n.convert(D)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(D){const I=D===An&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(D!==$n&&n.convert(D)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&D!==Tn&&!I)}function l(D){if(D==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";D="mediump"}return D==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),L=g>0,T=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:p,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:y,maxVaryings:M,maxFragmentUniforms:_,vertexTextures:L,maxSamples:T}}function sm(i){const t=this;let e=null,n=0,s=!1,r=!1;const o=new ri,a=new te,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const p=u.length!==0||d||n!==0||s;return s=d,n=u.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,p){const g=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,f=i.get(u);if(!s||g===null||g.length===0||r&&!m)r?h(null):c();else{const y=r?0:n,M=y*4;let _=f.clippingState||null;l.value=_,_=h(g,d,M,p);for(let L=0;L!==M;++L)_[L]=e[L];f.clippingState=_,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,p,g){const x=u!==null?u.length:0;let m=null;if(x!==0){if(m=l.value,g!==!0||m===null){const f=p+x*4,y=d.matrixWorldInverse;a.getNormalMatrix(y),(m===null||m.length<f)&&(m=new Float32Array(f));for(let M=0,_=p;M!==x;++M,_+=4)o.copy(u[M]).applyMatrix4(y,a),o.normal.toArray(m,_),m[_+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,m}}function rm(i){let t=new WeakMap;function e(o,a){return a===Er?o.mapping=rs:a===Lo&&(o.mapping=os),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Er||a===Lo)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new Eu(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}const Ji=4,El=[.125,.215,.35,.446,.526,.582],xi=20,uo=new Ra,Tl=new gt;let fo=null,po=0,mo=0,go=!1;const _i=(1+Math.sqrt(5))/2,Zi=1/_i,Al=[new A(-_i,Zi,0),new A(_i,Zi,0),new A(-Zi,0,_i),new A(Zi,0,_i),new A(0,_i,-Zi),new A(0,_i,Zi),new A(-1,1,-1),new A(1,1,-1),new A(-1,1,1),new A(1,1,1)];class la{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){fo=this._renderer.getRenderTarget(),po=this._renderer.getActiveCubeFace(),mo=this._renderer.getActiveMipmapLevel(),go=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Pl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Rl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(fo,po,mo),this._renderer.xr.enabled=go,t.scissorTest=!1,mr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===rs||t.mapping===os?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),fo=this._renderer.getRenderTarget(),po=this._renderer.getActiveCubeFace(),mo=this._renderer.getActiveMipmapLevel(),go=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:En,minFilter:En,generateMipmaps:!1,type:An,format:yn,colorSpace:cs,depthBuffer:!1},s=Cl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=om(r)),this._blurMaterial=am(r,t,e)}return s}_compileMaterial(t){const e=new b(this._lodPlanes[0],t);this._renderer.compile(e,uo)}_sceneToCubeUV(t,e,n,s){const a=new hn(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Tl),h.toneMapping=ai,h.autoClear=!1;const p=new jn({name:"PMREM.Background",side:Je,depthWrite:!1,depthTest:!1}),g=new b(new U,p);let x=!1;const m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,x=!0):(p.color.copy(Tl),x=!0);for(let f=0;f<6;f++){const y=f%3;y===0?(a.up.set(0,l[f],0),a.lookAt(c[f],0,0)):y===1?(a.up.set(0,0,l[f]),a.lookAt(0,c[f],0)):(a.up.set(0,l[f],0),a.lookAt(0,0,c[f]));const M=this._cubeSize;mr(s,y*M,f>2?M:0,M,M),h.setRenderTarget(s),x&&h.render(g,a),h.render(t,a)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===rs||t.mapping===os;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Pl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Rl());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new b(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const l=this._cubeSize;mr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,uo)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Al[(s-r-1)%Al.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new b(this._lodPlanes[s],c),d=c.uniforms,p=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*xi-1),x=r/g,m=isFinite(r)?1+Math.floor(h*x):xi;m>xi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${xi}`);const f=[];let y=0;for(let D=0;D<xi;++D){const I=D/x,S=Math.exp(-I*I/2);f.push(S),D===0?y+=S:D<m&&(y+=2*S)}for(let D=0;D<f.length;D++)f[D]=f[D]/y;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:M}=this;d.dTheta.value=g,d.mipInt.value=M-n;const _=this._sizeLods[s],L=3*_*(s>M-Ji?s-M+Ji:0),T=4*(this._cubeSize-_);mr(e,L,T,3*_,2*_),l.setRenderTarget(e),l.render(u,uo)}}function om(i){const t=[],e=[],n=[];let s=i;const r=i-Ji+1+El.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Ji?l=El[o-i+Ji-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],p=6,g=6,x=3,m=2,f=1,y=new Float32Array(x*g*p),M=new Float32Array(m*g*p),_=new Float32Array(f*g*p);for(let T=0;T<p;T++){const D=T%3*2/3-1,I=T>2?0:-1,S=[D,I,0,D+2/3,I,0,D+2/3,I+1,0,D,I,0,D+2/3,I+1,0,D,I+1,0];y.set(S,x*g*T),M.set(d,m*g*T);const v=[T,T,T,T,T,T];_.set(v,f*g*T)}const L=new tn;L.setAttribute("position",new _n(y,x)),L.setAttribute("uv",new _n(M,m)),L.setAttribute("faceIndex",new _n(_,f)),t.push(L),s>Ji&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Cl(i,t,e){const n=new gn(i,t,e);return n.texture.mapping=Lr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function mr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function am(i,t,e){const n=new Float32Array(xi),s=new A(0,1,0);return new ze({name:"SphericalGaussianBlur",defines:{n:xi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Pa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Rl(){return new ze({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Pa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Pl(){return new ze({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Pa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Pa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function lm(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Er||l===Lo,h=l===rs||l===os;if(c||h){let u=t.get(a);const d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new la(i)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{const p=a.image;return c&&p&&p.height>0||h&&p&&s(p)?(e===null&&(e=new la(i)),u=c?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0;const c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){const l=a.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function cm(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&$i("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function hm(i,t,e,n){const s={},r=new WeakMap;function o(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete s[d.id];const p=r.get(d);p&&(t.remove(p),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(u){const d=u.attributes;for(const p in d)t.update(d[p],i.ARRAY_BUFFER)}function c(u){const d=[],p=u.index,g=u.attributes.position;let x=0;if(p!==null){const y=p.array;x=p.version;for(let M=0,_=y.length;M<_;M+=3){const L=y[M+0],T=y[M+1],D=y[M+2];d.push(L,T,T,D,D,L)}}else if(g!==void 0){const y=g.array;x=g.version;for(let M=0,_=y.length/3-1;M<_;M+=3){const L=M+0,T=M+1,D=M+2;d.push(L,T,T,D,D,L)}}else return;const m=new(wc(d)?Cc:Ac)(d,1);m.version=x;const f=r.get(u);f&&t.remove(f),r.set(u,m)}function h(u){const d=r.get(u);if(d){const p=u.index;p!==null&&d.version<p.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function um(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,p){i.drawElements(n,p,r,d*o),e.update(p,n,1)}function c(d,p,g){g!==0&&(i.drawElementsInstanced(n,p,r,d*o,g),e.update(p,n,g))}function h(d,p,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,d,0,g);let m=0;for(let f=0;f<g;f++)m+=p[f];e.update(m,n,1)}function u(d,p,g,x){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<d.length;f++)c(d[f]/o,p[f],x[f]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,r,d,0,x,0,g);let f=0;for(let y=0;y<g;y++)f+=p[y]*x[y];e.update(f,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function dm(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function fm(i,t,e){const n=new WeakMap,s=new ge;function r(o,a,l){const c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(a);if(d===void 0||d.count!==u){let v=function(){I.dispose(),n.delete(a),a.removeEventListener("dispose",v)};var p=v;d!==void 0&&d.texture.dispose();const g=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,f=a.morphAttributes.position||[],y=a.morphAttributes.normal||[],M=a.morphAttributes.color||[];let _=0;g===!0&&(_=1),x===!0&&(_=2),m===!0&&(_=3);let L=a.attributes.position.count*_,T=1;L>t.maxTextureSize&&(T=Math.ceil(L/t.maxTextureSize),L=t.maxTextureSize);const D=new Float32Array(L*T*4*u),I=new Sc(D,L,T,u);I.type=Tn,I.needsUpdate=!0;const S=_*4;for(let C=0;C<u;C++){const N=f[C],F=y[C],O=M[C],G=L*T*4*C;for(let W=0;W<N.count;W++){const q=W*S;g===!0&&(s.fromBufferAttribute(N,W),D[G+q+0]=s.x,D[G+q+1]=s.y,D[G+q+2]=s.z,D[G+q+3]=0),x===!0&&(s.fromBufferAttribute(F,W),D[G+q+4]=s.x,D[G+q+5]=s.y,D[G+q+6]=s.z,D[G+q+7]=0),m===!0&&(s.fromBufferAttribute(O,W),D[G+q+8]=s.x,D[G+q+9]=s.y,D[G+q+10]=s.z,D[G+q+11]=O.itemSize===4?s.w:1)}}d={count:u,texture:I,size:new lt(L,T)},n.set(a,d),a.addEventListener("dispose",v)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];const x=a.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function pm(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function o(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}const Xc=new Qe,Ll=new Uc(1,1),Yc=new Sc,qc=new hu,Zc=new Lc,Dl=[],Il=[],Ul=new Float32Array(16),Nl=new Float32Array(9),Fl=new Float32Array(4);function ps(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Dl[s];if(r===void 0&&(r=new Float32Array(s),Dl[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Ge(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ke(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Nr(i,t){let e=Il[t];e===void 0&&(e=new Int32Array(t),Il[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function mm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function gm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;i.uniform2fv(this.addr,t),ke(e,t)}}function _m(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ge(e,t))return;i.uniform3fv(this.addr,t),ke(e,t)}}function vm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;i.uniform4fv(this.addr,t),ke(e,t)}}function xm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ge(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ke(e,t)}else{if(Ge(e,n))return;Fl.set(n),i.uniformMatrix2fv(this.addr,!1,Fl),ke(e,n)}}function Mm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ge(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ke(e,t)}else{if(Ge(e,n))return;Nl.set(n),i.uniformMatrix3fv(this.addr,!1,Nl),ke(e,n)}}function wm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ge(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ke(e,t)}else{if(Ge(e,n))return;Ul.set(n),i.uniformMatrix4fv(this.addr,!1,Ul),ke(e,n)}}function ym(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Sm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;i.uniform2iv(this.addr,t),ke(e,t)}}function bm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;i.uniform3iv(this.addr,t),ke(e,t)}}function Em(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;i.uniform4iv(this.addr,t),ke(e,t)}}function Tm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Am(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;i.uniform2uiv(this.addr,t),ke(e,t)}}function Cm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;i.uniform3uiv(this.addr,t),ke(e,t)}}function Rm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;i.uniform4uiv(this.addr,t),ke(e,t)}}function Pm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ll.compareFunction=Mc,r=Ll):r=Xc,e.setTexture2D(t||r,s)}function Lm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||qc,s)}function Dm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Zc,s)}function Im(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Yc,s)}function Um(i){switch(i){case 5126:return mm;case 35664:return gm;case 35665:return _m;case 35666:return vm;case 35674:return xm;case 35675:return Mm;case 35676:return wm;case 5124:case 35670:return ym;case 35667:case 35671:return Sm;case 35668:case 35672:return bm;case 35669:case 35673:return Em;case 5125:return Tm;case 36294:return Am;case 36295:return Cm;case 36296:return Rm;case 35678:case 36198:case 36298:case 36306:case 35682:return Pm;case 35679:case 36299:case 36307:return Lm;case 35680:case 36300:case 36308:case 36293:return Dm;case 36289:case 36303:case 36311:case 36292:return Im}}function Nm(i,t){i.uniform1fv(this.addr,t)}function Fm(i,t){const e=ps(t,this.size,2);i.uniform2fv(this.addr,e)}function Om(i,t){const e=ps(t,this.size,3);i.uniform3fv(this.addr,e)}function Bm(i,t){const e=ps(t,this.size,4);i.uniform4fv(this.addr,e)}function zm(i,t){const e=ps(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Gm(i,t){const e=ps(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function km(i,t){const e=ps(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Hm(i,t){i.uniform1iv(this.addr,t)}function Vm(i,t){i.uniform2iv(this.addr,t)}function Wm(i,t){i.uniform3iv(this.addr,t)}function Xm(i,t){i.uniform4iv(this.addr,t)}function Ym(i,t){i.uniform1uiv(this.addr,t)}function qm(i,t){i.uniform2uiv(this.addr,t)}function Zm(i,t){i.uniform3uiv(this.addr,t)}function $m(i,t){i.uniform4uiv(this.addr,t)}function jm(i,t,e){const n=this.cache,s=t.length,r=Nr(e,s);Ge(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Xc,r[o])}function Km(i,t,e){const n=this.cache,s=t.length,r=Nr(e,s);Ge(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||qc,r[o])}function Jm(i,t,e){const n=this.cache,s=t.length,r=Nr(e,s);Ge(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Zc,r[o])}function Qm(i,t,e){const n=this.cache,s=t.length,r=Nr(e,s);Ge(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Yc,r[o])}function t0(i){switch(i){case 5126:return Nm;case 35664:return Fm;case 35665:return Om;case 35666:return Bm;case 35674:return zm;case 35675:return Gm;case 35676:return km;case 5124:case 35670:return Hm;case 35667:case 35671:return Vm;case 35668:case 35672:return Wm;case 35669:case 35673:return Xm;case 5125:return Ym;case 36294:return qm;case 36295:return Zm;case 36296:return $m;case 35678:case 36198:case 36298:case 36306:case 35682:return jm;case 35679:case 36299:case 36307:return Km;case 35680:case 36300:case 36308:case 36293:return Jm;case 36289:case 36303:case 36311:case 36292:return Qm}}class e0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Um(e.type)}}class n0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=t0(e.type)}}class i0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(t,e[a.id],n)}}}const _o=/(\w+)(\])?(\[|\.)?/g;function Ol(i,t){i.seq.push(t),i.map[t.id]=t}function s0(i,t,e){const n=i.name,s=n.length;for(_o.lastIndex=0;;){const r=_o.exec(n),o=_o.lastIndex;let a=r[1];const l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Ol(e,c===void 0?new e0(a,i,t):new n0(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new i0(a),Ol(e,u)),e=u}}}class Sr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);s0(r,o,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){const a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const o=t[s];o.id in e&&n.push(o)}return n}}function Bl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const r0=37297;let o0=0;function a0(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const zl=new te;function l0(i){ce._getMatrix(zl,ce.workingColorSpace,i);const t=`mat3( ${zl.elements.map(e=>e.toFixed(4))} )`;switch(ce.getTransfer(i)){case Tr:return[t,"LinearTransferOETF"];case de:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Gl(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+a0(i.getShaderSource(t),o)}else return s}function c0(i,t){const e=l0(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function h0(i,t){let e;switch(t){case sc:e="Linear";break;case rc:e="Reinhard";break;case oc:e="Cineon";break;case da:e="ACESFilmic";break;case ac:e="AgX";break;case lc:e="Neutral";break;case Ah:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const gr=new A;function u0(){ce.getLuminanceCoefficients(gr);const i=gr.x.toFixed(4),t=gr.y.toFixed(4),e=gr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function d0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Rs).join(`
`)}function f0(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function p0(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Rs(i){return i!==""}function kl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Hl(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const m0=/^[ \t]*#include +<([\w\d./]+)>/gm;function ca(i){return i.replace(m0,_0)}const g0=new Map;function _0(i,t){let e=ee[t];if(e===void 0){const n=g0.get(t);if(n!==void 0)e=ee[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ca(e)}const v0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vl(i){return i.replace(v0,x0)}function x0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Wl(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function M0(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===ec?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===nc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Vn&&(t="SHADOWMAP_TYPE_VSM"),t}function w0(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case rs:case os:t="ENVMAP_TYPE_CUBE";break;case Lr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function y0(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case os:t="ENVMAP_MODE_REFRACTION";break}return t}function S0(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case ic:t="ENVMAP_BLENDING_MULTIPLY";break;case Eh:t="ENVMAP_BLENDING_MIX";break;case Th:t="ENVMAP_BLENDING_ADD";break}return t}function b0(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function E0(i,t,e,n){const s=i.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=M0(e),c=w0(e),h=y0(e),u=S0(e),d=b0(e),p=d0(e),g=f0(r),x=s.createProgram();let m,f,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Rs).join(`
`),m.length>0&&(m+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Rs).join(`
`),f.length>0&&(f+=`
`)):(m=[Wl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Rs).join(`
`),f=[Wl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ai?"#define TONE_MAPPING":"",e.toneMapping!==ai?ee.tonemapping_pars_fragment:"",e.toneMapping!==ai?h0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",ee.colorspace_pars_fragment,c0("linearToOutputTexel",e.outputColorSpace),u0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Rs).join(`
`)),o=ca(o),o=kl(o,e),o=Hl(o,e),a=ca(a),a=kl(a,e),a=Hl(a,e),o=Vl(o),a=Vl(a),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,f=["#define varying in",e.glslVersion===Va?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Va?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const M=y+m+o,_=y+f+a,L=Bl(s,s.VERTEX_SHADER,M),T=Bl(s,s.FRAGMENT_SHADER,_);s.attachShader(x,L),s.attachShader(x,T),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function D(C){if(i.debug.checkShaderErrors){const N=s.getProgramInfoLog(x).trim(),F=s.getShaderInfoLog(L).trim(),O=s.getShaderInfoLog(T).trim();let G=!0,W=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,L,T);else{const q=Gl(s,L,"vertex"),V=Gl(s,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+N+`
`+q+`
`+V)}else N!==""?console.warn("THREE.WebGLProgram: Program Info Log:",N):(F===""||O==="")&&(W=!1);W&&(C.diagnostics={runnable:G,programLog:N,vertexShader:{log:F,prefix:m},fragmentShader:{log:O,prefix:f}})}s.deleteShader(L),s.deleteShader(T),I=new Sr(s,x),S=p0(s,x)}let I;this.getUniforms=function(){return I===void 0&&D(this),I};let S;this.getAttributes=function(){return S===void 0&&D(this),S};let v=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=s.getProgramParameter(x,r0)),v},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=o0++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=L,this.fragmentShader=T,this}let T0=0;class A0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new C0(t),e.set(t,n)),n}}class C0{constructor(t){this.id=T0++,this.code=t,this.usedTimes=0}}function R0(i,t,e,n,s,r,o){const a=new Ec,l=new A0,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures;let p=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(S){return c.add(S),S===0?"uv":`uv${S}`}function m(S,v,C,N,F){const O=N.fog,G=F.geometry,W=S.isMeshStandardMaterial?N.environment:null,q=(S.isMeshStandardMaterial?e:t).get(S.envMap||W),V=q&&q.mapping===Lr?q.image.height:null,ct=g[S.type];S.precision!==null&&(p=s.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));const dt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,_t=dt!==void 0?dt.length:0;let Wt=0;G.morphAttributes.position!==void 0&&(Wt=1),G.morphAttributes.normal!==void 0&&(Wt=2),G.morphAttributes.color!==void 0&&(Wt=3);let Vt,Q,pt,vt;if(ct){const ae=bn[ct];Vt=ae.vertexShader,Q=ae.fragmentShader}else Vt=S.vertexShader,Q=S.fragmentShader,l.update(S),pt=l.getVertexShaderID(S),vt=l.getFragmentShaderID(S);const mt=i.getRenderTarget(),Ut=i.state.buffers.depth.getReversed(),Nt=F.isInstancedMesh===!0,kt=F.isBatchedMesh===!0,Bt=!!S.map,$=!!S.matcap,ot=!!q,R=!!S.aoMap,Mt=!!S.lightMap,et=!!S.bumpMap,ht=!!S.normalMap,st=!!S.displacementMap,Ft=!!S.emissiveMap,ut=!!S.metalnessMap,P=!!S.roughnessMap,w=S.anisotropy>0,H=S.clearcoat>0,J=S.dispersion>0,rt=S.iridescence>0,tt=S.sheen>0,Lt=S.transmission>0,K=w&&!!S.anisotropyMap,nt=H&&!!S.clearcoatMap,Dt=H&&!!S.clearcoatNormalMap,it=H&&!!S.clearcoatRoughnessMap,wt=rt&&!!S.iridescenceMap,Ht=rt&&!!S.iridescenceThicknessMap,It=tt&&!!S.sheenColorMap,Ct=tt&&!!S.sheenRoughnessMap,Kt=!!S.specularMap,qt=!!S.specularColorMap,he=!!S.specularIntensityMap,B=Lt&&!!S.transmissionMap,St=Lt&&!!S.thicknessMap,j=!!S.gradientMap,at=!!S.alphaMap,At=S.alphaTest>0,bt=!!S.alphaHash,$t=!!S.extensions;let ve=ai;S.toneMapped&&(mt===null||mt.isXRRenderTarget===!0)&&(ve=i.toneMapping);const Pe={shaderID:ct,shaderType:S.type,shaderName:S.name,vertexShader:Vt,fragmentShader:Q,defines:S.defines,customVertexShaderID:pt,customFragmentShaderID:vt,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:kt,batchingColor:kt&&F._colorsTexture!==null,instancing:Nt,instancingColor:Nt&&F.instanceColor!==null,instancingMorph:Nt&&F.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:mt===null?i.outputColorSpace:mt.isXRRenderTarget===!0?mt.texture.colorSpace:cs,alphaToCoverage:!!S.alphaToCoverage,map:Bt,matcap:$,envMap:ot,envMapMode:ot&&q.mapping,envMapCubeUVHeight:V,aoMap:R,lightMap:Mt,bumpMap:et,normalMap:ht,displacementMap:d&&st,emissiveMap:Ft,normalMapObjectSpace:ht&&S.normalMapType===Lh,normalMapTangentSpace:ht&&S.normalMapType===xc,metalnessMap:ut,roughnessMap:P,anisotropy:w,anisotropyMap:K,clearcoat:H,clearcoatMap:nt,clearcoatNormalMap:Dt,clearcoatRoughnessMap:it,dispersion:J,iridescence:rt,iridescenceMap:wt,iridescenceThicknessMap:Ht,sheen:tt,sheenColorMap:It,sheenRoughnessMap:Ct,specularMap:Kt,specularColorMap:qt,specularIntensityMap:he,transmission:Lt,transmissionMap:B,thicknessMap:St,gradientMap:j,opaque:S.transparent===!1&&S.blending===ts&&S.alphaToCoverage===!1,alphaMap:at,alphaTest:At,alphaHash:bt,combine:S.combine,mapUv:Bt&&x(S.map.channel),aoMapUv:R&&x(S.aoMap.channel),lightMapUv:Mt&&x(S.lightMap.channel),bumpMapUv:et&&x(S.bumpMap.channel),normalMapUv:ht&&x(S.normalMap.channel),displacementMapUv:st&&x(S.displacementMap.channel),emissiveMapUv:Ft&&x(S.emissiveMap.channel),metalnessMapUv:ut&&x(S.metalnessMap.channel),roughnessMapUv:P&&x(S.roughnessMap.channel),anisotropyMapUv:K&&x(S.anisotropyMap.channel),clearcoatMapUv:nt&&x(S.clearcoatMap.channel),clearcoatNormalMapUv:Dt&&x(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:it&&x(S.clearcoatRoughnessMap.channel),iridescenceMapUv:wt&&x(S.iridescenceMap.channel),iridescenceThicknessMapUv:Ht&&x(S.iridescenceThicknessMap.channel),sheenColorMapUv:It&&x(S.sheenColorMap.channel),sheenRoughnessMapUv:Ct&&x(S.sheenRoughnessMap.channel),specularMapUv:Kt&&x(S.specularMap.channel),specularColorMapUv:qt&&x(S.specularColorMap.channel),specularIntensityMapUv:he&&x(S.specularIntensityMap.channel),transmissionMapUv:B&&x(S.transmissionMap.channel),thicknessMapUv:St&&x(S.thicknessMap.channel),alphaMapUv:at&&x(S.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(ht||w),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!G.attributes.uv&&(Bt||at),fog:!!O,useFog:S.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Ut,skinning:F.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:_t,morphTextureStride:Wt,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&C.length>0,shadowMapType:i.shadowMap.type,toneMapping:ve,decodeVideoTexture:Bt&&S.map.isVideoTexture===!0&&ce.getTransfer(S.map.colorSpace)===de,decodeVideoTextureEmissive:Ft&&S.emissiveMap.isVideoTexture===!0&&ce.getTransfer(S.emissiveMap.colorSpace)===de,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===on,flipSided:S.side===Je,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:$t&&S.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:($t&&S.extensions.multiDraw===!0||kt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Pe.vertexUv1s=c.has(1),Pe.vertexUv2s=c.has(2),Pe.vertexUv3s=c.has(3),c.clear(),Pe}function f(S){const v=[];if(S.shaderID?v.push(S.shaderID):(v.push(S.customVertexShaderID),v.push(S.customFragmentShaderID)),S.defines!==void 0)for(const C in S.defines)v.push(C),v.push(S.defines[C]);return S.isRawShaderMaterial===!1&&(y(v,S),M(v,S),v.push(i.outputColorSpace)),v.push(S.customProgramCacheKey),v.join()}function y(S,v){S.push(v.precision),S.push(v.outputColorSpace),S.push(v.envMapMode),S.push(v.envMapCubeUVHeight),S.push(v.mapUv),S.push(v.alphaMapUv),S.push(v.lightMapUv),S.push(v.aoMapUv),S.push(v.bumpMapUv),S.push(v.normalMapUv),S.push(v.displacementMapUv),S.push(v.emissiveMapUv),S.push(v.metalnessMapUv),S.push(v.roughnessMapUv),S.push(v.anisotropyMapUv),S.push(v.clearcoatMapUv),S.push(v.clearcoatNormalMapUv),S.push(v.clearcoatRoughnessMapUv),S.push(v.iridescenceMapUv),S.push(v.iridescenceThicknessMapUv),S.push(v.sheenColorMapUv),S.push(v.sheenRoughnessMapUv),S.push(v.specularMapUv),S.push(v.specularColorMapUv),S.push(v.specularIntensityMapUv),S.push(v.transmissionMapUv),S.push(v.thicknessMapUv),S.push(v.combine),S.push(v.fogExp2),S.push(v.sizeAttenuation),S.push(v.morphTargetsCount),S.push(v.morphAttributeCount),S.push(v.numDirLights),S.push(v.numPointLights),S.push(v.numSpotLights),S.push(v.numSpotLightMaps),S.push(v.numHemiLights),S.push(v.numRectAreaLights),S.push(v.numDirLightShadows),S.push(v.numPointLightShadows),S.push(v.numSpotLightShadows),S.push(v.numSpotLightShadowsWithMaps),S.push(v.numLightProbes),S.push(v.shadowMapType),S.push(v.toneMapping),S.push(v.numClippingPlanes),S.push(v.numClipIntersection),S.push(v.depthPacking)}function M(S,v){a.disableAll(),v.supportsVertexTextures&&a.enable(0),v.instancing&&a.enable(1),v.instancingColor&&a.enable(2),v.instancingMorph&&a.enable(3),v.matcap&&a.enable(4),v.envMap&&a.enable(5),v.normalMapObjectSpace&&a.enable(6),v.normalMapTangentSpace&&a.enable(7),v.clearcoat&&a.enable(8),v.iridescence&&a.enable(9),v.alphaTest&&a.enable(10),v.vertexColors&&a.enable(11),v.vertexAlphas&&a.enable(12),v.vertexUv1s&&a.enable(13),v.vertexUv2s&&a.enable(14),v.vertexUv3s&&a.enable(15),v.vertexTangents&&a.enable(16),v.anisotropy&&a.enable(17),v.alphaHash&&a.enable(18),v.batching&&a.enable(19),v.dispersion&&a.enable(20),v.batchingColor&&a.enable(21),S.push(a.mask),a.disableAll(),v.fog&&a.enable(0),v.useFog&&a.enable(1),v.flatShading&&a.enable(2),v.logarithmicDepthBuffer&&a.enable(3),v.reverseDepthBuffer&&a.enable(4),v.skinning&&a.enable(5),v.morphTargets&&a.enable(6),v.morphNormals&&a.enable(7),v.morphColors&&a.enable(8),v.premultipliedAlpha&&a.enable(9),v.shadowMapEnabled&&a.enable(10),v.doubleSided&&a.enable(11),v.flipSided&&a.enable(12),v.useDepthPacking&&a.enable(13),v.dithering&&a.enable(14),v.transmission&&a.enable(15),v.sheen&&a.enable(16),v.opaque&&a.enable(17),v.pointsUvs&&a.enable(18),v.decodeVideoTexture&&a.enable(19),v.decodeVideoTextureEmissive&&a.enable(20),v.alphaToCoverage&&a.enable(21),S.push(a.mask)}function _(S){const v=g[S.type];let C;if(v){const N=bn[v];C=Bs.clone(N.uniforms)}else C=S.uniforms;return C}function L(S,v){let C;for(let N=0,F=h.length;N<F;N++){const O=h[N];if(O.cacheKey===v){C=O,++C.usedTimes;break}}return C===void 0&&(C=new E0(i,v,S,r),h.push(C)),C}function T(S){if(--S.usedTimes===0){const v=h.indexOf(S);h[v]=h[h.length-1],h.pop(),S.destroy()}}function D(S){l.remove(S)}function I(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:_,acquireProgram:L,releaseProgram:T,releaseShaderCache:D,programs:h,dispose:I}}function P0(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function L0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Xl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Yl(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,d,p,g,x,m){let f=i[t];return f===void 0?(f={id:u.id,object:u,geometry:d,material:p,groupOrder:g,renderOrder:u.renderOrder,z:x,group:m},i[t]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=x,f.group=m),t++,f}function a(u,d,p,g,x,m){const f=o(u,d,p,g,x,m);p.transmission>0?n.push(f):p.transparent===!0?s.push(f):e.push(f)}function l(u,d,p,g,x,m){const f=o(u,d,p,g,x,m);p.transmission>0?n.unshift(f):p.transparent===!0?s.unshift(f):e.unshift(f)}function c(u,d){e.length>1&&e.sort(u||L0),n.length>1&&n.sort(d||Xl),s.length>1&&s.sort(d||Xl)}function h(){for(let u=t,d=i.length;u<d;u++){const p=i[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function D0(){let i=new WeakMap;function t(n,s){const r=i.get(n);let o;return r===void 0?(o=new Yl,i.set(n,[o])):s>=r.length?(o=new Yl,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function I0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new A,color:new gt};break;case"SpotLight":e={position:new A,direction:new A,color:new gt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new A,color:new gt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new A,skyColor:new gt,groundColor:new gt};break;case"RectAreaLight":e={color:new gt,position:new A,halfWidth:new A,halfHeight:new A};break}return i[t.id]=e,e}}}function U0(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let N0=0;function F0(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function O0(i){const t=new I0,e=U0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new A);const s=new A,r=new _e,o=new _e;function a(c){let h=0,u=0,d=0;for(let S=0;S<9;S++)n.probe[S].set(0,0,0);let p=0,g=0,x=0,m=0,f=0,y=0,M=0,_=0,L=0,T=0,D=0;c.sort(F0);for(let S=0,v=c.length;S<v;S++){const C=c[S],N=C.color,F=C.intensity,O=C.distance,G=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)h+=N.r*F,u+=N.g*F,d+=N.b*F;else if(C.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(C.sh.coefficients[W],F);D++}else if(C.isDirectionalLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const q=C.shadow,V=e.get(C);V.shadowIntensity=q.intensity,V.shadowBias=q.bias,V.shadowNormalBias=q.normalBias,V.shadowRadius=q.radius,V.shadowMapSize=q.mapSize,n.directionalShadow[p]=V,n.directionalShadowMap[p]=G,n.directionalShadowMatrix[p]=C.shadow.matrix,y++}n.directional[p]=W,p++}else if(C.isSpotLight){const W=t.get(C);W.position.setFromMatrixPosition(C.matrixWorld),W.color.copy(N).multiplyScalar(F),W.distance=O,W.coneCos=Math.cos(C.angle),W.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),W.decay=C.decay,n.spot[x]=W;const q=C.shadow;if(C.map&&(n.spotLightMap[L]=C.map,L++,q.updateMatrices(C),C.castShadow&&T++),n.spotLightMatrix[x]=q.matrix,C.castShadow){const V=e.get(C);V.shadowIntensity=q.intensity,V.shadowBias=q.bias,V.shadowNormalBias=q.normalBias,V.shadowRadius=q.radius,V.shadowMapSize=q.mapSize,n.spotShadow[x]=V,n.spotShadowMap[x]=G,_++}x++}else if(C.isRectAreaLight){const W=t.get(C);W.color.copy(N).multiplyScalar(F),W.halfWidth.set(C.width*.5,0,0),W.halfHeight.set(0,C.height*.5,0),n.rectArea[m]=W,m++}else if(C.isPointLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),W.distance=C.distance,W.decay=C.decay,C.castShadow){const q=C.shadow,V=e.get(C);V.shadowIntensity=q.intensity,V.shadowBias=q.bias,V.shadowNormalBias=q.normalBias,V.shadowRadius=q.radius,V.shadowMapSize=q.mapSize,V.shadowCameraNear=q.camera.near,V.shadowCameraFar=q.camera.far,n.pointShadow[g]=V,n.pointShadowMap[g]=G,n.pointShadowMatrix[g]=C.shadow.matrix,M++}n.point[g]=W,g++}else if(C.isHemisphereLight){const W=t.get(C);W.skyColor.copy(C.color).multiplyScalar(F),W.groundColor.copy(C.groundColor).multiplyScalar(F),n.hemi[f]=W,f++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Tt.LTC_FLOAT_1,n.rectAreaLTC2=Tt.LTC_FLOAT_2):(n.rectAreaLTC1=Tt.LTC_HALF_1,n.rectAreaLTC2=Tt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const I=n.hash;(I.directionalLength!==p||I.pointLength!==g||I.spotLength!==x||I.rectAreaLength!==m||I.hemiLength!==f||I.numDirectionalShadows!==y||I.numPointShadows!==M||I.numSpotShadows!==_||I.numSpotMaps!==L||I.numLightProbes!==D)&&(n.directional.length=p,n.spot.length=x,n.rectArea.length=m,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=_,n.spotShadowMap.length=_,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=_+L-T,n.spotLightMap.length=L,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=D,I.directionalLength=p,I.pointLength=g,I.spotLength=x,I.rectAreaLength=m,I.hemiLength=f,I.numDirectionalShadows=y,I.numPointShadows=M,I.numSpotShadows=_,I.numSpotMaps=L,I.numLightProbes=D,n.version=N0++)}function l(c,h){let u=0,d=0,p=0,g=0,x=0;const m=h.matrixWorldInverse;for(let f=0,y=c.length;f<y;f++){const M=c[f];if(M.isDirectionalLight){const _=n.directional[u];_.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),u++}else if(M.isSpotLight){const _=n.spot[p];_.position.setFromMatrixPosition(M.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(m),p++}else if(M.isRectAreaLight){const _=n.rectArea[g];_.position.setFromMatrixPosition(M.matrixWorld),_.position.applyMatrix4(m),o.identity(),r.copy(M.matrixWorld),r.premultiply(m),o.extractRotation(r),_.halfWidth.set(M.width*.5,0,0),_.halfHeight.set(0,M.height*.5,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),g++}else if(M.isPointLight){const _=n.point[d];_.position.setFromMatrixPosition(M.matrixWorld),_.position.applyMatrix4(m),d++}else if(M.isHemisphereLight){const _=n.hemi[x];_.direction.setFromMatrixPosition(M.matrixWorld),_.direction.transformDirection(m),x++}}}return{setup:a,setupView:l,state:n}}function ql(i){const t=new O0(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function B0(i){let t=new WeakMap;function e(s,r=0){const o=t.get(s);let a;return o===void 0?(a=new ql(i),t.set(s,[a])):r>=o.length?(a=new ql(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}const z0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,G0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function k0(i,t,e){let n=new wa;const s=new lt,r=new lt,o=new ge,a=new cd({depthPacking:Ph}),l=new hd,c={},h=e.maxTextureSize,u={[Zn]:Je,[Je]:Zn,[on]:on},d=new ze({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new lt},radius:{value:4}},vertexShader:z0,fragmentShader:G0}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const g=new tn;g.setAttribute("position",new _n(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new b(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ec;let f=this.type;this.render=function(T,D,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;const S=i.getRenderTarget(),v=i.getActiveCubeFace(),C=i.getActiveMipmapLevel(),N=i.state;N.setBlending(Yn),N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const F=f!==Vn&&this.type===Vn,O=f===Vn&&this.type!==Vn;for(let G=0,W=T.length;G<W;G++){const q=T[G],V=q.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",q,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);const ct=V.getFrameExtents();if(s.multiply(ct),r.copy(V.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ct.x),s.x=r.x*ct.x,V.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ct.y),s.y=r.y*ct.y,V.mapSize.y=r.y)),V.map===null||F===!0||O===!0){const _t=this.type!==Vn?{minFilter:un,magFilter:un}:{};V.map!==null&&V.map.dispose(),V.map=new gn(s.x,s.y,_t),V.map.texture.name=q.name+".shadowMap",V.camera.updateProjectionMatrix()}i.setRenderTarget(V.map),i.clear();const dt=V.getViewportCount();for(let _t=0;_t<dt;_t++){const Wt=V.getViewport(_t);o.set(r.x*Wt.x,r.y*Wt.y,r.x*Wt.z,r.y*Wt.w),N.viewport(o),V.updateMatrices(q,_t),n=V.getFrustum(),_(D,I,V.camera,q,this.type)}V.isPointLightShadow!==!0&&this.type===Vn&&y(V,I),V.needsUpdate=!1}f=this.type,m.needsUpdate=!1,i.setRenderTarget(S,v,C)};function y(T,D){const I=t.update(x);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,p.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new gn(s.x,s.y)),d.uniforms.shadow_pass.value=T.map.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(D,null,I,d,x,null),p.uniforms.shadow_pass.value=T.mapPass.texture,p.uniforms.resolution.value=T.mapSize,p.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(D,null,I,p,x,null)}function M(T,D,I,S){let v=null;const C=I.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(C!==void 0)v=C;else if(v=I.isPointLight===!0?l:a,i.localClippingEnabled&&D.clipShadows===!0&&Array.isArray(D.clippingPlanes)&&D.clippingPlanes.length!==0||D.displacementMap&&D.displacementScale!==0||D.alphaMap&&D.alphaTest>0||D.map&&D.alphaTest>0){const N=v.uuid,F=D.uuid;let O=c[N];O===void 0&&(O={},c[N]=O);let G=O[F];G===void 0&&(G=v.clone(),O[F]=G,D.addEventListener("dispose",L)),v=G}if(v.visible=D.visible,v.wireframe=D.wireframe,S===Vn?v.side=D.shadowSide!==null?D.shadowSide:D.side:v.side=D.shadowSide!==null?D.shadowSide:u[D.side],v.alphaMap=D.alphaMap,v.alphaTest=D.alphaTest,v.map=D.map,v.clipShadows=D.clipShadows,v.clippingPlanes=D.clippingPlanes,v.clipIntersection=D.clipIntersection,v.displacementMap=D.displacementMap,v.displacementScale=D.displacementScale,v.displacementBias=D.displacementBias,v.wireframeLinewidth=D.wireframeLinewidth,v.linewidth=D.linewidth,I.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const N=i.properties.get(v);N.light=I}return v}function _(T,D,I,S,v){if(T.visible===!1)return;if(T.layers.test(D.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&v===Vn)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,T.matrixWorld);const F=t.update(T),O=T.material;if(Array.isArray(O)){const G=F.groups;for(let W=0,q=G.length;W<q;W++){const V=G[W],ct=O[V.materialIndex];if(ct&&ct.visible){const dt=M(T,ct,S,v);T.onBeforeShadow(i,T,D,I,F,dt,V),i.renderBufferDirect(I,null,F,dt,T,V),T.onAfterShadow(i,T,D,I,F,dt,V)}}}else if(O.visible){const G=M(T,O,S,v);T.onBeforeShadow(i,T,D,I,F,G,null),i.renderBufferDirect(I,null,F,G,T,null),T.onAfterShadow(i,T,D,I,F,G,null)}}const N=T.children;for(let F=0,O=N.length;F<O;F++)_(N[F],D,I,S,v)}function L(T){T.target.removeEventListener("dispose",L);for(const I in c){const S=c[I],v=T.target.uuid;v in S&&(S[v].dispose(),delete S[v])}}}const H0={[bo]:Eo,[To]:Ro,[Ao]:Po,[ss]:Co,[Eo]:bo,[Ro]:To,[Po]:Ao,[Co]:ss};function V0(i,t){function e(){let B=!1;const St=new ge;let j=null;const at=new ge(0,0,0,0);return{setMask:function(At){j!==At&&!B&&(i.colorMask(At,At,At,At),j=At)},setLocked:function(At){B=At},setClear:function(At,bt,$t,ve,Pe){Pe===!0&&(At*=ve,bt*=ve,$t*=ve),St.set(At,bt,$t,ve),at.equals(St)===!1&&(i.clearColor(At,bt,$t,ve),at.copy(St))},reset:function(){B=!1,j=null,at.set(-1,0,0,0)}}}function n(){let B=!1,St=!1,j=null,at=null,At=null;return{setReversed:function(bt){if(St!==bt){const $t=t.get("EXT_clip_control");St?$t.clipControlEXT($t.LOWER_LEFT_EXT,$t.ZERO_TO_ONE_EXT):$t.clipControlEXT($t.LOWER_LEFT_EXT,$t.NEGATIVE_ONE_TO_ONE_EXT);const ve=At;At=null,this.setClear(ve)}St=bt},getReversed:function(){return St},setTest:function(bt){bt?mt(i.DEPTH_TEST):Ut(i.DEPTH_TEST)},setMask:function(bt){j!==bt&&!B&&(i.depthMask(bt),j=bt)},setFunc:function(bt){if(St&&(bt=H0[bt]),at!==bt){switch(bt){case bo:i.depthFunc(i.NEVER);break;case Eo:i.depthFunc(i.ALWAYS);break;case To:i.depthFunc(i.LESS);break;case ss:i.depthFunc(i.LEQUAL);break;case Ao:i.depthFunc(i.EQUAL);break;case Co:i.depthFunc(i.GEQUAL);break;case Ro:i.depthFunc(i.GREATER);break;case Po:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}at=bt}},setLocked:function(bt){B=bt},setClear:function(bt){At!==bt&&(St&&(bt=1-bt),i.clearDepth(bt),At=bt)},reset:function(){B=!1,j=null,at=null,At=null,St=!1}}}function s(){let B=!1,St=null,j=null,at=null,At=null,bt=null,$t=null,ve=null,Pe=null;return{setTest:function(ae){B||(ae?mt(i.STENCIL_TEST):Ut(i.STENCIL_TEST))},setMask:function(ae){St!==ae&&!B&&(i.stencilMask(ae),St=ae)},setFunc:function(ae,He,Fe){(j!==ae||at!==He||At!==Fe)&&(i.stencilFunc(ae,He,Fe),j=ae,at=He,At=Fe)},setOp:function(ae,He,Fe){(bt!==ae||$t!==He||ve!==Fe)&&(i.stencilOp(ae,He,Fe),bt=ae,$t=He,ve=Fe)},setLocked:function(ae){B=ae},setClear:function(ae){Pe!==ae&&(i.clearStencil(ae),Pe=ae)},reset:function(){B=!1,St=null,j=null,at=null,At=null,bt=null,$t=null,ve=null,Pe=null}}}const r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap;let h={},u={},d=new WeakMap,p=[],g=null,x=!1,m=null,f=null,y=null,M=null,_=null,L=null,T=null,D=new gt(0,0,0),I=0,S=!1,v=null,C=null,N=null,F=null,O=null;const G=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let W=!1,q=0;const V=i.getParameter(i.VERSION);V.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(V)[1]),W=q>=1):V.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),W=q>=2);let ct=null,dt={};const _t=i.getParameter(i.SCISSOR_BOX),Wt=i.getParameter(i.VIEWPORT),Vt=new ge().fromArray(_t),Q=new ge().fromArray(Wt);function pt(B,St,j,at){const At=new Uint8Array(4),bt=i.createTexture();i.bindTexture(B,bt),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let $t=0;$t<j;$t++)B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY?i.texImage3D(St,0,i.RGBA,1,1,at,0,i.RGBA,i.UNSIGNED_BYTE,At):i.texImage2D(St+$t,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,At);return bt}const vt={};vt[i.TEXTURE_2D]=pt(i.TEXTURE_2D,i.TEXTURE_2D,1),vt[i.TEXTURE_CUBE_MAP]=pt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),vt[i.TEXTURE_2D_ARRAY]=pt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),vt[i.TEXTURE_3D]=pt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),mt(i.DEPTH_TEST),o.setFunc(ss),et(!1),ht(za),mt(i.CULL_FACE),R(Yn);function mt(B){h[B]!==!0&&(i.enable(B),h[B]=!0)}function Ut(B){h[B]!==!1&&(i.disable(B),h[B]=!1)}function Nt(B,St){return u[B]!==St?(i.bindFramebuffer(B,St),u[B]=St,B===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=St),B===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=St),!0):!1}function kt(B,St){let j=p,at=!1;if(B){j=d.get(St),j===void 0&&(j=[],d.set(St,j));const At=B.textures;if(j.length!==At.length||j[0]!==i.COLOR_ATTACHMENT0){for(let bt=0,$t=At.length;bt<$t;bt++)j[bt]=i.COLOR_ATTACHMENT0+bt;j.length=At.length,at=!0}}else j[0]!==i.BACK&&(j[0]=i.BACK,at=!0);at&&i.drawBuffers(j)}function Bt(B){return g!==B?(i.useProgram(B),g=B,!0):!1}const $={[vi]:i.FUNC_ADD,[lh]:i.FUNC_SUBTRACT,[ch]:i.FUNC_REVERSE_SUBTRACT};$[hh]=i.MIN,$[uh]=i.MAX;const ot={[dh]:i.ZERO,[fh]:i.ONE,[ph]:i.SRC_COLOR,[yo]:i.SRC_ALPHA,[Mh]:i.SRC_ALPHA_SATURATE,[vh]:i.DST_COLOR,[gh]:i.DST_ALPHA,[mh]:i.ONE_MINUS_SRC_COLOR,[So]:i.ONE_MINUS_SRC_ALPHA,[xh]:i.ONE_MINUS_DST_COLOR,[_h]:i.ONE_MINUS_DST_ALPHA,[wh]:i.CONSTANT_COLOR,[yh]:i.ONE_MINUS_CONSTANT_COLOR,[Sh]:i.CONSTANT_ALPHA,[bh]:i.ONE_MINUS_CONSTANT_ALPHA};function R(B,St,j,at,At,bt,$t,ve,Pe,ae){if(B===Yn){x===!0&&(Ut(i.BLEND),x=!1);return}if(x===!1&&(mt(i.BLEND),x=!0),B!==ah){if(B!==m||ae!==S){if((f!==vi||_!==vi)&&(i.blendEquation(i.FUNC_ADD),f=vi,_=vi),ae)switch(B){case ts:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case br:i.blendFunc(i.ONE,i.ONE);break;case Ga:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ka:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case ts:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case br:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ga:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ka:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}y=null,M=null,L=null,T=null,D.set(0,0,0),I=0,m=B,S=ae}return}At=At||St,bt=bt||j,$t=$t||at,(St!==f||At!==_)&&(i.blendEquationSeparate($[St],$[At]),f=St,_=At),(j!==y||at!==M||bt!==L||$t!==T)&&(i.blendFuncSeparate(ot[j],ot[at],ot[bt],ot[$t]),y=j,M=at,L=bt,T=$t),(ve.equals(D)===!1||Pe!==I)&&(i.blendColor(ve.r,ve.g,ve.b,Pe),D.copy(ve),I=Pe),m=B,S=!1}function Mt(B,St){B.side===on?Ut(i.CULL_FACE):mt(i.CULL_FACE);let j=B.side===Je;St&&(j=!j),et(j),B.blending===ts&&B.transparent===!1?R(Yn):R(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),o.setFunc(B.depthFunc),o.setTest(B.depthTest),o.setMask(B.depthWrite),r.setMask(B.colorWrite);const at=B.stencilWrite;a.setTest(at),at&&(a.setMask(B.stencilWriteMask),a.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),a.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),Ft(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?mt(i.SAMPLE_ALPHA_TO_COVERAGE):Ut(i.SAMPLE_ALPHA_TO_COVERAGE)}function et(B){v!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),v=B)}function ht(B){B!==rh?(mt(i.CULL_FACE),B!==C&&(B===za?i.cullFace(i.BACK):B===oh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ut(i.CULL_FACE),C=B}function st(B){B!==N&&(W&&i.lineWidth(B),N=B)}function Ft(B,St,j){B?(mt(i.POLYGON_OFFSET_FILL),(F!==St||O!==j)&&(i.polygonOffset(St,j),F=St,O=j)):Ut(i.POLYGON_OFFSET_FILL)}function ut(B){B?mt(i.SCISSOR_TEST):Ut(i.SCISSOR_TEST)}function P(B){B===void 0&&(B=i.TEXTURE0+G-1),ct!==B&&(i.activeTexture(B),ct=B)}function w(B,St,j){j===void 0&&(ct===null?j=i.TEXTURE0+G-1:j=ct);let at=dt[j];at===void 0&&(at={type:void 0,texture:void 0},dt[j]=at),(at.type!==B||at.texture!==St)&&(ct!==j&&(i.activeTexture(j),ct=j),i.bindTexture(B,St||vt[B]),at.type=B,at.texture=St)}function H(){const B=dt[ct];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function J(){try{i.compressedTexImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function rt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function tt(){try{i.texSubImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Lt(){try{i.texSubImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function K(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function nt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Dt(){try{i.texStorage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function it(){try{i.texStorage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function wt(){try{i.texImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ht(){try{i.texImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function It(B){Vt.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),Vt.copy(B))}function Ct(B){Q.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),Q.copy(B))}function Kt(B,St){let j=c.get(St);j===void 0&&(j=new WeakMap,c.set(St,j));let at=j.get(B);at===void 0&&(at=i.getUniformBlockIndex(St,B.name),j.set(B,at))}function qt(B,St){const at=c.get(St).get(B);l.get(St)!==at&&(i.uniformBlockBinding(St,at,B.__bindingPointIndex),l.set(St,at))}function he(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},ct=null,dt={},u={},d=new WeakMap,p=[],g=null,x=!1,m=null,f=null,y=null,M=null,_=null,L=null,T=null,D=new gt(0,0,0),I=0,S=!1,v=null,C=null,N=null,F=null,O=null,Vt.set(0,0,i.canvas.width,i.canvas.height),Q.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:mt,disable:Ut,bindFramebuffer:Nt,drawBuffers:kt,useProgram:Bt,setBlending:R,setMaterial:Mt,setFlipSided:et,setCullFace:ht,setLineWidth:st,setPolygonOffset:Ft,setScissorTest:ut,activeTexture:P,bindTexture:w,unbindTexture:H,compressedTexImage2D:J,compressedTexImage3D:rt,texImage2D:wt,texImage3D:Ht,updateUBOMapping:Kt,uniformBlockBinding:qt,texStorage2D:Dt,texStorage3D:it,texSubImage2D:tt,texSubImage3D:Lt,compressedTexSubImage2D:K,compressedTexSubImage3D:nt,scissor:It,viewport:Ct,reset:he}}function W0(i,t,e,n,s,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new lt,h=new WeakMap;let u;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(P,w){return p?new OffscreenCanvas(P,w):Cr("canvas")}function x(P,w,H){let J=1;const rt=ut(P);if((rt.width>H||rt.height>H)&&(J=H/Math.max(rt.width,rt.height)),J<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const tt=Math.floor(J*rt.width),Lt=Math.floor(J*rt.height);u===void 0&&(u=g(tt,Lt));const K=w?g(tt,Lt):u;return K.width=tt,K.height=Lt,K.getContext("2d").drawImage(P,0,0,tt,Lt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+rt.width+"x"+rt.height+") to ("+tt+"x"+Lt+")."),K}else return"data"in P&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+rt.width+"x"+rt.height+")."),P;return P}function m(P){return P.generateMipmaps}function f(P){i.generateMipmap(P)}function y(P){return P.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?i.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(P,w,H,J,rt=!1){if(P!==null){if(i[P]!==void 0)return i[P];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let tt=w;if(w===i.RED&&(H===i.FLOAT&&(tt=i.R32F),H===i.HALF_FLOAT&&(tt=i.R16F),H===i.UNSIGNED_BYTE&&(tt=i.R8)),w===i.RED_INTEGER&&(H===i.UNSIGNED_BYTE&&(tt=i.R8UI),H===i.UNSIGNED_SHORT&&(tt=i.R16UI),H===i.UNSIGNED_INT&&(tt=i.R32UI),H===i.BYTE&&(tt=i.R8I),H===i.SHORT&&(tt=i.R16I),H===i.INT&&(tt=i.R32I)),w===i.RG&&(H===i.FLOAT&&(tt=i.RG32F),H===i.HALF_FLOAT&&(tt=i.RG16F),H===i.UNSIGNED_BYTE&&(tt=i.RG8)),w===i.RG_INTEGER&&(H===i.UNSIGNED_BYTE&&(tt=i.RG8UI),H===i.UNSIGNED_SHORT&&(tt=i.RG16UI),H===i.UNSIGNED_INT&&(tt=i.RG32UI),H===i.BYTE&&(tt=i.RG8I),H===i.SHORT&&(tt=i.RG16I),H===i.INT&&(tt=i.RG32I)),w===i.RGB_INTEGER&&(H===i.UNSIGNED_BYTE&&(tt=i.RGB8UI),H===i.UNSIGNED_SHORT&&(tt=i.RGB16UI),H===i.UNSIGNED_INT&&(tt=i.RGB32UI),H===i.BYTE&&(tt=i.RGB8I),H===i.SHORT&&(tt=i.RGB16I),H===i.INT&&(tt=i.RGB32I)),w===i.RGBA_INTEGER&&(H===i.UNSIGNED_BYTE&&(tt=i.RGBA8UI),H===i.UNSIGNED_SHORT&&(tt=i.RGBA16UI),H===i.UNSIGNED_INT&&(tt=i.RGBA32UI),H===i.BYTE&&(tt=i.RGBA8I),H===i.SHORT&&(tt=i.RGBA16I),H===i.INT&&(tt=i.RGBA32I)),w===i.RGB&&H===i.UNSIGNED_INT_5_9_9_9_REV&&(tt=i.RGB9_E5),w===i.RGBA){const Lt=rt?Tr:ce.getTransfer(J);H===i.FLOAT&&(tt=i.RGBA32F),H===i.HALF_FLOAT&&(tt=i.RGBA16F),H===i.UNSIGNED_BYTE&&(tt=Lt===de?i.SRGB8_ALPHA8:i.RGBA8),H===i.UNSIGNED_SHORT_4_4_4_4&&(tt=i.RGBA4),H===i.UNSIGNED_SHORT_5_5_5_1&&(tt=i.RGB5_A1)}return(tt===i.R16F||tt===i.R32F||tt===i.RG16F||tt===i.RG32F||tt===i.RGBA16F||tt===i.RGBA32F)&&t.get("EXT_color_buffer_float"),tt}function _(P,w){let H;return P?w===null||w===yi||w===as?H=i.DEPTH24_STENCIL8:w===Tn?H=i.DEPTH32F_STENCIL8:w===Fs&&(H=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===yi||w===as?H=i.DEPTH_COMPONENT24:w===Tn?H=i.DEPTH_COMPONENT32F:w===Fs&&(H=i.DEPTH_COMPONENT16),H}function L(P,w){return m(P)===!0||P.isFramebufferTexture&&P.minFilter!==un&&P.minFilter!==En?Math.log2(Math.max(w.width,w.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?w.mipmaps.length:1}function T(P){const w=P.target;w.removeEventListener("dispose",T),I(w),w.isVideoTexture&&h.delete(w)}function D(P){const w=P.target;w.removeEventListener("dispose",D),v(w)}function I(P){const w=n.get(P);if(w.__webglInit===void 0)return;const H=P.source,J=d.get(H);if(J){const rt=J[w.__cacheKey];rt.usedTimes--,rt.usedTimes===0&&S(P),Object.keys(J).length===0&&d.delete(H)}n.remove(P)}function S(P){const w=n.get(P);i.deleteTexture(w.__webglTexture);const H=P.source,J=d.get(H);delete J[w.__cacheKey],o.memory.textures--}function v(P){const w=n.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),n.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(w.__webglFramebuffer[J]))for(let rt=0;rt<w.__webglFramebuffer[J].length;rt++)i.deleteFramebuffer(w.__webglFramebuffer[J][rt]);else i.deleteFramebuffer(w.__webglFramebuffer[J]);w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer[J])}else{if(Array.isArray(w.__webglFramebuffer))for(let J=0;J<w.__webglFramebuffer.length;J++)i.deleteFramebuffer(w.__webglFramebuffer[J]);else i.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&i.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let J=0;J<w.__webglColorRenderbuffer.length;J++)w.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(w.__webglColorRenderbuffer[J]);w.__webglDepthRenderbuffer&&i.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const H=P.textures;for(let J=0,rt=H.length;J<rt;J++){const tt=n.get(H[J]);tt.__webglTexture&&(i.deleteTexture(tt.__webglTexture),o.memory.textures--),n.remove(H[J])}n.remove(P)}let C=0;function N(){C=0}function F(){const P=C;return P>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+P+" texture units while this GPU supports only "+s.maxTextures),C+=1,P}function O(P){const w=[];return w.push(P.wrapS),w.push(P.wrapT),w.push(P.wrapR||0),w.push(P.magFilter),w.push(P.minFilter),w.push(P.anisotropy),w.push(P.internalFormat),w.push(P.format),w.push(P.type),w.push(P.generateMipmaps),w.push(P.premultiplyAlpha),w.push(P.flipY),w.push(P.unpackAlignment),w.push(P.colorSpace),w.join()}function G(P,w){const H=n.get(P);if(P.isVideoTexture&&st(P),P.isRenderTargetTexture===!1&&P.version>0&&H.__version!==P.version){const J=P.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Q(H,P,w);return}}e.bindTexture(i.TEXTURE_2D,H.__webglTexture,i.TEXTURE0+w)}function W(P,w){const H=n.get(P);if(P.version>0&&H.__version!==P.version){Q(H,P,w);return}e.bindTexture(i.TEXTURE_2D_ARRAY,H.__webglTexture,i.TEXTURE0+w)}function q(P,w){const H=n.get(P);if(P.version>0&&H.__version!==P.version){Q(H,P,w);return}e.bindTexture(i.TEXTURE_3D,H.__webglTexture,i.TEXTURE0+w)}function V(P,w){const H=n.get(P);if(P.version>0&&H.__version!==P.version){pt(H,P,w);return}e.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture,i.TEXTURE0+w)}const ct={[Ns]:i.REPEAT,[Mi]:i.CLAMP_TO_EDGE,[Do]:i.MIRRORED_REPEAT},dt={[un]:i.NEAREST,[Ch]:i.NEAREST_MIPMAP_NEAREST,[Vs]:i.NEAREST_MIPMAP_LINEAR,[En]:i.LINEAR,[Br]:i.LINEAR_MIPMAP_NEAREST,[wi]:i.LINEAR_MIPMAP_LINEAR},_t={[Dh]:i.NEVER,[Bh]:i.ALWAYS,[Ih]:i.LESS,[Mc]:i.LEQUAL,[Uh]:i.EQUAL,[Oh]:i.GEQUAL,[Nh]:i.GREATER,[Fh]:i.NOTEQUAL};function Wt(P,w){if(w.type===Tn&&t.has("OES_texture_float_linear")===!1&&(w.magFilter===En||w.magFilter===Br||w.magFilter===Vs||w.magFilter===wi||w.minFilter===En||w.minFilter===Br||w.minFilter===Vs||w.minFilter===wi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(P,i.TEXTURE_WRAP_S,ct[w.wrapS]),i.texParameteri(P,i.TEXTURE_WRAP_T,ct[w.wrapT]),(P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY)&&i.texParameteri(P,i.TEXTURE_WRAP_R,ct[w.wrapR]),i.texParameteri(P,i.TEXTURE_MAG_FILTER,dt[w.magFilter]),i.texParameteri(P,i.TEXTURE_MIN_FILTER,dt[w.minFilter]),w.compareFunction&&(i.texParameteri(P,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(P,i.TEXTURE_COMPARE_FUNC,_t[w.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===un||w.minFilter!==Vs&&w.minFilter!==wi||w.type===Tn&&t.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){const H=t.get("EXT_texture_filter_anisotropic");i.texParameterf(P,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function Vt(P,w){let H=!1;P.__webglInit===void 0&&(P.__webglInit=!0,w.addEventListener("dispose",T));const J=w.source;let rt=d.get(J);rt===void 0&&(rt={},d.set(J,rt));const tt=O(w);if(tt!==P.__cacheKey){rt[tt]===void 0&&(rt[tt]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,H=!0),rt[tt].usedTimes++;const Lt=rt[P.__cacheKey];Lt!==void 0&&(rt[P.__cacheKey].usedTimes--,Lt.usedTimes===0&&S(w)),P.__cacheKey=tt,P.__webglTexture=rt[tt].texture}return H}function Q(P,w,H){let J=i.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),w.isData3DTexture&&(J=i.TEXTURE_3D);const rt=Vt(P,w),tt=w.source;e.bindTexture(J,P.__webglTexture,i.TEXTURE0+H);const Lt=n.get(tt);if(tt.version!==Lt.__version||rt===!0){e.activeTexture(i.TEXTURE0+H);const K=ce.getPrimaries(ce.workingColorSpace),nt=w.colorSpace===Wn?null:ce.getPrimaries(w.colorSpace),Dt=w.colorSpace===Wn||K===nt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Dt);let it=x(w.image,!1,s.maxTextureSize);it=Ft(w,it);const wt=r.convert(w.format,w.colorSpace),Ht=r.convert(w.type);let It=M(w.internalFormat,wt,Ht,w.colorSpace,w.isVideoTexture);Wt(J,w);let Ct;const Kt=w.mipmaps,qt=w.isVideoTexture!==!0,he=Lt.__version===void 0||rt===!0,B=tt.dataReady,St=L(w,it);if(w.isDepthTexture)It=_(w.format===ls,w.type),he&&(qt?e.texStorage2D(i.TEXTURE_2D,1,It,it.width,it.height):e.texImage2D(i.TEXTURE_2D,0,It,it.width,it.height,0,wt,Ht,null));else if(w.isDataTexture)if(Kt.length>0){qt&&he&&e.texStorage2D(i.TEXTURE_2D,St,It,Kt[0].width,Kt[0].height);for(let j=0,at=Kt.length;j<at;j++)Ct=Kt[j],qt?B&&e.texSubImage2D(i.TEXTURE_2D,j,0,0,Ct.width,Ct.height,wt,Ht,Ct.data):e.texImage2D(i.TEXTURE_2D,j,It,Ct.width,Ct.height,0,wt,Ht,Ct.data);w.generateMipmaps=!1}else qt?(he&&e.texStorage2D(i.TEXTURE_2D,St,It,it.width,it.height),B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,it.width,it.height,wt,Ht,it.data)):e.texImage2D(i.TEXTURE_2D,0,It,it.width,it.height,0,wt,Ht,it.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){qt&&he&&e.texStorage3D(i.TEXTURE_2D_ARRAY,St,It,Kt[0].width,Kt[0].height,it.depth);for(let j=0,at=Kt.length;j<at;j++)if(Ct=Kt[j],w.format!==yn)if(wt!==null)if(qt){if(B)if(w.layerUpdates.size>0){const At=bl(Ct.width,Ct.height,w.format,w.type);for(const bt of w.layerUpdates){const $t=Ct.data.subarray(bt*At/Ct.data.BYTES_PER_ELEMENT,(bt+1)*At/Ct.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,bt,Ct.width,Ct.height,1,wt,$t)}w.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,0,Ct.width,Ct.height,it.depth,wt,Ct.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,j,It,Ct.width,Ct.height,it.depth,0,Ct.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else qt?B&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,0,Ct.width,Ct.height,it.depth,wt,Ht,Ct.data):e.texImage3D(i.TEXTURE_2D_ARRAY,j,It,Ct.width,Ct.height,it.depth,0,wt,Ht,Ct.data)}else{qt&&he&&e.texStorage2D(i.TEXTURE_2D,St,It,Kt[0].width,Kt[0].height);for(let j=0,at=Kt.length;j<at;j++)Ct=Kt[j],w.format!==yn?wt!==null?qt?B&&e.compressedTexSubImage2D(i.TEXTURE_2D,j,0,0,Ct.width,Ct.height,wt,Ct.data):e.compressedTexImage2D(i.TEXTURE_2D,j,It,Ct.width,Ct.height,0,Ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qt?B&&e.texSubImage2D(i.TEXTURE_2D,j,0,0,Ct.width,Ct.height,wt,Ht,Ct.data):e.texImage2D(i.TEXTURE_2D,j,It,Ct.width,Ct.height,0,wt,Ht,Ct.data)}else if(w.isDataArrayTexture)if(qt){if(he&&e.texStorage3D(i.TEXTURE_2D_ARRAY,St,It,it.width,it.height,it.depth),B)if(w.layerUpdates.size>0){const j=bl(it.width,it.height,w.format,w.type);for(const at of w.layerUpdates){const At=it.data.subarray(at*j/it.data.BYTES_PER_ELEMENT,(at+1)*j/it.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,at,it.width,it.height,1,wt,Ht,At)}w.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,wt,Ht,it.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,It,it.width,it.height,it.depth,0,wt,Ht,it.data);else if(w.isData3DTexture)qt?(he&&e.texStorage3D(i.TEXTURE_3D,St,It,it.width,it.height,it.depth),B&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,wt,Ht,it.data)):e.texImage3D(i.TEXTURE_3D,0,It,it.width,it.height,it.depth,0,wt,Ht,it.data);else if(w.isFramebufferTexture){if(he)if(qt)e.texStorage2D(i.TEXTURE_2D,St,It,it.width,it.height);else{let j=it.width,at=it.height;for(let At=0;At<St;At++)e.texImage2D(i.TEXTURE_2D,At,It,j,at,0,wt,Ht,null),j>>=1,at>>=1}}else if(Kt.length>0){if(qt&&he){const j=ut(Kt[0]);e.texStorage2D(i.TEXTURE_2D,St,It,j.width,j.height)}for(let j=0,at=Kt.length;j<at;j++)Ct=Kt[j],qt?B&&e.texSubImage2D(i.TEXTURE_2D,j,0,0,wt,Ht,Ct):e.texImage2D(i.TEXTURE_2D,j,It,wt,Ht,Ct);w.generateMipmaps=!1}else if(qt){if(he){const j=ut(it);e.texStorage2D(i.TEXTURE_2D,St,It,j.width,j.height)}B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,wt,Ht,it)}else e.texImage2D(i.TEXTURE_2D,0,It,wt,Ht,it);m(w)&&f(J),Lt.__version=tt.version,w.onUpdate&&w.onUpdate(w)}P.__version=w.version}function pt(P,w,H){if(w.image.length!==6)return;const J=Vt(P,w),rt=w.source;e.bindTexture(i.TEXTURE_CUBE_MAP,P.__webglTexture,i.TEXTURE0+H);const tt=n.get(rt);if(rt.version!==tt.__version||J===!0){e.activeTexture(i.TEXTURE0+H);const Lt=ce.getPrimaries(ce.workingColorSpace),K=w.colorSpace===Wn?null:ce.getPrimaries(w.colorSpace),nt=w.colorSpace===Wn||Lt===K?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,nt);const Dt=w.isCompressedTexture||w.image[0].isCompressedTexture,it=w.image[0]&&w.image[0].isDataTexture,wt=[];for(let at=0;at<6;at++)!Dt&&!it?wt[at]=x(w.image[at],!0,s.maxCubemapSize):wt[at]=it?w.image[at].image:w.image[at],wt[at]=Ft(w,wt[at]);const Ht=wt[0],It=r.convert(w.format,w.colorSpace),Ct=r.convert(w.type),Kt=M(w.internalFormat,It,Ct,w.colorSpace),qt=w.isVideoTexture!==!0,he=tt.__version===void 0||J===!0,B=rt.dataReady;let St=L(w,Ht);Wt(i.TEXTURE_CUBE_MAP,w);let j;if(Dt){qt&&he&&e.texStorage2D(i.TEXTURE_CUBE_MAP,St,Kt,Ht.width,Ht.height);for(let at=0;at<6;at++){j=wt[at].mipmaps;for(let At=0;At<j.length;At++){const bt=j[At];w.format!==yn?It!==null?qt?B&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,0,0,bt.width,bt.height,It,bt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,Kt,bt.width,bt.height,0,bt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):qt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,0,0,bt.width,bt.height,It,Ct,bt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At,Kt,bt.width,bt.height,0,It,Ct,bt.data)}}}else{if(j=w.mipmaps,qt&&he){j.length>0&&St++;const at=ut(wt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,St,Kt,at.width,at.height)}for(let at=0;at<6;at++)if(it){qt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,wt[at].width,wt[at].height,It,Ct,wt[at].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Kt,wt[at].width,wt[at].height,0,It,Ct,wt[at].data);for(let At=0;At<j.length;At++){const $t=j[At].image[at].image;qt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,0,0,$t.width,$t.height,It,Ct,$t.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,Kt,$t.width,$t.height,0,It,Ct,$t.data)}}else{qt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,It,Ct,wt[at]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Kt,It,Ct,wt[at]);for(let At=0;At<j.length;At++){const bt=j[At];qt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,0,0,It,Ct,bt.image[at]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,At+1,Kt,It,Ct,bt.image[at])}}}m(w)&&f(i.TEXTURE_CUBE_MAP),tt.__version=rt.version,w.onUpdate&&w.onUpdate(w)}P.__version=w.version}function vt(P,w,H,J,rt,tt){const Lt=r.convert(H.format,H.colorSpace),K=r.convert(H.type),nt=M(H.internalFormat,Lt,K,H.colorSpace),Dt=n.get(w),it=n.get(H);if(it.__renderTarget=w,!Dt.__hasExternalTextures){const wt=Math.max(1,w.width>>tt),Ht=Math.max(1,w.height>>tt);rt===i.TEXTURE_3D||rt===i.TEXTURE_2D_ARRAY?e.texImage3D(rt,tt,nt,wt,Ht,w.depth,0,Lt,K,null):e.texImage2D(rt,tt,nt,wt,Ht,0,Lt,K,null)}e.bindFramebuffer(i.FRAMEBUFFER,P),ht(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,rt,it.__webglTexture,0,et(w)):(rt===i.TEXTURE_2D||rt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&rt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,rt,it.__webglTexture,tt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function mt(P,w,H){if(i.bindRenderbuffer(i.RENDERBUFFER,P),w.depthBuffer){const J=w.depthTexture,rt=J&&J.isDepthTexture?J.type:null,tt=_(w.stencilBuffer,rt),Lt=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=et(w);ht(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,K,tt,w.width,w.height):H?i.renderbufferStorageMultisample(i.RENDERBUFFER,K,tt,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,tt,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Lt,i.RENDERBUFFER,P)}else{const J=w.textures;for(let rt=0;rt<J.length;rt++){const tt=J[rt],Lt=r.convert(tt.format,tt.colorSpace),K=r.convert(tt.type),nt=M(tt.internalFormat,Lt,K,tt.colorSpace),Dt=et(w);H&&ht(w)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Dt,nt,w.width,w.height):ht(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Dt,nt,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,nt,w.width,w.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ut(P,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,P),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const J=n.get(w.depthTexture);J.__renderTarget=w,(!J.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),G(w.depthTexture,0);const rt=J.__webglTexture,tt=et(w);if(w.depthTexture.format===es)ht(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,rt,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,rt,0);else if(w.depthTexture.format===ls)ht(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,rt,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,rt,0);else throw new Error("Unknown depthTexture format")}function Nt(P){const w=n.get(P),H=P.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==P.depthTexture){const J=P.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),J){const rt=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,J.removeEventListener("dispose",rt)};J.addEventListener("dispose",rt),w.__depthDisposeCallback=rt}w.__boundDepthTexture=J}if(P.depthTexture&&!w.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Ut(w.__webglFramebuffer,P)}else if(H){w.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer[J]),w.__webglDepthbuffer[J]===void 0)w.__webglDepthbuffer[J]=i.createRenderbuffer(),mt(w.__webglDepthbuffer[J],P,!1);else{const rt=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,tt=w.__webglDepthbuffer[J];i.bindRenderbuffer(i.RENDERBUFFER,tt),i.framebufferRenderbuffer(i.FRAMEBUFFER,rt,i.RENDERBUFFER,tt)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=i.createRenderbuffer(),mt(w.__webglDepthbuffer,P,!1);else{const J=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=w.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,rt)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function kt(P,w,H){const J=n.get(P);w!==void 0&&vt(J.__webglFramebuffer,P,P.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),H!==void 0&&Nt(P)}function Bt(P){const w=P.texture,H=n.get(P),J=n.get(w);P.addEventListener("dispose",D);const rt=P.textures,tt=P.isWebGLCubeRenderTarget===!0,Lt=rt.length>1;if(Lt||(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=w.version,o.memory.textures++),tt){H.__webglFramebuffer=[];for(let K=0;K<6;K++)if(w.mipmaps&&w.mipmaps.length>0){H.__webglFramebuffer[K]=[];for(let nt=0;nt<w.mipmaps.length;nt++)H.__webglFramebuffer[K][nt]=i.createFramebuffer()}else H.__webglFramebuffer[K]=i.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){H.__webglFramebuffer=[];for(let K=0;K<w.mipmaps.length;K++)H.__webglFramebuffer[K]=i.createFramebuffer()}else H.__webglFramebuffer=i.createFramebuffer();if(Lt)for(let K=0,nt=rt.length;K<nt;K++){const Dt=n.get(rt[K]);Dt.__webglTexture===void 0&&(Dt.__webglTexture=i.createTexture(),o.memory.textures++)}if(P.samples>0&&ht(P)===!1){H.__webglMultisampledFramebuffer=i.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let K=0;K<rt.length;K++){const nt=rt[K];H.__webglColorRenderbuffer[K]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,H.__webglColorRenderbuffer[K]);const Dt=r.convert(nt.format,nt.colorSpace),it=r.convert(nt.type),wt=M(nt.internalFormat,Dt,it,nt.colorSpace,P.isXRRenderTarget===!0),Ht=et(P);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ht,wt,P.width,P.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+K,i.RENDERBUFFER,H.__webglColorRenderbuffer[K])}i.bindRenderbuffer(i.RENDERBUFFER,null),P.depthBuffer&&(H.__webglDepthRenderbuffer=i.createRenderbuffer(),mt(H.__webglDepthRenderbuffer,P,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(tt){e.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),Wt(i.TEXTURE_CUBE_MAP,w);for(let K=0;K<6;K++)if(w.mipmaps&&w.mipmaps.length>0)for(let nt=0;nt<w.mipmaps.length;nt++)vt(H.__webglFramebuffer[K][nt],P,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+K,nt);else vt(H.__webglFramebuffer[K],P,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);m(w)&&f(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Lt){for(let K=0,nt=rt.length;K<nt;K++){const Dt=rt[K],it=n.get(Dt);e.bindTexture(i.TEXTURE_2D,it.__webglTexture),Wt(i.TEXTURE_2D,Dt),vt(H.__webglFramebuffer,P,Dt,i.COLOR_ATTACHMENT0+K,i.TEXTURE_2D,0),m(Dt)&&f(i.TEXTURE_2D)}e.unbindTexture()}else{let K=i.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(K=P.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(K,J.__webglTexture),Wt(K,w),w.mipmaps&&w.mipmaps.length>0)for(let nt=0;nt<w.mipmaps.length;nt++)vt(H.__webglFramebuffer[nt],P,w,i.COLOR_ATTACHMENT0,K,nt);else vt(H.__webglFramebuffer,P,w,i.COLOR_ATTACHMENT0,K,0);m(w)&&f(K),e.unbindTexture()}P.depthBuffer&&Nt(P)}function $(P){const w=P.textures;for(let H=0,J=w.length;H<J;H++){const rt=w[H];if(m(rt)){const tt=y(P),Lt=n.get(rt).__webglTexture;e.bindTexture(tt,Lt),f(tt),e.unbindTexture()}}}const ot=[],R=[];function Mt(P){if(P.samples>0){if(ht(P)===!1){const w=P.textures,H=P.width,J=P.height;let rt=i.COLOR_BUFFER_BIT;const tt=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Lt=n.get(P),K=w.length>1;if(K)for(let nt=0;nt<w.length;nt++)e.bindFramebuffer(i.FRAMEBUFFER,Lt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Lt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Lt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Lt.__webglFramebuffer);for(let nt=0;nt<w.length;nt++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(rt|=i.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(rt|=i.STENCIL_BUFFER_BIT)),K){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Lt.__webglColorRenderbuffer[nt]);const Dt=n.get(w[nt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Dt,0)}i.blitFramebuffer(0,0,H,J,0,0,H,J,rt,i.NEAREST),l===!0&&(ot.length=0,R.length=0,ot.push(i.COLOR_ATTACHMENT0+nt),P.depthBuffer&&P.resolveDepthBuffer===!1&&(ot.push(tt),R.push(tt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,R)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ot))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),K)for(let nt=0;nt<w.length;nt++){e.bindFramebuffer(i.FRAMEBUFFER,Lt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.RENDERBUFFER,Lt.__webglColorRenderbuffer[nt]);const Dt=n.get(w[nt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Lt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.TEXTURE_2D,Dt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Lt.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.resolveDepthBuffer===!1&&l){const w=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[w])}}}function et(P){return Math.min(s.maxSamples,P.samples)}function ht(P){const w=n.get(P);return P.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function st(P){const w=o.render.frame;h.get(P)!==w&&(h.set(P,w),P.update())}function Ft(P,w){const H=P.colorSpace,J=P.format,rt=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||H!==cs&&H!==Wn&&(ce.getTransfer(H)===de?(J!==yn||rt!==$n)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),w}function ut(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(c.width=P.naturalWidth||P.width,c.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(c.width=P.displayWidth,c.height=P.displayHeight):(c.width=P.width,c.height=P.height),c}this.allocateTextureUnit=F,this.resetTextureUnits=N,this.setTexture2D=G,this.setTexture2DArray=W,this.setTexture3D=q,this.setTextureCube=V,this.rebindTextures=kt,this.setupRenderTarget=Bt,this.updateRenderTargetMipmap=$,this.updateMultisampleRenderTarget=Mt,this.setupDepthRenderbuffer=Nt,this.setupFrameBufferTexture=vt,this.useMultisampledRTT=ht}function X0(i,t){function e(n,s=Wn){let r;const o=ce.getTransfer(s);if(n===$n)return i.UNSIGNED_BYTE;if(n===pa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===ma)return i.UNSIGNED_SHORT_5_5_5_1;if(n===dc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===hc)return i.BYTE;if(n===uc)return i.SHORT;if(n===Fs)return i.UNSIGNED_SHORT;if(n===fa)return i.INT;if(n===yi)return i.UNSIGNED_INT;if(n===Tn)return i.FLOAT;if(n===An)return i.HALF_FLOAT;if(n===fc)return i.ALPHA;if(n===pc)return i.RGB;if(n===yn)return i.RGBA;if(n===mc)return i.LUMINANCE;if(n===gc)return i.LUMINANCE_ALPHA;if(n===es)return i.DEPTH_COMPONENT;if(n===ls)return i.DEPTH_STENCIL;if(n===ga)return i.RED;if(n===_a)return i.RED_INTEGER;if(n===_c)return i.RG;if(n===va)return i.RG_INTEGER;if(n===xa)return i.RGBA_INTEGER;if(n===vr||n===xr||n===Mr||n===wr)if(o===de)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===vr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===xr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===wr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===vr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===xr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Mr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===wr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Io||n===Uo||n===No||n===Fo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Io)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Uo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===No)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Fo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Oo||n===Bo||n===zo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Oo||n===Bo)return o===de?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===zo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Go||n===ko||n===Ho||n===Vo||n===Wo||n===Xo||n===Yo||n===qo||n===Zo||n===$o||n===jo||n===Ko||n===Jo||n===Qo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Go)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ko)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ho)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Vo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Wo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Xo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Yo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===qo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Zo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===$o)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===jo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ko)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Jo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Qo)return o===de?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===yr||n===ta||n===ea)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===yr)return o===de?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ta)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ea)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===vc||n===na||n===ia||n===sa)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===yr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===na)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ia)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===sa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===as?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const Y0={type:"move"};class vo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Jt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Jt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Jt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const x of t.hand.values()){const m=e.getJointPose(x,n),f=this._getHandJoint(c,x);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Y0)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Jt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const q0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Z0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class $0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new Qe,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!==n.depthNear||e.depthFar!==n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new ze({vertexShader:q0,fragmentShader:Z0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new b(new Ce(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class j0 extends Ei{constructor(t,e){super();const n=this;let s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,g=null;const x=new $0,m=e.getContextAttributes();let f=null,y=null;const M=[],_=[],L=new lt;let T=null;const D=new hn;D.viewport=new ge;const I=new hn;I.viewport=new ge;const S=[D,I],v=new pd;let C=null,N=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let pt=M[Q];return pt===void 0&&(pt=new vo,M[Q]=pt),pt.getTargetRaySpace()},this.getControllerGrip=function(Q){let pt=M[Q];return pt===void 0&&(pt=new vo,M[Q]=pt),pt.getGripSpace()},this.getHand=function(Q){let pt=M[Q];return pt===void 0&&(pt=new vo,M[Q]=pt),pt.getHandSpace()};function F(Q){const pt=_.indexOf(Q.inputSource);if(pt===-1)return;const vt=M[pt];vt!==void 0&&(vt.update(Q.inputSource,Q.frame,c||o),vt.dispatchEvent({type:Q.type,data:Q.inputSource}))}function O(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",O),s.removeEventListener("inputsourceschange",G);for(let Q=0;Q<M.length;Q++){const pt=_[Q];pt!==null&&(_[Q]=null,M[Q].disconnect(pt))}C=null,N=null,x.reset(),t.setRenderTarget(f),p=null,d=null,u=null,s=null,y=null,Vt.stop(),n.isPresenting=!1,t.setPixelRatio(T),t.setSize(L.width,L.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){r=Q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){a=Q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Q){c=Q},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Q){if(s=Q,s!==null){if(f=t.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",O),s.addEventListener("inputsourceschange",G),m.xrCompatible!==!0&&await e.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(L),s.enabledFeatures!==void 0&&s.enabledFeatures.includes("layers")){let vt=null,mt=null,Ut=null;m.depth&&(Ut=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,vt=m.stencil?ls:es,mt=m.stencil?as:yi);const Nt={colorFormat:e.RGBA8,depthFormat:Ut,scaleFactor:r};u=new XRWebGLBinding(s,e),d=u.createProjectionLayer(Nt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),y=new gn(d.textureWidth,d.textureHeight,{format:yn,type:$n,depthTexture:new Uc(d.textureWidth,d.textureHeight,mt,void 0,void 0,void 0,void 0,void 0,void 0,vt),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}else{const vt={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,vt),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),y=new gn(p.framebufferWidth,p.framebufferHeight,{format:yn,type:$n,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Vt.setContext(s),Vt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function G(Q){for(let pt=0;pt<Q.removed.length;pt++){const vt=Q.removed[pt],mt=_.indexOf(vt);mt>=0&&(_[mt]=null,M[mt].disconnect(vt))}for(let pt=0;pt<Q.added.length;pt++){const vt=Q.added[pt];let mt=_.indexOf(vt);if(mt===-1){for(let Nt=0;Nt<M.length;Nt++)if(Nt>=_.length){_.push(vt),mt=Nt;break}else if(_[Nt]===null){_[Nt]=vt,mt=Nt;break}if(mt===-1)break}const Ut=M[mt];Ut&&Ut.connect(vt)}}const W=new A,q=new A;function V(Q,pt,vt){W.setFromMatrixPosition(pt.matrixWorld),q.setFromMatrixPosition(vt.matrixWorld);const mt=W.distanceTo(q),Ut=pt.projectionMatrix.elements,Nt=vt.projectionMatrix.elements,kt=Ut[14]/(Ut[10]-1),Bt=Ut[14]/(Ut[10]+1),$=(Ut[9]+1)/Ut[5],ot=(Ut[9]-1)/Ut[5],R=(Ut[8]-1)/Ut[0],Mt=(Nt[8]+1)/Nt[0],et=kt*R,ht=kt*Mt,st=mt/(-R+Mt),Ft=st*-R;if(pt.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(Ft),Q.translateZ(st),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),Ut[10]===-1)Q.projectionMatrix.copy(pt.projectionMatrix),Q.projectionMatrixInverse.copy(pt.projectionMatrixInverse);else{const ut=kt+st,P=Bt+st,w=et-Ft,H=ht+(mt-Ft),J=$*Bt/P*ut,rt=ot*Bt/P*ut;Q.projectionMatrix.makePerspective(w,H,J,rt,ut,P),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function ct(Q,pt){pt===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(pt.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(s===null)return;let pt=Q.near,vt=Q.far;x.texture!==null&&(x.depthNear>0&&(pt=x.depthNear),x.depthFar>0&&(vt=x.depthFar)),v.near=I.near=D.near=pt,v.far=I.far=D.far=vt,(C!==v.near||N!==v.far)&&(s.updateRenderState({depthNear:v.near,depthFar:v.far}),C=v.near,N=v.far),D.layers.mask=Q.layers.mask|2,I.layers.mask=Q.layers.mask|4,v.layers.mask=D.layers.mask|I.layers.mask;const mt=Q.parent,Ut=v.cameras;ct(v,mt);for(let Nt=0;Nt<Ut.length;Nt++)ct(Ut[Nt],mt);Ut.length===2?V(v,D,I):v.projectionMatrix.copy(D.projectionMatrix),dt(Q,v,mt)};function dt(Q,pt,vt){vt===null?Q.matrix.copy(pt.matrixWorld):(Q.matrix.copy(vt.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(pt.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(pt.projectionMatrix),Q.projectionMatrixInverse.copy(pt.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=Os*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(Q){l=Q,d!==null&&(d.fixedFoveation=Q),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=Q)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(v)};let _t=null;function Wt(Q,pt){if(h=pt.getViewerPose(c||o),g=pt,h!==null){const vt=h.views;p!==null&&(t.setRenderTargetFramebuffer(y,p.framebuffer),t.setRenderTarget(y));let mt=!1;vt.length!==v.cameras.length&&(v.cameras.length=0,mt=!0);for(let Nt=0;Nt<vt.length;Nt++){const kt=vt[Nt];let Bt=null;if(p!==null)Bt=p.getViewport(kt);else{const ot=u.getViewSubImage(d,kt);Bt=ot.viewport,Nt===0&&(t.setRenderTargetTextures(y,ot.colorTexture,d.ignoreDepthValues?void 0:ot.depthStencilTexture),t.setRenderTarget(y))}let $=S[Nt];$===void 0&&($=new hn,$.layers.enable(Nt),$.viewport=new ge,S[Nt]=$),$.matrix.fromArray(kt.transform.matrix),$.matrix.decompose($.position,$.quaternion,$.scale),$.projectionMatrix.fromArray(kt.projectionMatrix),$.projectionMatrixInverse.copy($.projectionMatrix).invert(),$.viewport.set(Bt.x,Bt.y,Bt.width,Bt.height),Nt===0&&(v.matrix.copy($.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),mt===!0&&v.cameras.push($)}const Ut=s.enabledFeatures;if(Ut&&Ut.includes("depth-sensing")){const Nt=u.getDepthInformation(vt[0]);Nt&&Nt.isValid&&Nt.texture&&x.init(t,Nt,s.renderState)}}for(let vt=0;vt<M.length;vt++){const mt=_[vt],Ut=M[vt];mt!==null&&Ut!==void 0&&Ut.update(mt,pt,c||o)}_t&&_t(Q,pt),pt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pt}),g=null}const Vt=new Wc;Vt.setAnimationLoop(Wt),this.setAnimationLoop=function(Q){_t=Q},this.dispose=function(){}}}const gi=new Pn,K0=new _e;function J0(i,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,Rc(i)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function s(m,f,y,M,_){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(m,f):f.isMeshToonMaterial?(r(m,f),u(m,f)):f.isMeshPhongMaterial?(r(m,f),h(m,f)):f.isMeshStandardMaterial?(r(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,_)):f.isMeshMatcapMaterial?(r(m,f),g(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),x(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(o(m,f),f.isLineDashedMaterial&&a(m,f)):f.isPointsMaterial?l(m,f,y,M):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Je&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Je&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const y=t.get(f),M=y.envMap,_=y.envMapRotation;M&&(m.envMap.value=M,gi.copy(_),gi.x*=-1,gi.y*=-1,gi.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(gi.y*=-1,gi.z*=-1),m.envMapRotation.value.setFromMatrix4(K0.makeRotationFromEuler(gi)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function o(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function a(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,y,M){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*y,m.scale.value=M*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function h(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,y){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Je&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function x(m,f){const y=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Q0(i,t,e,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,M){const _=M.program;n.uniformBlockBinding(y,_)}function c(y,M){let _=s[y.id];_===void 0&&(g(y),_=h(y),s[y.id]=_,y.addEventListener("dispose",m));const L=M.program;n.updateUBOMapping(y,L);const T=t.render.frame;r[y.id]!==T&&(d(y),r[y.id]=T)}function h(y){const M=u();y.__bindingPointIndex=M;const _=i.createBuffer(),L=y.__size,T=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,_),i.bufferData(i.UNIFORM_BUFFER,L,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,_),_}function u(){for(let y=0;y<a;y++)if(o.indexOf(y)===-1)return o.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(y){const M=s[y.id],_=y.uniforms,L=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let T=0,D=_.length;T<D;T++){const I=Array.isArray(_[T])?_[T]:[_[T]];for(let S=0,v=I.length;S<v;S++){const C=I[S];if(p(C,T,S,L)===!0){const N=C.__offset,F=Array.isArray(C.value)?C.value:[C.value];let O=0;for(let G=0;G<F.length;G++){const W=F[G],q=x(W);typeof W=="number"||typeof W=="boolean"?(C.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,N+O,C.__data)):W.isMatrix3?(C.__data[0]=W.elements[0],C.__data[1]=W.elements[1],C.__data[2]=W.elements[2],C.__data[3]=0,C.__data[4]=W.elements[3],C.__data[5]=W.elements[4],C.__data[6]=W.elements[5],C.__data[7]=0,C.__data[8]=W.elements[6],C.__data[9]=W.elements[7],C.__data[10]=W.elements[8],C.__data[11]=0):(W.toArray(C.__data,O),O+=q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,N,C.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(y,M,_,L){const T=y.value,D=M+"_"+_;if(L[D]===void 0)return typeof T=="number"||typeof T=="boolean"?L[D]=T:L[D]=T.clone(),!0;{const I=L[D];if(typeof T=="number"||typeof T=="boolean"){if(I!==T)return L[D]=T,!0}else if(I.equals(T)===!1)return I.copy(T),!0}return!1}function g(y){const M=y.uniforms;let _=0;const L=16;for(let D=0,I=M.length;D<I;D++){const S=Array.isArray(M[D])?M[D]:[M[D]];for(let v=0,C=S.length;v<C;v++){const N=S[v],F=Array.isArray(N.value)?N.value:[N.value];for(let O=0,G=F.length;O<G;O++){const W=F[O],q=x(W),V=_%L,ct=V%q.boundary,dt=V+ct;_+=ct,dt!==0&&L-dt<q.storage&&(_+=L-dt),N.__data=new Float32Array(q.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=_,_+=q.storage}}}const T=_%L;return T>0&&(_+=L-T),y.__size=_,y.__cache={},this}function x(y){const M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=48,M.storage=48):y.isMatrix4?(M.boundary=64,M.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),M}function m(y){const M=y.target;M.removeEventListener("dispose",m);const _=o.indexOf(M.__bindingPointIndex);o.splice(_,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function f(){for(const y in s)i.deleteBuffer(s[y]);o=[],s={},r={}}return{bind:l,update:c,dispose:f}}class tg{constructor(t={}){const{canvas:e=eu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=o;const g=new Uint32Array(4),x=new Int32Array(4);let m=null,f=null;const y=[],M=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ie,this.toneMapping=ai,this.toneMappingExposure=1;const _=this;let L=!1,T=0,D=0,I=null,S=-1,v=null;const C=new ge,N=new ge;let F=null;const O=new gt(0);let G=0,W=e.width,q=e.height,V=1,ct=null,dt=null;const _t=new ge(0,0,W,q),Wt=new ge(0,0,W,q);let Vt=!1;const Q=new wa;let pt=!1,vt=!1;this.transmissionResolutionScale=1;const mt=new _e,Ut=new _e,Nt=new A,kt=new ge,Bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let $=!1;function ot(){return I===null?V:1}let R=n;function Mt(E,z){return e.getContext(E,z)}try{const E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ua}`),e.addEventListener("webglcontextlost",at,!1),e.addEventListener("webglcontextrestored",At,!1),e.addEventListener("webglcontextcreationerror",bt,!1),R===null){const z="webgl2";if(R=Mt(z,E),R===null)throw Mt(z)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let et,ht,st,Ft,ut,P,w,H,J,rt,tt,Lt,K,nt,Dt,it,wt,Ht,It,Ct,Kt,qt,he,B;function St(){et=new cm(R),et.init(),qt=new X0(R,et),ht=new im(R,et,t,qt),st=new V0(R,et),ht.reverseDepthBuffer&&d&&st.buffers.depth.setReversed(!0),Ft=new dm(R),ut=new P0,P=new W0(R,et,st,ut,ht,qt,Ft),w=new rm(_),H=new lm(_),J=new vd(R),he=new em(R,J),rt=new hm(R,J,Ft,he),tt=new pm(R,rt,J,Ft),It=new fm(R,ht,P),it=new sm(ut),Lt=new R0(_,w,H,et,ht,he,it),K=new J0(_,ut),nt=new D0,Dt=new B0(et),Ht=new tm(_,w,H,st,tt,p,l),wt=new k0(_,tt,ht),B=new Q0(R,Ft,ht,st),Ct=new nm(R,et,Ft),Kt=new um(R,et,Ft),Ft.programs=Lt.programs,_.capabilities=ht,_.extensions=et,_.properties=ut,_.renderLists=nt,_.shadowMap=wt,_.state=st,_.info=Ft}St();const j=new j0(_,R);this.xr=j,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){const E=et.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=et.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(E){E!==void 0&&(V=E,this.setSize(W,q,!1))},this.getSize=function(E){return E.set(W,q)},this.setSize=function(E,z,X=!0){if(j.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=E,q=z,e.width=Math.floor(E*V),e.height=Math.floor(z*V),X===!0&&(e.style.width=E+"px",e.style.height=z+"px"),this.setViewport(0,0,E,z)},this.getDrawingBufferSize=function(E){return E.set(W*V,q*V).floor()},this.setDrawingBufferSize=function(E,z,X){W=E,q=z,V=X,e.width=Math.floor(E*X),e.height=Math.floor(z*X),this.setViewport(0,0,E,z)},this.getCurrentViewport=function(E){return E.copy(C)},this.getViewport=function(E){return E.copy(_t)},this.setViewport=function(E,z,X,Z){E.isVector4?_t.set(E.x,E.y,E.z,E.w):_t.set(E,z,X,Z),st.viewport(C.copy(_t).multiplyScalar(V).round())},this.getScissor=function(E){return E.copy(Wt)},this.setScissor=function(E,z,X,Z){E.isVector4?Wt.set(E.x,E.y,E.z,E.w):Wt.set(E,z,X,Z),st.scissor(N.copy(Wt).multiplyScalar(V).round())},this.getScissorTest=function(){return Vt},this.setScissorTest=function(E){st.setScissorTest(Vt=E)},this.setOpaqueSort=function(E){ct=E},this.setTransparentSort=function(E){dt=E},this.getClearColor=function(E){return E.copy(Ht.getClearColor())},this.setClearColor=function(){Ht.setClearColor.apply(Ht,arguments)},this.getClearAlpha=function(){return Ht.getClearAlpha()},this.setClearAlpha=function(){Ht.setClearAlpha.apply(Ht,arguments)},this.clear=function(E=!0,z=!0,X=!0){let Z=0;if(E){let k=!1;if(I!==null){const ft=I.texture.format;k=ft===xa||ft===va||ft===_a}if(k){const ft=I.texture.type,Et=ft===$n||ft===yi||ft===Fs||ft===as||ft===pa||ft===ma,Pt=Ht.getClearColor(),yt=Ht.getClearAlpha(),Zt=Pt.r,jt=Pt.g,Xt=Pt.b;Et?(g[0]=Zt,g[1]=jt,g[2]=Xt,g[3]=yt,R.clearBufferuiv(R.COLOR,0,g)):(x[0]=Zt,x[1]=jt,x[2]=Xt,x[3]=yt,R.clearBufferiv(R.COLOR,0,x))}else Z|=R.COLOR_BUFFER_BIT}z&&(Z|=R.DEPTH_BUFFER_BIT),X&&(Z|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),R.clear(Z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",at,!1),e.removeEventListener("webglcontextrestored",At,!1),e.removeEventListener("webglcontextcreationerror",bt,!1),Ht.dispose(),nt.dispose(),Dt.dispose(),ut.dispose(),w.dispose(),H.dispose(),tt.dispose(),he.dispose(),B.dispose(),Lt.dispose(),j.dispose(),j.removeEventListener("sessionstart",Kn),j.removeEventListener("sessionend",Dn),an.stop()};function at(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),L=!0}function At(){console.log("THREE.WebGLRenderer: Context Restored."),L=!1;const E=Ft.autoReset,z=wt.enabled,X=wt.autoUpdate,Z=wt.needsUpdate,k=wt.type;St(),Ft.autoReset=E,wt.enabled=z,wt.autoUpdate=X,wt.needsUpdate=Z,wt.type=k}function bt(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function $t(E){const z=E.target;z.removeEventListener("dispose",$t),ve(z)}function ve(E){Pe(E),ut.remove(E)}function Pe(E){const z=ut.get(E).programs;z!==void 0&&(z.forEach(function(X){Lt.releaseProgram(X)}),E.isShaderMaterial&&Lt.releaseShaderCache(E))}this.renderBufferDirect=function(E,z,X,Z,k,ft){z===null&&(z=Bt);const Et=k.isMesh&&k.matrixWorld.determinant()<0,Pt=dn(E,z,X,Z,k);st.setMaterial(Z,Et);let yt=X.index,Zt=1;if(Z.wireframe===!0){if(yt=rt.getWireframeAttribute(X),yt===void 0)return;Zt=2}const jt=X.drawRange,Xt=X.attributes.position;let re=jt.start*Zt,le=(jt.start+jt.count)*Zt;ft!==null&&(re=Math.max(re,ft.start*Zt),le=Math.min(le,(ft.start+ft.count)*Zt)),yt!==null?(re=Math.max(re,0),le=Math.min(le,yt.count)):Xt!=null&&(re=Math.max(re,0),le=Math.min(le,Xt.count));const be=le-re;if(be<0||be===1/0)return;he.setup(k,Z,Pt,X,yt);let ye,oe=Ct;if(yt!==null&&(ye=J.get(yt),oe=Kt,oe.setIndex(ye)),k.isMesh)Z.wireframe===!0?(st.setLineWidth(Z.wireframeLinewidth*ot()),oe.setMode(R.LINES)):oe.setMode(R.TRIANGLES);else if(k.isLine){let Yt=Z.linewidth;Yt===void 0&&(Yt=1),st.setLineWidth(Yt*ot()),k.isLineSegments?oe.setMode(R.LINES):k.isLineLoop?oe.setMode(R.LINE_LOOP):oe.setMode(R.LINE_STRIP)}else k.isPoints?oe.setMode(R.POINTS):k.isSprite&&oe.setMode(R.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)oe.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(et.get("WEBGL_multi_draw"))oe.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{const Yt=k._multiDrawStarts,Oe=k._multiDrawCounts,ue=k._multiDrawCount,sn=yt?J.get(yt).bytesPerElement:1,Nn=ut.get(Z).currentProgram.getUniforms();for(let Ze=0;Ze<ue;Ze++)Nn.setValue(R,"_gl_DrawID",Ze),oe.render(Yt[Ze]/sn,Oe[Ze])}else if(k.isInstancedMesh)oe.renderInstances(re,be,k.count);else if(X.isInstancedBufferGeometry){const Yt=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,Oe=Math.min(X.instanceCount,Yt);oe.renderInstances(re,be,Oe)}else oe.render(re,be)};function ae(E,z,X){E.transparent===!0&&E.side===on&&E.forceSinglePass===!1?(E.side=Je,E.needsUpdate=!0,Se(E,z,X),E.side=Zn,E.needsUpdate=!0,Se(E,z,X),E.side=on):Se(E,z,X)}this.compile=function(E,z,X=null){X===null&&(X=E),f=Dt.get(X),f.init(z),M.push(f),X.traverseVisible(function(k){k.isLight&&k.layers.test(z.layers)&&(f.pushLight(k),k.castShadow&&f.pushShadow(k))}),E!==X&&E.traverseVisible(function(k){k.isLight&&k.layers.test(z.layers)&&(f.pushLight(k),k.castShadow&&f.pushShadow(k))}),f.setupLights();const Z=new Set;return E.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;const ft=k.material;if(ft)if(Array.isArray(ft))for(let Et=0;Et<ft.length;Et++){const Pt=ft[Et];ae(Pt,X,k),Z.add(Pt)}else ae(ft,X,k),Z.add(ft)}),M.pop(),f=null,Z},this.compileAsync=function(E,z,X=null){const Z=this.compile(E,z,X);return new Promise(k=>{function ft(){if(Z.forEach(function(Et){ut.get(Et).currentProgram.isReady()&&Z.delete(Et)}),Z.size===0){k(E);return}setTimeout(ft,10)}et.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let He=null;function Fe(E){He&&He(E)}function Kn(){an.stop()}function Dn(){an.start()}const an=new Wc;an.setAnimationLoop(Fe),typeof self<"u"&&an.setContext(self),this.setAnimationLoop=function(E){He=E,j.setAnimationLoop(E),E===null?an.stop():an.start()},j.addEventListener("sessionstart",Kn),j.addEventListener("sessionend",Dn),this.render=function(E,z){if(z!==void 0&&z.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),j.enabled===!0&&j.isPresenting===!0&&(j.cameraAutoUpdate===!0&&j.updateCamera(z),z=j.getCamera()),E.isScene===!0&&E.onBeforeRender(_,E,z,I),f=Dt.get(E,M.length),f.init(z),M.push(f),Ut.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),Q.setFromProjectionMatrix(Ut),vt=this.localClippingEnabled,pt=it.init(this.clippingPlanes,vt),m=nt.get(E,y.length),m.init(),y.push(m),j.enabled===!0&&j.isPresenting===!0){const ft=_.xr.getDepthSensingMesh();ft!==null&&In(ft,z,-1/0,_.sortObjects)}In(E,z,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(ct,dt),$=j.enabled===!1||j.isPresenting===!1||j.hasDepthSensing()===!1,$&&Ht.addToRenderList(m,E),this.info.render.frame++,pt===!0&&it.beginShadows();const X=f.state.shadowsArray;wt.render(X,E,z),pt===!0&&it.endShadows(),this.info.autoReset===!0&&this.info.reset();const Z=m.opaque,k=m.transmissive;if(f.setupLights(),z.isArrayCamera){const ft=z.cameras;if(k.length>0)for(let Et=0,Pt=ft.length;Et<Pt;Et++){const yt=ft[Et];Rt(Z,k,E,yt)}$&&Ht.render(E);for(let Et=0,Pt=ft.length;Et<Pt;Et++){const yt=ft[Et];Un(m,E,yt,yt.viewport)}}else k.length>0&&Rt(Z,k,E,z),$&&Ht.render(E),Un(m,E,z);I!==null&&D===0&&(P.updateMultisampleRenderTarget(I),P.updateRenderTargetMipmap(I)),E.isScene===!0&&E.onAfterRender(_,E,z),he.resetDefaultState(),S=-1,v=null,M.pop(),M.length>0?(f=M[M.length-1],pt===!0&&it.setGlobalState(_.clippingPlanes,f.state.camera)):f=null,y.pop(),y.length>0?m=y[y.length-1]:m=null};function In(E,z,X,Z){if(E.visible===!1)return;if(E.layers.test(z.layers)){if(E.isGroup)X=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(z);else if(E.isLight)f.pushLight(E),E.castShadow&&f.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||Q.intersectsSprite(E)){Z&&kt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Ut);const Et=tt.update(E),Pt=E.material;Pt.visible&&m.push(E,Et,Pt,X,kt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||Q.intersectsObject(E))){const Et=tt.update(E),Pt=E.material;if(Z&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),kt.copy(E.boundingSphere.center)):(Et.boundingSphere===null&&Et.computeBoundingSphere(),kt.copy(Et.boundingSphere.center)),kt.applyMatrix4(E.matrixWorld).applyMatrix4(Ut)),Array.isArray(Pt)){const yt=Et.groups;for(let Zt=0,jt=yt.length;Zt<jt;Zt++){const Xt=yt[Zt],re=Pt[Xt.materialIndex];re&&re.visible&&m.push(E,Et,re,X,kt.z,Xt)}}else Pt.visible&&m.push(E,Et,Pt,X,kt.z,null)}}const ft=E.children;for(let Et=0,Pt=ft.length;Et<Pt;Et++)In(ft[Et],z,X,Z)}function Un(E,z,X,Z){const k=E.opaque,ft=E.transmissive,Et=E.transparent;f.setupLightsView(X),pt===!0&&it.setGlobalState(_.clippingPlanes,X),Z&&st.viewport(C.copy(Z)),k.length>0&&Gt(k,z,X),ft.length>0&&Gt(ft,z,X),Et.length>0&&Gt(Et,z,X),st.buffers.depth.setTest(!0),st.buffers.depth.setMask(!0),st.buffers.color.setMask(!0),st.setPolygonOffset(!1)}function Rt(E,z,X,Z){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[Z.id]===void 0&&(f.state.transmissionRenderTarget[Z.id]=new gn(1,1,{generateMipmaps:!0,type:et.has("EXT_color_buffer_half_float")||et.has("EXT_color_buffer_float")?An:$n,minFilter:wi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ce.workingColorSpace}));const ft=f.state.transmissionRenderTarget[Z.id],Et=Z.viewport||C;ft.setSize(Et.z*_.transmissionResolutionScale,Et.w*_.transmissionResolutionScale);const Pt=_.getRenderTarget();_.setRenderTarget(ft),_.getClearColor(O),G=_.getClearAlpha(),G<1&&_.setClearColor(16777215,.5),_.clear(),$&&Ht.render(X);const yt=_.toneMapping;_.toneMapping=ai;const Zt=Z.viewport;if(Z.viewport!==void 0&&(Z.viewport=void 0),f.setupLightsView(Z),pt===!0&&it.setGlobalState(_.clippingPlanes,Z),Gt(E,X,Z),P.updateMultisampleRenderTarget(ft),P.updateRenderTargetMipmap(ft),et.has("WEBGL_multisampled_render_to_texture")===!1){let jt=!1;for(let Xt=0,re=z.length;Xt<re;Xt++){const le=z[Xt],be=le.object,ye=le.geometry,oe=le.material,Yt=le.group;if(oe.side===on&&be.layers.test(Z.layers)){const Oe=oe.side;oe.side=Je,oe.needsUpdate=!0,ie(be,X,Z,ye,oe,Yt),oe.side=Oe,oe.needsUpdate=!0,jt=!0}}jt===!0&&(P.updateMultisampleRenderTarget(ft),P.updateRenderTargetMipmap(ft))}_.setRenderTarget(Pt),_.setClearColor(O,G),Zt!==void 0&&(Z.viewport=Zt),_.toneMapping=yt}function Gt(E,z,X){const Z=z.isScene===!0?z.overrideMaterial:null;for(let k=0,ft=E.length;k<ft;k++){const Et=E[k],Pt=Et.object,yt=Et.geometry,Zt=Z===null?Et.material:Z,jt=Et.group;Pt.layers.test(X.layers)&&ie(Pt,z,X,yt,Zt,jt)}}function ie(E,z,X,Z,k,ft){E.onBeforeRender(_,z,X,Z,k,ft),E.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),k.onBeforeRender(_,z,X,Z,E,ft),k.transparent===!0&&k.side===on&&k.forceSinglePass===!1?(k.side=Je,k.needsUpdate=!0,_.renderBufferDirect(X,z,Z,k,E,ft),k.side=Zn,k.needsUpdate=!0,_.renderBufferDirect(X,z,Z,k,E,ft),k.side=on):_.renderBufferDirect(X,z,Z,k,E,ft),E.onAfterRender(_,z,X,Z,k,ft)}function Se(E,z,X){z.isScene!==!0&&(z=Bt);const Z=ut.get(E),k=f.state.lights,ft=f.state.shadowsArray,Et=k.state.version,Pt=Lt.getParameters(E,k.state,ft,z,X),yt=Lt.getProgramCacheKey(Pt);let Zt=Z.programs;Z.environment=E.isMeshStandardMaterial?z.environment:null,Z.fog=z.fog,Z.envMap=(E.isMeshStandardMaterial?H:w).get(E.envMap||Z.environment),Z.envMapRotation=Z.environment!==null&&E.envMap===null?z.environmentRotation:E.envMapRotation,Zt===void 0&&(E.addEventListener("dispose",$t),Zt=new Map,Z.programs=Zt);let jt=Zt.get(yt);if(jt!==void 0){if(Z.currentProgram===jt&&Z.lightsStateVersion===Et)return hi(E,Pt),jt}else Pt.uniforms=Lt.getUniforms(E),E.onBeforeCompile(Pt,_),jt=Lt.acquireProgram(Pt,yt),Zt.set(yt,jt),Z.uniforms=Pt.uniforms;const Xt=Z.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Xt.clippingPlanes=it.uniform),hi(E,Pt),Z.needsLights=gs(E),Z.lightsStateVersion=Et,Z.needsLights&&(Xt.ambientLightColor.value=k.state.ambient,Xt.lightProbe.value=k.state.probe,Xt.directionalLights.value=k.state.directional,Xt.directionalLightShadows.value=k.state.directionalShadow,Xt.spotLights.value=k.state.spot,Xt.spotLightShadows.value=k.state.spotShadow,Xt.rectAreaLights.value=k.state.rectArea,Xt.ltc_1.value=k.state.rectAreaLTC1,Xt.ltc_2.value=k.state.rectAreaLTC2,Xt.pointLights.value=k.state.point,Xt.pointLightShadows.value=k.state.pointShadow,Xt.hemisphereLights.value=k.state.hemi,Xt.directionalShadowMap.value=k.state.directionalShadowMap,Xt.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Xt.spotShadowMap.value=k.state.spotShadowMap,Xt.spotLightMatrix.value=k.state.spotLightMatrix,Xt.spotLightMap.value=k.state.spotLightMap,Xt.pointShadowMap.value=k.state.pointShadowMap,Xt.pointShadowMatrix.value=k.state.pointShadowMatrix),Z.currentProgram=jt,Z.uniformsList=null,jt}function Me(E){if(E.uniformsList===null){const z=E.currentProgram.getUniforms();E.uniformsList=Sr.seqWithValue(z.seq,E.uniforms)}return E.uniformsList}function hi(E,z){const X=ut.get(E);X.outputColorSpace=z.outputColorSpace,X.batching=z.batching,X.batchingColor=z.batchingColor,X.instancing=z.instancing,X.instancingColor=z.instancingColor,X.instancingMorph=z.instancingMorph,X.skinning=z.skinning,X.morphTargets=z.morphTargets,X.morphNormals=z.morphNormals,X.morphColors=z.morphColors,X.morphTargetsCount=z.morphTargetsCount,X.numClippingPlanes=z.numClippingPlanes,X.numIntersection=z.numClipIntersection,X.vertexAlphas=z.vertexAlphas,X.vertexTangents=z.vertexTangents,X.toneMapping=z.toneMapping}function dn(E,z,X,Z,k){z.isScene!==!0&&(z=Bt),P.resetTextureUnits();const ft=z.fog,Et=Z.isMeshStandardMaterial?z.environment:null,Pt=I===null?_.outputColorSpace:I.isXRRenderTarget===!0?I.texture.colorSpace:cs,yt=(Z.isMeshStandardMaterial?H:w).get(Z.envMap||Et),Zt=Z.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,jt=!!X.attributes.tangent&&(!!Z.normalMap||Z.anisotropy>0),Xt=!!X.morphAttributes.position,re=!!X.morphAttributes.normal,le=!!X.morphAttributes.color;let be=ai;Z.toneMapped&&(I===null||I.isXRRenderTarget===!0)&&(be=_.toneMapping);const ye=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,oe=ye!==void 0?ye.length:0,Yt=ut.get(Z),Oe=f.state.lights;if(pt===!0&&(vt===!0||E!==v)){const De=E===v&&Z.id===S;it.setState(Z,E,De)}let ue=!1;Z.version===Yt.__version?(Yt.needsLights&&Yt.lightsStateVersion!==Oe.state.version||Yt.outputColorSpace!==Pt||k.isBatchedMesh&&Yt.batching===!1||!k.isBatchedMesh&&Yt.batching===!0||k.isBatchedMesh&&Yt.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&Yt.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&Yt.instancing===!1||!k.isInstancedMesh&&Yt.instancing===!0||k.isSkinnedMesh&&Yt.skinning===!1||!k.isSkinnedMesh&&Yt.skinning===!0||k.isInstancedMesh&&Yt.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Yt.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Yt.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Yt.instancingMorph===!1&&k.morphTexture!==null||Yt.envMap!==yt||Z.fog===!0&&Yt.fog!==ft||Yt.numClippingPlanes!==void 0&&(Yt.numClippingPlanes!==it.numPlanes||Yt.numIntersection!==it.numIntersection)||Yt.vertexAlphas!==Zt||Yt.vertexTangents!==jt||Yt.morphTargets!==Xt||Yt.morphNormals!==re||Yt.morphColors!==le||Yt.toneMapping!==be||Yt.morphTargetsCount!==oe)&&(ue=!0):(ue=!0,Yt.__version=Z.version);let sn=Yt.currentProgram;ue===!0&&(sn=Se(Z,z,k));let Nn=!1,Ze=!1,Jn=!1;const we=sn.getUniforms(),$e=Yt.uniforms;if(st.useProgram(sn.program)&&(Nn=!0,Ze=!0,Jn=!0),Z.id!==S&&(S=Z.id,Ze=!0),Nn||v!==E){st.buffers.depth.getReversed()?(mt.copy(E.projectionMatrix),iu(mt),su(mt),we.setValue(R,"projectionMatrix",mt)):we.setValue(R,"projectionMatrix",E.projectionMatrix),we.setValue(R,"viewMatrix",E.matrixWorldInverse);const Ve=we.map.cameraPosition;Ve!==void 0&&Ve.setValue(R,Nt.setFromMatrixPosition(E.matrixWorld)),ht.logarithmicDepthBuffer&&we.setValue(R,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(Z.isMeshPhongMaterial||Z.isMeshToonMaterial||Z.isMeshLambertMaterial||Z.isMeshBasicMaterial||Z.isMeshStandardMaterial||Z.isShaderMaterial)&&we.setValue(R,"isOrthographic",E.isOrthographicCamera===!0),v!==E&&(v=E,Ze=!0,Jn=!0)}if(k.isSkinnedMesh){we.setOptional(R,k,"bindMatrix"),we.setOptional(R,k,"bindMatrixInverse");const De=k.skeleton;De&&(De.boneTexture===null&&De.computeBoneTexture(),we.setValue(R,"boneTexture",De.boneTexture,P))}k.isBatchedMesh&&(we.setOptional(R,k,"batchingTexture"),we.setValue(R,"batchingTexture",k._matricesTexture,P),we.setOptional(R,k,"batchingIdTexture"),we.setValue(R,"batchingIdTexture",k._indirectTexture,P),we.setOptional(R,k,"batchingColorTexture"),k._colorsTexture!==null&&we.setValue(R,"batchingColorTexture",k._colorsTexture,P));const Ye=X.morphAttributes;if((Ye.position!==void 0||Ye.normal!==void 0||Ye.color!==void 0)&&It.update(k,X,sn),(Ze||Yt.receiveShadow!==k.receiveShadow)&&(Yt.receiveShadow=k.receiveShadow,we.setValue(R,"receiveShadow",k.receiveShadow)),Z.isMeshGouraudMaterial&&Z.envMap!==null&&($e.envMap.value=yt,$e.flipEnvMap.value=yt.isCubeTexture&&yt.isRenderTargetTexture===!1?-1:1),Z.isMeshStandardMaterial&&Z.envMap===null&&z.environment!==null&&($e.envMapIntensity.value=z.environmentIntensity),Ze&&(we.setValue(R,"toneMappingExposure",_.toneMappingExposure),Yt.needsLights&&fn($e,Jn),ft&&Z.fog===!0&&K.refreshFogUniforms($e,ft),K.refreshMaterialUniforms($e,Z,V,q,f.state.transmissionRenderTarget[E.id]),Sr.upload(R,Me(Yt),$e,P)),Z.isShaderMaterial&&Z.uniformsNeedUpdate===!0&&(Sr.upload(R,Me(Yt),$e,P),Z.uniformsNeedUpdate=!1),Z.isSpriteMaterial&&we.setValue(R,"center",k.center),we.setValue(R,"modelViewMatrix",k.modelViewMatrix),we.setValue(R,"normalMatrix",k.normalMatrix),we.setValue(R,"modelMatrix",k.matrixWorld),Z.isShaderMaterial||Z.isRawShaderMaterial){const De=Z.uniformsGroups;for(let Ve=0,Ri=De.length;Ve<Ri;Ve++){const Fn=De[Ve];B.update(Fn,sn),B.bind(Fn,sn)}}return sn}function fn(E,z){E.ambientLightColor.needsUpdate=z,E.lightProbe.needsUpdate=z,E.directionalLights.needsUpdate=z,E.directionalLightShadows.needsUpdate=z,E.pointLights.needsUpdate=z,E.pointLightShadows.needsUpdate=z,E.spotLights.needsUpdate=z,E.spotLightShadows.needsUpdate=z,E.rectAreaLights.needsUpdate=z,E.hemisphereLights.needsUpdate=z}function gs(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return D},this.getRenderTarget=function(){return I},this.setRenderTargetTextures=function(E,z,X){ut.get(E.texture).__webglTexture=z,ut.get(E.depthTexture).__webglTexture=X;const Z=ut.get(E);Z.__hasExternalTextures=!0,Z.__autoAllocateDepthBuffer=X===void 0,Z.__autoAllocateDepthBuffer||et.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),Z.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,z){const X=ut.get(E);X.__webglFramebuffer=z,X.__useDefaultFramebuffer=z===void 0};const Ci=R.createFramebuffer();this.setRenderTarget=function(E,z=0,X=0){I=E,T=z,D=X;let Z=!0,k=null,ft=!1,Et=!1;if(E){const yt=ut.get(E);if(yt.__useDefaultFramebuffer!==void 0)st.bindFramebuffer(R.FRAMEBUFFER,null),Z=!1;else if(yt.__webglFramebuffer===void 0)P.setupRenderTarget(E);else if(yt.__hasExternalTextures)P.rebindTextures(E,ut.get(E.texture).__webglTexture,ut.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const Xt=E.depthTexture;if(yt.__boundDepthTexture!==Xt){if(Xt!==null&&ut.has(Xt)&&(E.width!==Xt.image.width||E.height!==Xt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");P.setupDepthRenderbuffer(E)}}const Zt=E.texture;(Zt.isData3DTexture||Zt.isDataArrayTexture||Zt.isCompressedArrayTexture)&&(Et=!0);const jt=ut.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(jt[z])?k=jt[z][X]:k=jt[z],ft=!0):E.samples>0&&P.useMultisampledRTT(E)===!1?k=ut.get(E).__webglMultisampledFramebuffer:Array.isArray(jt)?k=jt[X]:k=jt,C.copy(E.viewport),N.copy(E.scissor),F=E.scissorTest}else C.copy(_t).multiplyScalar(V).floor(),N.copy(Wt).multiplyScalar(V).floor(),F=Vt;if(X!==0&&(k=Ci),st.bindFramebuffer(R.FRAMEBUFFER,k)&&Z&&st.drawBuffers(E,k),st.viewport(C),st.scissor(N),st.setScissorTest(F),ft){const yt=ut.get(E.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+z,yt.__webglTexture,X)}else if(Et){const yt=ut.get(E.texture),Zt=z;R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,yt.__webglTexture,X,Zt)}else if(E!==null&&X!==0){const yt=ut.get(E.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,yt.__webglTexture,X)}S=-1},this.readRenderTargetPixels=function(E,z,X,Z,k,ft,Et){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pt=ut.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Et!==void 0&&(Pt=Pt[Et]),Pt){st.bindFramebuffer(R.FRAMEBUFFER,Pt);try{const yt=E.texture,Zt=yt.format,jt=yt.type;if(!ht.textureFormatReadable(Zt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!ht.textureTypeReadable(jt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=E.width-Z&&X>=0&&X<=E.height-k&&R.readPixels(z,X,Z,k,qt.convert(Zt),qt.convert(jt),ft)}finally{const yt=I!==null?ut.get(I).__webglFramebuffer:null;st.bindFramebuffer(R.FRAMEBUFFER,yt)}}},this.readRenderTargetPixelsAsync=async function(E,z,X,Z,k,ft,Et){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Pt=ut.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Et!==void 0&&(Pt=Pt[Et]),Pt){const yt=E.texture,Zt=yt.format,jt=yt.type;if(!ht.textureFormatReadable(Zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ht.textureTypeReadable(jt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(z>=0&&z<=E.width-Z&&X>=0&&X<=E.height-k){st.bindFramebuffer(R.FRAMEBUFFER,Pt);const Xt=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,Xt),R.bufferData(R.PIXEL_PACK_BUFFER,ft.byteLength,R.STREAM_READ),R.readPixels(z,X,Z,k,qt.convert(Zt),qt.convert(jt),0);const re=I!==null?ut.get(I).__webglFramebuffer:null;st.bindFramebuffer(R.FRAMEBUFFER,re);const le=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await nu(R,le,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,Xt),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,ft),R.deleteBuffer(Xt),R.deleteSync(le),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,z=null,X=0){E.isTexture!==!0&&($i("WebGLRenderer: copyFramebufferToTexture function signature has changed."),z=arguments[0]||null,E=arguments[1]);const Z=Math.pow(2,-X),k=Math.floor(E.image.width*Z),ft=Math.floor(E.image.height*Z),Et=z!==null?z.x:0,Pt=z!==null?z.y:0;P.setTexture2D(E,0),R.copyTexSubImage2D(R.TEXTURE_2D,X,0,0,Et,Pt,k,ft),st.unbindTexture()};const _s=R.createFramebuffer(),Or=R.createFramebuffer();this.copyTextureToTexture=function(E,z,X=null,Z=null,k=0,ft=null){E.isTexture!==!0&&($i("WebGLRenderer: copyTextureToTexture function signature has changed."),Z=arguments[0]||null,E=arguments[1],z=arguments[2],ft=arguments[3]||0,X=null),ft===null&&(k!==0?($i("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),ft=k,k=0):ft=0);let Et,Pt,yt,Zt,jt,Xt,re,le,be;const ye=E.isCompressedTexture?E.mipmaps[ft]:E.image;if(X!==null)Et=X.max.x-X.min.x,Pt=X.max.y-X.min.y,yt=X.isBox3?X.max.z-X.min.z:1,Zt=X.min.x,jt=X.min.y,Xt=X.isBox3?X.min.z:0;else{const Ye=Math.pow(2,-k);Et=Math.floor(ye.width*Ye),Pt=Math.floor(ye.height*Ye),E.isDataArrayTexture?yt=ye.depth:E.isData3DTexture?yt=Math.floor(ye.depth*Ye):yt=1,Zt=0,jt=0,Xt=0}Z!==null?(re=Z.x,le=Z.y,be=Z.z):(re=0,le=0,be=0);const oe=qt.convert(z.format),Yt=qt.convert(z.type);let Oe;z.isData3DTexture?(P.setTexture3D(z,0),Oe=R.TEXTURE_3D):z.isDataArrayTexture||z.isCompressedArrayTexture?(P.setTexture2DArray(z,0),Oe=R.TEXTURE_2D_ARRAY):(P.setTexture2D(z,0),Oe=R.TEXTURE_2D),R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,z.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,z.unpackAlignment);const ue=R.getParameter(R.UNPACK_ROW_LENGTH),sn=R.getParameter(R.UNPACK_IMAGE_HEIGHT),Nn=R.getParameter(R.UNPACK_SKIP_PIXELS),Ze=R.getParameter(R.UNPACK_SKIP_ROWS),Jn=R.getParameter(R.UNPACK_SKIP_IMAGES);R.pixelStorei(R.UNPACK_ROW_LENGTH,ye.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,ye.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Zt),R.pixelStorei(R.UNPACK_SKIP_ROWS,jt),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Xt);const we=E.isDataArrayTexture||E.isData3DTexture,$e=z.isDataArrayTexture||z.isData3DTexture;if(E.isDepthTexture){const Ye=ut.get(E),De=ut.get(z),Ve=ut.get(Ye.__renderTarget),Ri=ut.get(De.__renderTarget);st.bindFramebuffer(R.READ_FRAMEBUFFER,Ve.__webglFramebuffer),st.bindFramebuffer(R.DRAW_FRAMEBUFFER,Ri.__webglFramebuffer);for(let Fn=0;Fn<yt;Fn++)we&&(R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,ut.get(E).__webglTexture,k,Xt+Fn),R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,ut.get(z).__webglTexture,ft,be+Fn)),R.blitFramebuffer(Zt,jt,Et,Pt,re,le,Et,Pt,R.DEPTH_BUFFER_BIT,R.NEAREST);st.bindFramebuffer(R.READ_FRAMEBUFFER,null),st.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else if(k!==0||E.isRenderTargetTexture||ut.has(E)){const Ye=ut.get(E),De=ut.get(z);st.bindFramebuffer(R.READ_FRAMEBUFFER,_s),st.bindFramebuffer(R.DRAW_FRAMEBUFFER,Or);for(let Ve=0;Ve<yt;Ve++)we?R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,Ye.__webglTexture,k,Xt+Ve):R.framebufferTexture2D(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,Ye.__webglTexture,k),$e?R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,De.__webglTexture,ft,be+Ve):R.framebufferTexture2D(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,De.__webglTexture,ft),k!==0?R.blitFramebuffer(Zt,jt,Et,Pt,re,le,Et,Pt,R.COLOR_BUFFER_BIT,R.NEAREST):$e?R.copyTexSubImage3D(Oe,ft,re,le,be+Ve,Zt,jt,Et,Pt):R.copyTexSubImage2D(Oe,ft,re,le,Zt,jt,Et,Pt);st.bindFramebuffer(R.READ_FRAMEBUFFER,null),st.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else $e?E.isDataTexture||E.isData3DTexture?R.texSubImage3D(Oe,ft,re,le,be,Et,Pt,yt,oe,Yt,ye.data):z.isCompressedArrayTexture?R.compressedTexSubImage3D(Oe,ft,re,le,be,Et,Pt,yt,oe,ye.data):R.texSubImage3D(Oe,ft,re,le,be,Et,Pt,yt,oe,Yt,ye):E.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,ft,re,le,Et,Pt,oe,Yt,ye.data):E.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,ft,re,le,ye.width,ye.height,oe,ye.data):R.texSubImage2D(R.TEXTURE_2D,ft,re,le,Et,Pt,oe,Yt,ye);R.pixelStorei(R.UNPACK_ROW_LENGTH,ue),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,sn),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Nn),R.pixelStorei(R.UNPACK_SKIP_ROWS,Ze),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Jn),ft===0&&z.generateMipmaps&&R.generateMipmap(Oe),st.unbindTexture()},this.copyTextureToTexture3D=function(E,z,X=null,Z=null,k=0){return E.isTexture!==!0&&($i("WebGLRenderer: copyTextureToTexture3D function signature has changed."),X=arguments[0]||null,Z=arguments[1]||null,E=arguments[2],z=arguments[3],k=arguments[4]||0),$i('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,z,X,Z,k)},this.initRenderTarget=function(E){ut.get(E).__webglFramebuffer===void 0&&P.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?P.setTextureCube(E,0):E.isData3DTexture?P.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?P.setTexture2DArray(E,0):P.setTexture2D(E,0),st.unbindTexture()},this.resetState=function(){T=0,D=0,I=null,st.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=ce._getDrawingBufferColorSpace(t),e.unpackColorSpace=ce._getUnpackColorSpace()}}const Zl={type:"change"},La={type:"start"},$c={type:"end"},_r=new bc,$l=new ri,eg=Math.cos(70*Ae.DEG2RAD),Be=new A,rn=2*Math.PI,me={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},xo=1e-6;class ng extends gd{constructor(t,e=null){super(t,e),this.state=me.NONE,this.enabled=!0,this.target=new A,this.cursor=new A,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Qi.ROTATE,MIDDLE:Qi.DOLLY,RIGHT:Qi.PAN},this.touches={ONE:ji.ROTATE,TWO:ji.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new A,this._lastQuaternion=new Si,this._lastTargetPosition=new A,this._quat=new Si().setFromUnitVectors(t.up,new A(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Sl,this._sphericalDelta=new Sl,this._scale=1,this._panOffset=new A,this._rotateStart=new lt,this._rotateEnd=new lt,this._rotateDelta=new lt,this._panStart=new lt,this._panEnd=new lt,this._panDelta=new lt,this._dollyStart=new lt,this._dollyEnd=new lt,this._dollyDelta=new lt,this._dollyDirection=new A,this._mouse=new lt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=sg.bind(this),this._onPointerDown=ig.bind(this),this._onPointerUp=rg.bind(this),this._onContextMenu=dg.bind(this),this._onMouseWheel=lg.bind(this),this._onKeyDown=cg.bind(this),this._onTouchStart=hg.bind(this),this._onTouchMove=ug.bind(this),this._onMouseDown=og.bind(this),this._onMouseMove=ag.bind(this),this._interceptControlDown=fg.bind(this),this._interceptControlUp=pg.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Zl),this.update(),this.state=me.NONE}update(t=null){const e=this.object.position;Be.copy(e).sub(this.target),Be.applyQuaternion(this._quat),this._spherical.setFromVector3(Be),this.autoRotate&&this.state===me.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=rn:n>Math.PI&&(n-=rn),s<-Math.PI?s+=rn:s>Math.PI&&(s-=rn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Be.setFromSpherical(this._spherical),Be.applyQuaternion(this._quatInverse),e.copy(this.target).add(Be),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=Be.length();o=this._clampDistance(a*this._scale);const l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){const a=new A(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;const c=new A(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=Be.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(_r.origin.copy(this.object.position),_r.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(_r.direction))<eg?this.object.lookAt(this.target):($l.setFromNormalAndCoplanarPoint(this.object.up,this.target),_r.intersectPlane($l,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>xo||8*(1-this._lastQuaternion.dot(this.object.quaternion))>xo||this._lastTargetPosition.distanceToSquared(this.target)>xo?(this.dispatchEvent(Zl),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?rn/60*this.autoRotateSpeed*t:rn/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Be.setFromMatrixColumn(e,0),Be.multiplyScalar(-t),this._panOffset.add(Be)}_panUp(t,e){this.screenSpacePanning===!0?Be.setFromMatrixColumn(e,1):(Be.setFromMatrixColumn(e,0),Be.crossVectors(this.object.up,Be)),Be.multiplyScalar(t),this._panOffset.add(Be)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const s=this.object.position;Be.copy(s).sub(this.target);let r=Be.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(rn*this._rotateDelta.x/e.clientHeight),this._rotateUp(rn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(rn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-rn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(rn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-rn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(rn*this._rotateDelta.x/e.clientHeight),this._rotateUp(rn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new lt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function ig(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function sg(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function rg(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent($c),this.state=me.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function og(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Qi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=me.DOLLY;break;case Qi.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=me.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=me.ROTATE}break;case Qi.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=me.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=me.PAN}break;default:this.state=me.NONE}this.state!==me.NONE&&this.dispatchEvent(La)}function ag(i){switch(this.state){case me.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case me.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case me.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function lg(i){this.enabled===!1||this.enableZoom===!1||this.state!==me.NONE||(i.preventDefault(),this.dispatchEvent(La),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent($c))}function cg(i){this.enabled!==!1&&this._handleKeyDown(i)}function hg(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case ji.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=me.TOUCH_ROTATE;break;case ji.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=me.TOUCH_PAN;break;default:this.state=me.NONE}break;case 2:switch(this.touches.TWO){case ji.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=me.TOUCH_DOLLY_PAN;break;case ji.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=me.TOUCH_DOLLY_ROTATE;break;default:this.state=me.NONE}break;default:this.state=me.NONE}this.state!==me.NONE&&this.dispatchEvent(La)}function ug(i){switch(this._trackPointer(i),this.state){case me.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case me.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case me.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case me.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=me.NONE}}function dg(i){this.enabled!==!1&&i.preventDefault()}function fg(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function pg(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const jc={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class ms{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const mg=new Ra(-1,1,1,-1,0,1);class gg extends tn{constructor(){super(),this.setAttribute("position",new pe([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new pe([0,2,0,0,2,0],2))}}const _g=new gg;class Da{constructor(t){this._mesh=new b(_g,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,mg)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class vg extends ms{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof ze?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Bs.clone(t.uniforms),this.material=new ze({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new Da(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class jl extends ms{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){const s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}}class xg extends ms{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class Mg{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){const n=t.getSize(new lt);this._width=n.width,this._height=n.height,e=new gn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:An}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new vg(jc),this.copyPass.material.blending=Yn,this.clock=new md}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const e=this.renderer.getRenderTarget();let n=!1;for(let s=0,r=this.passes.length;s<r;s++){const o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),o.needsSwap){if(n){const a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}jl!==void 0&&(o instanceof jl?n=!0:o instanceof xg&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){const e=this.renderer.getSize(new lt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;const n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class wg extends ms{constructor(t,e,n=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new gt}render(t,e,n){const s=t.autoClear;t.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),t.autoClear=s}}const yg={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new gt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class ds extends ms{constructor(t,e,n,s){super(),this.strength=e!==void 0?e:1,this.radius=n,this.threshold=s,this.resolution=t!==void 0?new lt(t.x,t.y):new lt(256,256),this.clearColor=new gt(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new gn(r,o,{type:An}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const d=new gn(r,o,{type:An});d.texture.name="UnrealBloomPass.h"+u,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);const p=new gn(r,o,{type:An});p.texture.name="UnrealBloomPass.v"+u,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),r=Math.round(r/2),o=Math.round(o/2)}const a=yg;this.highPassUniforms=Bs.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new ze({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this.getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new lt(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new A(1,1,1),new A(1,1,1),new A(1,1,1),new A(1,1,1),new A(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const h=jc;this.copyUniforms=Bs.clone(h.uniforms),this.blendMaterial=new ze({uniforms:this.copyUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,blending:br,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new gt,this.oldClearAlpha=1,this.basic=new jn,this.fsQuad=new Da(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),s=Math.round(e/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new lt(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(t,e,n,s,r){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();const o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let a=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[l].uniforms.direction.value=ds.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=ds.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this.fsQuad.render(t),a=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(n),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=o}getSeparableBlurMaterial(t){const e=[];for(let n=0;n<t;n++)e.push(.39894*Math.exp(-.5*n*n/(t*t))/t);return new ze({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new lt(.5,.5)},direction:{value:new lt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new ze({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}ds.BlurDirectionX=new lt(1,0);ds.BlurDirectionY=new lt(0,1);const Sg={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class bg extends ms{constructor(){super();const t=Sg;this.uniforms=Bs.clone(t.uniforms),this.material=new ld({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new Da(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},ce.getTransfer(this._outputColorSpace)===de&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===sc?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===rc?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===oc?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===da?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===ac?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===lc&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}function Sn(i){let t=i>>>0;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function xe(i,t){const e=document.createElement("canvas");e.width=i,e.height=t;const n=e.getContext("2d");return[e,n]}function Ne(i,t){const e=new ci(i);return e.wrapS=Ns,e.wrapT=Ns,(t?.repeatX!==void 0||t?.repeatY!==void 0)&&e.repeat.set(t.repeatX??1,t.repeatY??1),e.colorSpace=t?.srgb===!1?Wn:Ie,e.anisotropy=t?.anisotropy??8,e.needsUpdate=!0,e}function Eg(){const i=Tg(),t=Ag(),e=Cg(),n=Rg(),s=Lg(),r=Dg(),o=Ug(),a=Og();return{mosaicAlbedo:i.albedo,mosaicBump:i.bump,sandstoneAlbedo:t.albedo,sandstoneBump:t.bump,strataAlbedo:e.albedo,strataBump:e.bump,bluestoneAlbedo:n.albedo,bluestoneBump:n.bump,walnutAlbedo:Pg(),brassAlbedo:s.albedo,brassBump:s.bump,vaultBrickAlbedo:r.albedo,vaultBrickBump:r.bump,subwayTileAlbedo:Ig(),tactileAlbedo:o.albedo,tactileBump:o.bump,banyanLeaf:Ng(),fallenLeaf:Fg(),awningRed:Kl("#a92822","#e8d8be"),awningBlue:Kl("#244f76","#e6dfd3"),concreteAlbedo:a.albedo,concreteBump:a.bump,timberAlbedo:Bg(),steamPuff:zg(),windowVariants:[0,1,2,3].map(l=>Gg(l)),brassPlaque:kg()}}function Tg(){const i=Sn(101),[t,e]=xe(512,512),[n,s]=xe(512,512);e.fillStyle="#5c5348",e.fillRect(0,0,512,512),s.fillStyle="#383838",s.fillRect(0,0,512,512);const r=32,o=64,a=512/r,l=512/o;for(let c=0;c<o;c++){const h=c%16<3;for(let u=0;u<r;u++){const d=(i()-.5)*18;let p=h?168+d:212+d,g=h?112+d*.7:194+d*.85,x=h?92+d*.6:168+d*.75;const m=i()*.14;p*=1-m,g*=1-m,x*=1-m,e.fillStyle=`rgb(${p|0},${g|0},${x|0})`,e.fillRect(u*a+1,c*l+1,a-1.6,l-1.4);const f=175+(i()-.5)*35|0;s.fillStyle=`rgb(${f},${f},${f})`,s.fillRect(u*a+1,c*l+1,a-1.6,l-1.4)}}for(let c=0;c<42;c++){const h=i()*512,u=i()*260,d=80+i()*220,p=3+i()*11,g=e.createLinearGradient(h,u,h,u+d);g.addColorStop(0,"rgba(34, 30, 26, 0.34)"),g.addColorStop(.5,"rgba(42, 39, 34, 0.18)"),g.addColorStop(1,"rgba(42, 39, 34, 0)"),e.fillStyle=g,e.fillRect(h,u,p,d)}return{albedo:Ne(t,{repeatX:2,repeatY:2}),bump:Ne(n,{repeatX:2,repeatY:2,srgb:!1})}}function Ag(){const i=Sn(202),[t,e]=xe(512,512),[n,s]=xe(512,512);e.fillStyle="#332e28",e.fillRect(0,0,512,512),s.fillStyle="#202020",s.fillRect(0,0,512,512);const r=12,o=512/r;for(let a=0;a<r;a++){let l=-(i()*40);for(;l<512;){const c=52+i()*68,h=98+(i()-.5)*34,u=(i()-.4)*18;e.fillStyle=`rgb(${h+u|0},${h+u*.45|0},${h-12|0})`,e.fillRect(l+2,a*o+2,c-4,o-4);for(let p=0;p<16;p++){const g=l+3+i()*Math.max(4,c-8),x=a*o+3+i()*(o-6),m=.08+i()*.12;e.fillStyle=i()>.5?`rgba(255,244,220,${m})`:`rgba(24,20,16,${m})`,e.fillRect(g,x,3+i()*8,2+i()*4)}const d=145+i()*75|0;s.fillStyle=`rgb(${d},${d},${d})`,s.fillRect(l+2,a*o+2,c-4,o-4),l+=c}}for(let a=0;a<48;a++){const l=i()*512,c=i()*512,h=14+i()*42,u=e.createRadialGradient(l,c,2,l,c,h);u.addColorStop(0,"rgba(46, 74, 38, 0.52)"),u.addColorStop(.55,"rgba(54, 82, 42, 0.25)"),u.addColorStop(1,"rgba(54, 82, 42, 0)"),e.fillStyle=u,e.beginPath(),e.arc(l,c,h,0,Math.PI*2),e.fill()}for(let a=0;a<20;a++){const l=i()*512,c=e.createLinearGradient(l,0,l,512);c.addColorStop(0,"rgba(18, 24, 16, 0.28)"),c.addColorStop(.6,"rgba(20, 26, 20, 0.12)"),c.addColorStop(1,"rgba(18, 22, 18, 0.32)"),e.fillStyle=c,e.fillRect(l,0,8+i()*18,512)}return{albedo:Ne(t,{repeatX:2.5,repeatY:1.5}),bump:Ne(n,{repeatX:2.5,repeatY:1.5,srgb:!1})}}function Cg(){const i=Sn(303),[t,e]=xe(512,512),[n,s]=xe(512,512),r=["#4c3f34","#5c4a3b","#3e362f","#6a5442","#453b33","#554539","#342e2a","#634e3e"];let o=0,a=0;for(;o<512;){const l=18+i()*42;e.fillStyle=r[a%r.length],e.fillRect(0,o,512,l+2);const c=90+a%4*32+i()*20|0;s.fillStyle=`rgb(${c},${c},${c})`,s.fillRect(0,o,512,l+2),e.strokeStyle="rgba(20, 16, 14, 0.45)",e.lineWidth=1.5+i()*2,e.beginPath();for(let h=0;h<=512;h+=16){const u=o+Math.sin(h*.02+a)*4+(i()-.5)*2;h===0?e.moveTo(h,u):e.lineTo(h,u)}e.stroke();for(let h=0;h<45;h++){const u=i()*512,d=o+i()*l;e.fillStyle=i()>.5?"rgba(210,185,155,0.12)":"rgba(18,14,12,0.18)",e.fillRect(u,d,2+i()*14,1.5+i()*3)}o+=l,a++}return{albedo:Ne(t,{repeatX:2,repeatY:1}),bump:Ne(n,{repeatX:2,repeatY:1,srgb:!1})}}function Rg(){const i=Sn(404),[t,e]=xe(512,512),[n,s]=xe(512,512);e.fillStyle="#22272f",e.fillRect(0,0,512,512),s.fillStyle="#242424",s.fillRect(0,0,512,512);const r=8,o=4,a=512/o,l=512/r;for(let c=0;c<r;c++){const h=c%2*(a*.5);for(let u=-1;u<=o;u++){const d=u*a+h,p=c*l,g=62+(i()-.5)*20;e.fillStyle=`rgb(${g-4|0},${g+2|0},${g+11|0})`,e.fillRect(d+2,p+2,a-4,l-4);const x=155+i()*55|0;s.fillStyle=`rgb(${x},${x},${x})`,s.fillRect(d+2,p+2,a-4,l-4)}}return{albedo:Ne(t,{repeatX:2,repeatY:2}),bump:Ne(n,{repeatX:2,repeatY:2,srgb:!1})}}function Pg(){const i=Sn(505),[t,e]=xe(512,512);e.fillStyle="#2d1c13",e.fillRect(0,0,512,512);for(let n=0;n<512;n+=2){const r=38+(Math.sin(n*.045)*14+Math.sin(n*.13)*5)+(i()-.5)*8;e.fillStyle=`rgb(${r+18|0},${r+2|0},${r-8|0})`,e.fillRect(0,n,512,2.2)}e.strokeStyle="rgba(18, 9, 4, 0.35)",e.lineWidth=1;for(let n=0;n<160;n++){const s=i()*512,r=i()*440,o=30+i()*140;e.beginPath(),e.moveTo(r,s),e.bezierCurveTo(r+o*.3,s+(i()-.5)*4,r+o*.7,s+(i()-.5)*4,r+o,s),e.stroke()}return Ne(t,{repeatX:2,repeatY:1})}function Lg(){const i=Sn(606),[t,e]=xe(512,128),[n,s]=xe(512,128),r=e.createLinearGradient(0,0,512,128);r.addColorStop(0,"#bfa065"),r.addColorStop(.5,"#d9ba7b"),r.addColorStop(1,"#a9894f"),e.fillStyle=r,e.fillRect(0,0,512,128),s.fillStyle="#808080",s.fillRect(0,0,512,128);for(let o=0;o<128;o++){const a=.05+i()*.12;e.fillStyle=i()>.5?`rgba(255,244,210,${a})`:`rgba(60,42,15,${a})`,e.fillRect(0,o,512,1);const l=110+i()*38|0;s.fillStyle=`rgb(${l},${l},${l})`,s.fillRect(0,o,512,1)}return{albedo:Ne(t,{repeatX:2,repeatY:1}),bump:Ne(n,{repeatX:2,repeatY:1,srgb:!1})}}function Dg(){const i=Sn(707),[t,e]=xe(512,512),[n,s]=xe(512,512);e.fillStyle="#383029",e.fillRect(0,0,512,512),s.fillStyle="#222222",s.fillRect(0,0,512,512);const r=20,o=8,a=512/o,l=512/r;for(let c=0;c<r;c++){const h=c%2*(a*.5);for(let u=-1;u<=o;u++){const d=u*a+h,p=c*l,g=i(),x=118+g*46+(i()-.5)*20|0,m=72+g*24+(i()-.5)*14|0,f=54+g*14+(i()-.5)*12|0;e.fillStyle=`rgb(${x},${m},${f})`,e.fillRect(d+2,p+2,a-4,l-3.5);const y=165+i()*60|0;s.fillStyle=`rgb(${y},${y},${y})`,s.fillRect(d+2,p+2,a-4,l-3.5)}}return{albedo:Ne(t,{repeatX:3,repeatY:2}),bump:Ne(n,{repeatX:3,repeatY:2,srgb:!1})}}function Ig(){const i=Sn(808),[t,e]=xe(512,512);e.fillStyle="#d7d3ca",e.fillRect(0,0,512,512);const n=16,s=16,r=512/n,o=512/s;for(let a=0;a<s;a++)for(let l=0;l<n;l++){const c=212+(i()-.5)*12|0;e.fillStyle=`rgb(${c},${c-3},${c-9})`,e.fillRect(l*r+1,a*o+1,r-2,o-2)}return e.fillStyle="#a82628",e.fillRect(0,226,512,34),e.fillStyle="#d98f2b",e.fillRect(0,262,512,10),e.fillStyle="#3a3d45",e.fillRect(0,405,512,107),Ne(t,{repeatX:2.5,repeatY:1})}function Ug(){const[i,t]=xe(256,256),[e,n]=xe(256,256);t.fillStyle="#d8a623",t.fillRect(0,0,256,256),n.fillStyle="#606060",n.fillRect(0,0,256,256);const s=32;for(let r=16;r<256;r+=s)for(let o=16;o<256;o+=s)t.fillStyle="#ecc03b",t.beginPath(),t.arc(o,r,8,0,Math.PI*2),t.fill(),t.strokeStyle="#9e7412",t.lineWidth=1.5,t.stroke(),n.fillStyle="#ececec",n.beginPath(),n.arc(o,r,8,0,Math.PI*2),n.fill();return{albedo:Ne(i,{repeatX:16,repeatY:1}),bump:Ne(e,{repeatX:16,repeatY:1,srgb:!1})}}function Ng(){const i=Sn(909),[t,e]=xe(512,512);e.clearRect(0,0,512,512),e.strokeStyle="#33271e",e.lineCap="round";const n=[[256,460,256,175,5],[256,360,130,225,3.5],[256,340,385,220,3.5],[256,255,165,118,2.8],[256,245,348,125,2.8],[188,285,88,285,2.5],[328,275,428,280,2.5]];for(const[o,a,l,c,h]of n)e.lineWidth=h,e.beginPath(),e.moveTo(o,a),e.quadraticCurveTo((o+l)*.5,(a+c)*.5-12,l,c),e.stroke();const s=(o,a,l,c,h,u)=>{e.save(),e.translate(o,a),e.rotate(l);const d=e.createLinearGradient(0,0,c,0),p=32+u*24|0,g=68+u*46|0,x=34+u*18|0,m=58+u*34|0,f=112+u*52|0,y=44+u*20|0;d.addColorStop(0,`rgb(${p},${g},${x})`),d.addColorStop(.65,`rgb(${m},${f},${y})`),d.addColorStop(1,`rgb(${Math.min(148,m+26)},${Math.min(182,f+26)},${Math.min(92,y+14)})`),e.fillStyle=d,e.beginPath(),e.moveTo(0,0),e.bezierCurveTo(c*.28,-h,c*.72,-h*.82,c,0),e.bezierCurveTo(c*.72,h*.82,c*.28,h,0,0),e.closePath(),e.fill(),e.strokeStyle="rgba(148, 194, 110, 0.35)",e.lineWidth=1.2,e.beginPath(),e.moveTo(4,0),e.lineTo(c*.88,0),e.stroke(),e.restore()};for(let o=0;o<48;o++){const a=o/48,l=25+Math.sqrt(i())*165,c=i()*Math.PI*2,h=256+Math.cos(c)*l*.92,u=248+Math.sin(c)*l*.88,d=Math.atan2(u-330,h-256)+(i()-.5)*1.15,p=46+i()*44,g=13+i()*11;s(h,u,d,p,g,a*.75+i()*.35)}const r=new ci(t);return r.colorSpace=Ie,r.anisotropy=4,r.needsUpdate=!0,r}function Fg(){const[i,t]=xe(64,64);t.clearRect(0,0,64,64),t.save(),t.translate(8,32);const e=t.createLinearGradient(0,0,48,0);e.addColorStop(0,"#5e5624"),e.addColorStop(.5,"#8c752b"),e.addColorStop(1,"#b08432"),t.fillStyle=e,t.beginPath(),t.moveTo(0,0),t.bezierCurveTo(14,-14,34,-12,48,0),t.bezierCurveTo(34,12,14,14,0,0),t.closePath(),t.fill(),t.restore();const n=new ci(i);return n.colorSpace=Ie,n}function Kl(i,t){const[e,n]=xe(256,256),s=8,r=256/s;for(let a=0;a<s;a++)n.fillStyle=a%2===0?i:t,n.fillRect(a*r,0,r+1,256);const o=n.createLinearGradient(0,0,0,256);return o.addColorStop(0,"rgba(0,0,0,0.08)"),o.addColorStop(.75,"rgba(0,0,0,0)"),o.addColorStop(1,"rgba(16,12,10,0.3)"),n.fillStyle=o,n.fillRect(0,0,256,256),Ne(e,{repeatX:1,repeatY:1})}function Og(){const i=Sn(1111),[t,e]=xe(512,512),[n,s]=xe(512,512);e.fillStyle="#7e7d78",e.fillRect(0,0,512,512),s.fillStyle="#808080",s.fillRect(0,0,512,512);for(let r=0;r<4200;r++){const o=i()*512,a=i()*512,l=1+i()*4,c=105+i()*44|0;e.fillStyle=`rgba(${c},${c-1},${c-4},0.22)`,e.fillRect(o,a,l,l),s.fillStyle=`rgba(${c},${c},${c},0.3)`,s.fillRect(o,a,l,l)}e.strokeStyle="rgba(42,40,38,0.3)",e.lineWidth=2;for(let r=0;r<512;r+=128)e.beginPath(),e.moveTo(r,0),e.lineTo(r,512),e.stroke();for(let r=0;r<512;r+=128)e.beginPath(),e.moveTo(0,r),e.lineTo(512,r),e.stroke();return{albedo:Ne(t,{repeatX:2,repeatY:1}),bump:Ne(n,{repeatX:2,repeatY:1,srgb:!1})}}function Bg(){const i=Sn(1212),[t,e]=xe(256,256);e.fillStyle="#331d14",e.fillRect(0,0,256,256);for(let n=0;n<256;n+=2){const s=40+(i()-.5)*16;e.fillStyle=`rgb(${s+16|0},${s-4|0},${s-14|0})`,e.fillRect(n,0,2,256)}return Ne(t,{repeatX:1,repeatY:2})}function zg(){const[i,t]=xe(128,128),e=t.createRadialGradient(64,64,4,64,64,60);e.addColorStop(0,"rgba(255, 248, 238, 0.72)"),e.addColorStop(.45,"rgba(240, 235, 228, 0.32)"),e.addColorStop(1,"rgba(220, 220, 225, 0)"),t.fillStyle=e,t.fillRect(0,0,128,128);const n=new ci(i);return n.colorSpace=Ie,n}function Gg(i){const[t,e]=xe(256,256),n=[{bg:"#f2b86d",wall:"#d6954c",curtain:"#7d3a2c",light:"#fff2cf"},{bg:"#c8dce8",wall:"#8fa9bc",curtain:"#3d5163",light:"#e8f5ff"},{bg:"#e8a256",wall:"#bd7634",curtain:"#5b3928",light:"#ffe8b8"},{bg:"#414c5e",wall:"#2c3544",curtain:"#232a36",light:"#7a8ea8"}],s=n[i%n.length],r=e.createLinearGradient(0,0,0,256);r.addColorStop(0,s.light),r.addColorStop(.45,s.bg),r.addColorStop(1,s.wall),e.fillStyle=r,e.fillRect(0,0,256,256),e.fillStyle="rgba(28, 18, 12, 0.28)",e.fillRect(36,168,184,88),e.fillRect(88,118,68,50),e.fillStyle=s.light,e.beginPath(),e.arc(128,44,18,0,Math.PI*2),e.fill(),e.fillStyle=s.curtain,e.globalAlpha=.78,e.beginPath(),e.moveTo(0,0),e.lineTo(66,0),e.quadraticCurveTo(42,130,58,256),e.lineTo(0,256),e.closePath(),e.fill(),e.beginPath(),e.moveTo(256,0),e.lineTo(192,0),e.quadraticCurveTo(214,130,198,256),e.lineTo(256,256),e.closePath(),e.fill(),e.globalAlpha=1,e.strokeStyle="#383430",e.lineWidth=10,e.strokeRect(5,5,246,246),e.lineWidth=6,e.beginPath(),e.moveTo(128,0),e.lineTo(128,256),e.moveTo(0,170),e.lineTo(256,170),e.stroke();const o=new ci(t);return o.colorSpace=Ie,o}function kg(){const[i,t]=xe(1024,192),e=t.createLinearGradient(0,0,1024,192);e.addColorStop(0,"#a68548"),e.addColorStop(.5,"#d6b472"),e.addColorStop(1,"#9b7b3e"),t.fillStyle=e,t.fillRect(0,0,1024,192),t.strokeStyle="#3a2a12",t.lineWidth=4,t.strokeRect(14,14,996,164),t.lineWidth=1.5,t.strokeRect(22,22,980,148);for(const[s,r]of[[36,36],[988,36],[36,156],[988,156]])t.fillStyle="#473315",t.beginPath(),t.arc(s,r,6,0,Math.PI*2),t.fill();t.textAlign="center",t.textBaseline="middle",t.fillStyle="#241708",t.font='700 42px "PingFang SC", "Microsoft YaHei", sans-serif',t.fillText("重庆 8D 山城雨夜微缩沙盘",512,74),t.font='600 22px "SF Mono", "Consolas", monospace',t.fillStyle="#34230e",t.fillText("CHONGQING 8D RAIN BOX  ·  1:150 ARCHITECTURAL CUTAWAY DIORAMA",512,132);const n=new ci(i);return n.colorSpace=Ie,n.anisotropy=8,n}function Te(i){const t=i.width??512,e=i.height??160,[n,s]=xe(t,e);if(s.fillStyle=i.bg??"#181012",s.fillRect(0,0,t,e),i.border){s.strokeStyle=i.border,s.lineWidth=Math.max(4,Math.min(t,e)*.045);const o=s.lineWidth*1.2;s.strokeRect(o,o,t-o*2,e-o*2)}if(s.textAlign="center",s.textBaseline="middle",i.glow&&(s.shadowColor=i.glow,s.shadowBlur=14),s.fillStyle=i.fg??"#ffdf9e",i.vertical){const o=Array.from(i.text),a=i.fontSize??Math.floor(Math.min(t*.64,e*.82/Math.max(1,o.length)));s.font=`700 ${a}px "PingFang SC", "Microsoft YaHei", sans-serif`;const l=e*.82/Math.max(1,o.length),c=e*.09+l*.5;o.forEach((h,u)=>{s.fillText(h,t*.5,c+u*l)})}else{const o=i.fontSize??Math.floor(e*.44);s.font=`700 ${o}px "PingFang SC", "Microsoft YaHei", sans-serif`;let a=t*.5;if(i.badge){const l=e*.28,c=Math.max(l+22,t*.11),h=e*.5;s.save(),s.shadowBlur=0,s.fillStyle=i.badgeColor??"#c42b2b",s.beginPath(),s.arc(c,h,l,0,Math.PI*2),s.fill(),s.strokeStyle="#f6dfb2",s.lineWidth=3,s.stroke(),s.fillStyle="#fff8ec",s.font=`700 ${Math.floor(l*1.15)}px "PingFang SC", "Microsoft YaHei", sans-serif`,s.fillText(i.badge,c,h+1),s.restore(),a=t*.56}if(i.subtext){s.fillText(i.text,a,e*.38),s.shadowBlur=4;const l=i.subFontSize??Math.floor(e*.2);s.font=`600 ${l}px "SF Mono", "PingFang SC", "Microsoft YaHei", sans-serif`,s.fillStyle=i.fg??"#ffe7bc",s.globalAlpha=.9,s.fillText(i.subtext,a,e*.74),s.globalAlpha=1}else s.fillText(i.text,a,e*.52)}const r=new ci(n);return r.colorSpace=Ie,r.anisotropy=8,r}function Hg(i){const[t,e]=xe(512,256),n=e.createLinearGradient(0,0,0,256);n.addColorStop(0,"#10182b"),n.addColorStop(.38,"#1e2c44"),n.addColorStop(.52,"#4a352a"),n.addColorStop(.65,"#2b2022"),n.addColorStop(1,"#0d1018"),e.fillStyle=n,e.fillRect(0,0,512,256);const s=[[110,65,58,"rgba(130, 175, 225, 0.35)"],[360,72,68,"rgba(255, 200, 130, 0.38)"],[250,128,45,"rgba(235, 95, 72, 0.32)"],[440,132,38,"rgba(72, 200, 185, 0.28)"]];for(const[l,c,h,u]of s){const d=e.createRadialGradient(l,c,2,l,c,h);d.addColorStop(0,u),d.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=d,e.beginPath(),e.arc(l,c,h,0,Math.PI*2),e.fill()}const r=new ci(t);r.mapping=Er,r.colorSpace=Ie;const o=new la(i);o.compileEquirectangularShader();const a=o.fromEquirectangular(r);return r.dispose(),o.dispose(),a.texture}function Vg(){return{uTime:{value:0},uRainWeight:{value:1},uSunWeight:{value:0},uSnowWeight:{value:0}}}function Wg(i){return new ze({uniforms:{uTime:i.uTime,uRainWeight:i.uRainWeight,uSunWeight:i.uSunWeight,uSnowWeight:i.uSnowWeight},vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform float uRainWeight;
      uniform float uSunWeight;
      uniform float uSnowWeight;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise2(p);
          p *= 2.07;
          a *= 0.5;
        }
        return v;
      }

      // 3-layer concentric raindrop ripples
      float rainRippleLayer(vec2 p, float t, float scale) {
        vec2 g = p * scale;
        vec2 cell = floor(g);
        vec2 local = fract(g) - 0.5;
        float h = hash21(cell);
        vec2 center = (vec2(hash21(cell + 11.7), hash21(cell + 27.3)) - 0.5) * 0.45;
        float dist = length(local - center);
        float phase = fract(t * (0.62 + h * 0.48) + h * 6.2831);
        float ring = exp(-pow(max(abs(dist - phase * 0.46) * 26.0, 1e-5), 2.0));
        float fade = (1.0 - phase) * smoothstep(0.0, 0.08, phase);
        return ring * fade;
      }

      void main() {
        // Road spans X in [-11.6, 11.6], Z in [2.0, 8.5]
        vec2 wp = vWorldPos.xz;

        // Multi-octave asphalt micro-grain
        float grain = fbm(wp * 5.2);
        float fineGrain = noise2(wp * 28.0);
        vec3 baseAsphalt = mix(vec3(0.055, 0.06, 0.072), vec3(0.115, 0.12, 0.135), grain * 0.75 + fineGrain * 0.25);

        // Tire-track wetness channels along two lanes (vUv.y around 0.28, 0.42, 0.62, 0.76)
        float t1 = exp(-pow(max((vUv.y - 0.26) * 14.0, 1e-5), 2.0));
        float t2 = exp(-pow(max((vUv.y - 0.40) * 14.0, 1e-5), 2.0));
        float t3 = exp(-pow(max((vUv.y - 0.60) * 14.0, 1e-5), 2.0));
        float t4 = exp(-pow(max((vUv.y - 0.74) * 14.0, 1e-5), 2.0));
        float tireTracks = clamp(t1 + t2 + t3 + t4, 0.0, 1.0);

        // Puddle mask (more puddles along curbs, crosswalk, and tire channels)
        float puddleNoise = fbm(wp * 0.52 + vec2(3.1, 1.7));
        float curbWet = smoothstep(0.22, 0.0, vUv.y) + smoothstep(0.78, 1.0, vUv.y);
        float puddleMask = smoothstep(0.42, 0.66, puddleNoise + tireTracks * 0.24 + curbWet * 0.22);
        float wetness = clamp((0.35 + puddleMask * 0.65) * uRainWeight + 0.10 * uSnowWeight, 0.0, 1.0);

        // Road markings: double yellow center line + zebra crosswalk near x = -2.2
        float centerLineA = smoothstep(0.014, 0.005, abs(vUv.y - 0.486));
        float centerLineB = smoothstep(0.014, 0.005, abs(vUv.y - 0.514));
        float inCrosswalkX = smoothstep(0.32, 0.34, vUv.x) * smoothstep(0.47, 0.45, vUv.x);
        float zebra = step(0.46, fract(vUv.y * 8.5)) * inCrosswalkX * smoothstep(0.07, 0.11, vUv.y) * smoothstep(0.93, 0.89, vUv.y);
        float yellowMask = clamp(centerLineA + centerLineB, 0.0, 1.0) * (1.0 - inCrosswalkX);

        float wear = 0.62 + 0.38 * grain;
        vec3 roadCol = baseAsphalt;
        roadCol = mix(roadCol, vec3(0.68, 0.50, 0.12) * wear, yellowMask * 0.82);
        roadCol = mix(roadCol, vec3(0.66, 0.67, 0.69) * wear, zebra * 0.76);

        // Darken wet asphalt slightly
        roadCol *= mix(1.0, 0.62, wetness);

        // 3-layer raindrop ripples
        float r1 = rainRippleLayer(wp, uTime, 1.35);
        float r2 = rainRippleLayer(wp + vec2(4.7, 2.3), uTime * 1.13, 2.15);
        float r3 = rainRippleLayer(wp + vec2(9.1, 6.4), uTime * 0.89, 3.35);
        float ripples = (r1 + r2 * 0.8 + r3 * 0.6) * puddleMask * uRainWeight;

        // Perturbed normal for shimmering reflections
        vec3 N = normalize(vec3(
          (grain - 0.5) * 0.16 + (r1 - r2) * 0.18 * uRainWeight,
          1.0,
          (fineGrain - 0.5) * 0.16 + (r2 - r3) * 0.18 * uRainWeight
        ));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(dot(N, V), 0.001, 1.0);
        float fresnel = pow(max(1.0 - ndotv, 1e-5), 3.0);

        // Neon puddle reflections aligned with actual shop & lantern positions along the street
        // Crimson hotpot glow left (x ~ -7.2), warm amber noodle/lantern center (x ~ -2.2), warm tea/cyan neon right (x ~ 5.5)
        float distCrimson = length((wp - vec2(-7.0, 3.4)) * vec2(0.22, 0.42));
        float distAmber = length((wp - vec2(-2.2, 4.1)) * vec2(0.24, 0.40));
        float distCyan = length((wp - vec2(5.6, 3.8)) * vec2(0.22, 0.42));
        float distGold = length((wp - vec2(1.4, 3.2)) * vec2(0.28, 0.45));

        float shimmer = 0.72 + 0.28 * sin(wp.x * 3.1 + uTime * 2.2 + grain * 6.0);
        vec3 neonRefl = vec3(0.0);
        neonRefl += vec3(0.95, 0.22, 0.16) * exp(-distCrimson * distCrimson * 1.15) * 0.78;
        neonRefl += vec3(1.00, 0.64, 0.22) * exp(-distAmber * distAmber * 1.05) * 0.68;
        neonRefl += vec3(0.20, 0.78, 0.88) * exp(-distCyan * distCyan * 1.25) * 0.56;
        neonRefl += vec3(0.98, 0.76, 0.34) * exp(-distGold * distGold * 1.25) * 0.50;
        neonRefl *= shimmer;

        // Wet specular streak reflection
        float specStrength = (0.28 + 0.72 * fresnel) * wetness;
        vec3 color = roadCol + neonRefl * specStrength * (0.55 + 0.65 * puddleMask) * (1.0 - uSunWeight * 0.72);
        // Subtle raindrop ripple glint
        color += vec3(0.62, 0.74, 0.88) * ripples * 0.24;

        // Sunlit warm golden afternoon lighting
        vec3 sunDir = normalize(vec3(0.55, 0.62, 0.45));
        vec3 H = normalize(sunDir + V);
        float sunDiff = clamp(dot(N, sunDir), 0.0, 1.0);
        float sunSpec = pow(max(dot(N, H), 1e-5), 26.0);
        vec3 sunCol = roadCol * (1.25 + sunDiff * 0.85) * vec3(1.08, 0.99, 0.88) + vec3(0.95, 0.80, 0.55) * sunSpec * 0.22;
        color = mix(color, sunCol, uSunWeight);

        // Snow mode: cozy matte snow drifts along curb/verge, tire tracks cleared slightly, STRICTLY capped < 0.76 (zero bloom!)
        float snowNoise = fbm(wp * 0.9 + vec2(7.3, 2.9));
        float snowMask = smoothstep(0.18, 0.62, snowNoise + curbWet * 0.55 - tireTracks * 0.38) * uSnowWeight;
        vec3 snowCol = mix(vec3(0.54, 0.60, 0.70), vec3(0.72, 0.75, 0.80), 0.5 + 0.5 * grain);
        // Gentle warm lantern tint on snow without exceeding bloom threshold
        snowCol += neonRefl * 0.14;
        color = mix(color, snowCol, snowMask * 0.88);

        // Calibrated ceiling to protect Metal UnrealBloomPass from road glare blowout
        color = min(color, vec3(0.84));

        gl_FragColor = vec4(color, 1.0);
      }
    `})}function Xg(i,t){return new ze({uniforms:{uTime:i.uTime,uRainWeight:i.uRainWeight,uSunWeight:i.uSunWeight,uSnowWeight:i.uSnowWeight,uMap:{value:t}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      precision highp float;
      uniform float uTime;
      uniform float uRainWeight;
      uniform float uSunWeight;
      uniform float uSnowWeight;
      uniform sampler2D uMap;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float hash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 34.5);
        return fract(p.x * p.y);
      }

      float ripple(vec2 p, float t) {
        vec2 g = p * 2.1;
        vec2 c = floor(g);
        vec2 l = fract(g) - 0.5;
        float h = hash21(c);
        float phase = fract(t * (0.7 + h * 0.4) + h * 6.28);
        float ring = exp(-pow(max(abs(length(l) - phase * 0.42) * 24.0, 1e-5), 2.0));
        return ring * (1.0 - phase);
      }

      void main() {
        vec3 tex = texture2D(uMap, vUv * 2.2).rgb;
        vec3 N = normalize(vWorldNormal);
        float upFacing = smoothstep(0.35, 0.85, N.y);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(max(1.0 - clamp(dot(N, V), 0.001, 1.0), 1e-5), 2.8);

        // Wet dark blue-slate sheen
        vec3 col = tex * mix(0.88, 0.58, uRainWeight * upFacing);
        float rip = ripple(vWorldPos.xz, uTime) * uRainWeight * upFacing;

        // Warm lantern reflection on wet steps
        vec3 warmRefl = mix(vec3(0.95, 0.48, 0.18), vec3(0.85, 0.25, 0.20), 0.5 + 0.5 * sin(vWorldPos.x * 0.45));
        col += warmRefl * fresnel * 0.55 * uRainWeight * upFacing;
        col += vec3(0.65, 0.78, 0.92) * rip * 0.22;

        // Sun mode warm stone
        vec3 sunDir = normalize(vec3(0.55, 0.65, 0.42));
        float sunDiff = clamp(dot(N, sunDir), 0.0, 1.0);
        vec3 sunCol = tex * (0.85 + sunDiff * 0.72) * vec3(1.08, 0.98, 0.86);
        col = mix(col, sunCol, uSunWeight);

        // Snow dust on top surfaces (strictly matte, no bloom whiteout)
        vec3 snowCol = vec3(0.66, 0.71, 0.78);
        col = mix(col, snowCol, uSnowWeight * upFacing * 0.76);

        gl_FragColor = vec4(min(col, vec3(0.82)), 1.0);
      }
    `})}function Fr(i,t=.28,e=2.4){return new ze({transparent:!0,depthWrite:!1,blending:br,side:Zn,uniforms:{uColor:{value:new gt(i)},uOpacity:{value:t},uPower:{value:e}},vertexShader:`
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPower;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        float ndv = clamp(abs(dot(normalize(vNormal), normalize(vViewDir))), 0.0, 1.0);
        float core = pow(max(ndv, 1e-5), uPower);
        float edgeFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        float alpha = core * mix(1.0, edgeFade, 0.35) * uOpacity;
        gl_FragColor = vec4(uColor * alpha, alpha);
      }
    `})}function Yg(i,t){const e=new Y({map:i,alphaTest:.36,side:on,roughness:.68,metalness:.02});return e.onBeforeCompile=n=>{n.uniforms.uTime=t.uTime,n.uniforms.uSnowWeight=t.uSnowWeight,n.vertexShader=n.vertexShader.replace("#include <common>",`
        #include <common>
        uniform float uTime;
        varying float vLeafSnowFactor;
        `).replace("#include <begin_vertex>",`
        #include <begin_vertex>
        vec4 instWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        float sway = sin(uTime * 1.55 + instWorld.x * 0.75 + instWorld.z * 0.62 + instWorld.y * 0.4) * 0.065;
        float sway2 = cos(uTime * 2.1 + instWorld.z * 0.9) * 0.035;
        transformed.x += sway * (uv.y);
        transformed.z += sway2 * (uv.y);
        vLeafSnowFactor = smoothstep(0.25, 0.95, uv.y);
        `),n.fragmentShader=n.fragmentShader.replace("#include <common>",`
        #include <common>
        uniform float uSnowWeight;
        varying float vLeafSnowFactor;
        `).replace("#include <color_fragment>",`
        #include <color_fragment>
        // Gentle matte snow dusting on upper tips of leaves in winter mode
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.68, 0.73, 0.80), uSnowWeight * vLeafSnowFactor * 0.58);
        `)},e}function qg(i){const t=new Jt;t.name="ExhibitionPlinth";const e=new Y({map:i.walnutAlbedo,roughness:.42,metalness:.08}),n=new Y({map:i.brassAlbedo,bumpMap:i.brassBump,bumpScale:.015,roughness:.44,metalness:.78}),s=new b(new U(26.6,.9,20.6),e);s.position.set(0,-12.55,0),s.receiveShadow=!0,s.castShadow=!0,t.add(s);const r=new b(new U(25.8,.14,19.8),n);r.position.set(0,-12.04,0),t.add(r);const o=new b(new U(25.2,1.12,19.2),e);o.position.set(0,-11.41,0),o.receiveShadow=!0,o.castShadow=!0,t.add(o);const a=.22,l=.2,c=-10.82,h=new b(new U(24.6,l,a),n);h.position.set(0,c,9.25);const u=h.clone();u.position.z=-9.25;const d=new b(new U(a,l,18.7),n);d.position.set(-12.2,c,0);const p=d.clone();p.position.x=12.2,t.add(h,u,d,p);const g=new U(.45,1.16,.45);for(const F of[-1,1])for(const O of[-1,1]){const G=new b(g,n);G.position.set(F*12.45,-11.41,O*9.45),t.add(G)}const x=new Jt;x.position.set(0,-11.42,9.74),x.rotation.x=-.18;const m=new b(new U(7.8,1.38,.14),n);x.add(m);const f=new Y({map:i.brassPlaque,roughness:.34,metalness:.78}),y=new b(new Ce(7.52,1.18),f);y.position.z=.078,x.add(y),t.add(x);const M=new Y({color:592657,roughness:.92,metalness:.05}),_=new b(new zt(28,29,.16,48),M);_.position.set(0,-13.1,0),_.receiveShadow=!0,t.add(_);const L=new Jt;L.name="ExplodeGuideAxes";const T=new jn({color:14333556,transparent:!0,opacity:0,depthWrite:!1}),D=new jn({color:5691589,transparent:!0,opacity:0,depthWrite:!1}),I=[[-12.15,9.05],[12.15,9.05],[-12.15,-9.05],[12.15,-9.05]],S=new zt(.032,.032,41,8),v=new Ai(.24,.026,8,20),C=[-10.5,-1.2,6.2,14.5,22.8];for(const[F,O]of I){const G=new b(S,T);G.position.set(F,9.5,O),L.add(G);for(const W of C){const q=new b(v,D);q.rotation.x=Math.PI*.5,q.position.set(F,W,O),L.add(q)}}return t.add(L),{group:t,guideAxesGroup:L,animated:[{update:F=>{const O=F.explodeFactor;L.visible=O>.01,T.opacity=O*.48,D.opacity=O*.72}}]}}function Zg(i){const t=new Jt;t.name="TierSubway";const e=[],n=[],s=new Y({map:i.strataAlbedo,bumpMap:i.strataBump,bumpScale:.14,roughness:.9,metalness:.04}),r=new Y({map:i.concreteAlbedo,bumpMap:i.concreteBump,bumpScale:.06,roughness:.85,metalness:.05}),o=new Y({color:3882565,roughness:.88,metalness:.06}),a=new Y({map:i.brassAlbedo,bumpMap:i.brassBump,bumpScale:.015,roughness:.28,metalness:.85}),l=new b(new U(24,.45,18),s);l.position.set(0,-10.58,0),l.receiveShadow=!0,t.add(l);const c=new b(new U(24,9.6,.5),s);c.position.set(0,-6,-8.75),t.add(c);const h=new b(new U(.5,9.6,10.7),s);h.position.set(-11.75,-6,-3.4),t.add(h);const u=new b(new U(.5,9.6,3.1),s);u.position.set(-11.75,-6,7.45),t.add(u);const d=new b(new U(.55,3.9,4.2),s);d.position.set(-11.75,-3.15,3.9),t.add(d);const p=new b(new U(.5,9.6,18),s);p.position.set(11.75,-6,0),t.add(p);const g=new b(new U(24,.5,18),r);g.position.set(0,-1.45,0),g.receiveShadow=!0,t.add(g);const x=new b(new U(.85,8.8,17.4),s);x.position.set(2.85,-6,0),t.add(x);const m=new Y({color:4937055,roughness:.42,metalness:.72});for(const Rt of[-3.1,-4.4,-7.8]){const Gt=new b(new zt(.14,.14,.65,14),m);Gt.rotation.x=Math.PI*.5,Gt.position.set(2.85,Rt,8.52),t.add(Gt);const ie=new b(new zt(.22,.22,.08,16),a);ie.rotation.x=Math.PI*.5,ie.position.set(2.85,Rt,8.76),t.add(ie)}const f=new b(new zt(.11,.11,8.4,12),m);f.position.set(12.06,-6,6.2),t.add(f);for(const Rt of[-3.2,-5.8,-8.4]){const Gt=new b(new zt(.18,.18,.09,14),a);Gt.position.set(12.06,Rt,6.2),t.add(Gt)}const y=new Jt;y.name="SubwayStation",t.add(y);const M=new Y({map:i.subwayTileAlbedo,roughness:.32,metalness:.08}),_=new b(new Ce(13.9,8.2),M);_.position.set(-4.55,-6.2,-8.25),y.add(_);const L=new Y({color:6053992,roughness:.72,metalness:.18}),T=[];for(let Rt=0;Rt<=16;Rt++){const Gt=Rt/16,ie=-8.2+Gt*16.35,Se=Math.sin(Gt*Math.PI)*.65,Me=Ae.lerp(-3.55,-2.02,Math.pow(Gt,.55))+Se*.45;T.push(new A(0,Math.min(-1.76,Me),ie))}const D=new Rn(T),I=new Xe(D,24,.18,8,!1);for(let Rt=-10.8;Rt<=1.8;Rt+=2.52){const Gt=new b(I,L);Gt.position.x=Rt,y.add(Gt)}const S=new Y({color:6777716,roughness:.52,metalness:.1}),v=new b(new U(13.9,1.25,9.7),S);v.position.set(-4.55,-9.78,-3.35),v.receiveShadow=!0,y.add(v);const C=new Y({color:9146263,roughness:.4,metalness:.15}),N=new b(new U(13.9,.12,.45),C);N.position.set(-4.55,-9.11,1.32),y.add(N);const F=new Y({map:i.tactileAlbedo,bumpMap:i.tactileBump,bumpScale:.04,roughness:.62,metalness:.05}),O=new b(new U(13.6,.04,.58),F);O.position.set(-4.55,-9.13,.62),y.add(O);const G=new Y({color:3027772,roughness:.6,metalness:.4}),W=new Y({color:16248544,emissive:16770237,emissiveIntensity:.72,roughness:.35});for(const Rt of[-4.2,-.6,3.2]){const Gt=new b(new U(12.2,.18,.72),G);Gt.position.set(-4.55,-2.06,Rt),y.add(Gt);const ie=new b(new Ce(11.8,.52),W);ie.rotation.x=Math.PI*.5,ie.position.set(-4.55,-2.16,Rt),y.add(ie)}const q=Te({text:"洪崖雨巷站",subtext:"HONGYA YUXIANG STA.",width:768,height:196,bg:"#1c2330",fg:"#f7f2e8",border:"#c23430",badge:"渝",badgeColor:"#b92a28",fontSize:66,subFontSize:28}),V=new Y({map:q,emissiveMap:q,emissive:new gt(16777215),emissiveIntensity:.48,roughness:.35}),ct=new b(new U(5.8,1.48,.14),[G,G,G,G,V,G]);ct.position.set(-4.6,-4.95,-8.1),y.add(ct);const dt=Te({text:"← 2号线 · 李子坝",subtext:"TO LIZIBA MONORAIL",width:512,height:140,bg:"#19352b",fg:"#ecfff5",border:"#35a87a",fontSize:44,subFontSize:22}),_t=new Y({map:dt,emissiveMap:dt,emissive:new gt(16777215),emissiveIntensity:.45,roughness:.35}),Wt=new b(new U(3.2,.88,.12),[G,G,G,G,_t,G]);Wt.position.set(-9.5,-5.05,-8.1),y.add(Wt);const Vt=Te({text:"防空洞老街出口 →",subtext:"AIR-RAID SHELTER EXIT",width:512,height:140,bg:"#322014",fg:"#ffe4a8",border:"#d69032",fontSize:40,subFontSize:22}),Q=new Y({map:Vt,emissiveMap:Vt,emissive:new gt(16777215),emissiveIntensity:.45,roughness:.35}),pt=new b(new U(3.2,.88,.12),[G,G,G,G,Q,G]);pt.position.set(.3,-5.05,-8.1),y.add(pt);const vt=new b(new U(4.4,.72,.16),[G,G,G,G,V,V]);vt.position.set(-4.6,-3.55,-2.2),y.add(vt);for(const Rt of[-6.4,-2.8]){const Gt=new b(new zt(.03,.03,1.5,8),G);Gt.position.set(Rt,-2.65,-2.2),y.add(Gt)}const mt=new Y({color:12236462,roughness:.42,metalness:.15}),Ut=new Y({color:10888744,roughness:.38,metalness:.2});for(const Rt of[-11.15,-7.7,-1.45,2.08]){const Gt=new b(new U(.46,7.2,.46),mt);Gt.position.set(Rt,-5.55,-5.2),y.add(Gt);const ie=new b(new U(.5,.42,.5),Ut);ie.position.set(Rt,-6.2,-5.2),y.add(ie)}const Nt=new Y({color:11383998,roughness:.3,metalness:.8});for(const Rt of[-7,-2.2]){const Gt=new b(new U(2.1,.09,.56),Nt);Gt.position.set(Rt,-8.62,-2.6);const ie=new b(new U(2.1,.42,.06),Nt);ie.position.set(Rt,-8.38,-2.88),y.add(Gt,ie);for(const Se of[-.85,.85]){const Me=new b(new U(.08,.52,.46),Nt);Me.position.set(Rt+Se,-8.88,-2.6),y.add(Me)}}const kt=[[-8.1,-.55,2967656,.18],[-6.6,-2.4,8141622,0],[-5.1,-.45,4938825,-.15],[-3.4,-.8,10187330,.22],[-1.1,-.5,3882314,-.1],[.9,-1.2,7221826,.3]];for(const[Rt,Gt,ie,Se]of kt){const Me=Ia(ie,!1);Me.position.set(Rt,-9.15,Gt),Me.rotation.y=Se,y.add(Me)}const Bt=new b(new U(14,.25,6.2),o);Bt.position.set(-4.5,-10.28,4.7),y.add(Bt);const $=new Y({color:5065286,roughness:.9}),ot=new U(.24,.12,2.35),R=new us(ot,$,26),Mt=new Le;for(let Rt=0;Rt<26;Rt++)Mt.position.set(-11.2+Rt*.54,-10.12,4.15),Mt.rotation.set(0,0,0),Mt.updateMatrix(),R.setMatrixAt(Rt,Mt.matrix);R.instanceMatrix.needsUpdate=!0,y.add(R);const et=new Y({color:10199724,roughness:.28,metalness:.88});for(const Rt of[3.35,4.95]){const Gt=new b(new U(14.4,.14,.09),et);Gt.position.set(-4.4,-10.02,Rt),y.add(Gt)}const ht=$g();ht.position.set(-5.1,-9.95,4.15),y.add(ht),e.push({update:Rt=>{if(Rt.convergence){const Gt=-4.9+Math.sin(Rt.convergenceProgress*Math.PI*2)*.9;ht.position.x=Ae.lerp(ht.position.x,Gt,Math.min(1,Rt.dt*3.5))}else{const Gt=Rt.time*.16%1;let ie=0;if(Gt<.35){const Se=Gt/.35,Me=1-Math.pow(1-Se,3);ie=Ae.lerp(-1.25,.65,Me)}else if(Gt<.72)ie=.65;else{const Se=(Gt-.72)/.28,Me=Se*Se*(3-2*Se);ie=Ae.lerp(.65,-1.25,Me)}ht.position.x=-5.1+ie}}});const st=new oi(16770754,9.5,16,1.5);st.position.set(-7.2,-3.6,.5);const Ft=new oi(16772822,9.5,16,1.5);Ft.position.set(-1.8,-3.6,1.2),y.add(st,Ft),n.push(st,Ft);const ut=new Jt;ut.name="HotpotCave",t.add(ut);const P=new Y({map:i.vaultBrickAlbedo,bumpMap:i.vaultBrickBump,bumpScale:.12,roughness:.82,metalness:.05}),w=new Y({map:i.bluestoneAlbedo,bumpMap:i.bluestoneBump,bumpScale:.05,color:9141874,roughness:.65,metalness:.08}),H=new b(new U(8.2,.32,16.8),w);H.position.set(7.4,-10.22,0),H.receiveShadow=!0,ut.add(H);const J=new zt(4.05,4.05,16.5,24,1,!0,0,Math.PI);J.rotateZ(Math.PI*.5),J.rotateY(Math.PI*.5);const rt=P.clone();rt.side=Je;const tt=new b(J,rt);tt.position.set(7.4,-6.2,0),ut.add(tt);const Lt=new b(new U(.28,4,16.5),P);Lt.position.set(3.42,-8.2,0);const K=new b(new U(.28,4,16.5),P);K.position.set(11.38,-8.2,0);const nt=new b(new U(8.2,8.2,.35),P);nt.position.set(7.4,-6.2,-8.2),ut.add(Lt,K,nt);const Dt=[];for(let Rt=0;Rt<=16;Rt++){const Gt=Rt/16*Math.PI;Dt.push(new A(Math.cos(Gt)*3.92,Math.sin(Gt)*3.92,0))}const it=new Rn(Dt),wt=new Xe(it,22,.16,8,!1);for(const Rt of[-6.8,-3.4,0,3.4,6.8]){const Gt=new b(wt,P);Gt.position.set(7.4,-6.2,Rt),ut.add(Gt)}const Ht=Te({text:"★ 人防防空洞 · 1969 ★",width:640,height:112,bg:"#4b3b2c",fg:"#f6d27a",border:"#c29248",fontSize:44}),It=new Y({map:Ht,emissiveMap:Ht,emissive:new gt(16764808),emissiveIntensity:.4,roughness:.5}),Ct=new b(new U(4.4,.72,.16),[o,o,o,o,It,o]);Ct.position.set(7.4,-2.55,7.65),ut.add(Ct);const Kt=Te({text:"防空洞老火锅",subtext:"地道老油 · 九宫格",width:560,height:160,bg:"#4d1110",fg:"#ffdf8c",border:"#e08b36",glow:"#ff5226",fontSize:64,subFontSize:26}),qt=new Y({map:Kt,emissiveMap:Kt,emissive:new gt(16758896),emissiveIntensity:.72,roughness:.35}),he=new b(new U(3.8,1.05,.16),[o,o,o,o,qt,o]);he.position.set(7.4,-3.65,7.15),ut.add(he);const B=Te({text:"鲜毛肚 · 冰球鹅肠 · 嫩鸭血",subtext:"九宫格老油锅底 · 山城冰啤酒",width:640,height:170,bg:"#381912",fg:"#ffe2a0",border:"#b57b3b",fontSize:40,subFontSize:24}),St=new Y({map:B,emissiveMap:B,emissive:new gt(16764040),emissiveIntensity:.36,roughness:.55}),j=new b(new U(4.6,1.25,.12),[o,o,o,o,St,o]);j.position.set(7.4,-6.2,-7.95),ut.add(j);const at=new jn({color:1710102}),At=new Y({color:16770221,emissive:16757575,emissiveIntensity:1.05,roughness:.2}),bt=new qe(.085,8,8);for(const[Rt,Gt,ie,Se]of[[4.1,10.7,5.2,3.6],[10.7,4.1,2.2,-.4],[4.1,10.7,-1.6,-4.6]]){const Me=[];for(let dn=0;dn<=10;dn++){const fn=dn/10,gs=Ae.lerp(Rt,Gt,fn),Ci=Ae.lerp(ie,Se,fn),_s=Math.sin(fn*Math.PI)*.65;Me.push(new A(gs,-4.15-_s,Ci))}const hi=new Rn(Me);ut.add(new b(new Xe(hi,14,.018,5,!1),at));for(let dn=1;dn<10;dn+=2){const fn=new b(bt,At);fn.position.copy(Me[dn]),fn.position.y-=.08,ut.add(fn)}}const $t=[],ve=[[5.3,-4.7,4.8],[9.5,-4.7,4.8],[5.3,-4.7,-1.8],[9.5,-4.7,-1.8]];for(let Rt=0;Rt<ve.length;Rt++){const[Gt,ie,Se]=ve[Rt],Me=Kc(.42);Me.position.set(Gt,ie,Se),ut.add(Me),$t.push(Me)}const Pe=[],ae=[[5.6,3.6],[9.2,3.2],[5.7,-2],[9.1,-2.4]];for(const[Rt,Gt]of ae){const ie=ha(!0);ie.position.set(Rt,-10.05,Gt),ut.add(ie),Pe.push(new A(Rt,-8.85,Gt))}const He=Jc(Pe,i.steamPuff,28);ut.add(He.group),e.push(He.animated),e.push({update:Rt=>{$t.forEach((Gt,ie)=>{Gt.rotation.z=Math.sin(Rt.time*1.4+ie*1.7)*.045})}});const Fe=new oi(16750144,14,14,1.4);Fe.position.set(7.4,-5.8,3.4);const Kn=new oi(16742450,11.5,13,1.4);Kn.position.set(7.4,-5.8,-2.8),ut.add(Fe,Kn),n.push(Fe,Kn);const Dn=new b(new U(23.8,.14,.14),a);Dn.position.set(0,-1.42,8.95);const an=Dn.clone();an.position.y=-10.58;const In=new b(new U(.14,9.3,.14),a);In.position.set(-11.82,-6,8.95);const Un=In.clone();return Un.position.x=11.82,t.add(Dn,an,In,Un),{group:t,animated:e,warmLights:n,metroTrainGroup:ht}}function $g(){const i=new Jt;i.name="ChongqingMetroTrain";const t=new Y({color:14080994,roughness:.24,metalness:.62}),e=new Y({color:12067368,roughness:.28,metalness:.32}),n=new Y({color:1711654,roughness:.35,metalness:.45}),s=new Y({color:1054498,roughness:.12,metalness:.85}),r=new Y({color:16770751,emissive:16766874,emissiveIntensity:.72,roughness:.5}),o=new Y({color:11877428,roughness:.6}),a=new Y({color:9410208,roughness:.45,metalness:.5}),l=Te({text:"洪崖雨巷 · 方向",width:320,height:64,bg:"#120d08",fg:"#ffb63d",glow:"#ff8a1e",fontSize:34}),c=new Y({map:l,emissiveMap:l,emissive:new gt(16755251),emissiveIntensity:.92}),h=new Y({color:16775394,emissive:16771509,emissiveIntensity:1.35}),u=new Y({color:16726832,emissive:16721952,emissiveIntensity:1.15}),d=3.15,p=2.02,g=3.48;for(let m=-1;m<=1;m++){const f=new Jt;f.position.x=m*g,i.add(f);const y=new b(new U(d,.42,p*.92),n);y.position.y=.52,f.add(y);for(const v of[-.95,.95]){const C=new b(new U(.92,.24,1.72),n);C.position.set(v,.34,0),f.add(C);for(const N of[-.3,.3])for(const F of[-.8,.8]){const O=new b(new zt(.24,.24,.11,12),a);O.rotation.x=Math.PI*.5,O.position.set(v+N,.24,F),f.add(O)}}const M=new b(new U(d-.16,1.55,p-.24),r);M.position.y=1.62,f.add(M);const _=new b(new U(d-.45,.22,.38),o);_.position.set(0,1.15,-.58),f.add(_);const L=new b(new zt(.015,.015,d-.55,6),a);L.rotation.z=Math.PI*.5,L.position.set(0,2.22,.22),f.add(L);for(let v=-1;v<=1;v+=.4){const C=new b(new Ai(.055,.012,6,10),o);C.position.set(v,2.08,.22),f.add(C)}const T=new b(new U(d,.72,p),t);T.position.y=1.06,f.add(T);const D=new b(new U(d+.02,.26,p+.02),e);D.position.y=1.24,f.add(D);const I=new b(new U(d,.42,p),t);I.position.y=2.48,f.add(I);const S=new b(new zt(p*.49,p*.5,d,14,1,!1,0,Math.PI),t);S.rotation.z=Math.PI*.5,S.scale.set(.32,1,1),S.position.y=2.66,f.add(S);for(const v of[-1,1]){const C=v*(p*.5-.04);for(const N of[-1.48,-.5,.5,1.48]){const F=new b(new U(.16,.92,.1),t);F.position.set(N,1.85,C),f.add(F)}for(const N of[-.5,.5]){const F=new b(new U(.03,1.85,.04),n);F.position.set(N,1.66,v*(p*.5+.015)),f.add(F)}}for(const v of[-.82,.82]){const C=new b(new U(.95,.24,1.15),a);C.position.set(v,2.94,0),f.add(C)}if(m!==0){const v=m,C=new Jt;C.position.x=v*(d*.5),f.add(C);const N=new zt(.76,1.02,1.15,16);N.rotateZ(-v*Math.PI*.5);const F=new b(N,t);F.scale.set(1,1.18,1),F.position.set(v*.52,1.72,0),C.add(F);const O=new b(new U(.92,.62,p*.9),e);O.position.set(v*.42,.96,0),C.add(O);const G=new b(new U(.45,.84,p*.84),s);G.position.set(v*.72,2.02,0),G.rotation.z=-v*.26,C.add(G);const W=new b(new Ce(1.22,.22),c);W.rotation.y=v>0?Math.PI*.5:-Math.PI*.5,W.position.set(v*.86,2.52,0),C.add(W);for(const q of[-.58,.58]){const V=new b(new U(.12,.16,.28),v>0?h:u);V.position.set(v*.92,1.12,q),C.add(V)}}}const x=new Y({color:2237998,roughness:.82});for(const m of[-g*.5,g*.5]){const f=new b(new U(.48,2.15,1.65),x);f.position.set(m,1.68,0),i.add(f)}return i}function Kc(i=.36){const t=new Jt,e=new Y({color:14033948,emissive:16726815,emissiveIntensity:.88,roughness:.45}),n=new Y({color:14923863,emissive:12749358,emissiveIntensity:.22,roughness:.35,metalness:.72}),s=new b(new zt(.015,.015,i*1.1,6),n);s.position.y=i*.85,t.add(s);const r=new b(new qe(i*.65,14,10),e);r.scale.set(1,1.12,1),t.add(r);const o=new zt(i*.32,i*.32,i*.14,10),a=new b(o,n);a.position.y=i*.68;const l=a.clone();l.position.y=-i*.68,t.add(a,l);const c=new b(new li(i*.14,i*.58,8),n);c.position.y=-i*1.02,t.add(c);const h=new b(new qe(i*1.25,12,10),Fr(16739125,.24,2.2));return t.add(h),t}function ha(i=!0){const t=new Jt,e=new Y({color:6043169,roughness:.65}),n=new Y({color:13073730,roughness:.32,metalness:.82}),s=new Y({color:10360848,emissive:14234900,emissiveIntensity:.82,roughness:.22}),r=new Y({color:10888736,roughness:.58}),o=new Y({color:2914360,roughness:.25,metalness:.1}),a=new Y({color:15459801,roughness:.35}),l=new b(new zt(.86,.86,.08,16),e);l.position.y=.78;const c=new b(new zt(.14,.28,.78,10),e);c.position.y=.39,t.add(l,c);const h=new b(new zt(.36,.31,.18,16),n);h.position.y=.9,t.add(h);const u=new b(new zt(.33,.33,.03,16),s);u.position.y=.985,t.add(u);const d=new U(.62,.05,.022),p=new U(.022,.05,.62);for(const x of[-.11,.11]){const m=new b(d,n);m.position.set(0,1,x);const f=new b(p,n);f.position.set(x,1,0),t.add(m,f)}for(let x=0;x<4;x++){const m=x/4*Math.PI*2+.4,f=new b(new zt(.085,.06,.055,10),a);if(f.position.set(Math.cos(m)*.58,.85,Math.sin(m)*.58),t.add(f),x%2===0){const y=new b(new zt(.035,.04,.24,8),o);y.position.set(Math.cos(m+.35)*.62,.94,Math.sin(m+.35)*.62),t.add(y)}}const g=[3426918,8733238,4938818,7492150];for(let x=0;x<4;x++){const m=x/4*Math.PI*2+.4,f=Math.cos(m)*1.12,y=Math.sin(m)*1.12,M=new b(new zt(.18,.2,.46,10),r);if(M.position.set(f,.23,y),t.add(M),i&&x<3){const _=Ia(g[x%g.length],!0);_.position.set(f,.44,y),_.lookAt(0,.44,0),t.add(_)}}return t}function Ia(i,t=!1){const e=new Jt,n=new Y({color:i,roughness:.78}),s=new Y({color:15122074,roughness:.7}),r=new Y({color:1709846,roughness:.85}),o=new Y({color:2369584,roughness:.85});if(t){const a=new b(new zt(.11,.14,.48,8),n);a.position.y=.26;const l=new b(new qe(.11,10,8),s);l.position.y=.6;const c=new b(new qe(.116,10,8,0,Math.PI*2,0,Math.PI*.58),r);c.position.y=.62;const h=new b(new U(.24,.12,.26),o);h.position.set(0,.06,.12),e.add(a,l,c,h)}else{for(const h of[-.065,.065]){const u=new b(new zt(.048,.042,.68,8),o);u.position.set(h,.34,0),e.add(u)}const a=new b(new zt(.12,.16,.66,9),n);a.position.y=.98;const l=new b(new qe(.115,10,8),s);l.position.y=1.44;const c=new b(new qe(.12,10,8,0,Math.PI*2,0,Math.PI*.6),r);c.position.y=1.46,e.add(a,l,c)}return e}function Jc(i,t,e=7){const n=new Jt;i.length*e;const s=new Dc({map:t,transparent:!0,opacity:.32,depthWrite:!1,color:16774632}),r=[];for(let a=0;a<i.length;a++)for(let l=0;l<e;l++){const c=new Cu(s.clone());n.add(c),r.push({sprite:c,origin:i[a],phase:l/e+a*.17,speed:.28+l*37%10*.015,driftX:Math.sin(l*2.1+a)*.14,driftZ:Math.cos(l*1.7+a)*.14})}return{group:n,animated:{update:a=>{for(const l of r){const c=(a.time*l.speed+l.phase)%1;l.sprite.position.set(l.origin.x+Math.sin(a.time*1.4+l.phase*6.28)*.2+l.driftX*c*1.6,l.origin.y+c*1.65,l.origin.z+Math.cos(a.time*1.2+l.phase*6.28)*.2+l.driftZ*c*1.6);const h=.24+c*.85;l.sprite.scale.set(h,h,1);const u=Math.sin(c*Math.PI);l.sprite.material.opacity=u*(.14+a.snowWeight*.08)}}}}}function jg(i,t){const e=new Jt;e.name="TierStreet";const n=[],s=[],r=[],o=[],a=[],l=new Y({map:i.sandstoneAlbedo,bumpMap:i.sandstoneBump,bumpScale:.14,roughness:.88,metalness:.04}),c=new Y({map:i.strataAlbedo,bumpMap:i.strataBump,bumpScale:.12,roughness:.9}),h=new Y({map:i.timberAlbedo,roughness:.62,metalness:.06}),u=new Y({color:3873298,roughness:.44,metalness:.1}),d=new Y({color:14273976,roughness:.85}),p=new Y({color:2764856,roughness:.56,metalness:.18}),g=new Y({color:2106411,roughness:.52,metalness:.72}),x=new Y({color:10135738,roughness:.94,metalness:0}),m=Xg(t,i.bluestoneAlbedo),f=Wg(t),y=new b(new U(24,1.2,18),c);y.position.set(0,-.6,0),y.receiveShadow=!0,e.add(y);const M=new Ce(23.6,6.3,1,1);M.rotateX(-Math.PI*.5);const _=new b(M,f);_.position.set(0,.02,5.25),e.add(_);const L=new b(new U(23.8,.24,1.6),m);L.position.set(0,.12,1.35),L.receiveShadow=!0,e.add(L);const T=new b(new U(23.8,.22,.65),m);T.position.set(0,.11,8.7),e.add(T);const D=new b(new U(11.6,4.8,6.4),l);D.position.set(-6.1,2.4,-5.7),D.receiveShadow=!0,e.add(D);const I=new b(new U(10,4.8,6.5),l);I.position.set(6.9,2.4,-5.65),I.receiveShadow=!0,e.add(I);const S=new b(new U(3.8,4.8,3.8),l);S.position.set(.7,2.4,-7),e.add(S);const v=new b(new U(11.8,.16,6.5),m);v.position.set(-6,4.86,-5.65);const C=new b(new U(10.2,.16,6.6),m);C.position.set(6.8,4.86,-5.6);const N=new b(new U(3.8,.16,4),m);N.position.set(.7,4.86,-6.9),e.add(v,C,N);const F=new b(new U(.46,3.8,4.2),l);F.position.set(-1.35,2.1,-1.6);const O=new b(new U(.56,4.1,4.8),l);O.position.set(2.35,2.25,-1.7),e.add(F,O);const G=18,W=3.15,q=.52;for(let xt=0;xt<G;xt++){const Ot=xt/(G-1),Qt=.24+Ot*4.55,se=1.05-Ot*6,Ee=new b(new U(W,.28,.44),m);Ee.position.set(q,Qt,se),Ee.receiveShadow=!0,e.add(Ee)}const V=new is(new A(q-1.48,1.15,1.1),new A(q-1.48,5.72,-5)),ct=new is(new A(q+1.48,1.15,1.1),new A(q+1.48,5.72,-5));e.add(new b(new Xe(V,12,.04,6,!1),g),new b(new Xe(ct,12,.04,6,!1),g));for(let xt=0;xt<6;xt++){const Ot=xt/5,Qt=.72+Ot*4.55,se=1.05-Ot*6;for(const Ee of[-1.48,1.48]){const On=new b(new zt(.032,.036,.92,6),g);On.position.set(q+Ee,Qt,se),e.add(On)}}const dt=[],_t=[],Wt=[],Vt=new Jt;Vt.name="ShopChongqingHotpot",e.add(Vt);const Q=new Y({color:8013865,emissive:4529932,emissiveIntensity:.42,roughness:.72}),pt=new Y({color:4992283,roughness:.7}),vt=new b(new U(6.1,.14,3.5),pt);vt.position.set(-7.75,.26,-.85);const mt=new b(new U(6.2,.24,3.6),h);mt.position.set(-7.75,4.32,-.85);const Ut=new b(new U(6.1,4.1,.2),Q);Ut.position.set(-7.75,2.28,-2.55);const Nt=new b(new U(.22,4.1,3.5),h);Nt.position.set(-10.72,2.28,-.85);const kt=new b(new U(.22,4.1,3.5),h);kt.position.set(-4.78,2.28,-.85),Vt.add(vt,mt,Ut,Nt,kt);const Bt=new b(new U(1.75,1.05,.16),u);Bt.position.set(-9.75,.76,.85);const $=new b(new U(1.75,1.05,.16),u);$.position.set(-5.75,.76,.85);const ot=new b(new U(6.2,.65,.28),u);ot.position.set(-7.75,3.92,.88),Vt.add(Bt,$,ot);for(const xt of[-10.65,-8.85,-6.65,-4.85]){const Ot=new b(new zt(.11,.12,4.1,8),u);Ot.position.set(xt,2.25,.88),Vt.add(Ot)}for(const xt of[-9.75,-5.75]){const Ot=new b(new U(1.72,.06,.08),u);Ot.position.set(xt,3.25,.86),Vt.add(Ot);for(const Qt of[-.54,0,.54]){const se=new b(new U(.045,.52,.06),u);se.position.set(xt+Qt,3.48,.86),Vt.add(se)}}const R=ha(!0);R.scale.setScalar(.84),R.position.set(-9.35,.33,-.75);const Mt=ha(!0);Mt.scale.setScalar(.84),Mt.position.set(-6.15,.33,-.82),Vt.add(R,Mt),dt.push(new A(-9.35,1.25,-.75),new A(-6.15,1.25,-.82));const et=Te({text:"鲜毛肚 · 冰球鹅肠 · 嫩鸭血",subtext:"重庆传统九宫格老油火锅",width:640,height:160,bg:"#3a140e",fg:"#ffe29c",border:"#d68a38",fontSize:40,subFontSize:24}),ht=new Y({map:et,emissiveMap:et,emissive:new gt(16764040),emissiveIntensity:.45}),st=new b(new Ce(3.8,.95),ht);st.position.set(-7.75,2.55,-2.42),Vt.add(st);const Ft=new Y({color:16768926,emissive:16754750,emissiveIntensity:1});for(const xt of[-9.35,-6.15]){const Ot=new b(new zt(.015,.015,1.1,6),g);Ot.position.set(xt,3.65,-.75);const Qt=new b(new li(.28,.22,12,1,!0),u);Qt.position.set(xt,3.12,-.75);const se=new b(new qe(.11,8,8),Ft);se.position.set(xt,3.04,-.75),Vt.add(Ot,Qt,se)}const ut=Te({text:"重庆老火锅",subtext:"CHONGQING OLD HOTPOT",width:640,height:176,bg:"#4b0f0e",fg:"#ffe29a",border:"#e09b3d",glow:"#ff4b1f",fontSize:74,subFontSize:22}),P=new Y({map:ut,emissiveMap:ut,emissive:new gt(16760954),emissiveIntensity:.78,roughness:.35}),w=new b(new U(3.8,.96,.18),[u,u,u,u,P,u]);w.position.set(-7.75,3.68,1.32),Vt.add(w);const H=Te({text:"毛肚鸭肠",width:128,height:448,bg:"#2b090c",fg:"#ff7056",border:"#ff4838",glow:"#ff2b1c",vertical:!0,fontSize:72}),J=new Y({map:H,emissiveMap:H,emissive:new gt(16735815),emissiveIntensity:.92}),rt=new b(new U(.16,2.7,.78),[J,J,g,g,g,g]);rt.position.set(-10.85,5.1,1.48),Vt.add(rt);const tt=new Y({color:2125371,roughness:.6}),Lt=new Y({color:3048770,roughness:.22,metalness:.15});for(let xt=0;xt<3;xt++){const Ot=.42+xt*.36,Qt=new b(new U(.46,.34,.36),tt);Qt.position.set(-10.22,Ot,1.32),Qt.rotation.y=(xt-1)*.08,Vt.add(Qt)}for(let xt=0;xt<6;xt++){const Ot=new b(new zt(.032,.038,.24,7),Lt);Ot.position.set(-10.32+xt%3*.1,1.46,1.24+Math.floor(xt/3)*.12),Vt.add(Ot)}const K=Te({text:"九宫格",subtext:"鲜毛肚 · 冰啤酒",width:220,height:300,bg:"#2b1210",fg:"#ffd98a",border:"#d98834",fontSize:48,subFontSize:24}),nt=new Y({map:K,emissiveMap:K,emissive:new gt(16760181),emissiveIntensity:.52}),Dt=new Jt;Dt.position.set(-5.05,.24,1.56),Dt.rotation.y=.28;const it=new b(new U(.56,.84,.05),[u,u,u,u,nt,u]);it.position.set(0,.42,.14),it.rotation.x=-.18;const wt=new b(new U(.56,.84,.05),u);wt.position.set(0,.42,-.14),wt.rotation.x=.18,Dt.add(it,wt),Vt.add(Dt);const Ht=new oi(16748092,12.5,11,1.5);Ht.position.set(-7.75,2.75,-.2),Vt.add(Ht),r.push(Ht);const It=new Jt;It.name="ShopNoodles",e.add(It);const Ct=new Y({color:12759705,emissive:3877401,emissiveIntensity:.35,roughness:.65}),Kt=new b(new U(3.1,.14,3.1),pt);Kt.position.set(-3.05,.26,-.75);const qt=new b(new U(3.1,3.6,.2),Ct);qt.position.set(-3.05,2.05,-2.25);const he=new b(new U(.2,3.6,3.1),h);he.position.set(-1.58,2.05,-.75);const B=new b(new U(3.2,.24,3.2),h);B.position.set(-3.05,3.85,-.75),It.add(Kt,qt,he,B);const St=new b(new U(2.6,.96,.72),d);St.position.set(-3.05,.76,-.35),It.add(St);const j=new Y({color:12239564,roughness:.25,metalness:.85}),at=new b(new zt(.26,.24,.38,14),j);at.position.set(-3.65,1.42,-.3),It.add(at);const At=new Y({color:13081949,roughness:.78});for(let xt=0;xt<3;xt++){const Ot=new b(new zt(.24,.24,.14,14),At);Ot.position.set(-2.55,1.32+xt*.145,-.25),It.add(Ot)}const bt=new b(new li(.25,.1,14),At);bt.position.set(-2.55,1.72,-.25),It.add(bt),dt.push(new A(-2.55,1.85,-.25),new A(-3.65,1.65,-.3));const $t=Te({text:"山城小面 · 冰粉",width:512,height:128,bg:"#1c2b3a",fg:"#ffe8a8",border:"#e59a38",glow:"#ffae38",fontSize:52}),ve=new Y({map:$t,emissiveMap:$t,emissive:new gt(16765064),emissiveIntensity:.72}),Pe=new b(new U(2.9,.72,.15),[u,u,u,u,ve,u]);Pe.position.set(-3.05,3.55,1.18),It.add(Pe);const ae=new Y({map:i.awningRed,roughness:.8,side:on}),He=new b(new U(3,.06,1.22),ae);He.position.set(-3.05,3.05,1.24),He.rotation.x=.34,It.add(He);const Fe=new b(new U(2.96,.08,1.18),x);Fe.position.set(-3.05,3.12,1.24),Fe.rotation.x=.34,Fe.visible=!1,It.add(Fe),s.push(Fe);const Kn=new Y({color:10233892,roughness:.85,side:on});for(let xt=0;xt<4;xt++){const Ot=new b(new Ce(.56,.82),Kn);Ot.geometry.translate(0,-.41,0),Ot.position.set(-3.92+xt*.6,2.75,.72),It.add(Ot),Wt.push(Ot)}const Dn=new b(new U(.86,.05,.68),j);Dn.position.set(-2.95,.86,1.48);const an=new b(new U(.76,.62,.56),g);an.position.set(-2.95,.54,1.48),It.add(Dn,an);const In=new Y({color:13184036,roughness:.45});for(const[xt,Ot]of[[-3.52,1.48],[-2.38,1.48],[-2.95,1.92]]){const Qt=new b(new zt(.15,.18,.42,8),In);Qt.position.set(xt,.45,Ot),It.add(Qt)}const Un=new oi(16757844,8.2,8,1.5);Un.position.set(-3.05,2.55,.1),It.add(Un),r.push(Un);const Rt=new Jt;Rt.name="ShopTeaHouse",e.add(Rt);const Gt=new b(new U(5.6,.14,3.2),pt);Gt.position.set(5.55,.26,-.7);const ie=new b(new U(5.6,4.05,.2),Q);ie.position.set(5.55,2.26,-2.25);const Se=new b(new U(.22,4.05,3.2),h);Se.position.set(2.8,2.26,-.7);const Me=new b(new U(.22,4.05,3.2),h);Me.position.set(8.3,2.26,-.7);const hi=new b(new U(5.8,.24,3.3),h);hi.position.set(5.55,4.3,-.7),Rt.add(Gt,ie,Se,Me,hi);for(const xt of[2.9,4.85,6.25,8.2]){const Ot=new b(new zt(.1,.11,4.05,8),u);Ot.position.set(xt,2.25,.85),Rt.add(Ot)}const dn=new b(new U(5.7,.62,.26),u);dn.position.set(5.55,3.92,.86),Rt.add(dn);const fn=[13187886,3902060,14261048,2906762,10181172,6062148],gs=new zt(.11,.11,.28,10);for(let xt=0;xt<3;xt++){const Ot=1.25+xt*.72,Qt=new b(new U(4.8,.08,.36),u);Qt.position.set(5.55,Ot,-1.96),Rt.add(Qt);for(let se=0;se<11;se++){const Ee=new Y({color:fn[(xt*5+se)%fn.length],roughness:.32,metalness:.25}),On=new b(gs,Ee);On.position.set(3.45+se*.42,Ot+.18,-1.94),Rt.add(On)}}const Ci=new b(new U(3.2,.92,.68),u);Ci.position.set(5.55,.74,-.55),Rt.add(Ci);const _s=Te({text:"老茶馆",width:256,height:128,bg:"#233b4d",fg:"#f2e4c4",border:"#a68b56",fontSize:54}),Or=new Y({map:_s,roughness:.85,side:on}),E=new b(new Ce(1.32,.74),Or);E.geometry.translate(0,-.37,0),E.position.set(5.55,3.15,.82),Rt.add(E),Wt.push(E);const z=Te({text:"山城茶馆",subtext:"盖碗老茶 · 巴渝慢生活",width:512,height:156,bg:"#1c2c24",fg:"#f8e0a4",border:"#c2974c",glow:"#e6a84c",fontSize:64,subFontSize:24}),X=new Y({map:z,emissiveMap:z,emissive:new gt(16766870),emissiveIntensity:.66}),Z=new b(new U(3.3,.96,.16),[u,u,u,u,X,u]);Z.position.set(5.55,4.1,1.05),Rt.add(Z);const k=Te({text:"十八梯 · 8D山城",subtext:"SHIBATI OLD ALLEY",width:384,height:140,bg:"#164982",fg:"#f4f6fa",border:"#e8eef5",fontSize:42,subFontSize:20}),ft=new Y({map:k,emissiveMap:k,emissive:new gt(8961023),emissiveIntensity:.25,roughness:.28,metalness:.22}),Et=new b(new U(1.48,.56,.06),[g,g,g,g,ft,g]);Et.position.set(2.58,2.55,.95),Rt.add(Et);const Pt=new oi(16758886,9.8,10,1.5);Pt.position.set(5.55,2.75,-.3),Rt.add(Pt),r.push(Pt);const yt=new Jt;yt.name="BayuDiaojiaolouUpper",e.add(yt);for(const xt of[-10.5,-8.3,-6.1,-3.9,-1.9]){const Ot=new b(new U(.16,1.35,.16),u);Ot.position.set(xt,4.05,1.25),Ot.rotation.x=.55,yt.add(Ot);const Qt=new b(new zt(.11,.12,3,8),u);Qt.position.set(xt,5.9,1.48),yt.add(Qt)}const Zt=new b(new U(9.6,.24,6.2),h);Zt.position.set(-6.2,4.45,-1.35),yt.add(Zt);const jt=new b(new U(9.4,.12,.36),u);jt.position.set(-6.2,4.92,1.54);const Xt=new b(new U(9.5,.1,.12),u);Xt.position.set(-6.2,5.42,1.84),yt.add(jt,Xt);for(let xt=-10.6;xt<=-1.8;xt+=.44){const Ot=new b(new U(.055,.62,.055),u);Ot.position.set(xt,5.15,1.72),Ot.rotation.x=.34,yt.add(Ot)}const re=new b(new U(8.8,2.8,4.6),d);re.position.set(-6.2,5.9,-1.6),yt.add(re);const le=new Y({map:i.windowVariants[0],emissiveMap:i.windowVariants[0],emissive:new gt(16758876),emissiveIntensity:.68,roughness:.35});for(const xt of[-9.4,-7.2,-5,-2.9]){const Ot=new b(new U(1.48,1.56,.14),u);Ot.position.set(xt,5.95,.72);const Qt=new b(new Ce(1.28,1.36),le);Qt.position.set(xt,5.95,.8),yt.add(Ot,Qt)}const be=new b(new U(6.8,2.25,4.1),d);be.position.set(-6.6,8.55,-2.2),yt.add(be);for(const xt of[-8.8,-6.6,-4.4]){const Ot=new b(new U(1.28,1.24,.14),u);Ot.position.set(xt,8.55,-.14);const Qt=new b(new Ce(1.08,1.04),le);Qt.position.set(xt,8.55,-.06),yt.add(Ot,Qt)}const ye=Mo({width:10.6,depth:5.8,ridgeHeight:1.35,tileMat:p,timberMat:u,snowMat:x,snowCaps:s,addDougong:!0,addUnderEaveGlow:!0});ye.position.set(-6.2,7.38,-1.05),yt.add(ye);const oe=Mo({width:8.2,depth:5.2,ridgeHeight:1.58,tileMat:p,timberMat:u,snowMat:x,snowCaps:s,addDougong:!0,addUnderEaveGlow:!0});oe.position.set(-6.6,9.7,-2.15),yt.add(oe);const Yt=Mo({width:6.8,depth:4.4,ridgeHeight:1.15,tileMat:p,timberMat:u,snowMat:x,snowCaps:s,addDougong:!0,addUnderEaveGlow:!0});Yt.position.set(5.6,4.42,-.35),yt.add(Yt);const Oe=new Y({color:3685701,roughness:.45,metalness:.65});for(const xt of[-10.95,-1.45,8.45]){const Ot=new b(new zt(.06,.06,4.2,8),Oe);Ot.position.set(xt,2.25,1.02),yt.add(Ot)}const ue=[[-10.2,3.52,1.36,.34],[-5.3,3.52,1.36,.34],[-9.6,6.82,1.72,.32],[-6.2,6.82,1.72,.32],[-2.8,6.82,1.72,.32],[3.5,3.85,1.28,.32],[7.6,3.85,1.28,.32]];for(const[xt,Ot,Qt,se]of ue){const Ee=Kc(se);Ee.position.set(xt,Ot,Qt),e.add(Ee),_t.push(Ee)}const sn=Jc(dt,i.steamPuff,6);e.add(sn.group),n.push(sn.animated);const Nn=Kg(i,t);e.add(Nn.group);const Ze=Nn.fallenLeaves,Jn=Te({text:"渝A·8D668",width:192,height:64,bg:"#1554a6",fg:"#f2f6ff",border:"#dce8ff",fontSize:34}),we=Te({text:"渝A·8D992",width:192,height:64,bg:"#1554a6",fg:"#f2f6ff",border:"#dce8ff",fontSize:34}),$e=Te({text:"出租 TAXI",width:192,height:64,bg:"#fff4d4",fg:"#c4221a",glow:"#ffdd88",fontSize:34}),Ye=wo(Jn,$e,a);Ye.position.set(-4.2,.04,3.95),e.add(Ye);const De=wo(we,$e,a);De.rotation.y=Math.PI,De.position.set(5.4,.04,6.65),e.add(De);const Ve=wo(Jn,$e,a);Ve.position.set(-7.6,.04,2.75),Ve.rotation.y=.04,e.add(Ve),n.push({update:xt=>{if(xt.convergence){const Qt=xt.convergenceProgress;Ye.position.x=Ae.lerp(-9.5,9.5,(Qt*.8+.35)%1),De.position.x=Ae.lerp(9.5,-9.5,(Qt*.8+.25)%1)}else{const se=((xt.time*2.15+7.5)%21.6+21.6)%21.6-10.8,Ee=21.6*.5-((xt.time*2.45+3)%21.6+21.6)%21.6;Ye.position.x=se,De.position.x=Ee}const Ot=1-xt.sunWeight*.78;for(const Qt of a){Qt.visible=Ot>.08;const se=Qt.material;se.uniforms.uOpacity.value=.24*Ot}}});const Ri=[],Fn=[{coat:2902635,umbrellaColor:14676223,translucent:!0,path:[[.15,.28,1.3],[.15,4.86,-4.9]],speed:.09,phase:.15},{coat:9385005,umbrellaColor:13187890,translucent:!1,path:[[.95,4.86,-4.9],[.95,.28,1.3]],speed:.085,phase:.52},{coat:4938825,umbrellaColor:14480127,translucent:!0,path:[[-10.6,.24,1.72],[-1.8,.24,1.72]],speed:.11,phase:.3},{coat:10910790,umbrellaColor:15117886,translucent:!1,path:[[9.8,.24,1.66],[2.2,.24,1.66]],speed:.1,phase:.65},{coat:3882314,umbrellaColor:14413567,translucent:!0,path:[[-2.35,.08,1.9],[-2.35,.08,8.5]],speed:.095,phase:.42},{coat:7027284,umbrellaColor:4032668,translucent:!1,path:[[4.2,.24,1.48],[6.8,.24,1.48]],speed:.075,phase:.2}];for(const xt of Fn){const Ot=Ia(xt.coat,!1),Qt=Qg(xt.umbrellaColor,xt.translucent);Qt.position.set(.14,1.16,.1),Qt.rotation.z=-.14,Ot.add(Qt),o.push(Qt),e.add(Ot),Ri.push({group:Ot,path:xt.path,speed:xt.speed,phase:xt.phase})}return t_(e,g,r),n.push({update:xt=>{_t.forEach((se,Ee)=>{se.rotation.z=Math.sin(xt.time*1.65+Ee*1.3)*.055,se.rotation.x=Math.cos(xt.time*1.2+Ee*.9)*.03}),Wt.forEach((se,Ee)=>{se.rotation.x=-.06+Math.sin(xt.time*2.4+Ee*.85)*.085});for(const se of Ri){const Ee=(xt.time*se.speed+se.phase)%2,On=Ee<=1?Ee:2-Ee,[Ua,Qc,Na]=se.path[0],[Fa,th,Oa]=se.path[1],eh=Ae.lerp(Ua,Fa,On),nh=Ae.lerp(Qc,th,On),ih=Ae.lerp(Na,Oa,On),sh=Math.abs(Math.sin(xt.time*7.5+se.phase*10))*.04;se.group.position.set(eh,nh+sh,ih);const Ba=Ee<=1?1:-1;se.group.rotation.y=Math.atan2((Fa-Ua)*Ba,(Oa-Na)*Ba)}const Ot=xt.sunWeight<.55;for(const se of o)se.visible=Ot;Ze.visible=xt.snowWeight<.35;const Qt=xt.snowWeight>.2;for(const se of s)se.visible=Qt}}),{group:e,animated:n,snowCaps:s,fallenLeavesMesh:Ze,warmLights:r,umbrellaGroups:o,headlightCones:a}}function Mo(i){const{width:t,depth:e,ridgeHeight:n,tileMat:s,timberMat:r,snowMat:o,snowCaps:a}=i,l=new Jt,c=t*.5,h=e*.5,u=Math.hypot(h,n),d=Math.atan2(n,h);for(const C of[-1,1]){const N=new b(new U(t,.12,u),r);N.position.set(0,n*.5,C*h*.5),N.rotation.x=C*d,l.add(N)}const p=new zc;p.moveTo(-h,0),p.lineTo(h,0),p.lineTo(0,n),p.closePath();const g=new Ta(p,{depth:.16,bevelEnabled:!1});g.rotateY(Math.PI*.5);const x=new b(g,r);x.position.set(-c+.18,0,0);const m=new b(g,r);m.position.set(c-.34,0,0),l.add(x,m);const y=Math.floor(t/.24),M=new zt(.068,.072,u+.18,6,1,!1,0,Math.PI);M.rotateX(Math.PI*.5);const _=y*2,L=new us(M,s,_),T=new Le;let D=0;for(const C of[-1,1])for(let N=0;N<y;N++){const F=-c+(N+.5)*(t/y),O=Math.abs(F)/Math.max(.1,c),G=Math.pow(Math.max(0,O-.55)/.45,2)*.34;T.position.set(F,n*.5+.06+G*.5,C*(h*.5+.04)),T.rotation.set(C*(d-G*.32),0,0),T.updateMatrix(),L.setMatrixAt(D++,T.matrix)}L.instanceMatrix.needsUpdate=!0,l.add(L);for(const C of[-1,1])for(const N of[-1,1]){const F=new Rn([new A(C*(c-.7),.14,N*(h-.15)),new A(C*(c+.05),.24,N*(h+.2)),new A(C*(c+.42),.62,N*(h+.36))]),O=new b(new Xe(F,8,.085,6,!1),s);l.add(O)}const I=new b(new U(t+.45,.22,.22),s);I.position.set(0,n+.08,0),l.add(I);for(const C of[-1,1]){const N=new b(new li(.13,.42,6),s);N.position.set(C*(c+.18),n+.28,0),N.rotation.z=-C*.36,l.add(N)}if(i.addDougong){const C=Math.max(4,Math.floor(t/1.15));for(let N=0;N<C;N++){const F=-c+.65+N/Math.max(1,C-1)*(t-1.3),O=new b(new U(.24,.14,.32),r);O.position.set(F,-.06,h-.24);const G=new b(new U(.42,.1,.46),r);G.position.set(F,.04,h-.16),l.add(O,G)}}if(i.addUnderEaveGlow){const C=new Y({color:16765568,emissive:16752440,emissiveIntensity:.78,roughness:.4}),N=new b(new U(t-.3,.06,.08),C);N.position.set(0,.02,h-.06),l.add(N)}const S=new Jt;for(const C of[-1,1]){const N=new b(new U(t+.06,.1,u+.06),o);N.position.set(0,n*.5+.14,C*(h*.5+.03)),N.rotation.x=C*d,S.add(N)}const v=new b(new U(t+.25,.12,.28),o);return v.position.set(0,n+.22,0),S.add(v),S.visible=!1,l.add(S),a.push(S),l}function Kg(i,t){const e=new Jt;e.name="WeepingBanyanTrees";const n=new Y({color:3681315,roughness:.92,metalness:.02}),s=new Y({color:4601384,roughness:.9});let r=4242;const o=()=>(r=r*1664525+1013904223>>>0,r/4294967296),a=[],l=(L,T,D,I)=>{const S=new Jt;S.position.copy(L),e.add(S);const v=[new A(0,-.4,0),new A(D.x*.45*T,.9*T,D.z*.45*T),new A(D.x*.95*T,2*T,D.z*.85*T),new A(D.x*1.15*T,3.05*T,D.z*1.1*T)],C=new Rn(v),N=new Xe(C,12,.36*T,8,!1);S.add(new b(N,n));const F=[[-1.7,1.4,1.3],[1.8,1.5,1.1],[-.6,1.8,1.9],[.9,1.7,-1.3],[-1.6,1.6,-1.1],[.1,2.1,.2],[1.9,1.2,-.2]],O=v[3];for(const[G,W,q]of F){const V=new A(O.x+G*.55*T,O.y+W*.62*T,O.z+q*.55*T),ct=new A(O.x+G*1.15*T,O.y+W*.92*T,O.z+q*1.15*T),dt=new Rn([O.clone(),V,ct]);S.add(new b(new Xe(dt,8,.14*T,6,!1),n)),a.push({pos:ct.clone().add(L),radiusX:1.55*T,radiusY:.85*T,radiusZ:1.45*T,count:Math.floor(215*T)}),a.push({pos:V.clone().add(L).add(new A(0,.45*T,0)),radiusX:1.2*T,radiusY:.72*T,radiusZ:1.2*T,count:Math.floor(115*T)})}for(let G=0;G<14;G++){const W=G/14*Math.PI*2,q=O.x+Math.cos(W)*(.45+o()*1.1)*T,V=O.z+Math.sin(W)*(.35+o()*.9)*T,ct=O.y+(.1+o()*.8)*T,dt=(1.6+o()*I)*T,_t=new Rn([new A(q,ct,V),new A(q+(o()-.5)*.22,ct-dt*.5,V+(o()-.5)*.22),new A(q+(o()-.5)*.3,ct-dt,V+(o()-.5)*.25)]);S.add(new b(new Xe(_t,7,.025+o()*.02,5,!1),s))}};l(new A(1.95,3.1,-1.65),1.05,new A(-.35,0,.85),2.8),l(new A(-10.3,4.6,-5.6),.85,new A(.2,0,.55),2.1);const c=new Ce(.92,.92),h=new Ce(.92,.92);h.rotateY(Math.PI*.5);const u=Jg([c,h]),d=Yg(i.banyanLeaf,t),p=a.reduce((L,T)=>L+T.count,0),g=new us(u,d,p);g.castShadow=!1,g.receiveShadow=!0;const x=new Le,m=new gt;let f=0;for(const L of a)for(let T=0;T<L.count;T++){const D=o(),I=o(),S=D*Math.PI*2,v=Math.acos(2*I-1),C=.35+Math.pow(o(),.55)*.65,N=L.pos.x+Math.sin(v)*Math.cos(S)*L.radiusX*C,F=L.pos.y+Math.cos(v)*L.radiusY*C,O=L.pos.z+Math.sin(v)*Math.sin(S)*L.radiusZ*C;x.position.set(N,F,O),x.rotation.set((o()-.5)*.85,o()*Math.PI*2,(o()-.5)*.85);const G=.65+o()*.72;x.scale.setScalar(G),x.updateMatrix(),g.setMatrixAt(f,x.matrix);const W=Ae.clamp((F-(L.pos.y-L.radiusY))/(L.radiusY*2),0,1);m.setHSL(.28+(o()-.5)*.04,.36+W*.14,.24+W*.2),g.setColorAt(f,m),f++}g.instanceMatrix.needsUpdate=!0,g.instanceColor&&(g.instanceColor.needsUpdate=!0),e.add(g);const y=new Ce(.18,.18);y.rotateX(-Math.PI*.5);const M=new Y({map:i.fallenLeaf,alphaTest:.35,roughness:.32,metalness:.05}),_=new us(y,M,160);for(let L=0;L<160;L++){if(L<55){const D=Math.floor(o()*18)/17;x.position.set(.52+(o()-.5)*2.8,.39+D*4.55,1.05-D*6+(o()-.5)*.22)}else x.position.set((o()-.5)*21,o()>.5?.255:.035,1.05+o()*1.75);x.rotation.set(0,o()*Math.PI*2,0),x.scale.setScalar(.75+o()*.65),x.updateMatrix(),_.setMatrixAt(L,x.matrix)}return _.instanceMatrix.needsUpdate=!0,e.add(_),{group:e,fallenLeaves:_}}function Jg(i){const t=[],e=[],n=[],s=[];let r=0;for(const a of i){const l=a.getAttribute("position"),c=a.getAttribute("normal"),h=a.getAttribute("uv"),u=a.getIndex();for(let d=0;d<l.count;d++)t.push(l.getX(d),l.getY(d),l.getZ(d)),e.push(c.getX(d),c.getY(d),c.getZ(d)),n.push(h.getX(d),h.getY(d));if(u)for(let d=0;d<u.count;d++)s.push(u.getX(d)+r);r+=l.count}const o=new tn;return o.setAttribute("position",new pe(t,3)),o.setAttribute("normal",new pe(e,3)),o.setAttribute("uv",new pe(n,2)),o.setIndex(s),o}function wo(i,t,e){const n=new Jt;n.name="ChongqingYellowTaxi";const s=new Y({color:15774230,roughness:.24,metalness:.35}),r=new Y({color:1993570,roughness:.32,metalness:.25}),o=new Y({color:1843240,roughness:.52,metalness:.3}),a=new Y({color:1318958,roughness:.12,metalness:.72,transparent:!0,opacity:.72}),l=new Y({color:1513758,roughness:.85}),c=new Y({color:13686495,roughness:.25,metalness:.88}),h=new Y({color:16775392,emissive:16770216,emissiveIntensity:1.4}),u=new Y({color:15084322,emissive:16721948,emissiveIntensity:1.15}),d=new Y({map:t,emissiveMap:t,emissive:new gt(16769172),emissiveIntensity:.88}),p=new Y({map:i,emissiveMap:i,emissive:new gt(5605597),emissiveIntensity:.25,roughness:.35}),g=new b(new U(3.45,.56,1.48),s);g.position.set(0,.58,0),g.castShadow=!0,n.add(g);const x=new b(new U(3.48,.14,1.5),r);x.position.set(0,.42,0),n.add(x);const m=new b(new U(1.06,.16,1.42),s);m.position.set(1.18,.84,0),m.rotation.z=-.1;const f=new b(new U(.72,.16,1.42),s);f.position.set(-1.32,.86,0),f.rotation.z=.06,n.add(m,f);const y=new b(new U(.12,.22,.82),o);y.position.set(1.72,.62,0);const M=new b(new U(.22,.2,1.5),o);M.position.set(1.68,.38,0);const _=new b(new U(.2,.2,1.5),o);_.position.set(-1.68,.38,0),n.add(y,M,_);const L=new Y({color:3880242,roughness:.8}),T=new b(new qe(.11,8,8),new Y({color:14332562}));T.position.set(.12,1.12,-.26);const D=new b(new U(.32,.42,.36),L);D.position.set(-.04,.96,-.26);const I=D.clone();I.position.z=.26,n.add(T,D,I);const S=new b(new U(1.56,.48,1.3),a);S.position.set(-.1,1.08,0),n.add(S);const v=new b(new U(1.42,.1,1.32),s);v.position.set(-.12,1.34,0),n.add(v);for(const q of[-.63,.63]){const V=new b(new U(.08,.56,.08),s);V.position.set(.62,1.08,q),V.rotation.z=.34;const ct=new b(new U(.08,.5,.08),o);ct.position.set(-.08,1.08,q);const dt=new b(new U(.1,.54,.08),s);dt.position.set(-.82,1.08,q),dt.rotation.z=-.32,n.add(V,ct,dt);const _t=new b(new U(.1,.09,.16),s);_t.position.set(.62,.92,q*1.24),n.add(_t)}const C=new b(new U(.28,.19,.58),[d,d,s,o,d,d]);C.position.set(-.06,1.48,0),n.add(C);const N=new b(new Ce(.36,.12),p);N.rotation.y=Math.PI*.5,N.position.set(1.8,.45,0);const F=new b(new Ce(.36,.12),p);F.rotation.y=-Math.PI*.5,F.position.set(-1.79,.52,0),n.add(N,F);const O=new li(.68,2.8,16,1,!0);O.rotateZ(Math.PI*.5),O.translate(1.4,0,0);for(const q of[-.5,.5]){const V=new b(new U(.1,.14,.28),h);V.position.set(1.72,.65,q);const ct=new b(new U(.08,.15,.3),u);ct.position.set(-1.72,.66,q),n.add(V,ct);const dt=Fr(16770989,.24,2.2),_t=new b(O,dt);_t.position.set(1.72,.58,q),_t.rotation.z=-.06,n.add(_t),e.push(_t)}const G=new zt(.3,.3,.22,16);G.rotateX(Math.PI*.5);const W=new zt(.19,.19,.23,12);W.rotateX(Math.PI*.5);for(const q of[-1.05,1.05])for(const V of[-.71,.71]){const ct=new b(G,l);ct.position.set(q,.3,V);const dt=new b(W,c);dt.position.set(q,.3,V),n.add(ct,dt)}return n}function Qg(i,t){const e=new Jt,n=new Y({color:i,roughness:.28,metalness:.08,transparent:t,opacity:t?.54:.94,side:on}),s=new Y({color:2764342,roughness:.4,metalness:.7}),r=new b(new li(.56,.24,8,1,!0),n);r.position.y=.64,e.add(r);for(let c=0;c<8;c++){const h=c/8*Math.PI*2,u=new b(new zt(.008,.008,.58,4),s);u.position.set(Math.cos(h)*.26,.62,Math.sin(h)*.26),u.rotation.z=-Math.cos(h)*1.18,u.rotation.x=Math.sin(h)*1.18,e.add(u)}const o=new b(new zt(.014,.014,.74,6),s);o.position.y=.36;const a=new b(new zt(.01,.014,.1,6),s);a.position.y=.79;const l=new b(new Ai(.055,.016,6,10,Math.PI),s);return l.rotation.z=Math.PI,l.position.set(.055,.01,0),e.add(o,a,l),e}function t_(i,t,e){const n=new Jt;n.name="ForegroundStreetProps",i.add(n);const s=new Y({color:2501170,roughness:.48,metalness:.78}),r=new Y({color:14920996,roughness:.45}),o=new Y({color:14542060,roughness:.25}),a=new Y({color:12723742,roughness:.35,metalness:.25}),l=new Y({color:4541010,roughness:.65,metalness:.5});for(const _ of[-9.4,-3.6,2.2,8.1]){const L=new b(new U(.72,.025,.36),s);L.position.set(_,.03,2.28),n.add(L);for(let T=-.26;T<=.26;T+=.13){const D=new b(new U(.03,.032,.3),t);D.position.set(_+T,.033,2.28),n.add(D)}}for(const[_,L]of[[-5.8,5.1],[3.8,5.4],[9.4,4.9]]){const T=new b(new zt(.42,.44,.03,16),s);T.position.set(_,.032,L);const D=new b(new Ai(.32,.025,6,16),t);D.rotation.x=Math.PI*.5,D.position.set(_,.048,L),n.add(T,D)}for(const _ of[-10.8,-9.2,-4.6,2.2,4.4,9.6]){const L=new b(new zt(.07,.075,.72,10),t);L.position.set(_,.6,2.02);const T=new b(new zt(.074,.074,.16,10),r);T.position.set(_,.78,2.02),n.add(L,T)}const c=new b(new U(4.6,.05,.05),s);c.position.set(7,.88,2.02);const h=new b(new U(4.6,.04,.04),s);h.position.set(7,.56,2.02),n.add(c,h);for(let _=4.9;_<=9.2;_+=1.05){const L=new b(new U(.05,.72,.05),s);L.position.set(_,.58,2.02),n.add(L)}const u=new b(new zt(.11,.14,.62,10),a);u.position.set(2.05,.55,1.85);const d=new b(new qe(.12,10,8),a);d.position.set(2.05,.87,1.85);const p=new b(new zt(.05,.05,.28,8),a);p.rotation.z=Math.PI*.5,p.position.set(2.05,.72,1.85),n.add(u,d,p);const g=[[-10.9,1.92],[-1.4,1.92],[9.9,1.92]],x=new Y({color:16770221,emissive:16755524,emissiveIntensity:1.25});for(let _=0;_<g.length;_++){const[L,T]=g[_],D=new b(new zt(.09,.13,6.8,10),l);D.position.set(L,3.6,T),n.add(D);const I=new b(new U(.1,.1,1.15),t);I.position.set(L,6.35,T),n.add(I);for(const O of[-.46,0,.46]){const G=new b(new zt(.04,.055,.14,8),o);G.position.set(L,6.46,T+O),n.add(G)}if(_>0){const O=new b(new zt(.24,.24,.72,12),l);O.position.set(L+.28,5.15,T-.12),n.add(O)}const S=new b(new U(.08,.08,1.35),l);S.position.set(L,6,T+.65);const v=new b(new U(.26,.1,.46),t);v.position.set(L,5.95,T+1.26);const C=new b(new qe(.1,8,8),x);C.position.set(L,5.88,T+1.26);const N=new b(new qe(.92,12,10),Fr(16758098,.22,2.3));N.position.set(L,5.86,T+1.26),n.add(S,v,C,N);const F=new oi(16757328,9,12,1.5);F.position.set(L,5.5,T+1.26),n.add(F),e.push(F)}const m=new jn({color:1382432}),f=[[new A(-10.9,6.45,1.5),new A(-1.4,6.45,1.5),.75],[new A(-10.9,6.45,2.35),new A(-1.4,6.45,2.35),.95],[new A(-1.4,6.45,1.5),new A(9.9,6.45,1.5),.85],[new A(-1.4,6.45,2.35),new A(9.9,6.45,2.35),1.1],[new A(-1.4,6.1,1.9),new A(-5.8,6.8,.9),.45],[new A(9.9,6,1.9),new A(6.2,4.3,.8),.42]];for(const[_,L,T]of f){const D=_.clone().lerp(L,.5);D.y-=T;const I=new ba(_,D,L);n.add(new b(new Xe(I,14,.015,4,!1),m))}const y=Jl(15906840);y.position.set(-4.35,.24,1.62),y.rotation.y=-.35,n.add(y);const M=Jl(2068448);M.position.set(8.65,.24,1.6),M.rotation.y=2.65,n.add(M)}function Jl(i){const t=new Jt,e=new Y({color:2896445,roughness:.4,metalness:.45}),n=new Y({color:i,roughness:.45}),s=new Y({color:1447965,roughness:.85}),r=new zt(.18,.18,.11,12);r.rotateX(Math.PI*.5);const o=new b(r,s);o.position.set(.46,.18,0);const a=new b(r,s);a.position.set(-.44,.18,0),t.add(o,a);const l=new b(new U(.95,.12,.34),e);l.position.set(0,.28,0);const c=new b(new U(.44,.16,.28),e);c.position.set(-.14,.56,0);const h=new b(new U(.14,.62,.22),e);h.position.set(.42,.58,0),h.rotation.z=.22;const u=new b(new zt(.022,.022,.58,6),e);u.rotation.x=Math.PI*.5,u.position.set(.36,.88,0),t.add(l,c,h,u);const d=new b(new U(.46,.44,.44),n);d.position.set(-.56,.72,0),t.add(d);const p=new b(new U(.04,.08,.14),new Y({color:16726831,emissive:16722719,emissiveIntensity:.9}));return p.position.set(-.8,.48,0),t.add(p),t}function e_(i){const t=new Jt;t.name="TierSky";const e=[],n=[],s=new Y({map:i.mosaicAlbedo,bumpMap:i.mosaicBump,bumpScale:.07,roughness:.76,metalness:.04}),r=new Y({map:i.concreteAlbedo,bumpMap:i.concreteBump,bumpScale:.06,roughness:.84,metalness:.05}),o=new Y({color:2896444,roughness:.48,metalness:.72}),a=new Y({color:3883596,roughness:.55,metalness:.68}),l=new Y({color:10135738,roughness:.94,metalness:0}),c=new Jt;c.name="LizibaApartmentTower",t.add(c);const h=new b(new U(8.4,.36,7),r);h.position.set(6.8,5.02,-5),c.add(h);const u=new b(new U(8,6.1,6.6),s);u.position.set(6.8,8.25,-5),u.castShadow=!0,u.receiveShadow=!0,c.add(u);const d=new b(new U(8,4.8,1.15),s);d.position.set(6.8,13.7,-2.275),d.castShadow=!0;const p=new b(new U(8,4.8,1.35),s);p.position.set(6.8,13.7,-7.625),p.castShadow=!0,c.add(d,p);const g=new Y({color:3159100,roughness:.9}),x=new b(new U(8.04,.22,4.3),g);x.position.set(6.8,11.38,-4.9);const m=new b(new U(8.04,.22,4.3),g);m.position.set(6.8,16.02,-4.9),c.add(x,m);const f=new Y({color:16772034,emissive:16764802,emissiveIntensity:.72});for(const K of[-6.7,-3.1]){const nt=new b(new U(7.2,.1,.12),f);nt.position.set(6.8,15.84,K),c.add(nt)}for(const K of[2.75,10.85]){const nt=new b(new U(.45,.42,4.8),r);nt.position.set(K,16.12,-4.9);const Dt=new b(new U(.45,.36,4.8),r);Dt.position.set(K,11.32,-4.9);const it=new b(new U(.45,4.8,.36),r);it.position.set(K,13.7,-2.68);const wt=new b(new U(.45,4.8,.36),r);wt.position.set(K,13.7,-7.12),c.add(nt,Dt,it,wt)}const y=Te({text:"李子坝站 · LIZIBA",subtext:"重庆轨道交通 2号线 · CRT LINE 2",width:640,height:152,bg:"#113a2a",fg:"#f2fff8",border:"#3ec78e",glow:"#35d694",fontSize:58,subFontSize:22}),M=new Y({map:y,emissiveMap:y,emissive:new gt(13172710),emissiveIntensity:.72,roughness:.32}),_=new b(new U(.22,.96,4.2),[o,M,o,o,o,o]);_.position.set(2.58,16.58,-4.9),c.add(_);const L=new b(new U(4.1,.78,.2),[o,o,o,o,M,o]);L.position.set(5.4,16.05,-1.16),c.add(L);const T=new b(new U(8,3.6,6.6),s);T.position.set(6.8,17.9,-5),T.castShadow=!0,T.receiveShadow=!0,c.add(T);for(const K of[7.3,9.4,11.3,16.1,17.9,19.72]){const nt=new b(new U(8.24,.16,6.82),r);nt.position.set(6.8,K,-5),c.add(nt)}const D=i.windowVariants.map((K,nt)=>{const Dt=nt===3;return new Y({map:K,emissiveMap:K,emissive:new gt(nt===1?14216447:16762496),emissiveIntensity:Dt?.12:.62,roughness:.3})}),I=new Y({color:13157820,roughness:.65}),S=new Y({color:10768946,roughness:.8}),v=new Y({color:3897916,roughness:.75}),C=[14043714,4622530,15257704,15131354],N=[6.3,8.35,10.35,12.6,14.8,17,18.8],F=[3.95,5.85,7.75,9.65];N.forEach((K,nt)=>{F.forEach((Dt,it)=>{const Ht=(nt*7+it*13)%11%4,It=new b(new Ce(1.16,1.24),D[Ht]);It.position.set(Dt,K,-1.66),c.add(It);const Ct=new b(new U(1.3,.1,.22),r);if(Ct.position.set(Dt,K-.66,-1.62),c.add(Ct),(nt+it)%4!==0){const Kt=Ql(1.24,1.26,.36,a,{hasPlant:(nt+it)%2===0,laundryColor:(nt*3+it)%3===0?C[(nt+it)%C.length]:null,potMat:S,plantMat:v});Kt.position.set(Dt,K,-1.66),c.add(Kt)}if((nt+it)%3===1){const Kt=new b(new U(.54,.38,.28),I);Kt.position.set(Dt+.72,K-.56,-1.56);const qt=new b(new zt(.13,.13,.04,10),o);qt.rotation.x=Math.PI*.5,qt.position.set(Dt+.66,K-.56,-1.41),c.add(Kt,qt)}})});for(const K of[6.3,8.35,10.35,17,18.8])for(const nt of[-3.4,-6.5]){const Dt=Math.abs(Math.round(K+nt))%4,it=new b(new Ce(1.12,1.2),D[Dt]);it.rotation.y=-Math.PI*.5,it.position.set(2.77,K,nt),c.add(it);const wt=Ql(1.2,1.22,.32,a,{hasPlant:!0,laundryColor:null,potMat:S,plantMat:v});wt.rotation.y=-Math.PI*.5,wt.position.set(2.77,K,nt),c.add(wt)}const O=19.8,G=new b(new U(8.1,.62,.24),s);G.position.set(6.8,O+.31,-1.8);const W=G.clone();W.position.z=-8.2;const q=new b(new U(.24,.62,6.6),s);q.position.set(2.88,O+.31,-5);const V=q.clone();V.position.x=10.72,c.add(G,W,q,V);const ct=new b(new U(2.4,1.9,2.2),r);ct.position.set(8.8,O+.95,-6.4),c.add(ct);const dt=new Y({color:12240078,roughness:.32,metalness:.78});for(const K of[4.2,5.45]){const nt=new b(new zt(.46,.46,1.25,14),dt);nt.position.set(K,O+.96,-6.5);const Dt=new b(new zt(.36,.46,.42,6),o);Dt.position.set(K,O+.22,-6.5),c.add(nt,Dt)}const _t=new Jt;_t.position.set(6.8,O+.62,-6.8);const Wt=new b(new zt(.22,.22,1.5,12),dt);Wt.rotation.z=Math.PI*.5,Wt.position.set(0,.52,-.35);const Vt=new b(new U(1.42,.08,1.1),new Y({color:1714240,roughness:.2,metalness:.65}));Vt.rotation.x=.52,Vt.position.set(0,.16,.12),_t.add(Wt,Vt),c.add(_t);const Q=Te({text:"重庆 · 山城",width:512,height:152,bg:"#1c090a",fg:"#ff6e5a",border:"#e84438",glow:"#ff3626",fontSize:72}),pt=new Y({map:Q,emissiveMap:Q,emissive:new gt(16732736),emissiveIntensity:.88}),vt=new b(new U(4.6,1.32,.18),[o,o,o,o,pt,o]);vt.position.set(6.5,O+1.38,-2.25),c.add(vt);for(const K of[4.6,8.4]){const nt=new b(new U(.12,1.3,.12),o);nt.position.set(K,O+.68,-2.25),c.add(nt)}const mt=Te({text:"雾都山城",width:128,height:448,bg:"#161f2b",fg:"#68e3ff",border:"#3cc8eb",glow:"#24b4e0",vertical:!0,fontSize:72}),Ut=new Y({map:mt,emissiveMap:mt,emissive:new gt(5231871),emissiveIntensity:.86}),Nt=new b(new U(.76,3.3,.18),[o,o,o,o,Ut,Ut]);Nt.position.set(2.34,18,-2.15),c.add(Nt);const kt=new b(new U(7.7,.14,6.2),l);kt.position.set(6.8,O+.08,-5),kt.visible=!1,c.add(kt),n.push(kt);const Bt=new Jt;Bt.name="MonorailViaduct",t.add(Bt);const $=new b(new U(23.8,1.32,.86),r);$.position.set(0,12.26,-4.9),$.castShadow=!0,$.receiveShadow=!0,Bt.add($);const ot=new b(new U(14.3,.12,.72),o);ot.position.set(-4.6,12.32,-3.95);const R=new b(new U(14.3,.05,.05),o);R.position.set(-4.6,13.06,-3.62),Bt.add(ot,R);for(let K=-11.4;K<=2.2;K+=1.7){const nt=new b(new U(.05,.78,.05),o);nt.position.set(K,12.72,-3.62),Bt.add(nt)}for(const K of[-9.4,-2.2]){const nt=new b(new U(1.15,7.2,1.15),r);nt.position.set(K,8.2,-4.9);const Dt=new b(new U(1.65,.55,1.65),r);Dt.position.set(K,11.4,-4.9);const it=new b(new U(1.2,.24,1.2),o);it.position.set(K,11.66,-4.9),Bt.add(nt,Dt,it)}const Mt=n_();Mt.position.set(-1.5,12.3,-4.9),t.add(Mt),e.push({update:K=>{if(K.convergence){const nt=-.2+Math.sin(K.convergenceProgress*Math.PI*2)*1.4;Mt.position.x=Ae.lerp(Mt.position.x,nt,Math.min(1,K.dt*4))}else{const nt=-1.2+Math.sin(K.time*.42)*4.2;Mt.position.x=nt}}});const et=new Jt;et.name="YangtzeRiverCableway",t.add(et);const ht=new A(-10.8,24.2,-1.6),st=new A(10.8,24.6,-.6),Ft=[],ut=tc(19.2,o,Ft);ut.position.set(ht.x,5,ht.z);const P=tc(19.6,o,Ft);P.position.set(st.x,5,st.z),et.add(ut,P);const w=new Rn([ht.clone().add(new A(0,-.35,0)),ht.clone().lerp(st,.25).add(new A(0,-1.05,0)),ht.clone().lerp(st,.5).add(new A(0,-1.32,0)),ht.clone().lerp(st,.75).add(new A(0,-1.05,0)),st.clone().add(new A(0,-.35,0))]),H=new Y({color:1975084,roughness:.4,metalness:.85});for(const K of[-.28,.28]){const nt=new b(new Xe(w,32,.036,6,!1),H);nt.position.z=K,et.add(nt)}const J=new b(new Xe(w,32,.022,6,!1),H);J.position.y=.34,et.add(J);const rt=i_();et.add(rt);const tt=st.clone().sub(ht).normalize(),Lt=Math.atan2(tt.z,tt.x);return e.push({update:K=>{let nt=.42+Math.sin(K.time*.22+.2)*.26;K.convergence&&(nt=.4+Math.sin(K.convergenceProgress*Math.PI*2)*.12);const Dt=w.getPointAt(Ae.clamp(nt,.14,.72));rt.position.copy(Dt),rt.rotation.y=-Lt,rt.rotation.x=Math.sin(K.time*1.15)*.035;const it=.65+.65*Math.sin(K.time*3.8);for(const wt of Ft)wt.emissiveIntensity=it}}),{group:t,animated:e,snowCaps:n,monorailTrainGroup:Mt,cablewayCabinGroup:rt}}function Ql(i,t,e,n,s){const r=new Jt,o=.016,a=new b(new U(i,o*2,o*2),n);a.position.set(0,-t*.5,e);const l=a.clone();l.position.y=t*.5,r.add(a,l);for(const c of[-t*.5,0,t*.5])for(const h of[-i*.5,i*.5]){const u=new b(new U(o*2,o*2,e),n);u.position.set(h,c,e*.5),r.add(u)}for(let c=0;c<=5;c++){const h=-i*.5+c/5*i,u=new b(new U(o*1.8,t,o*1.8),n);u.position.set(h,0,e),r.add(u)}if(s.hasPlant){const c=new b(new zt(.09,.065,.14,7),s.potMat);c.position.set(-i*.25,-t*.5+.08,e*.55);const h=new b(new Ea(.11,0),s.plantMat);h.position.set(-i*.25,-t*.5+.2,e*.55),r.add(c,h)}if(s.laundryColor!==null){const c=new b(new U(.28,.36,.04),new Y({color:s.laundryColor,roughness:.85}));c.position.set(i*.22,t*.22,e+.04),c.rotation.z=.06,r.add(c)}return r}function n_(){const i=new Jt;i.name="CRTLine2Monorail";const t=new Y({color:15133416,roughness:.26,metalness:.35}),e=new Y({color:1210450,roughness:.28,metalness:.32}),n=new Y({color:12371148,roughness:.28,metalness:.65}),s=new Y({color:2238512,roughness:.65}),r=new Y({color:1054754,roughness:.12,metalness:.85}),o=new Y({color:16773327,emissive:16767382,emissiveIntensity:.78}),a=new Y({color:2001506,roughness:.6}),l=new Y({color:16775394,emissive:16770216,emissiveIntensity:1.35}),c=new Y({color:16726832,emissive:16721952,emissiveIntensity:1.15}),h=Te({text:"2号线 · 较场口",width:320,height:64,bg:"#0c100d",fg:"#ffb83c",glow:"#ff901e",fontSize:34}),u=new Y({map:h,emissiveMap:h,emissive:new gt(16755251),emissiveIntensity:.92}),d=3.15,p=1.96,g=3.45,x=[-1.5,-.5,.5,1.5];for(let m=0;m<4;m++){const f=x[m]*g,y=new Jt;y.position.x=f,i.add(y);for(const v of[-.66,.66]){const C=new b(new U(d*.96,.82,.34),s);C.position.set(0,.42,v),y.add(C)}const M=new b(new U(d-.14,1.38,p-.24),o);M.position.y=1.65,y.add(M);const _=new b(new U(d-.5,.2,.32),a);_.position.set(0,1.18,-.56),y.add(_);for(let v=-1;v<=1;v+=.4){const C=new b(new Ai(.05,.012,6,10),a);C.position.set(v,2.12,.2),y.add(C)}const L=new b(new U(d,.64,p),n);L.position.y=1.04;const T=new b(new U(d+.02,.28,p+.02),e);T.position.y=1.18;const D=new b(new U(d,.36,p),t);D.position.y=2.42,y.add(L,T,D);const I=new b(new U(d,.22,p*.88),t);I.position.y=2.68;const S=new b(new U(1.05,.18,1.02),n);S.position.y=2.86,y.add(I,S);for(const v of[-1,1])for(const C of[-1.48,-.52,.52,1.48]){const N=new b(new U(.16,.88,.08),t);N.position.set(C,1.82,v*(p*.5-.03)),y.add(N)}if(m===0||m===3){const v=m===0?-1:1,C=new Jt;C.position.x=v*(d*.5),y.add(C);const N=new b(new U(.86,1.85,p*.94),t);N.position.set(v*.38,1.68,0);const F=new b(new U(.92,.56,p*.96),e);F.position.set(v*.42,1.08,0);const O=new b(new U(.42,.78,p*.84),r);O.position.set(v*.64,1.98,0),O.rotation.z=-v*.28,C.add(N,F,O);const G=new b(new Ce(1.16,.2),u);G.rotation.y=v>0?Math.PI*.5:-Math.PI*.5,G.position.set(v*.82,2.45,0),C.add(G);for(const W of[-.54,.54]){const q=new b(new U(.1,.14,.24),v<0?l:c);q.position.set(v*.85,1.15,W),C.add(q)}}}for(const m of[-g,0,g]){const f=new b(new U(.36,1.96,1.54),s);f.position.set(m,1.66,0),i.add(f)}return i}function tc(i,t,e){const n=new Jt,s=.72,r=.34;for(const u of[-1,1])for(const d of[-1,1]){const p=new A(u*s,0,d*s),g=new A(u*r,i,d*r),x=new is(p,g);n.add(new b(new Xe(x,2,.065,6,!1),t))}const o=7;for(let u=0;u<o;u++){const d=u/o*i,p=(u+1)/o*i,g=Ae.lerp(s,r,u/o),x=Ae.lerp(s,r,(u+1)/o),m=new U(x*2,.06,.06),f=new U(.06,.06,x*2);for(const y of[-1,1]){const M=new b(m,t);M.position.set(0,p,y*x);const _=new b(f,t);_.position.set(y*x,p,0),n.add(M,_);const L=new is(new A(-g,d,y*g),new A(x,p,y*x)),T=new is(new A(g,d,y*g),new A(-x,p,y*x));n.add(new b(new Xe(L,2,.028,4,!1),t),new b(new Xe(T,2,.028,4,!1),t))}}const a=new b(new U(1.1,.24,1.35),t);a.position.set(0,i-.32,0),n.add(a);const l=new Y({color:16726832,emissive:16721948,emissiveIntensity:1.2});e.push(l);const c=new b(new qe(.15,10,8),l);c.position.set(0,i+.24,0);const h=new b(new qe(.55,10,8),Fr(16726056,.3,2.1));return h.position.copy(c.position),n.add(c,h),n}function i_(){const i=new Jt,t=new Y({color:3159616,roughness:.4,metalness:.78}),e=new Y({color:12855332,roughness:.3,metalness:.22}),n=new Y({color:15721419,roughness:.34,metalness:.12}),s=new Y({color:16770480,emissive:16762478,emissiveIntensity:.82}),r=new b(new U(1.75,.16,.72),t);r.position.set(0,.08,0),i.add(r);const o=new zt(.12,.12,.08,12);o.rotateX(Math.PI*.5);for(const f of[-.62,-.22,.22,.62])for(const y of[-.28,.28]){const M=new b(o,t);M.position.set(f,.06,y),i.add(M)}const a=new Rn([new A(0,.05,0),new A(0,-.65,-.34),new A(0,-1.55,0)]);i.add(new b(new Xe(a,12,.065,8,!1),t));const l=new Jt;l.position.y=-2.35,i.add(l);const c=new b(new U(2.38,1.15,1.16),s);c.position.y=.05,l.add(c);const h=new Y({color:2892832,roughness:.8});for(const f of[-.7,-.15,.4,.85]){const y=new b(new zt(.08,.1,.65,7),h);y.position.set(f,-.12,.12),l.add(y)}const u=new b(new U(2.58,.54,1.36),e);u.position.y=-.42;const d=new b(new U(2.62,.24,1.38),n);d.position.y=.68;const p=new b(new U(2.64,.12,1.4),e);p.position.y=.52,l.add(u,d,p);for(const f of[-.66,.66])for(const y of[-1.24,-.42,.42,1.24]){const M=new b(new U(.08,.66,.08),n);M.position.set(y,.16,f),l.add(M)}const g=Te({text:"长江索道",width:256,height:64,bg:"#b82420",fg:"#fff3d4",fontSize:40}),x=new Y({map:g,roughness:.35}),m=new b(new Ce(1.3,.32),x);return m.position.set(0,-.42,.69),l.add(m),i}function s_(i,t){const e=new Jt;e.name="WeatherAndLighting";const n={uZenith:{value:new gt(593178)},uMid:{value:new gt(1450552)},uHorizon:{value:new gt(2958384)},uSunGlow:{value:0}},s=new ze({side:Je,depthWrite:!1,uniforms:n,vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform float uSunGlow;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        float upper = smoothstep(0.46, 0.92, h);
        float lower = smoothstep(0.28, 0.52, h);
        vec3 col = mix(uHorizon, uMid, lower);
        col = mix(col, uZenith, upper);

        // Subtle warm apricot golden-hour sun glow on horizon in sunny mode
        vec3 sunDir = normalize(vec3(0.58, 0.34, -0.74));
        float sunDot = clamp(dot(normalize(vDir), sunDir), 0.0, 1.0);
        float sunHalo = pow(max(sunDot, 1e-5), 9.0) * 0.32 * uSunGlow;
        col += vec3(1.0, 0.78, 0.52) * sunHalo;

        gl_FragColor = vec4(min(col, vec3(0.84)), 1.0);
      }
    `}),r=new b(new qe(140,28,18),s);e.add(r);const o=new ud(5401494,2497818,.85);e.add(o);const a=new wl(10270952,1.35);a.position.set(22,34,24),a.castShadow=!0,a.shadow.mapSize.set(2048,2048),a.shadow.camera.near=6,a.shadow.camera.far=85,a.shadow.camera.left=-22,a.shadow.camera.right=22,a.shadow.camera.top=28,a.shadow.camera.bottom=-18,a.shadow.bias=-6e-4,e.add(a);const l=new wl(16751708,.72);l.position.set(-24,18,-18),e.add(l);let c=8848;const h=()=>(c=c*1664525+1013904223>>>0,c/4294967296),u=760,d=new zt(.0055,.0055,1.18,4),p=new jn({color:9747686,transparent:!0,opacity:.17,depthWrite:!1}),g=new us(d,p,u),x=[];for(let Bt=0;Bt<u;Bt++)x.push({x:(h()-.5)*25,y:h()*34-2,z:(h()-.5)*18,speed:22+h()*12,len:.65+h()*.65});e.add(g);const m=700,f=new Aa(.065,0),y=new jn({color:11387094,transparent:!0,opacity:.76,depthWrite:!1}),M=new us(f,y,m),_=[];for(let Bt=0;Bt<m;Bt++)_.push({x:(h()-.5)*28,y:h()*34-2,z:(h()-.5)*22,speed:1.8+h()*1.6,phase:h()*Math.PI*2,scale:.55+h()*.85});e.add(M);const L=new gt(593436),T=new gt(1451066),D=new gt(2761523),I=new gt(1317675),S=new gt(4949908),v=new gt(8959150),C=new gt(15053442),N=new gt(12953741),F=new gt(1120813),O=new gt(2306892),G=new gt(3818070),W=new gt(2174016),q=new gt(9416928),V=new gt(16768936),ct=new gt(10927577),dt=new gt(5401494),_t=new gt(11457756),Wt=new gt(7572912),Vt=new gt(2891802),Q=new gt(7230526),pt=new gt(3553863),vt=new Le,mt=t.map(Bt=>Bt.intensity),Ut=new gt,Nt=(Bt,$,ot,R,Mt,et,ht)=>{Bt.setRGB($.r*ot+R.r*Mt+et.r*ht,$.g*ot+R.g*Mt+et.g*ht,$.b*ot+R.b*Mt+et.b*ht)};return{group:e,animated:{update:Bt=>{const $=Bt.rainWeight,ot=Bt.sunWeight,R=Bt.snowWeight;Nt(n.uZenith.value,L,$,S,ot,F,R),Nt(n.uMid.value,T,$,v,ot,O,R),Nt(n.uHorizon.value,D,$,C,ot,G,R),n.uSunGlow.value=ot,i.fog instanceof Dr&&(Nt(Ut,I,$,N,ot,W,R),i.fog.color.copy(Ut),i.fog.density=$*.0068+ot*.0038+R*.0062),Nt(a.color,q,$,V,ot,ct,R),a.intensity=$*1.25+ot*2.15+R*1.05,Nt(o.color,dt,$,_t,ot,Wt,R),Nt(o.groundColor,Vt,$,Q,ot,pt,R),o.intensity=$*.82+ot*1.28+R*.78,l.intensity=$*.78+ot*.65+R*.62;const Mt=$*1.05+ot*.45+R*1.12;for(let et=0;et<t.length;et++)t[et].intensity=mt[et]*Mt;if(g.visible=$>.05,g.visible){p.opacity=.17*$;const et=Bt.time;for(let ht=0;ht<u;ht++){const st=x[ht],Ft=30-((et*st.speed+st.y*1.7)%33+33)%33,ut=st.x+(30-Ft)*.075;vt.position.set(ut,Ft,st.z),vt.rotation.set(0,0,-.075),vt.scale.set(1,st.len,1),vt.updateMatrix(),g.setMatrixAt(ht,vt.matrix)}g.instanceMatrix.needsUpdate=!0}if(M.visible=R>.05,M.visible){y.opacity=.74*R;const et=Bt.time;for(let ht=0;ht<m;ht++){const st=_[ht],Ft=30-((et*st.speed+st.y*1.3)%33+33)%33,ut=Math.sin(et*.85+st.phase)*.9,P=Math.cos(et*.72+st.phase*1.3)*.65;vt.position.set(st.x+ut,Ft,st.z+P),vt.rotation.set(et*.5+st.phase,et*.7,0),vt.scale.setScalar(st.scale),vt.updateMatrix(),M.setMatrixAt(ht,vt.matrix)}M.instanceMatrix.needsUpdate=!0}}},keyLight:a,rimLight:l,hemiLight:o,skyUniforms:n}}class r_{ctx=null;masterGain=null;rainGain=null;rainFilter=null;humGain=null;isPlaying=!1;weather="rain";melodyTimer=null;bellTimer=null;stepIdx=0;pentatonicHz=[293.66,329.63,369.99,440,493.88,587.33,659.25,739.99,880];melodyPattern=[0,3,4,5,3,2,1,0,3,5,6,5,4,3,1,2];get playing(){return this.isPlaying}toggle(){return this.isPlaying?this.stop():this.start(),this.isPlaying}setWeather(t){if(this.weather=t,!this.ctx||!this.rainGain||!this.rainFilter)return;const e=this.ctx.currentTime;t==="rain"?(this.rainGain.gain.setTargetAtTime(.11,e,.5),this.rainFilter.frequency.setTargetAtTime(980,e,.5)):t==="sun"?(this.rainGain.gain.setTargetAtTime(.032,e,.5),this.rainFilter.frequency.setTargetAtTime(420,e,.5)):(this.rainGain.gain.setTargetAtTime(.048,e,.5),this.rainFilter.frequency.setTargetAtTime(560,e,.5))}triggerConvergenceChime(){!this.isPlaying||!this.ctx||!this.masterGain||(this.playBronzeBell(440),window.setTimeout(()=>{this.isPlaying&&this.playSubwayChime()},650))}start(){if(this.isPlaying)return;const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this.ctx||(this.ctx=new t,this.setupGraph()),this.ctx.state==="suspended"&&this.ctx.resume(),this.isPlaying=!0;const e=this.ctx.currentTime;this.masterGain?.gain.cancelScheduledValues(e),this.masterGain?.gain.setTargetAtTime(.42,e,.45),this.setWeather(this.weather),this.scheduleLoops()}stop(){if(this.isPlaying&&(this.isPlaying=!1,this.melodyTimer!==null&&(window.clearInterval(this.melodyTimer),this.melodyTimer=null),this.bellTimer!==null&&(window.clearInterval(this.bellTimer),this.bellTimer=null),this.ctx&&this.masterGain)){const t=this.ctx.currentTime;this.masterGain.gain.cancelScheduledValues(t),this.masterGain.gain.setTargetAtTime(1e-4,t,.25)}}setupGraph(){if(!this.ctx)return;const t=this.ctx.createDynamicsCompressor();t.threshold.value=-16,t.knee.value=18,t.ratio.value=4,t.attack.value=.015,t.release.value=.25,this.masterGain=this.ctx.createGain(),this.masterGain.gain.value=1e-4,this.masterGain.connect(t),t.connect(this.ctx.destination);const e=this.ctx.sampleRate*4,n=this.ctx.createBuffer(2,e,this.ctx.sampleRate);for(let c=0;c<2;c++){const h=n.getChannelData(c);let u=0;for(let d=0;d<e;d++){const p=Math.random()*2-1;u=(u+.045*p)/1.045,h[d]=u*2.4}}const s=this.ctx.createBufferSource();s.buffer=n,s.loop=!0,this.rainFilter=this.ctx.createBiquadFilter(),this.rainFilter.type="lowpass",this.rainFilter.frequency.value=980,this.rainFilter.Q.value=.6;const r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=110,this.rainGain=this.ctx.createGain(),this.rainGain.gain.value=.11,s.connect(this.rainFilter),this.rainFilter.connect(r),r.connect(this.rainGain),this.rainGain.connect(this.masterGain),s.start();const o=this.ctx.createOscillator();o.type="sine",o.frequency.value=73.42;const a=this.ctx.createOscillator();a.type="triangle",a.frequency.value=110;const l=this.ctx.createBiquadFilter();l.type="lowpass",l.frequency.value=210,this.humGain=this.ctx.createGain(),this.humGain.gain.value=.042,o.connect(l),a.connect(l),l.connect(this.humGain),this.humGain.connect(this.masterGain),o.start(),a.start()}scheduleLoops(){this.playGuqinFeltNote(this.pentatonicHz[0]),this.melodyTimer=window.setInterval(()=>{if(!this.isPlaying)return;const t=this.melodyPattern[this.stepIdx%this.melodyPattern.length];this.stepIdx++,this.playGuqinFeltNote(this.pentatonicHz[t]),this.stepIdx%4===0&&window.setTimeout(()=>{this.isPlaying&&this.playGuqinFeltNote(this.pentatonicHz[(t+3)%this.pentatonicHz.length]*.5,.06)},280)},1500),this.bellTimer=window.setInterval(()=>{this.isPlaying&&(this.stepIdx%2===0?this.playBronzeBell(392):this.playSubwayChime())},11e3)}playGuqinFeltNote(t,e=.11){if(!this.ctx||!this.masterGain)return;const n=this.ctx.currentTime,s=this.ctx.createOscillator();s.type="triangle",s.frequency.setValueAtTime(t,n),s.frequency.exponentialRampToValueAtTime(t*1.002,n+.14),s.frequency.exponentialRampToValueAtTime(t,n+.45);const r=this.ctx.createOscillator();r.type="sine",r.frequency.setValueAtTime(t*2,n);const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.setValueAtTime(Math.min(1800,t*3.4),n),o.frequency.exponentialRampToValueAtTime(Math.max(320,t*1.25),n+1.9);const a=this.ctx.createGain();a.gain.setValueAtTime(1e-4,n),a.gain.linearRampToValueAtTime(e,n+.035),a.gain.exponentialRampToValueAtTime(1e-4,n+2.6);const l=this.ctx.createGain();l.gain.value=.22,s.connect(o),r.connect(l),l.connect(o),o.connect(a),a.connect(this.masterGain),s.start(n),r.start(n),s.stop(n+2.75),r.stop(n+2.75)}playBronzeBell(t){if(!this.ctx||!this.masterGain)return;const e=this.ctx.currentTime,n=[[1,.085,3.2],[2.02,.032,2],[2.98,.014,1.4]];for(const[s,r,o]of n){const a=this.ctx.createOscillator();a.type="sine",a.frequency.value=t*s;const l=this.ctx.createGain();l.gain.setValueAtTime(1e-4,e),l.gain.linearRampToValueAtTime(r,e+.02),l.gain.exponentialRampToValueAtTime(1e-4,e+o),a.connect(l),l.connect(this.masterGain),a.start(e),a.stop(e+o+.1)}}playSubwayChime(){if(!this.ctx||!this.masterGain)return;[587.33,739.99].forEach((e,n)=>{if(!this.ctx||!this.masterGain)return;const s=this.ctx.currentTime+n*.34,r=this.ctx.createOscillator();r.type="sine",r.frequency.value=e;const o=this.ctx.createGain();o.gain.setValueAtTime(1e-4,s),o.gain.linearRampToValueAtTime(.065,s+.025),o.gain.exponentialRampToValueAtTime(1e-4,s+1.15),r.connect(o),o.connect(this.masterGain),r.start(s),r.stop(s+1.25)})}}const o_=[{id:"cableway",code:"TIER +1 · A01",elevation:"+21m",title:"长江索道 · 空中客车",desc:"红白复古轿厢与X型钢桁架塔，凌空掠过山城屋脊",side:"left",tier:"sky",localPos:new A(-4.2,20.6,-1.2)},{id:"monorail",code:"TIER +1 · A02",elevation:"+13m",title:"2号线跨座式单轨",desc:"四节编组绿银流线列车，橡胶轮裙跨抱高架轨道梁",side:"left",tier:"sky",localPos:new A(-5.2,13.8,-4.9)},{id:"diaojiaolou",code:"TIER 0 · B01",elevation:"+4m",title:"巴渝吊脚楼 · 重庆老火锅",desc:"小青瓦飞檐、美人靠廊台与九宫格热气实景内堂",side:"left",tier:"street",localPos:new A(-7.6,4.2,.8)},{id:"subway",code:"TIER -1 · C01",elevation:"-10m",title:"穿山地铁 · 洪崖雨巷站",desc:"盾构拱肋站台、黄盲道与红银流线型地铁剖面",side:"left",tier:"subway",localPos:new A(-5,-7.2,4)},{id:"liziba",code:"TIER +1 · A03",elevation:"+16m",title:"李子坝单轨穿楼",desc:"7层马赛克居民楼、凸出防盗网与三至五层镂空涵洞",side:"right",tier:"sky",localPos:new A(6.8,15.8,-1.7)},{id:"banyan",code:"TIER 0 · B02",elevation:"+4m",title:"山城黄桷树 · 青石梯坎",desc:"青苔堡坎气生根、羽状枝叶冠层与雨夜青石阶梯",side:"right",tier:"street",localPos:new A(1.8,5.2,-.8)},{id:"taxi",code:"TIER 0 · B03",elevation:"0m",title:"黄色“法拉利”与湿润街巷",desc:"渝A黄色出租车、霓虹水洼倒影、雨伞行人与电瓶车",side:"right",tier:"street",localPos:new A(4.5,1.1,5.2)},{id:"cave",code:"TIER -1 · C02",elevation:"-10m",title:"防空洞地下老火锅",desc:"1969人防红砖拱洞、爱迪生灯串与沸腾九宫格餐桌",side:"right",tier:"subway",localPos:new A(7.6,-6.5,4.5)}];class a_{layerEl;svgEl;cardsContainer;nodes=[];visible=!1;cardWidth=224;sideMargin=20;minGap=10;tmpVec=new A;constructor(){this.layerEl=document.getElementById("callout-layer"),this.svgEl=document.getElementById("callout-svg"),this.cardsContainer=document.getElementById("callout-cards"),this.buildDOM()}buildDOM(){const t="http://www.w3.org/2000/svg";this.cardsContainer.innerHTML="",this.svgEl.innerHTML="";for(const e of o_){const n=document.createElement("div");n.className=`cad-card side-${e.side}`,n.dataset.id=e.id,n.innerHTML=`
        <div class="cad-card-head">
          <span class="cad-code">${e.code}</span>
          <span class="cad-elev">${e.elevation}</span>
        </div>
        <div class="cad-title">${e.title}</div>
        <div class="cad-desc">${e.desc}</div>
      `,this.cardsContainer.appendChild(n);const s=document.createElementNS(t,"path");s.setAttribute("fill","none"),s.setAttribute("stroke","rgba(218, 180, 114, 0.78)"),s.setAttribute("stroke-width","1.35");const r=document.createElementNS(t,"circle");r.setAttribute("r","5.5"),r.setAttribute("fill","none"),r.setAttribute("stroke","rgba(242, 209, 146, 0.85)"),r.setAttribute("stroke-width","1.2");const o=document.createElementNS(t,"circle");o.setAttribute("r","2.5"),o.setAttribute("fill","#ffe7b3"),this.svgEl.appendChild(s),this.svgEl.appendChild(r),this.svgEl.appendChild(o),this.nodes.push({anchor:e,el:n,line:s,dot:o,ring:r})}}setVisible(t){this.visible=t,this.layerEl.classList.toggle("visible",t),this.layerEl.setAttribute("aria-hidden",t?"false":"true")}update(t,e,n,s){if(!this.visible)return;this.svgEl.setAttribute("viewBox",`0 0 ${n} ${s}`);const r=122,o=s-88,a=l=>{const c=this.nodes.filter(u=>u.anchor.side===l).map(u=>{const d=e[u.anchor.tier];this.tmpVec.copy(u.anchor.localPos),d.localToWorld(this.tmpVec),this.tmpVec.project(t);const p=(this.tmpVec.x*.5+.5)*n,g=(-this.tmpVec.y*.5+.5)*s,x=Math.max(66,u.el.offsetHeight||72);return{node:u,ax:p,ay:g,h:x,y:g-x*.5}});c.sort((u,d)=>u.ay-d.ay);for(let u=0;u<c.length;u++)u===0?c[u].y=Math.max(r,c[u].y):c[u].y=Math.max(c[u].y,c[u-1].y+c[u-1].h+this.minGap);for(let u=c.length-1;u>=0;u--)u===c.length-1?c[u].y=Math.min(c[u].y,o-c[u].h):c[u].y=Math.min(c[u].y,c[u+1].y-c[u].h-this.minGap),c[u].y=Math.max(r,c[u].y);const h=l==="left"?this.sideMargin:n-this.sideMargin-this.cardWidth;for(const u of c){const{node:d,ax:p,ay:g,h:x,y:m}=u;d.el.style.left=`${Math.round(h)}px`,d.el.style.top=`${Math.round(m)}px`;const f=Ae.clamp(p,12,n-12),y=Ae.clamp(g,12,s-12),M=l==="left"?h+this.cardWidth:h,_=m+x*.5,L=l==="left"?M+24:M-24;d.line.setAttribute("d",`M ${M.toFixed(1)} ${_.toFixed(1)} L ${L.toFixed(1)} ${_.toFixed(1)} L ${f.toFixed(1)} ${y.toFixed(1)}`),d.dot.setAttribute("cx",f.toFixed(1)),d.dot.setAttribute("cy",y.toFixed(1)),d.ring.setAttribute("cx",f.toFixed(1)),d.ring.setAttribute("cy",y.toFixed(1))}};a("left"),a("right")}computeQualityMetrics(t,e){if(!this.visible)return{calloutCount:0,calloutOverlaps:0,calloutOutOfBounds:0};const n=this.nodes.map(c=>c.el.getBoundingClientRect()),r=["hud-header","hud-topright","hud-dock"].map(c=>document.getElementById(c)?.getBoundingClientRect()).filter(c=>!!c);let o=0,a=0;const l=(c,h)=>c.left<h.right-1&&c.right>h.left+1&&c.top<h.bottom-1&&c.bottom>h.top+1;for(let c=0;c<n.length;c++){const h=n[c];(h.left<0||h.top<0||h.right>t||h.bottom>e)&&a++;for(let u=c+1;u<n.length;u++)l(h,n[u])&&o++;for(const u of r)l(h,u)&&o++}return{calloutCount:n.length,calloutOverlaps:o,calloutOutOfBounds:a}}}const Cs={hero:{pos:new A(30.2,16.2,51.8),target:new A(0,3.8,-.8)},street:{pos:new A(-14.6,3.8,17.8),target:new A(1.6,7.6,-2.5)},explode:{pos:new A(35.8,19.6,61.5),target:new A(0,8.2,-1)}};class l_{container;renderer;scene;camera;controls;composer;bloomPass;sharedUniforms=Vg();animated=[];soundscape=new r_;callouts=new a_;tierSubwayGroup;tierStreetGroup;tierSkyGroup;skySnowCaps=[];view="hero";weather="rain";exploded=!1;convergence=!1;convergenceProgress=0;autoOrbit=!1;simTime=0;explodeFactor=0;rainWeight=1;sunWeight=0;snowWeight=0;targetCamPos=Cs.hero.pos.clone();targetCamLook=Cs.hero.target.clone();cameraTransitioning=!1;lastFrameMs=performance.now();fpsSmoothed=60;rafId=0;constructor(){this.container=document.getElementById("canvas-root"),this.renderer=new tg({antialias:!0,powerPreference:"high-performance",preserveDrawingBuffer:!1}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.outputColorSpace=Ie,this.renderer.toneMapping=da,this.renderer.toneMappingExposure=1.04,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=nc,this.renderer.info.autoReset=!1,this.container.appendChild(this.renderer.domElement),this.scene=new Tu,this.scene.fog=new Dr(1317675,.0068),this.scene.environment=Hg(this.renderer),this.camera=new hn(39,window.innerWidth/window.innerHeight,.2,260),this.camera.position.copy(Cs.hero.pos),this.controls=new ng(this.camera,this.renderer.domElement),this.controls.target.copy(Cs.hero.target),this.controls.enableDamping=!0,this.controls.dampingFactor=.07,this.controls.minDistance=8,this.controls.maxDistance=82,this.controls.maxPolarAngle=Math.PI*.56,this.controls.minPolarAngle=.18,this.controls.update(),this.controls.addEventListener("start",()=>{this.cameraTransitioning=!1,this.autoOrbit=!1});const t=new gn(window.innerWidth,window.innerHeight,{type:An,samples:4});this.composer=new Mg(this.renderer,t),this.composer.addPass(new wg(this.scene,this.camera)),this.bloomPass=new ds(new lt(window.innerWidth,window.innerHeight),.34,.42,.92),this.composer.addPass(this.bloomPass),this.composer.addPass(new bg),this.buildScene(),this.bindUI(),this.registerAutomationHooks(),window.addEventListener("resize",()=>this.onResize()),this.stepSimulation(.016),this.startLoop()}buildScene(){const t=Eg(),e=qg(t);this.scene.add(e.group),this.animated.push(...e.animated);const n=Zg(t);this.tierSubwayGroup=n.group,this.scene.add(this.tierSubwayGroup),this.animated.push(...n.animated);const s=jg(t,this.sharedUniforms);this.tierStreetGroup=s.group,this.scene.add(this.tierStreetGroup),this.animated.push(...s.animated);const r=e_(t);this.tierSkyGroup=r.group,this.skySnowCaps=r.snowCaps,this.scene.add(this.tierSkyGroup),this.animated.push(...r.animated);const o=[...n.warmLights,...s.warmLights],a=s_(this.scene,o);this.scene.add(a.group),this.animated.push(a.animated)}bindUI(){document.querySelectorAll("[data-view]").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.view;this.setView(s,!1)})}),document.querySelectorAll("[data-weather]").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.weather;this.setWeather(s,!1)})}),document.getElementById("btn-convergence").addEventListener("click",()=>{this.toggleConvergence()});const e=document.getElementById("btn-audio");e.addEventListener("click",()=>{const n=this.soundscape.toggle();e.classList.toggle("playing",n)}),window.addEventListener("keydown",n=>{if(!(n.target instanceof HTMLInputElement||n.target instanceof HTMLTextAreaElement)){if(n.key==="1")this.setView("hero",!1);else if(n.key==="2")this.setView("street",!1);else if(n.key==="3"){const s=["rain","sun","snow"],r=s[(s.indexOf(this.weather)+1)%s.length];this.setWeather(r,!1)}else if(n.key==="4")this.setView(this.view==="explode"?"hero":"explode",!1);else if(n.code==="Space")n.preventDefault(),this.toggleConvergence();else if(n.key==="m"||n.key==="M"){const s=this.soundscape.toggle();e.classList.toggle("playing",s)}}})}syncHUD(){document.querySelectorAll("[data-view]").forEach(s=>{s.classList.toggle("active",s.dataset.view===this.view)}),document.querySelectorAll("[data-weather]").forEach(s=>{s.classList.toggle("active",s.dataset.weather===this.weather)}),document.getElementById("btn-convergence")?.classList.toggle("active",this.convergence),document.body.classList.toggle("weather-sun",this.weather==="sun"),document.body.classList.toggle("weather-snow",this.weather==="snow");const t=document.getElementById("status-sky"),e=document.getElementById("status-street"),n=document.getElementById("status-sub");t&&e&&n&&(this.convergence?(t.textContent="+16m 单轨·索道交汇",e.textContent="0m 渝A车流齐聚",n.textContent="-10m 地铁进站"):this.exploded?(t.textContent="+16m 天空层拆解",e.textContent="0m 街巷层拆解",n.textContent="-10m 地下层拆解"):(t.textContent="+16m 单轨穿楼",e.textContent="0m 梯坎老街",n.textContent="-10m 穿山地铁"))}setView(t,e){this.view=t,this.exploded=t==="explode";const n=Cs[t];this.targetCamPos.copy(n.pos),this.targetCamLook.copy(n.target),e?(this.camera.position.copy(n.pos),this.controls.target.copy(n.target),this.controls.update(),this.cameraTransitioning=!1,this.explodeFactor=this.exploded?1:0):this.cameraTransitioning=!0,this.callouts.setVisible(this.exploded),this.syncHUD()}setWeather(t,e){this.weather=t,this.soundscape.setWeather(t),e&&(this.rainWeight=t==="rain"?1:0,this.sunWeight=t==="sun"?1:0,this.snowWeight=t==="snow"?1:0),this.syncHUD()}toggleConvergence(t){this.convergence=t!==void 0?t:!this.convergence,this.convergence&&(this.convergenceProgress=0,this.soundscape.triggerConvergenceChime()),this.syncHUD()}stepSimulation(t){const e=Math.max(0,Math.min(t,.25));this.simTime+=e,this.convergence&&(this.convergenceProgress=(this.convergenceProgress+e*.22)%1);const n=Math.min(1,e*3.8);this.rainWeight=Ae.lerp(this.rainWeight,this.weather==="rain"?1:0,n),this.sunWeight=Ae.lerp(this.sunWeight,this.weather==="sun"?1:0,n),this.snowWeight=Ae.lerp(this.snowWeight,this.weather==="snow"?1:0,n);const s=this.exploded?1:0;this.explodeFactor=Ae.lerp(this.explodeFactor,s,Math.min(1,e*4.5));const r=this.explodeFactor*this.explodeFactor*(3-2*this.explodeFactor);this.tierSubwayGroup.position.y=r*-.4,this.tierStreetGroup.position.y=r*3.4,this.tierSkyGroup.position.y=r*7.6;const o=this.snowWeight>.2;for(const l of this.skySnowCaps)l.visible=o;if(this.bloomPass.strength=this.rainWeight*.34+this.sunWeight*.14+this.snowWeight*.24,this.bloomPass.threshold=this.rainWeight*.91+this.sunWeight*.96+this.snowWeight*.95,this.renderer.toneMappingExposure=this.rainWeight*1.05+this.sunWeight*1+this.snowWeight*.98,this.sharedUniforms.uTime.value=this.simTime,this.sharedUniforms.uRainWeight.value=this.rainWeight,this.sharedUniforms.uSunWeight.value=this.sunWeight,this.sharedUniforms.uSnowWeight.value=this.snowWeight,this.cameraTransitioning){const l=Math.min(1,e*5.2);this.camera.position.lerp(this.targetCamPos,l),this.controls.target.lerp(this.targetCamLook,l),this.camera.position.distanceToSquared(this.targetCamPos)<.002&&this.controls.target.distanceToSquared(this.targetCamLook)<.002&&(this.camera.position.copy(this.targetCamPos),this.controls.target.copy(this.targetCamLook),this.cameraTransitioning=!1)}else if(this.autoOrbit){const l=e*.25,c=this.camera.position.clone().sub(this.controls.target);c.applyAxisAngle(new A(0,1,0),l),this.camera.position.copy(this.controls.target).add(c)}this.controls.update();const a={time:this.simTime,dt:e,weather:this.weather,rainWeight:this.rainWeight,sunWeight:this.sunWeight,snowWeight:this.snowWeight,convergence:this.convergence,convergenceProgress:this.convergenceProgress,explodeFactor:r};for(const l of this.animated)l.update(a);this.scene.updateMatrixWorld(),this.camera.updateMatrixWorld(),this.callouts.update(this.camera,{sky:this.tierSkyGroup,street:this.tierStreetGroup,subway:this.tierSubwayGroup},window.innerWidth,window.innerHeight),this.renderer.info.reset(),this.composer.render()}startLoop(){const t=e=>{const n=Math.min(.1,Math.max(.001,(e-this.lastFrameMs)/1e3));this.lastFrameMs=e,this.fpsSmoothed=this.fpsSmoothed*.9+1/n*.1,this.stepSimulation(n),this.rafId=requestAnimationFrame(t)};this.rafId=requestAnimationFrame(t)}onResize(){const t=window.innerWidth,e=window.innerHeight;this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.renderer.setSize(t,e),this.composer.setSize(t,e),this.bloomPass.setSize(t,e)}registerAutomationHooks(){window.__setDioramaState=t=>{t.weather&&this.setWeather(t.weather,!0),t.view&&this.setView(t.view,!0),t.exploded!==void 0&&(this.exploded=t.exploded,this.explodeFactor=t.exploded?1:0,t.exploded&&this.view!=="explode"&&(this.view="explode"),this.callouts.setVisible(this.exploded),this.syncHUD()),t.convergence!==void 0&&this.toggleConvergence(t.convergence),t.autoOrbit!==void 0&&(this.autoOrbit=t.autoOrbit),t.time!==void 0&&(this.simTime=t.time),this.stepSimulation(0)},window.__advanceSimulation=t=>{this.stepSimulation(t)},window.__setCameraPose=(t,e)=>{this.cameraTransitioning=!1,this.camera.position.set(t[0],t[1],t[2]),this.controls.target.set(e[0],e[1],e[2]),this.controls.update(),this.stepSimulation(0)},window.__getDioramaMetrics=()=>{const t=this.renderer.info.render,e=this.callouts.computeQualityMetrics(window.innerWidth,window.innerHeight);return{fps:Math.round(this.fpsSmoothed),triangles:t.triangles,drawCalls:t.calls,weather:this.weather,view:this.view,exploded:this.exploded,convergence:this.convergence,calloutCount:e.calloutCount,calloutOverlaps:e.calloutOverlaps,calloutOutOfBounds:e.calloutOutOfBounds}}}}new l_;

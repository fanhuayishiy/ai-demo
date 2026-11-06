import{G as K,V as fo,c as M,m as Do,o as zo,M as b,d as po,n as C,F as Q,D as O,B as Ro,e as X,f as ho,p as go,q as mo,r as Go,s as Ao,A as Io,t as Oo,u as Ho}from"./index-8eIWcX-w.js";function Uo(l){const H=l.L,B=l.palette,h=l.u,r=new K;r.name="atmosphere";const Y=[],Z=[],U=[],F=[],$=new fo(H.ANCHOR.SUN_DIR.x,H.ANCHOR.SUN_DIR.y,H.ANCHOR.SUN_DIR.z).normalize(),oo=new fo(.45,.62,.55).normalize();function w(t,e,a,o,n){return t.transparent=!0,t.depthWrite=!1,t.fog=!1,Y.push({mat:t,dayC:new M(e),nightC:new M(a),dayO:o,nightO:n}),t}const L={uNight:{value:l.night?1:0},uTime:{value:0},uSunDir:{value:$.clone()},uMoonDir:{value:oo.clone()},uSkyTop:{value:new M(B.skyTop)},uSkyHorizon:{value:new M(B.skyHorizon)},uSkyNight:{value:new M(B.skyNight)},uSunTint:{value:new M(16765600)},uMoonTint:{value:new M(13623551)}},yo=new Do({uniforms:L,side:zo,depthWrite:!1,fog:!1,vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      precision highp float;
      varying vec3 vDir;
      uniform float uNight;
      uniform float uTime;
      uniform vec3 uSunDir;   // CPU 端已归一化
      uniform vec3 uMoonDir;  // 月亮方向常量，CPU 端已归一化
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSkyNight;
      uniform vec3 uSunTint;
      uniform vec3 uMoonTint;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        float up = clamp(h, 0.0, 1.0);

        // ---- 白天：地平线暖橘 -> 天顶蓝 ----
        vec3 day = mix(uSkyHorizon, uSkyTop, pow(up, 0.55));
        float horizonGlow = exp(-pow(abs(h) * 6.0, 1.6));
        day += uSunTint * horizonGlow * 0.16;

        // ---- 太阳方向暖辉光 + 日轮 ----
        float sd = max(dot(d, uSunDir), 0.0);
        // 同底幂合并：等价于 pow(sd, 90.0) / pow(sd, 14.0)
        float logSd = log2(max(sd, 1.0e-7));
        float sunHalo = exp2(90.0 * logSd) * 0.55 + exp2(14.0 * logSd) * 0.22;
        float sunDisk = smoothstep(0.9974, 0.9992, sd);
        day += uSunTint * (sunHalo + sunDisk * 2.3);
        day += uSunTint * (1.0 - smoothstep(0.0, 0.22, abs(h - 0.02))) * sd * 0.10;

        // 混合系数形式：严格等价于 mix(day, night, uNight)。白天 uNight→0 时
        // 夜景贡献被系数压到 0，可整段跳过且过渡连续、无跳变。
        vec3 col = day * (1.0 - uNight);

        if (uNight > 0.001) {
          // ---- 夜空：深蓝 + 地平线城市余晖 ----
          float down = 1.0 - up;
          vec3 night = mix(
            uSkyNight * 0.5,
            uSkyNight * 1.28 + vec3(0.015, 0.025, 0.05),
            down * down * down   // 等价于 pow(1.0 - up, 3.0)
          );
          float cg = abs(h - 0.02) * 13.0;
          float cityGlow = exp(-cg * cg);   // 等价于 exp(-pow(cg, 2.0))
          night += vec3(0.19, 0.11, 0.055) * cityGlow * 0.6;

          // ---- 月亮冷辉 + 月轮（方向由 CPU uniform 传入）----
          float md = max(dot(d, uMoonDir), 0.0);
          float logMd = log2(max(md, 1.0e-7));
          float moonHalo = exp2(200.0 * logMd) * 0.45 + exp2(28.0 * logMd) * 0.09;
          float moonDisk = smoothstep(0.9990, 0.9997, md);
          night += uMoonTint * (moonHalo + moonDisk * 1.7);

          // ---- 稀疏星点（hash 噪声 + 闪烁），仅上半空 ----
          vec2 sc = vec2(atan(d.z, d.x) * 1.2732, asin(clamp(h, -1.0, 1.0)) * 2.0);
          vec2 grid = sc * 46.0;
          vec2 cell = floor(grid);
          float r = hash21(cell);
          float star = step(0.984, r) * step(0.02, h);
          vec2 f = fract(grid) - 0.5;
          float shape = 1.0 - smoothstep(0.0, 0.40, length(f));
          float tw = 0.5 + 0.5 * sin(uTime * 2.3 + r * 60.0);
          float mag = hash21(cell + 7.13);
          night += vec3(0.88, 0.93, 1.0) * star * shape * (0.35 + 0.65 * tw) * (0.4 + mag);

          col += night * uNight;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `}),D=new b(new po(260,48,32),yo);D.renderOrder=-1e3,D.frustumCulled=!1,D.castShadow=!1,D.receiveShadow=!1,r.add(D);const wo=h.canvasTexture(128,128,(t,e,a)=>{const o=t.createRadialGradient(e/2,a/2,0,e/2,a/2,e/2);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(.16,"rgba(255,248,225,0.82)"),o.addColorStop(.46,"rgba(255,222,165,0.22)"),o.addColorStop(1,"rgba(255,205,150,0)"),t.fillStyle=o,t.fillRect(0,0,e,a)});function N(t,e,a,o,n,s,i){const k=new Ao({map:wo,color:new M(o),transparent:!0,blending:Io,depthWrite:!1,depthTest:!1,fog:!1,opacity:l.night?s:n}),c=new Oo(k);return c.position.copy(e),c.scale.set(a,a,1),c.renderOrder=i,t.add(c),Z.push({mat:k,day:n,night:s}),c}const _=$.clone().multiplyScalar(232),V=oo.clone().multiplyScalar(232),xo=[N(r,_,44,16767136,.95,0,-952),N(r,_,104,16758903,.5,0,-950),N(r,_,210,16751962,.22,0,-948)],Mo=[N(r,V,26,14674687,0,.8,-946),N(r,V,72,11126527,0,.32,-944),N(r,V,148,8366312,0,.12,-942)],G=new po(1,9,6),So=w(new C({color:16771016,side:Q}),16771016,3820136,.62,.38),vo=w(new C({color:10004144,side:Q}),10004144,1911880,.6,.42),to=w(new C({color:15259842,side:Q}),15259842,1846342,.3,.2),d=l.rng(2024);for(let t=0;t<9;t++){const e=new K,a=d()*Math.PI*2,o=95+d()*118;e.position.set(Math.cos(a)*o,22+d()*48,Math.sin(a)*o),e.rotation.y=d()*.8-.4;const n=4+Math.floor(d()*3),s=6+d()*9;for(let i=0;i<n;i++){const k=(i-(n-1)/2)*s*.62+(d()-.5)*s*.45,c=(d()-.35)*s*.32,z=(d()-.5)*s*.6,u=s*(.5+d()*.5),m=new b(G,vo);m.position.set(k,c-.2*u,z),m.scale.set(u,u*.6,u*.82),m.renderOrder=-620,e.add(m);const y=new b(G,So);y.position.set(k,c+.24*u,z+.06*u),y.scale.set(u*.9,u*.54,u*.78),y.renderOrder=-600,e.add(y)}r.add(e),U.push({grp:e,speed:(.28+d()*.55)*(d()>.5?1:-1)})}const g=l.rng(333);for(let t=0;t<6;t++){const e=new K,a=g()*Math.PI*2,o=175+g()*42;e.position.set(Math.cos(a)*o,9+g()*9,Math.sin(a)*o),e.rotation.y=g()*Math.PI-Math.PI/2;const n=26+g()*34,s=new b(G,to);s.scale.set(n,1.1+g()*1.3,3+g()*3),s.renderOrder=-640,e.add(s);const i=new b(G,to);i.scale.set(n*.68,.85,2.3),i.position.set(-n*.14,-.55,1.6),i.renderOrder=-640,e.add(i),r.add(e),U.push({grp:e,speed:(.07+g()*.13)*(g()>.5?1:-1)})}function eo(t,e,a,o,n,s,i){const c=l.rng(a)()*Math.PI*2,z=[],u=[];for(let R=0;R<=e;R++){const v=R/e*Math.PI*2,co=t+Math.sin(v*3+c)*5+Math.sin(v*7+c)*2,Po=s+Math.sin(v*5+c)*2.4+Math.sin(v*11+c)*1.2+Math.sin(v*23+c)*.6,lo=Math.cos(v)*co,uo=Math.sin(v)*co;if(z.push(lo,n,uo,lo,Po,uo),R<e){const P=R*2;u.push(P,P+1,P+2,P+1,P+3,P+2)}}const m=new X;m.setAttribute("position",new Ho(z,3)),m.setIndex(u),m.computeVertexNormals();const y=new b(m,o);return y.renderOrder=i,y.frustumCulled=!1,r.add(y),y}const bo=w(new C({color:10135468,side:O}),10135468,2110544,.3,.5),Co=w(new C({color:8491418,side:O}),8491418,1386560,.42,.6);eo(228,140,11,bo,-3.5,3.2,-860),eo(176,120,27,Co,-3.5,2.2,-840);const T=w(new C({color:7175304,side:O}),7175304,1452093,.5,.62),f=l.rng(909);h.instances(new Ro(1,1,1),T,26,(t,e)=>{const a=f()*Math.PI*2,o=168+f()*14,n=3.5+f()*8;e.position.set(Math.cos(a)*o,-2.5+n/2,Math.sin(a)*o),e.scale.set(1+f()*2.2,n,1+f()*1.6),e.rotation.y=-a+f()*.4},r);for(let t=0;t<4;t++){const e=Math.PI*.15+t*Math.PI*.42+f()*.3,a=172,o=Math.cos(e)*a,n=Math.sin(e)*a,s=-2.5,i=10+f()*4;h.beam([o,s,n],[o,s+i,n],.09,T,r,6),h.beam([o-2.2,s+i,n],[o+2.2,s+i,n],.06,T,r,6),h.beam([o,s+i+1.6,n],[o+2,s+i,n],.03,T,r,5),h.beam([o,s+i+1.6,n],[o-2,s+i,n],.03,T,r,5),h.beam([o,s+i,n],[o,s+i+1.6,n],.05,T,r,5)}const ao=h.canvasTexture(64,64,(t,e,a)=>{const o=t.createRadialGradient(e/2,a/2,0,e/2,a/2,e/2);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(.42,"rgba(255,255,255,0.55)"),o.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=o,t.fillRect(0,0,e,a)}),no=110,A=new Float32Array(no*3);for(let t=0;t<no;t++){const e=f()*Math.PI*2,a=166+f()*16;A[t*3]=Math.cos(e)*a,A[t*3+1]=.4+f()*6,A[t*3+2]=Math.sin(e)*a}const so=new X;so.setAttribute("position",new ho(A,3));const ro=new go({color:16757854,size:1.15,sizeAttenuation:!0,transparent:!0,opacity:l.night?.85:0,depthWrite:!1,map:ao,fog:!1}),W=new mo(so,ro);W.renderOrder=-810,W.frustumCulled=!1,r.add(W);const No=h.canvasTexture(256,256,(t,e,a)=>{const o=t.createRadialGradient(e/2,a/2,e*.05,e/2,a/2,e*.5);o.addColorStop(0,"rgba(255,255,255,0)"),o.addColorStop(.42,"rgba(255,255,255,0)"),o.addColorStop(.72,"rgba(255,252,244,0.55)"),o.addColorStop(.9,"rgba(255,250,240,0.22)"),o.addColorStop(1,"rgba(255,250,240,0)"),t.fillStyle=o,t.fillRect(0,0,e,a)}),To=new Go(230,64);for(let t=0;t<3;t++){const e=w(new C({map:No,color:15986146,side:O}),15986146,3822968,.5,.3),a=new b(To,e);a.rotation.x=-Math.PI/2,a.position.y=.6+t*3.2,a.scale.setScalar(1-t*.06),a.rotation.z=t*.7,a.renderOrder=-700+t,a.frustumCulled=!1,r.add(a),F.push(a)}const j=190,p=new Float32Array(j*3),S=l.rng(707),q=[];for(let t=0;t<j;t++)p[t*3]=(S()-.5)*100,p[t*3+1]=S()*24,p[t*3+2]=(S()-.5)*100,q.push({sp:.25+S()*.55,ph:S()*Math.PI*2});const E=new X;E.setAttribute("position",new ho(p,3));const ko=w(new go({color:16771264,size:.18,sizeAttenuation:!0,map:ao}),16771264,10470632,.5,.28),J=new mo(E,ko);J.renderOrder=-400,J.frustumCulled=!1,r.add(J),r.traverse(t=>{t.isMesh&&(t.castShadow=!1,t.receiveShadow=!1)});let I=l.night?1:0,x=I,io=!0;return r.userData.setNight=t=>{I=t?1:0,io&&(x=I,io=!1)},r.userData.update=(t,e)=>{x+=(I-x)*Math.min(1,e*2.2),L.uNight.value=x,L.uTime.value=t;for(const o of U)o.grp.position.x+=o.speed*e,o.grp.position.x>265?o.grp.position.x=-265:o.grp.position.x<-265&&(o.grp.position.x=265);for(const o of Y)o.mat.color.copy(o.dayC).lerp(o.nightC,x),o.mat.opacity=o.dayO+(o.nightO-o.dayO)*x;for(const o of Z)o.mat.opacity=o.day+(o.night-o.day)*x;ro.opacity=.9*x;const a=1+.03*Math.sin(t*.7);xo[1].scale.set(104*a,104*a,1),Mo[0].scale.set(26*(1+.02*Math.sin(t*.5)),26,1);for(let o=0;o<F.length;o++)F[o].rotation.z+=e*(.004+o*.002);for(let o=0;o<j;o++)p[o*3+1]+=q[o].sp*e,p[o*3]+=Math.sin(t*.4+q[o].ph)*e*.16,p[o*3+1]>24&&(p[o*3+1]=0,p[o*3]=(S()-.5)*100,p[o*3+2]=(S()-.5)*100);E.attributes.position.needsUpdate=!0},r}export{Uo as createAtmosphere};

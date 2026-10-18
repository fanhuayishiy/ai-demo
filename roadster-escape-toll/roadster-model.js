/* Closed exterior reconstructed from the user's A01/A02/A03/A11/A14 images.
 * Coordinates are photo-derived proportions, not manufacturer CAD dimensions.
 * Front is -Z, height is +Y; nominal length 4.7 units.
 */
(function (root) {
  'use strict';
  root.createRoadsterModel = function (T) {
    var car = new T.Group();
    car.name = 'Roadster-reference-exterior';
    function material(color, metalness, roughness) {
      return new T.MeshStandardMaterial({color: color, metalness: metalness, roughness: roughness, side: T.DoubleSide});
    }
    var paint = material(0xb7b9bd, .72, .30);
    var alloy = material(0xb9bdc3, .88, .24);
    var rimDark = material(0x171a1f, .70, .32);
    var tireMat = material(0x111215, .02, .94);
    var carbon = material(0x18191b, .24, .61);
    var matte = material(0x08090b, .05, .88);
    var glass = material(0x242020, .25, .23);
    glass.envMapIntensity = .48;
    var seamMat = material(0x363638, .30, .64);
    var lens = material(0x171a1d, .30, .21);
    var red = material(0xd50312, .1, .28);
    red.emissive.setHex(0xff0010); red.emissiveIntensity = 1.1;
    var white = material(0xdfe7ee, .1, .2);
    white.emissive.setHex(0xd5e2ed); white.emissiveIntensity = .7;
    var amber = material(0x9a3104, .1, .3);
    var nozzleMat = material(0x5e5b58, .88, .35);
    var frostMat = nozzleMat;

    function mesh(name, vertices, indices, mat) {
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(vertices.flat(), 3));
      if (indices) g.setIndex(indices);
      g.computeVertexNormals();
      var m = new T.Mesh(g, mat); m.name = name; m.castShadow = true; m.receiveShadow = true;
      car.add(m); return m;
    }
    function polygon(name, pts, mat) {
      var idx=[]; for(var i=1;i<pts.length-1;i++) idx.push(0,i,i+1);
      return mesh(name, pts, idx, mat);
    }
    function strip(name, rows, mat) {
      var pts=[], idx=[];
      rows.forEach(function(r,i){ pts.push(r[0],r[1]); if(i) {var a=(i-1)*2;idx.push(a,a+1,a+3,a,a+3,a+2);} });
      return mesh(name,pts,idx,mat);
    }
    function line(name, points, radius, mat) {
      var curve = new T.CatmullRomCurve3(points.map(function(p){return new T.Vector3(p[0],p[1],p[2]);}), false, 'centripetal');
      var m=new T.Mesh(new T.TubeGeometry(curve, Math.max(12,points.length*4),radius,6,false),mat);
      m.name=name; car.add(m);return m;
    }
    function box(name, size, pos, mat) {
      var m=new T.Mesh(new T.BoxGeometry(size[0],size[1],size[2]),mat);
      m.position.set(pos[0],pos[1],pos[2]);m.name=name;car.add(m);return m;
    }
    function sample(table,z) {
      if(z<=table[0][0])return table[0].slice(1);
      for(var i=1;i<table.length;i++)if(z<=table[i][0]){
        var t=(z-table[i-1][0])/(table[i][0]-table[i-1][0]);
        return table[i].slice(1).map(function(v,k){return table[i-1][k+1]*(1-t)+v*t;});
      }
      return table[table.length-1].slice(1);
    }
    // z, outer width/2, upper shoulder width/2, shoulder Y, upper Y,
    // center-deck Y, central hood crease X, lower silver panel Y.
    var body=[
      [-2.35,.78,.73,.49,.515,.515,.695,.265],
      [-2.22,.87,.79,.57,.595,.560,.680,.250],
      [-2.04,.94,.84,.67,.705,.635,.650,.250],
      [-1.82,.99,.87,.77,.795,.720,.610,.250],
      [-1.57,1.0,.88,.825,.858,.790,.560,.250],
      [-1.36,.995,.86,.830,.862,.845,.515,.250],
      [-1.08,.982,.84,.785,.851,.846,.530,.253],
      [-.65,.965,.82,.795,.860,.850,.550,.263],
      [0,.970,.82,.848,.900,.870,.560,.290],
      [.55,.990,.84,.893,.946,.900,.570,.330],
      [1.05,1.01,.85,.938,.988,.930,.570,.365],
      [1.58,1.025,.86,.948,.985,.949,.560,.390],
      [1.95,1.005,.87,.933,.970,.960,.570,.530],
      [2.22,.980,.89,.915,.962,.960,.600,.625],
      [2.35,.958,.89,.900,.956,.956,.620,.700]
    ];
    var WHEEL_Z_F=-1.456,WHEEL_Z_R=1.588,WHEEL_R_F=.365,WHEEL_R_R=.395,WHEEL_X=.875;
    var arches=[{z:WHEEL_Z_F,r:WHEEL_R_F+.027,y:WHEEL_R_F},{z:WHEEL_Z_R,r:WHEEL_R_R+.027,y:WHEEL_R_R}];
    function archBottom(z,base) {
      arches.forEach(function(a){var d=z-a.z;if(Math.abs(d)<a.r)base=Math.max(base,a.y+Math.sqrt(a.r*a.r-d*d));});
      return base;
    }
    function sideX(z,y){var p=sample(body,z);return p[0]-.035*Math.max(0,Math.min(1,(p[2]-y)/.5));}
    function bodyTopAt(x,z) {
      var p=sample(body,z),a=Math.abs(x);
      if(a<=p[5])return p[4]+.004*(1-a/p[5]);
      if(a<=p[1])return p[4]+(p[3]-p[4])*(a-p[5])/(p[1]-p[5]);
      return p[3]+(p[2]-p[3])*(a-p[1])/(p[0]-p[1]);
    }
    function hoodPoint(x,z,lift){return[x,bodyTopAt(x,z)+(lift||.003),z];}
    var zs=body.map(function(r){return r[0];});
    for(var z=-2.35;z<2.35;z+=.025)zs.push(z);
    arches.forEach(function(a){for(var i=0;i<=64;i++)zs.push(a.z+a.r*Math.cos(i*Math.PI/64));});
    zs.sort(function(a,b){return a-b;});zs=zs.filter(function(z,i){return z>=-2.35&&z<=2.35&&(!i||z-zs[i-1]>.00001);});
    [-1,1].forEach(function(s){
      var outer=[],fender=[],inner=[],center=[],lip=[];
      zs.forEach(function(z){
        var p=sample(body,z),b=archBottom(z,p[6]);
        outer.push([[s*sideX(z,b),b,z],[s*p[0],p[2],z]]);
        fender.push([[s*p[0],p[2],z],[s*p[1],p[3],z]]);
        inner.push([[s*p[1],p[3],z],[s*p[5],p[4],z]]);
        center.push([[s*p[5],p[4],z],[0,p[4]+.004,z]]);
        if(b>p[6]+.005)lip.push([[s*(sideX(z,b)+.002),b,z],[s*(sideX(z,b+.012)+.002),b+.012,z]]);
      });
      strip('sculpted-side-'+s,outer,paint);
      strip('fender-shoulder-'+s,fender,paint);
      strip('upper-quarter-'+s,inner,paint);
      strip('hood-and-deck-'+s,center,paint);
      // Arch returns are cut only into the outer panels, never through the hood.
      arches.forEach(function(a){
        var rim=[],well=[];
        for(var i=0;i<=64;i++){
          var t=i*Math.PI/64,z=a.z+Math.cos(t)*a.r,y=a.y+Math.sin(t)*a.r;
          var x=sideX(z,y);
          rim.push([[s*(x+.002),y,z],[s*(x+.003),y+.012,z]]);
          well.push([[s*x,y,z],[s*.73,y-.006,z]]);
        }
        strip('wheel-arch-edge-'+s,rim,paint);strip('recessed-wheel-well-'+s,well,matte);
      });
      // One continuous rising carbon sill, ending at the wheel openings.
      var skirt=[];
      [-1.04,-.8,-.2,.5,1.165].forEach(function(z){var p=sample(body,z);skirt.push([[s*(p[0]-.023),.115,z],[s*(sideX(z,p[6])+.006),p[6]-.004,z]]);});
      strip('carbon-sill-'+s,skirt,carbon);
      line('sill-lower-edge-'+s,[[-1.035,.125],[-.3,.12],[.5,.12],[1.16,.14]].map(function(p){return[s*.956,p[1],p[0]];}),.008,rimDark);
    });
    box('undertray',[1.55,.055,3.90],[0,.145,0],matte);

    // Single glass canopy: shared edges join windshield, roof and side panes.
    // z, roof halfwidth, roof edge Y, window belt halfwidth, window belt Y.
    var canopy=[
      [-1.36,.800,.858,.800,.858],[-1.10,.756,.968,.827,.853],
      [-.70,.663,1.112,.841,.866],[-.38,.584,1.211,.844,.887],
      [-.14,.557,1.245,.845,.906],[.20,.556,1.247,.842,.933],
      [.58,.568,1.230,.836,.963],[.98,.597,1.196,.817,.997],
      [1.20,.620,1.164,.792,1.025],[1.42,.644,1.122,.755,1.054]
    ];
    var czs=[];for(var ci=0;ci<canopy.length-1;ci++)for(var cj=0;cj<8;cj++)czs.push(canopy[ci][0]+(canopy[ci+1][0]-canopy[ci][0])*cj/8);czs.push(1.42);
    [-1,1].forEach(function(s){
      var roofRows=[],windowRows=[],railRows=[],beltRows=[];
      czs.forEach(function(z){var p=sample(canopy,z),bp=sample(body,z);
        roofRows.push([[0,p[1]+.012,z],[s*p[0],p[1],z]]);
        windowRows.push([[s*p[0],p[1]-.014,z],[s*p[2],p[3],z]]);
        railRows.push([[s*(p[0]-.006),p[1]+.003,z],[s*(p[0]+.023),p[1]-.012,z]]);
        beltRows.push([[s*p[2],p[3]-.003,z],[s*bp[1],bp[3],z]]);
      });
      strip('panoramic-canopy-'+s,roofRows,glass);
      strip('side-window-'+s,windowRows,glass);
      strip('thin-silver-roof-rail-'+s,railRows,paint);
      strip('window-belt-shoulder-'+s,beltRows,paint);
      // Rear quarter's silver spear covers the glass wedge at its trailing corner.
      polygon('rear-window-spear-'+s,[[s*.597,1.196,.98],[s*.644,1.122,1.42],[s*.755,1.054,1.42],[s*.792,1.025,1.20]],paint);
      [.38].forEach(function(z){var p=sample(canopy,z);strip('window-divider-'+s,[
        [[s*(p[0]+.001),p[1]-.016,z-.009],[s*(p[0]+.001),p[1]-.016,z+.009]],
        [[s*(p[2]+.002),p[3],z-.009],[s*(p[2]+.002),p[3],z+.009]]],rimDark);});
      // A-pillar and door cuts lie on the actual pane/side surface.
      var a=sample(canopy,-.42);
      line('front-door-seam-'+s,[[s*a[0],a[1]-.016,-.42],[s*.843,.88,-.84],[s*sideX(-.90,.74),.74,-.90],[s*sideX(-.80,.264),.264,-.80]],.0025,seamMat);
      line('rear-door-seam-'+s,[[s*.842,.933,.38],[s*sideX(.40,.87),.87,.40],[s*sideX(.21,.30),.30,.21]],.0025,seamMat);
      polygon('side-camera-inset-'+s,[[s*.989,.746,-1.19],[s*.982,.725,-.96],[s*.985,.690,-.96],[s*.993,.711,-1.19]],matte);
      polygon('side-amber-marker-'+s,[[s*.994,.730,-1.18],[s*.989,.715,-1.10],[s*.989,.701,-1.10],[s*.994,.715,-1.18]],amber);
    });
    // Rear glass narrows between the two sculpted silver buttresses.
    var rearGlass=[], leftButt=[],rightButt=[];
    [[1.42,.644,1.122,.755,1.054],[1.65,.648,1.073,.80,1.016],[1.92,.650,1.007,.855,.975],[2.14,.651,.963,.887,.961]].forEach(function(r){
      rearGlass.push([[-r[1],r[2],r[0]],[r[1],r[2],r[0]]]);
      leftButt.push([[-r[1]-.012,r[2]+.018,r[0]],[-r[3],r[4],r[0]]]);
      rightButt.push([[r[1]+.012,r[2]+.018,r[0]],[r[3],r[4],r[0]]]);
    });
    strip('rear-glass',rearGlass,glass);strip('left-rear-buttress',leftButt,paint);strip('right-rear-buttress',rightButt,paint);
    // Delicate glass roof break, without a duplicate silver shell under the roof.
    [-.40,.63].forEach(function(z){var p=sample(canopy,z);line('roof-panel-cut',[[-p[0],p[1]+.003,z],[0,p[1]+.014,z],[p[0],p[1]+.003,z]],.002,seamMat);});

    // Broad trapezoid nose and recessed triangular lamps.
    polygon('front-black-fascia',[[-.695,.508,-2.357],[.695,.508,-2.357],[.744,.182,-2.32],[-.744,.182,-2.32]],matte);
    [-1,1].forEach(function(s){
      polygon('front-silver-cheek-'+s,[[s*.695,.515,-2.35],[s*.78,.49,-2.35],[s*.87,.57,-2.22],[s*.86,.248,-2.21],[s*.735,.263,-2.35]],paint);
      polygon('front-lower-cheek-'+s,[[s*.735,.26,-2.352],[s*.86,.248,-2.214],[s*.865,.13,-2.24],[s*.745,.14,-2.36]],carbon);
      // Sample the lamp across the curved fender so none of it sinks below paint.
      var lampRows=[];
      for(var li=0;li<=20;li++){
        var lt=li/20,lz=-2.313+.294*lt;
        lampRows.push([hoodPoint(s*(.697+(.791-.697)*lt),lz),hoodPoint(s*(.697+(.642-.697)*lt),lz)]);
      }
      strip('triangular-headlamp-'+s,lampRows,lens);
      strip('headlamp-led-'+s,[[hoodPoint(s*.785,-2.026,.006),hoodPoint(s*.781,-2.047,.006)],
        [hoodPoint(s*.647,-2.026,.006),hoodPoint(s*.650,-2.047,.006)]],white);
      line('hood-crease-'+s,[[s*.695,.521,-2.35],[s*.65,.641,-2.04],[s*.56,.796,-1.57],[s*.515,.850,-1.36]],.0025,seamMat);
    });
    line('front-splitter',[[-.86,.135,-2.24],[-.74,.13,-2.38],[0,.14,-2.39],[.74,.13,-2.38],[.86,.135,-2.24]],.017,carbon);
    line('nose-top-edge',[[-.695,.512,-2.36],[0,.517,-2.365],[.695,.512,-2.36]],.006,alloy);
    line('hood-service-cut',[[-.536,.820,-1.48],[0,.824,-1.48],[.536,.820,-1.48]],.002,seamMat);

    // A11 is upright. A05 is inverted: do not swap the lamp/nozzle tiers.
    // Stowed spoiler is a physical thin deck panel, with a visible trailing lip.
    strip('stowed-active-spoiler',[
      [[-.89,.963,2.15],[.89,.963,2.15]],
      [[-.900,.968,2.31],[.900,.968,2.31]],
      [[-.905,.959,2.371],[.905,.959,2.371]]
    ],paint);
    line('spoiler-panel-cut',[[-.89,.966,2.15],[0,.966,2.15],[.89,.966,2.15]],.003,seamMat);
    polygon('rear-lamp-recess',[[-.905,.951,2.368],[.905,.951,2.368],[.893,.810,2.390],[-.893,.810,2.390]],matte);
    strip('full-width-red-tail-lamp',[
      [[-.872,.882,2.394],[-.872,.896,2.394]],
      [[0,.887,2.400],[0,.901,2.400]],
      [[.872,.882,2.394],[.872,.896,2.394]]
    ],red);
    line('tail-lamp-lower-bezel',[[-.89,.810,2.39],[0,.809,2.406],[.89,.810,2.39]],.009,alloy);
    [-1,1].forEach(function(s){
      polygon('rear-silver-fascia-'+s,[[0,.804,2.392],[s*.40,.803,2.392],[s*.89,.810,2.376],[s*.91,.634,2.285],[s*.46,.632,2.355],[s*.23,.644,2.400],[0,.650,2.400]],paint);
      polygon('rear-fascia-sculpture-'+s,[[s*.40,.803,2.392],[s*.46,.632,2.355],[s*.23,.644,2.400]],alloy);
      polygon('rear-silver-outer-fold-'+s,[[s*.905,.959,2.371],[s*.958,.900,2.35],[s*1.005,.933,1.95],[s*.970,.670,2.12],[s*.91,.634,2.285]],paint);
      polygon('rear-black-bumper-'+s,[[0,.632,2.365],[s*.91,.634,2.285],[s*.968,.670,2.12],[s*.95,.325,2.14],[s*.72,.306,2.31],[s*.67,.485,2.38],[0,.495,2.38]],carbon);
      line('rear-side-red-reflector-'+s,[[s*.968,.665,2.13],[s*.925,.636,2.275]],.008,red);
      line('rear-low-reflector-'+s,[[s*.70,.602,2.373],[s*.88,.601,2.31]],.004,red);
    });
    box('license-plate-rim',[.320,.156,.015],[0,.702,2.417],alloy);
    box('license-plate',[.302,.138,.008],[0,.702,2.428],material(0x7b7c80,.5,.49));
    // A local canvas label is optional, allowing the exact model to be verified in Node too.
    if(typeof document!=='undefined'){
      var plateCanvas=document.createElement('canvas');plateCanvas.width=384;plateCanvas.height=160;
      var ctx=plateCanvas.getContext('2d');ctx.fillStyle='#85868a';ctx.fillRect(0,0,384,160);
      ctx.strokeStyle='#afb0b4';ctx.lineWidth=5;ctx.strokeRect(7,7,370,146);
      ctx.font='78px serif';ctx.textAlign='center';ctx.fillStyle='#414248';ctx.fillText('RDSTR',192,111);
      var tex=new T.CanvasTexture(plateCanvas);tex.encoding=T.sRGBEncoding;
      var pm=new T.MeshBasicMaterial({map:tex});
      var label=new T.Mesh(new T.PlaneGeometry(.296,.133),pm);label.position.set(0,.702,2.433);car.add(label);
    }
    box('rear-camera',[.055,.023,.018],[0,.789,2.409],matte);
    polygon('four-nozzle-surround',[[-.67,.485,2.402],[-.65,.561,2.396],[-.49,.615,2.385],[.49,.615,2.385],[.65,.561,2.396],[.67,.485,2.402]],matte);
    line('nozzle-surround-upper-edge',[[-.67,.485,2.406],[-.65,.561,2.400],[-.49,.615,2.389],[.49,.615,2.389],[.65,.561,2.400],[.67,.485,2.406]],.009,rimDark);
    // Recessed four-cell diffuser: back wall, sloped floor, roof and real fins.
    polygon('diffuser-back-wall',[[-.60,.190,2.115],[.60,.190,2.115],[.60,.480,2.115],[-.60,.480,2.115]],matte);
    polygon('diffuser-sloped-floor',[[-.60,.190,2.115],[.60,.190,2.115],[.60,.125,2.390],[-.60,.125,2.390]],carbon);
    polygon('diffuser-roof',[[-.65,.477,2.402],[.65,.477,2.402],[.60,.480,2.115],[-.60,.480,2.115]],carbon);
    [-.66,-.32,0,.32,.66].forEach(function(x){
      var fin=polygon('diffuser-vertical-fin',[[x,.480,2.402],[x,.150,2.387],[x,.190,2.115],[x,.480,2.115]],carbon);
      line('diffuser-fin-edge',[[x,.480,2.408],[x,.190,2.396],[x*.91,.125,2.392]],.008,rimDark);
    });
    [-.48,-.16,.16,.48].forEach(function(x){
      var well=new T.Mesh(new T.CylinderGeometry(.064,.070,.018,24),rimDark);well.rotation.x=Math.PI/2;well.position.set(x,.332,2.132);car.add(well);
      var hole=new T.Mesh(new T.CircleGeometry(.048,24),matte);hole.position.set(x,.332,2.145);car.add(hole);
    });
/* Paste inside buildRoadster. Uses its T, tireMat, rimDark and alloy materials.
   A01/A14 show six dark radial arms with silver aero infill between them.
   Wheel axis is X; the detailed outer face points toward +X. */
function buildWheel(radius, halfWidth) {
  var wheel = new T.Group();
  var r = radius, hw = halfWidth;
  var rimR = r * 0.818;

  // Rounded shoulders and shallow circumferential tread grooves are part of
  // the tire profile, so the silhouette stays round without added black bands.
  var profile = [
    [0.807, -0.90], [0.844, -1.02], [0.900, -1.045],
    [0.952, -0.96], [0.984, -0.79], [0.997, -0.58],
    [1.000, -0.49], [1.000, -0.36], [0.990, -0.34],
    [0.990, -0.30], [1.000, -0.28], [1.000, -0.025],
    [0.990, -0.012], [0.990, 0.012], [1.000, 0.025],
    [1.000, 0.28], [0.990, 0.30], [0.990, 0.34],
    [1.000, 0.36], [1.000, 0.49], [0.997, 0.58],
    [0.984, 0.79], [0.952, 0.96], [0.900, 1.045],
    [0.844, 1.02], [0.807, 0.90]
  ].map(function (p) { return new T.Vector2(p[0] * r, p[1] * hw); });
  var tireGeometry = new T.LatheGeometry(profile, 72);
  tireGeometry.rotateZ(Math.PI / 2);
  wheel.add(new T.Mesh(tireGeometry, tireMat));

  function cylinder(rad, depth, x, material, segments) {
    var mesh = new T.Mesh(new T.CylinderGeometry(rad, rad, depth, segments || 64), material);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.x = x;
    wheel.add(mesh);
    return mesh;
  }
  function ring(rad, tube, x, material) {
    var mesh = new T.Mesh(new T.TorusGeometry(rad, tube, 6, 72), material);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.x = x;
    wheel.add(mesh);
    return mesh;
  }

  cylinder(rimR, hw * 1.81, 0, rimDark);
  // The dark backing remains visible in the channels around the aero covers.
  cylinder(r * 0.798, r * 0.018, hw * 0.81, rimDark);
  ring(rimR, r * 0.011, hw * 0.975, alloy);
  ring(r * 0.838, r * 0.005, hw * 1.018, tireMat);
  ring(r * 0.915, r * 0.003, hw * 1.044, tireMat);

  // Direct triangle geometry: faceted aero panels, channelled arms, edge rails.
  var panelPositions = [], armPositions = [], channelPositions = [], railPositions = [];
  function polar(frac, angle, x) {
    return [x, r * frac * Math.cos(angle), r * frac * Math.sin(angle)];
  }
  function triangle(out, a, b, c) {
    out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  }
  function solid(out, points, thickness) {
    // Angular winding keeps the visible face normal toward +X.
    for (var i = 1; i < points.length - 1; i++) {
      triangle(out, points[0], points[i], points[i + 1]);
    }
    for (var j = 0; j < points.length; j++) {
      var a = points[j], b = points[(j + 1) % points.length];
      var ai = [a[0] - thickness, a[1], a[2]];
      var bi = [b[0] - thickness, b[1], b[2]];
      triangle(out, a, ai, b);
      triangle(out, b, ai, bi);
    }
  }
  var step = Math.PI / 3;
  for (var spoke = 0; spoke < 6; spoke++) {
    var a = spoke * step;
    var panel = [polar(0.205, a + step * 0.50, hw * 0.865)];
    // The broad bright curved triangle is inset behind the dark structural arm.
    for (var k = 0; k <= 9; k++) {
      panel.push(polar(0.792, a + 0.133 + (step - 0.266) * k / 9, hw * 0.975));
    }
    solid(panelPositions, panel, r * 0.018);

    // A deep central channel leaves two raised rails in each dark spoke.
    solid(armPositions, [
      polar(0.125, a - 0.19, hw * 1.005),
      polar(0.795, a - 0.092, hw * 1.030),
      polar(0.795, a + 0.092, hw * 1.030),
      polar(0.125, a + 0.19, hw * 1.005)
    ], r * 0.038);
    solid(channelPositions, [
      polar(0.235, a - 0.037, hw * 1.033),
      polar(0.773, a - 0.035, hw * 1.041),
      polar(0.773, a + 0.035, hw * 1.041),
      polar(0.235, a + 0.037, hw * 1.033)
    ], r * 0.002);
    [-1, 1].forEach(function (side) {
      var edge = side * 0.082;
      // Hairline metal edges catch light without turning the arms silver.
      solid(railPositions, [
        polar(0.24, a + edge - 0.006, hw * 1.040),
        polar(0.775, a + edge - 0.004, hw * 1.040),
        polar(0.775, a + edge + 0.004, hw * 1.040),
        polar(0.24, a + edge + 0.006, hw * 1.040)
      ], r * 0.002);
    });
  }
  function addTriangles(positions, material) {
    var geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    wheel.add(new T.Mesh(geometry, material));
  }
  var aeroSilver = alloy.clone();
  aeroSilver.roughness = 0.32;
  aeroSilver.metalness = 0.72;
  var channelMaterial = tireMat.clone();
  channelMaterial.color.multiplyScalar(0.48);
  var railMaterial = alloy.clone();
  railMaterial.color.multiplyScalar(0.36);
  railMaterial.roughness = 0.25;
  addTriangles(panelPositions, aeroSilver);
  addTriangles(armPositions, rimDark);
  addTriangles(channelPositions, channelMaterial);
  addTriangles(railPositions, railMaterial);

  cylinder(r * 0.155, r * 0.045, hw * 1.027, rimDark, 36);
  cylinder(r * 0.108, r * 0.008, hw * 1.027 + r * 0.025, channelMaterial, 36);
  ring(r * 0.113, r * 0.006, hw * 1.027 + r * 0.031, railMaterial);
  // Small recessed fixings preserve a dark hub instead of a bright toy centre.
  for (var bolt = 0; bolt < 5; bolt++) {
    var angle = bolt * Math.PI * 2 / 5;
    var boltMesh = cylinder(r * 0.014, r * 0.007, hw * 1.027 + r * 0.025, railMaterial, 8);
    boltMesh.position.y = Math.cos(angle) * r * 0.132;
    boltMesh.position.z = Math.sin(angle) * r * 0.132;
  }
  wheel.traverse(function (object) {
    if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  return wheel;
}

    var wheelF=buildWheel(WHEEL_R_F,.115),wheelR=buildWheel(WHEEL_R_R,.140),wheels=[];
    [[-1,WHEEL_Z_F,wheelF,WHEEL_R_F],[1,WHEEL_Z_F,wheelF,WHEEL_R_F],[-1,WHEEL_Z_R,wheelR,WHEEL_R_R],[1,WHEEL_Z_R,wheelR,WHEEL_R_R]].forEach(function(p){
      var w=p[2].clone();w.position.set(p[0]*WHEEL_X,p[3],p[1]);if(p[0]<0)w.rotation.y=Math.PI;
      w.userData.rollRadius=p[3];w.userData.rollSign=p[0]<0?-1:1;car.add(w);wheels.push(w);
    });
    function plumeMaterial(opacity) {
      return new T.ShaderMaterial({
        transparent: true, depthWrite: false, side: T.FrontSide,
        blending: T.NormalBlending,
        uniforms: {
          uColor: { value: new T.Color(0xf2f9ff) },
          uOpacity: { value: opacity }
        },
        vertexShader:
          'varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
          'void main(){ vUv = uv;' +
          '  vec4 mv = modelViewMatrix * vec4(position,1.0);' +
          '  vN = normalize(normalMatrix * normal);' +
          '  vV = normalize(-mv.xyz);' +
          '  gl_Position = projectionMatrix * mv; }',
        fragmentShader:
          'uniform vec3 uColor; uniform float uOpacity;' +
          'varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
          'void main(){' +
          '  float along = 1.0 - vUv.y;' +                       /* 1 在喷口，0 在羽流末端 */
          '  float body = pow(clamp(along,0.0,1.0), 0.8);' +
          '  float fres = 1.0 - abs(dot(normalize(vN), normalize(vV)));' +
          '  float a = uOpacity * body * (0.42 + 0.95 * fres);' +
          '  if (a < 0.004) discard;' +
          '  gl_FragColor = vec4(uColor, a); }'
      });
    }
    var PLUME_OP = [0.80, 0.40, 0.17];
    var PLUME_LEN = [1.00, 1.15, 1.42];
    var plumeGeo = [
      new T.CylinderGeometry(0.085, 0.030, PLUME_LEN[0], 18, 1, true),
      new T.CylinderGeometry(0.180, 0.060, PLUME_LEN[1], 18, 1, true),
      new T.CylinderGeometry(0.340, 0.105, PLUME_LEN[2], 16, 1, true)
    ];
    plumeGeo.forEach(function (g, i) { g.translate(0, PLUME_LEN[i] / 2, 0); });

    var jets = [];
    function makeJet(kind, x, y, z, rx, ry, rz, nozzleGeo, frostGeo) {
      var grp = new T.Group();
      grp.position.set(x, y, z);
      grp.rotation.set(rx, ry, rz);
      grp.userData.kind = kind;
      grp.userData.side = x > 0.01 ? 1 : (x < -0.01 ? -1 : 0);
      grp.userData.plumes = [];
      grp.userData.mats = [];

      if (nozzleGeo) grp.add(new T.Mesh(nozzleGeo, nozzleMat));
      if (frostGeo) {
        var fr = new T.Mesh(frostGeo, frostMat);
        fr.position.y = 0.012;
        grp.add(fr);
      }
      for (var i = 0; i < 3; i++) {
        var mat = plumeMaterial(PLUME_OP[i]);
        var pm = new T.Mesh(plumeGeo[i], mat);
        pm.visible = false;
        pm.renderOrder = 5;
        grp.add(pm);
        grp.userData.plumes.push(pm);
        grp.userData.mats.push(mat);
      }
      car.add(grp);
      jets.push(grp);
      return grp;
    }

    /* 喷嘴几何沿局部 +Y 埋进车身：局部原点 = 喷口面，羽流正好从喷口长出来 */
    /* 车底 4 个：向下喷 → 把车顶起来 */
    var nozDown = new T.CylinderGeometry(0.085, 0.070, 0.11, 14, 1, true);
    nozDown.translate(0, -0.055, 0);
    var frostRing = new T.TorusGeometry(0.098, 0.016, 6, 16);
    frostRing.rotateX(Math.PI / 2);
    [[-0.55, -0.75], [0.55, -0.75], [-0.55, 1.30], [0.55, 1.30]].forEach(function (p) {
      makeJet('under', p[0], 0.205, p[1], Math.PI, 0, 0, nozDown, null);
    });

    /* 车尾 4 个：**一排 4 个**（官方正后视图就是这个排布，不是 2×2），
       向后喷 → 向前推。开口嵌入尾部深色件，保持金属喷口而非发光白环。
       四个开口在尾面等距排成一行。 */
    var nozBack = new T.CylinderGeometry(0.043, 0.036, 0.10, 24, 1, true);
    nozBack.translate(0, -0.050, 0);
    /* 细金属唇边压低反光；喷口本体加宽，确保游戏镜头距离下仍然可辨。 */
    var frostRingB = new T.TorusGeometry(0.043, 0.003, 8, 24);
    frostRingB.rotateX(Math.PI / 2);
    [-0.372, -0.124, 0.124, 0.372].forEach(function (x) {
      var cavity=new T.Mesh(new T.CircleGeometry(.042,24),matte);cavity.position.set(x,.546,2.407);car.add(cavity);
      makeJet('rear', x, 0.546, 2.424, Math.PI / 2, 0, 0, nozBack, frostRingB);
    });

    /* 车身两侧成对：姿态控制 */
    var nozSide = new T.CylinderGeometry(0.026, 0.022, 0.05, 12, 1, true);
    nozSide.translate(0, -0.05, 0);
    var frostRingS = new T.TorusGeometry(0.026, 0.003, 6, 14);
    frostRingS.rotateX(Math.PI / 2);
    [[-0.961, -0.67], [0.961, -0.67], [-1.00, 1.08], [1.00, 1.08]].forEach(function (p) {
      makeJet('side', p[0], 0.430, p[1], 0, 0, p[0] > 0 ? -Math.PI / 2 : Math.PI / 2, nozSide, frostRingS);
    });

    /* 车底冷光（气体膨胀致冷的感觉） */
    /* 车底冷光：只留一个向下的点光源。原方案是一块 2.6×4.0 m 的水平
       加色平面贴在车底，车一升空、相机俯视时整块平面就露出来，读成
       "车底下垫了一块灰板" —— 已移除，冷光效果交给点光源 + 白色冷雾。 */
    var thrustLight = new T.PointLight(0xbfe4ff, 0, 16, 2);
    thrustLight.position.set(0, -0.35, 0);
    car.add(thrustLight);

    car.traverse(function (o) {
      if (o.isMesh && o.material && !o.material.transparent) o.castShadow = true;
    });

    /* ------------------------------------------------------------------ *
     *  合批：按材质把刚性组内的静态网格合成一个 Mesh，降低 draw call。
     *  只处理不透明、非实例化、非地标的网格；轮子与推进器各自作为
     *  刚性组单独合并，组本身的变换（滚动 / 摆动）不受影响。
     *  合并前先把每个网格的局部矩阵烘进几何体，视觉结果与合并前一致。
     * ------------------------------------------------------------------ */
    var KEEP_SEPARATE = {
      'full-width-red-tail-lamp': 1,
      'license-plate': 1,
      'diffuser-roof': 1,
      'stowed-active-spoiler': 1
    };

    function mergeRigidGroup(group, tag) {
      var buckets = new Map();
      group.children.slice().forEach(function (o) {
        if (!o.isMesh || o.isInstancedMesh || o.isPoints) return;
        if (KEEP_SEPARATE[o.name]) return;
        var mat = o.material;
        if (!mat || Array.isArray(mat) || mat.transparent) return;
        var list = buckets.get(mat);
        if (list) list.push(o); else buckets.set(mat, [o]);
      });
      var index = 0;
      buckets.forEach(function (list, mat) {
        if (list.length < 2) return;
        var positions = [], normals = [], uvs = [], indices = [], base = 0;
        list.forEach(function (o) {
          o.updateMatrix();
          var g = o.geometry.clone().applyMatrix4(o.matrix);
          var p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
          for (var i = 0; i < p.count; i++) {
            positions.push(p.getX(i), p.getY(i), p.getZ(i));
            if (n) normals.push(n.getX(i), n.getY(i), n.getZ(i)); else normals.push(0, 1, 0);
            if (u) uvs.push(u.getX(i), u.getY(i)); else uvs.push(0, 0);
          }
          if (g.index) {
            var a = g.index.array;
            for (var j = 0; j < a.length; j++) indices.push(a[j] + base);
          } else {
            for (var k = 0; k < p.count; k++) indices.push(k + base);
          }
          base += p.count;
        });
        var merged = new T.BufferGeometry();
        merged.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        merged.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
        merged.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
        merged.setIndex(indices);
        merged.computeBoundingSphere();
        var batch = new T.Mesh(merged, mat);
        batch.name = 'merged-' + tag + '-' + (index++);
        batch.castShadow = true;
        batch.receiveShadow = true;
        list.forEach(function (o) { group.remove(o); });
        group.add(batch);
      });
    }

    mergeRigidGroup(car, 'body');
    wheels.forEach(function (w, i) { mergeRigidGroup(w, 'wheel' + i); });
    jets.forEach(function (j, i) { mergeRigidGroup(j, 'jet' + i); });

    return {
      group: car,
      jets: jets,
      plumeOp: PLUME_OP,
      plumeLen: PLUME_LEN,
      thrustLight: thrustLight,
      wheels: wheels
    };
  };
})(typeof window!=='undefined'?window:globalThis);

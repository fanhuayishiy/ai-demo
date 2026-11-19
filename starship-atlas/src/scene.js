import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createVehicle, createPart, setModelExplosion } from './model.js'

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
const clamp = THREE.MathUtils.clamp
const smooth = (x) => x * x * (3 - 2 * x)
const TAU = Math.PI * 2
const BOOSTER_HEIGHT = 72.3
const SHIP_HEIGHT = 52.1
const STACK_HEIGHT = BOOSTER_HEIGHT + SHIP_HEIGHT

function movable(object, x, y, z) {
  object.userData.groundOrigin = object.position.toArray()
  object.userData.groundOffset = [x,y,z]
  return object
}

function spreadGroundEquipment(root, amount) {
  root.traverse(object => {
    const {groundOrigin, groundOffset}=object.userData
    if(groundOrigin) object.position.fromArray(groundOrigin).addScaledVector(V(...groundOffset),amount)
  })
}

// A studio reflection panorama gives the steel hull broad highlights and deep
// reflections even when the page's own star chart is visible behind the scene.
function studioReflection(renderer) {
  const width = 256, height = 128
  const data = new Float32Array(width * height * 4)
  const panel = (x, center, halfWidth, softness) =>
    1 - THREE.MathUtils.smoothstep(Math.abs(x - center), halfWidth, halfWidth + softness)
  for (let y = 0; y < height; y++) {
    const v = y / height
    for (let x = 0; x < width; x++) {
      const u = x / width
      const sky = 0.055 + 0.25 * v
      const key = 5.8 * panel(u, .68, .068, .034) * panel(v, .57, .28, .10)
      const fill = 1.6 * panel(u, .19, .092, .03) * panel(v, .45, .22, .1)
      const strip = 3 * panel(u, .93, .015, .016) * panel(v, .54, .30, .08)
      const crown = 1.6 * panel(v, .9, .085, .10)
      const i = 4 * (y * width + x)
      data[i] = sky * .66 + key + fill * .64 + strip + crown
      data[i + 1] = sky * .83 + key + fill * .82 + strip * .87 + crown
      data[i + 2] = sky + key + fill + strip * .68 + crown * 1.1
      data[i + 3] = 1
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.needsUpdate = true
  const generator = new THREE.PMREMGenerator(renderer)
  const environment = generator.fromEquirectangular(texture)
  generator.dispose()
  texture.dispose()
  return environment
}

function steelwork(beams, color, roughness = .68) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({color, roughness, metalness: .5})
  const mesh = new THREE.InstancedMesh(geometry, material, beams.length)
  const transform = new THREE.Object3D()
  const up = V(0, 1, 0)
  beams.forEach(([a, b, width, depth = width], index) => {
    const delta = V().subVectors(b, a)
    transform.position.copy(a).lerp(b, .5)
    transform.scale.set(width, delta.length(), depth)
    transform.quaternion.setFromUnitVectors(up, delta.normalize())
    transform.updateMatrix()
    mesh.setMatrixAt(index, transform.matrix)
  })
  mesh.computeBoundingSphere()
  return mesh
}

function catchAssembly() {
  const root = new THREE.Group()
  const arms = []
  const carriage = []
  const hingeMaterial = new THREE.MeshStandardMaterial({color:0x82919e, metalness:.7, roughness:.38})
  const pinGeometry = new THREE.CylinderGeometry(.85,.85,3.2,24)
  for (const side of [-1, 1]) {
    const z=side*4.6
    carriage.push([V(-4,3.5,z),V(1,3.5,z),1.05],
      [V(-4,-4,z),V(1,-4,z),1.05],
      [V(1,-4,z),V(1,3.5,z),1.1],
      [V(-4,-4,z),V(-4,3.5,z),1.1],
      [V(-4,-4,z),V(1,3.5,z),.52])
    const group = new THREE.Group()
    group.position.set(1, 0, side * 3.8)
    const inside = side * .8, outside = side * 3.5
    const truss = [
      [V(0,0,0), V(33,0,inside), .85],
      [V(0,-3.3,0), V(33,-.5,inside), .75],
      [V(0,0,outside), V(27,0,inside), .65],
      [V(0,-3.3,outside),V(28,-.8,inside),.62],
      [V(0,0,0), V(0,0,outside), .8]
    ]
    for(let j=0;j<6;j++){
      const start=j*5, end=start+5, rise=-3.3+j*.43
      truss.push([V(start,rise,inside*j/6), V(end,0,inside*(j+1)/6),.42],
        [V(start,0,inside*j/6),V(end,rise+.43,inside*(j+1)/6),.30])
    }
    const bearing=new THREE.Mesh(pinGeometry,hingeMaterial)
    bearing.position.set(0,-.55,0)
    group.add(steelwork(truss,0x8a9bab),movable(bearing,0,5,0))
    // The raised strips indicate where the catch fittings meet the arms.
    group.add(steelwork([[V(16,.58,side*.35),V(29,.58,side*.68),.42,.94]],0xb3a077))
    root.add(movable(group,4,0,9*side))
    arms.push(group)
  }
  carriage.push([V(1,3.5,-4.6),V(1,3.5,4.6),1.15],
    [V(-4,-4,-4.6),V(-4,-4,4.6),1.15],
    [V(-4,3.5,4.6),V(-4,-4,-4.6),.64],
    [V(-4,3.5,-4.6),V(-4,-4,4.6),.64])
  root.add(movable(steelwork(carriage,0x677789),-5,-2,0))
  root.userData.partId='catcharms'
  return {root, arms}
}

function landingTower() {
  const root = new THREE.Group()
  const corners = [[-4,-4],[4,-4],[4,4],[-4,4]]
  const beams = [], decks = []
  for (let j = 0; j < 4; j++) {
    const [x,z] = corners[j], [nx,nz] = corners[(j+1)%4]
    beams.push([V(x,0,z), V(x,136,z), .85])
    for (let h = 0; h < 132; h += 12) {
      beams.push([V(x,h,z), V(nx,h+12,nz), .39], [V(nx,h,nz), V(x,h+12,z), .39])
      decks.push([V(x,h+1,z), V(nx,h+1,nz), .5])
    }
  }
  root.userData.partId='tower'
  root.add(steelwork(beams, 0x647381), movable(steelwork(decks, 0x99a6b2),0,0,-11))
  const mast = new THREE.Mesh(new THREE.BoxGeometry(3.6,134,2.2), new THREE.MeshStandardMaterial({color:0x516271,metalness:.36,roughness:.8}))
  mast.position.set(-2,67,0)
  root.add(movable(mast,-14,0,0))
  const carriage=catchAssembly()
  carriage.root.position.y=78
  root.add(movable(carriage.root,12,0,0))
  // Pad 2 has a deck over a bidirectional flame trench.
  const trench = new THREE.Group()
  const concrete = new THREE.MeshStandardMaterial({color:0x828585,roughness:.89})
  const deckSteel = new THREE.MeshStandardMaterial({color:0x76838e,roughness:.51,metalness:.55})
  for(const side of [-1,1]){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(28,9.3,4),concrete)
    wall.position.set(24,4.65,side*7.2)
    trench.add(wall)
    const deck=new THREE.Mesh(new THREE.BoxGeometry(23,.85,5.1),deckSteel)
    deck.position.set(24,9.7,side*6.7)
    trench.add(deck)
  }
  for(const x of [15,33]){
    const tie=new THREE.Mesh(new THREE.BoxGeometry(4.8,1.25,17.8),deckSteel)
    tie.position.set(x,9.8,0)
    trench.add(tie)
  }
  const mount=new THREE.Mesh(new THREE.TorusGeometry(6.5,.69,8,60),deckSteel)
  mount.position.set(24,10.3,0)
  mount.rotation.x=Math.PI/2
  trench.add(mount)
  root.add(movable(trench,9,0,0))
  return {root, arms:carriage.arms}
}

function inspectionModel(id) {
  if(id==='tower') return landingTower().root
  if(id==='catcharms') {
    const carriage=catchAssembly()
    carriage.arms.forEach((arm,i)=>{arm.rotation.y=(i?1:-1)*-.26})
    return carriage.root
  }
  return createPart(id)
}

function exhaust() {
  const geometry = new THREE.LatheGeometry([
    new THREE.Vector2(.01,-1), new THREE.Vector2(.18,-.75),
    new THREE.Vector2(.42,-.48),new THREE.Vector2(.70,-.22),
    new THREE.Vector2(1,-.04),new THREE.Vector2(.92,0)
  ], 32)
  const material = new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uTime; varying vec2 vUv;
    void main(){
      float t=vUv.y;
      float striation=pow(.5+.5*cos(6.283*vUv.x*13.+sin(5.*t+uTime)),3.);
      float bands=.5+.5*sin(t*30.-uTime*6.);
      vec3 color=mix(vec3(.88,.20,.045),vec3(.82,.67,1.),smoothstep(.65,1.,t));
      color=mix(color,vec3(1.,.94,.76),.5*t+.25*bands);
      gl_FragColor=vec4(color,(.42+.35*striation+.2*bands)*pow(t,.8));
      #include <colorspace_fragment>
    }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide
  })
  return new THREE.Mesh(geometry, material)
}

function planetLimb() {
  const material = new THREE.ShaderMaterial({
    vertexShader:`varying vec3 vN;
    void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vN;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.545);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){
      vec3 n=normalize(vN);float z=max(n.z,0.);
      vec2 p=n.xy*vec2(20.,36.)+vec2(n.z*4.5,0.);
      float cloud=noise(p)*.50+noise(2.1*p)*.29+noise(5.*p)*.14+noise(12.*p)*.07;
      vec3 sea=mix(vec3(.019,.038,.080),vec3(.027,.091,.18),cloud);
      sea=mix(sea,vec3(.40,.51,.60),smoothstep(.48,.75,cloud)*.78);
      vec3 c=mix(sea,vec3(.12,.32,.58),pow(1.-z,7.));
      c+=vec3(.16,.36,.62)*exp(-z*27.);
      gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }`
  })
  return new THREE.Mesh(new THREE.SphereGeometry(220,112,72),material)
}

function seaSurface() {
  const material = new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 p;uniform float uTime;
    void main(){float d=length(p);
      float ripples=sin(p.y*1.4+sin(p.x*.4+uTime)+uTime*2.)*.5+.5;
      float rings=pow(.5+.5*cos(d*2.-uTime*5.),7.)*exp(-d*.055);
      vec3 col=mix(vec3(.015,.043,.072),vec3(.056,.153,.20),ripples*.55);
      col+=vec3(.15,.36,.42)*rings;
      gl_FragColor=vec4(col,(1.-smoothstep(56.,168.,d))*.96);
      #include <colorspace_fragment>
    }`, transparent:true,depthWrite:false,side:THREE.DoubleSide
  })
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(340,340),material)
  sea.rotation.x=-Math.PI/2
  return sea
}

function sprayCloud() {
  const canvas=document.createElement('canvas')
  canvas.width=canvas.height=64
  const ctx=canvas.getContext('2d'),grad=ctx.createRadialGradient(32,32,1,32,32,32)
  grad.addColorStop(0,'rgba(255,255,255,.65)')
  grad.addColorStop(.42,'rgba(255,255,255,.38)')
  grad.addColorStop(1,'rgba(255,255,255,0)')
  ctx.fillStyle=grad
  ctx.fillRect(0,0,64,64)
  const map=new THREE.CanvasTexture(canvas)
  const material=new THREE.SpriteMaterial({map,color:0xc4d8e1,transparent:true,depthWrite:false,opacity:.75})
  const group=new THREE.Group()
  for(let i=0;i<30;i++){
    const a=i*2.4,r=2+(i%10)*1.75,h=2+Math.sin(Math.PI*(i%10)/10)*3
    const s=new THREE.Sprite(material)
    s.position.set(Math.cos(a)*r,h*Math.sin(i*1.41),Math.sin(a)*r)
    s.scale.setScalar(6+i%7)
    group.add(s)
  }
  return group
}

function samplePayload() {
  const train=new THREE.Group()
  const bus=new THREE.MeshStandardMaterial({color:0xa9a9a6,metalness:.65,roughness:.4})
  const panel=new THREE.MeshStandardMaterial({color:0x304c74,metalness:.35,roughness:.48,side:THREE.DoubleSide})
  for(let i=0;i<4;i++) {
    const item=new THREE.Group()
    const center=new THREE.Mesh(new THREE.BoxGeometry(2.3,.5,1.65),bus)
    item.add(center)
    for(const side of [-1,1]) {
      const wing=new THREE.Mesh(new THREE.BoxGeometry(2.6,.09,1.55),panel)
      wing.position.x=side*2.46
      item.add(wing)
    }
    train.add(item)
  }
  return train
}

function entryGlow() {
  const material=new THREE.ShaderMaterial({
    vertexShader:`varying float edge; varying float height;
      void main(){edge=abs(normalize(normalMatrix*normal).z);height=uv.y;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying float edge;varying float height;
      void main(){float rim=pow(1.-edge,2.3);
      gl_FragColor=vec4(mix(vec3(1.,.18,.02),vec3(1.,.78,.34),rim),rim*.85*sin(height*3.14159));
      #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
  })
  const shell=new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.2,-3),new THREE.Vector2(5,1),new THREE.Vector2(5.3,27),
    new THREE.Vector2(4.8,36),new THREE.Vector2(2.8,46),new THREE.Vector2(.01,51)
  ],48),material)
  return shell
}

function plasmaWake() {
  const material = new THREE.ShaderMaterial({
    uniforms: {uTime:{value:0}},
    vertexShader:`varying vec2 vUv;
      void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uTime;varying vec2 vUv;
      void main(){
        vec2 v=vUv*2.-1.;
        float w=clamp(1.-pow(abs(v.x)*1.26,4.),0.,1.);
        float base=-.39+.30*pow(abs(v.x),3.);
        float y=v.y-base;
        float bands=sin(v.x*39.-y*8.+sin(v.x*13.+uTime)*1.7+uTime);
        float body=exp(-abs(y)*7.)*.7;
        float veil=smoothstep(-.05,.12,y)*exp(-max(y,0.)*3.)*(.4+.28*bands);
        float alpha=(body+veil)*w*(1.-smoothstep(.65,.99,abs(v.y)));
        vec3 c=mix(vec3(1.,.12,.027),vec3(1.,.67,.21),body*.84);
        gl_FragColor=vec4(c,alpha);
        #include <colorspace_fragment>
      }`,
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  })
  return new THREE.Mesh(new THREE.PlaneGeometry(74,33),material)
}

const phaseFrames = [
  [110,157], [168,98], [112,112], [102,70],
  [94,69], [84,63], [104,90], [96,116]
]

export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})
  renderer.setClearColor(0,0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = .67
  const canvas=renderer.domElement
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;cursor:grab'
  canvas.setAttribute('aria-label','可拖动旋转、双指或滚轮缩放的星舰三维模型')
  container.append(canvas)
  const scene=new THREE.Scene()
  const environment=studioReflection(renderer)
  scene.environment=environment.texture
  scene.environmentIntensity=.5
  scene.add(new THREE.HemisphereLight(0xf2f5fc,0x69676a,.25))
  const key=new THREE.DirectionalLight(0xfff6e6,1.5)
  key.position.set(-55,90,90)
  const rim=new THREE.DirectionalLight(0xa9d8ff,.8)
  rim.position.set(55,12,-65)
  scene.add(key,rim)
  const camera=new THREE.OrthographicCamera(-80,80,50,-50,.1,1600)
  const controls=new OrbitControls(camera,canvas)
  controls.enablePan=false
  controls.minZoom=.45
  controls.maxZoom=5
  controls.zoomSpeed=.9
  controls.rotateSpeed=.65
  const vehicle=createVehicle()
  const {root,ship,booster}=vehicle
  scene.add(root)
  const preserveShip = ship.position.clone(), preserveBooster=booster.position.clone()
  const shipPose=ship.position.clone(), boosterPose=booster.position.clone()
  const bounds=new THREE.Box3(), center=V(), size=V()
  const parts=new Map()
  let mode='overview',phase=-1,progress=0,activePart,extras
  let expansion=0,expandedW=0,expandedH=0
  let width=1,height=1,request=0,disposed=false,frameW=119,frameH=75
  let cameraDirection=V(0,0,1)

  function invalidate() {
    if(request || disposed) return
    request=requestAnimationFrame(()=>{
      request=0
      if(!container.clientWidth || !container.clientHeight) return
      renderer.render(scene,camera)
      container.dispatchEvent(new Event('viewchange'))
    })
  }
  controls.addEventListener('change',invalidate)
  controls.addEventListener('start',()=>{canvas.style.cursor='grabbing'})
  controls.addEventListener('end',()=>{canvas.style.cursor='grab'})
  function frame() {
    const aspect=width/Math.max(1,height)
    const half=Math.max(frameH,expandedH,frameW/aspect,expandedW/aspect)/2
    camera.left=-half*aspect
    camera.right=half*aspect
    camera.top=half
    camera.bottom=-half
    camera.updateProjectionMatrix()
    invalidate()
  }
  function reset() {
    controls.target.set(0,0,0)
    camera.position.copy(cameraDirection).normalize().multiplyScalar(420)
    camera.up.set(0,1,0)
    camera.zoom=1
    controls.update()
    frame()
  }
  function resize() {
    width=container.clientWidth
    height=container.clientHeight
    if(!width || !height) return
    renderer.setSize(width,height,false)
    frame()
  }
  const observer=new ResizeObserver(resize)
  observer.observe(container)

  function missionProps() {
    if(extras) return extras
    const tower=landingTower(), flameB=exhaust(),flameS=exhaust(),heat=entryGlow()
    booster.add(flameB)
    ship.add(flameS,heat)
    const planet=planetLimb(), water=seaSurface(), smoke=sprayCloud(), plasma=plasmaWake(), payload=samplePayload()
    const props=new THREE.Group()
    props.add(tower.root,planet,water,smoke,plasma,payload)
    scene.add(props)
    extras={props,tower,flameB,flameS,planet,water,smoke,heat,plasma,payload}
    return extras
  }
  function neutral() {
    if(activePart) activePart.visible=false
    root.visible=true
    root.position.set(0,0,0)
    root.quaternion.identity()
    for(const [stage,pos] of [[booster,preserveBooster],[ship,preserveShip]]) {
      stage.visible=true
      stage.quaternion.identity()
      stage.position.copy(pos)
    }
    if(extras){
      extras.props.visible=false
      extras.flameB.visible=extras.flameS.visible=extras.heat.visible=false
    }
  }
  function overview() {
    clearExpansion()
    neutral()
    mode='overview'
    phase=-1
    root.rotation.set(-.35,4.72,-1.025,'ZXY')
    root.position.copy(V(0,-STACK_HEIGHT/2,0).applyQuaternion(root.quaternion))
    shipPose.copy(ship.position)
    boosterPose.copy(booster.position)
    frameW=119
    frameH=78
    cameraDirection.set(0,0,1)
    reset()
  }
  function pose(stage,length,x,y,angle,yaw=4.72,pitch=-.12) {
    stage.rotation.set(pitch,yaw,angle,'ZXY')
    stage.position.copy(V(0,-length/2,0).applyQuaternion(stage.quaternion)).add(V(x,y,0))
  }
  function wholeStack(angle,x,y,pitch=-.08) {
    root.rotation.set(pitch,4.72,angle,'ZXY')
    root.position.copy(V(0,-STACK_HEIGHT/2,0).applyQuaternion(root.quaternion)).add(V(x,y,0))
  }
  function placeFlame(flame, radius, length, t) {
    flame.visible=length>.02
    flame.position.y=.6
    flame.scale.set(radius,length,radius)
    flame.material.uniforms.uTime.value=t
  }
  function setPhase(index, fraction=0) {
    index=clamp(Math.trunc(index),0,7)
    const p=clamp(fraction,0,1), change=mode!=='mission' || phase!==index
    if(!change && p===progress) return
    const {props,tower,flameB,flameS,planet,water,smoke,heat,plasma,payload}=missionProps()
    if(change) clearExpansion()
    neutral()
    mode='mission'
    phase=index
    progress=p
    props.visible=true
    tower.root.visible=index===0||index===6||index===7
    planet.visible=index===3||index===4||index===5
    payload.visible=index===3
    plasma.visible=index===5
    water.visible=index===2
    smoke.visible=(index===0&&p<.46)||(index===2&&p>.92)
    const t=index*8+p*8
    water.material.uniforms.uTime.value=t
    const s=smooth(p)
    if(index===0) {
      wholeStack(-.16*s,3+12*s,-1+9*s,0)
      tower.root.position.set(-21,-75-116*s,0)
      tower.arms.forEach((arm,i)=>{arm.rotation.y=(i?1:-1)*-.55})
      placeFlame(flameB,4.65,12+28*s,t)
      smoke.position.set(3,-62-90*s,0)
      smoke.scale.setScalar(.8+1.8*p)
    } else if(index===1) {
      const angle=-1.04, axis=V(-Math.sin(angle),Math.cos(angle),0)
      pose(booster,BOOSTER_HEIGHT,-27*axis.x-12*s,-27*axis.y-8*s,angle+.62*s,.63,0)
      pose(ship,SHIP_HEIGHT,35.6*axis.x+16*s,35.6*axis.y+9*s,angle-.1*s,4.72,0)
      placeFlame(flameS,3.5,2+20*s,t)
    } else if(index===2) {
      ship.visible=false
      const approach=smooth(clamp((p-.25)/.63,0,1))
      pose(booster,BOOSTER_HEIGHT,-16+25*s,10-16*approach,1.16*(1-approach),4.67,0)
      water.position.set(9,-47-30*(1-approach),0)
      const thrust=p<.90 ? 6+13*Math.sin(Math.PI*p) : 0
      placeFlame(flameB,2.35,thrust,t)
      smoke.position.set(9,-42,0)
      smoke.scale.setScalar(.7+clamp((p-.92)/.08,0,1)*2)
      booster.visible=p<.99
    } else if(index===3) {
      booster.visible=false
      pose(ship,SHIP_HEIGHT,6+6*p,2+2*Math.sin(p*Math.PI),-.99-.13*s,4.72,-.22)
      planet.position.set(-65+10*p,-238,-275)
      for(let i=0;i<payload.children.length;i++) {
        const satellite=payload.children[i]
        const drift=clamp((p-i*.10)/.8,0,1)
        satellite.visible=drift>.045
        satellite.position.set(-2-43*drift,-5+16*drift+i*1.6,-6-i)
        satellite.rotation.set(.54,.45+drift+i*.12,.28+drift*.36)
        satellite.scale.setScalar(.74)
      }
    } else if(index===4) {
      booster.visible=false
      pose(ship,SHIP_HEIGHT,-4+7*p,4-4*p,1.08+.24*s,4.71,-.13)
      placeFlame(flameS,1.68,8+8*Math.sin(Math.PI*p),t)
      planet.position.set(-30,-236+3*p,-275)
    } else if(index===5) {
      booster.visible=false
      pose(ship,SHIP_HEIGHT,-4+8*p,5-8*p,-1.30-.26*s,2.15,-.15)
      planet.position.set(-30,-243+7*p,-275)
      heat.visible=true
      plasma.position.set(-4+8*p,6-8*p,-6)
      plasma.rotation.z=.27-.26*s
      plasma.material.uniforms.uTime.value=t
    } else if(index===6) {
      booster.visible=false
      pose(ship,SHIP_HEIGHT,17-12*s,13-15*s,-1.49*(1-s)-.045,4.68,-.08)
      tower.root.position.set(-59+26*s,-144+33*s,-10)
      tower.arms.forEach((arm,i)=>{arm.rotation.y=(i?1:-1)*-.36})
      placeFlame(flameS,2,8+10*Math.sin(p*Math.PI),t)
    } else {
      booster.visible=false
      const approach=smooth(clamp(p/.78,0,1))
      const closing=smooth(clamp((p-.26)/.52,0,1))
      // The closed pair straddles the upper stage, just aft of the forward flaps.
      tower.root.position.set(-20,-84,0)
      const cradleY=tower.root.position.y+78
      const finalCenter=cradleY+.87-36.26+SHIP_HEIGHT/2
      pose(ship,SHIP_HEIGHT,4+8*(1-approach),finalCenter+27*(1-approach),-.06*(1-approach),.73,0)
      tower.arms.forEach((arm,i)=>{arm.rotation.y=(i?1:-1)*(-.36*(1-closing))})
      placeFlame(flameS,1.7,(15-6*approach)*(1-smooth(clamp((p-.66)/.12,0,1))),t)
    }
    shipPose.copy(ship.position)
    boosterPose.copy(booster.position)
    if(change){
      frameW=phaseFrames[index][0]
      frameH=phaseFrames[index][1]
      const groundCamera = index===0 || index>=6
      const elevation = groundCamera ? .14 : index===2 ? .17 : 0
      if(index===7) cameraDirection.set(.64,.27,1)
      else cameraDirection.set(groundCamera ? .38 : 0,elevation,1)
      reset()
    }
    if(expansion) applyExpansion(expansion)
    invalidate()
  }
  function part(id) {
    clearExpansion()
    neutral()
    root.visible=false
    mode='part'
    phase=-1
    if(!parts.has(id)) {
      const item=inspectionModel(id)
      const pivot=new THREE.Group()
      bounds.setFromObject(item).getCenter(center)
      item.position.sub(center)
      pivot.add(item)
      const tilt={ship:-.72,booster:-.76,raptor:-.24,heatshield:-.16,flaps:-.25,foreflap:-.31,gridfins:-.20,hotstage:-.18,engines:-.22,shipengines:-.22,nose:-.36,tower:-.16,catcharms:.09}[id]??-.2
      const pitch={engines:-1.16,shipengines:-1.05,hotstage:.43,gridfins:.86,raptor:-.32,tower:.13,catcharms:.64}[id]??-.17
      const yaw={ship:4.72,booster:4.72,nose:.49,foreflap:2.80,tower:-.51,catcharms:-.49}[id]??.36
      pivot.rotation.set(pitch,yaw,tilt,'ZXY')
      scene.add(pivot)
      parts.set(id,pivot)
    }
    activePart=parts.get(id)
    activePart.visible=true
    bounds.setFromObject(activePart).getSize(size)
    frameW=Math.max(2,size.x*1.18)
    frameH=Math.max(2,size.y*1.18)
    cameraDirection.set(0,0,1)
    reset()
  }
  function anchors() {
    if(mode!=='overview') return []
    camera.updateMatrixWorld()
    root.updateMatrixWorld(true)
    return [[ship,29,'ship'],[booster,34,'booster']].map(([stage,y,id])=>{
      const point=stage.localToWorld(V(0,y,0)).project(camera)
      return {id,x:(point.x+1)/2,y:(1-point.y)/2}
    })
  }
  function applyExpansion(amount) {
    const focused=mode==='part'?activePart:root
    if(!focused) return
    expansion=amount
    if(mode==='part'){
      setModelExplosion(focused,amount)
      spreadGroundEquipment(focused,amount)
    } else {
      if(mode==='mission' && phase===2) booster.visible=progress<.99 || amount>0
      setModelExplosion(ship,amount)
      setModelExplosion(booster,amount)
      ship.position.copy(shipPose)
      booster.position.copy(boosterPose)
      if(mode==='overview'||phase===0) {
        ship.position.y+=12*amount
        booster.position.y-=8*amount
      }
      if(extras?.tower.root.visible && extras.props.visible) spreadGroundEquipment(extras.tower.root,amount)
    }
    expandedW=expandedH=0
    if(amount>0){
      // Project the visible part geometry into camera space so the extra clearance
      // follows the selected pose, independent of the current orbital azimuth.
      const extent=new THREE.Box3(), localBounds=new THREE.Box3(), matrix=new THREE.Matrix4()
      camera.updateMatrixWorld()
      focused.updateWorldMatrix(true,true)
      focused.traverseVisible(object=>{
        if(!object.isMesh||!findPartId(object)) return
        const geometry=object.isInstancedMesh?object:object.geometry
        if(!geometry.boundingBox)geometry.computeBoundingBox()
        matrix.multiplyMatrices(camera.matrixWorldInverse,object.matrixWorld)
        extent.union(localBounds.copy(geometry.boundingBox).applyMatrix4(matrix))
      })
      if(!extent.isEmpty()){
        expandedW=2.12*Math.max(Math.abs(extent.min.x),Math.abs(extent.max.x))
        expandedH=2.12*Math.max(Math.abs(extent.min.y),Math.abs(extent.max.y))
      }
    }
    frame()
  }
  function clearExpansion() {
    if(expansion) applyExpansion(0)
  }
  function explode(amount) {
    applyExpansion(clamp(Number.isFinite(amount)?amount:0,0,1))
  }
  function findPartId(object) {
    for(let node=object;node;node=node.parent) {
      if(node.userData.partId) return node.userData.partId
    }
    return null
  }
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2()
  let press=null
  function pointerDown(event) {
    if(!event.isPrimary) {
      if(press)press.dragged=true
      return
    }
    if(event.button===0)press={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false}
  }
  function pointerMove(event) {
    if(press?.id===event.pointerId && Math.hypot(event.clientX-press.x,event.clientY-press.y)>5)press.dragged=true
  }
  function pointerUp(event) {
    if(press?.id!==event.pointerId)return
    const tap=!press.dragged && Math.hypot(event.clientX-press.x,event.clientY-press.y)<=5
    press=null
    if(!tap)return
    const rect=canvas.getBoundingClientRect()
    pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2)
    camera.updateMatrixWorld()
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer,camera)
    const meshes=[]
    scene.traverseVisible(object=>{
      if(object.isMesh && !object.isSprite && !object.material.isShaderMaterial && findPartId(object))meshes.push(object)
    })
    const hit=raycaster.intersectObjects(meshes,false)[0]
    if(hit)container.dispatchEvent(new CustomEvent('partpick',{detail:{id:findPartId(hit.object)}}))
  }
  const cancelPress=()=>{press=null}
  canvas.addEventListener('pointerdown',pointerDown)
  canvas.addEventListener('pointermove',pointerMove)
  canvas.addEventListener('pointerup',pointerUp)
  canvas.addEventListener('pointercancel',cancelPress)
  function zoom(factor){
    if(!Number.isFinite(factor)||factor<=0) return
    camera.zoom=clamp(camera.zoom*factor,controls.minZoom,controls.maxZoom)
    camera.updateProjectionMatrix()
    invalidate()
  }
  function dispose() {
    disposed=true
    cancelAnimationFrame(request)
    observer.disconnect()
    canvas.removeEventListener('pointerdown',pointerDown)
    canvas.removeEventListener('pointermove',pointerMove)
    canvas.removeEventListener('pointerup',pointerUp)
    canvas.removeEventListener('pointercancel',cancelPress)
    controls.dispose()
    const resources=new Set()
    scene.traverse(node=>{
      if(node.geometry) resources.add(node.geometry)
      for(const mat of Array.isArray(node.material)?node.material:[node.material]){
        if(!mat) continue
        resources.add(mat)
        for(const property of Object.values(mat)) if(property?.isTexture) resources.add(property)
      }
    })
    for(const resource of resources) resource.dispose()
    environment.dispose()
    renderer.dispose()
    canvas.remove()
  }
  resize()
  overview()
  return {setPhase,overview,part,explode,zoom,reset,anchors,dispose}
}

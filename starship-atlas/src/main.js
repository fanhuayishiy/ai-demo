import { phases, parts, sources } from './data.js'
import { icon } from './icons.js'

const $ = selector => document.querySelector(selector)
const viewport = $('#viewport')
const poseField = $('#pose')
const partField = $('#part')
const spread = $('#spread')
const poster = $('#poster')
const partMap = new Map(parts.map(part => [part.id, part]))
const staticSamples = [.22, .58, .85, .55, .55, .55, .62, 1]
const phaseMs = 6200
const shipParts = ['ship','nose','foreflap','flaps','heatshield','shipengines','raptor']
const boosterParts = ['booster','gridfins','hotstage','engines','raptor']
const groundParts = ['tower','catcharms']
const allIds = parts.map(part => part.id)
const overview = { title:'星舰第十五次飞行', en:'FULL STACK', description:'Ship 42 与 Booster 22 从得克萨斯州升空。约 22.5 小时后，上面级返回 Starbase，由塔架机械臂接住。' }
const state = { pose:-1, part:'', position:0, explosion:0, playing:false, replay:false, speed:1 }
let viewer, fallback = false, imageZoom = 1, frameId = 0, previousFrame = 0
let displayedPhase
let previousImage = 'overview'

document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon) })
poseField.add(new Option('整箭构型', '-1'))
phases.forEach((phase,i) => poseField.add(new Option(phase.title, String(i))))

function availableParts() {
  if (state.pose < 2) return allIds.filter(id => state.pose !== 1 || !groundParts.includes(id))
  if (state.pose === 2) return boosterParts
  return state.pose >= 6 ? [...shipParts,...groundParts] : shipParts
}
function updatePartOptions() {
  partField.replaceChildren(new Option('整体', ''))
  for (const id of availableParts()) {
    const part = partMap.get(id)
    if (part) partField.add(new Option(part.title,id))
  }
  if (state.part && !Array.from(partField.options).some(o => o.value === state.part)) {
    partField.add(new Option(partMap.get(state.part).title,state.part))
  }
  partField.value = state.part
}
function sourceRows(items) {
  const area = $('#source-content')
  for (const item of items) {
    const link = document.createElement('a')
    link.href = item.url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    const name = document.createElement('b')
    name.textContent = item.title
    name.insertAdjacentHTML('beforeend',icon('external'))
    const description = document.createElement('p')
    description.textContent = item.description
    link.append(name, description)
    area.append(link)
  }
  const note = document.createElement('p')
  note.textContent = '三维外形与拆解间距用于结构观察，飞行回放按阶段压缩。'
  area.append(note)
}
sourceRows([...sources,{title:'NASA · 地球地平线摄影',url:'https://science.nasa.gov/earth/earth-observatory/thunderstorms-on-the-brazilian-horizon-41052/',description:'背景取自国际空间站照片 ISS020-E-047807。'}])

function currentItem() {
  return partMap.get(state.part) || phases[state.pose] || overview
}
function syncLabels() {
  const item = currentItem()
  const ground = [0,2,6,7].includes(state.pose)
  document.querySelector('main').dataset.scene = state.part ? 'part' : state.pose < 0 ? 'overview' : ground ? 'ground' : 'orbit'
  poseField.value = String(state.pose)
  $('#pose-text').textContent = phases[state.pose]?.title || '整箭构型'
  updatePartOptions()
  $('#part-text').textContent = partMap.get(state.part)?.title || '整体'
  $('#subject').textContent = item.title
  $('#subject-en').textContent = item.en.toUpperCase()
  $('#description').textContent = item.description
  viewport.setAttribute('aria-label',item.title + (fallback ? '模型图' : '三维模型'))
  poster.alt = item.title
  $('#anchors').hidden = !!state.part || state.pose !== -1 || state.explosion > 0
  const goBack = !!state.part || state.pose === 7
  $('#shortcut span').textContent = state.part ? '返回当前姿势' : state.pose === 7 ? '返回整箭' : '查看塔架捕获'
  $('#shortcut i').innerHTML = icon(goBack ? 'reset' : 'arrow-up-right')
  $('#render-state').textContent = fallback ? '静态渲染图' : state.playing ? '飞行回放' : state.part ? '部件视图' : '三维视图'
  $('#transport').hidden = !state.replay || !!state.part
  $('#time').textContent = 'T+ 约 ' + (phases[state.pose]?.time || '00:00')
  syncPlay()
}
function syncPlay() {
  const label = state.playing ? '暂停回放' : state.replay && !state.part && state.position < phases.length ? '继续回放' : '播放飞行'
  $('#play span').textContent = label
  $('#play i').innerHTML = icon(state.playing ? 'pause' : 'play-fill')
  $('#play').setAttribute('aria-label',label)
}
function syncSlider(el, percent) {
  el.style.setProperty('--fill',percent + '%')
}
function updateStatic() {
  const name = state.part ? 'part-' + state.part : state.pose < 0 ? 'overview' : 'phase-' + state.pose
  const key = name + (state.explosion >= .5 ? '-exploded' : '')
  if (key !== previousImage) {
    poster.src = import.meta.env.BASE_URL + 'media/' + key + '.webp'
    previousImage = key
  }
  poster.style.transform = 'scale(' + imageZoom + ')'
  updateAnchors()
}
function renderSubject() {
  if (!viewer) { updateStatic(); return }
  if (state.part) viewer.part(state.part)
  else if (state.pose < 0) viewer.overview()
  else viewer.setPhase(state.pose,Math.min(1, state.position - state.pose))
  if (state.explosion) viewer.explode(state.explosion)
}
function paintExplosion(value, apply=true) {
  state.explosion = fallback ? (value >= .5 ? 1 : 0) : Math.max(0,Math.min(1,value))
  spread.value = Math.round(100*state.explosion)
  $('#amount').textContent = spread.value + '%'
  syncSlider(spread,spread.value)
  $('#explode span').textContent = state.explosion ? '复原模型' : '拆解模型'
  $('#explode').setAttribute('aria-pressed', String(state.explosion > 0))
  $('#anchors').hidden = !!state.part || state.pose !== -1 || state.explosion > 0
  if (apply && viewer) viewer.explode(state.explosion)
  if (apply && !viewer) updateStatic()
}
function pause() {
  state.playing = false
  cancelAnimationFrame(frameId)
  previousFrame = 0
  syncPlay()
  if (!fallback) $('#render-state').textContent = state.part ? '部件视图' : '三维视图'
}
function selectPose(index) {
  pause()
  state.pose = index
  state.position = index < 0 ? 0 : index + staticSamples[index]
  state.replay = false
  state.part = ''
  imageZoom = 1
  paintExplosion(0)
  syncLabels()
  renderSubject()
  updateAnchors()
}
function selectPart(id) {
  if (id && !partMap.has(id)) return
  pause()
  state.part = id
  imageZoom = 1
  paintExplosion(0)
  syncLabels()
  renderSubject()
  updateAnchors()
}
function seek(position) {
  state.position = Math.max(0,Math.min(phases.length,position))
  state.pose = Math.min(phases.length-1,Math.floor(state.position))
  if (displayedPhase !== state.pose) {
    displayedPhase = state.pose
    syncLabels()
  }
  $('#position').value = state.position
  syncSlider($('#position'),100*state.position/phases.length)
  $('#position').setAttribute('aria-valuetext',phases[state.pose].title)
  if (viewer) viewer.setPhase(state.pose,state.position-state.pose)
  else updateStatic()
}
function tick(t) {
  if (!state.playing) return
  if (previousFrame) seek(state.position + (t-previousFrame)*state.speed/phaseMs)
  previousFrame = t
  if (state.position >= phases.length) { pause(); return }
  frameId = requestAnimationFrame(tick)
}
function play() {
  if (state.playing) { pause(); return }
  const start = state.pose === -1 || state.position >= phases.length ? 0 : state.position
  state.playing = true
  state.part = ''
  state.replay = true
  imageZoom = 1
  paintExplosion(0)
  displayedPhase = undefined
  seek(start)
  frameId = requestAnimationFrame(tick)
}
function expand(value) {
  if (state.playing) pause()
  paintExplosion(value)
}
function zoom(factor) {
  if (viewer) viewer.zoom(factor)
  else {
    imageZoom = Math.max(.45,Math.min(4,imageZoom*factor))
    updateStatic()
  }
}
poseField.addEventListener('change',()=>selectPose(Number(poseField.value)))
partField.addEventListener('change',()=>selectPart(partField.value))
$('#play').addEventListener('click',play)
$('#shortcut').addEventListener('click',()=>state.part ? selectPart('') : selectPose(state.pose===7?-1:7))
$('#explode').addEventListener('click',()=>expand(state.explosion>0 ? 0 : 1))
spread.addEventListener('input',()=>expand(Number(spread.value)/100))
$('#out').addEventListener('click',()=>zoom(1/1.2))
$('#in').addEventListener('click',()=>zoom(1.2))
$('#reset').addEventListener('click',()=>{ if (viewer) viewer.reset(); else { imageZoom=1; updateStatic() } })
$('#speed').addEventListener('click',()=>{ state.speed=state.speed===1?2:state.speed===2?.5:1; $('#speed').textContent=state.speed+'×' })
$('#position').addEventListener('input',()=>{pause();paintExplosion(0);seek(Number($('#position').value));syncPlay()})
viewport.addEventListener('partpick',event=>{if(event.detail?.id)selectPart(event.detail.id)})
viewport.addEventListener('wheel',event=>{if(fallback){event.preventDefault();zoom(event.deltaY<0?1.12:1/1.12)}},{passive:false})
document.querySelectorAll('[data-pick]').forEach(el=>el.addEventListener('click',()=>selectPart(el.dataset.pick)))
const dialog = $('#sources-dialog')
$('#sources').addEventListener('click',()=>{if(state.playing)pause();dialog.showModal()})
$('#close').addEventListener('click',()=>dialog.close())
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return
  const r=dialog.getBoundingClientRect()
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()
})
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing)pause()})

function updateAnchors() {
  const wrap = $('#anchors')
  if (wrap.hidden) return
  const w=wrap.clientWidth,h=wrap.clientHeight
  const imageScale = Math.min(w/1200,h/730) * imageZoom
  const stillAnchors = [{id:'ship',x:.74484,y:.255561},{id:'booster',x:.323415,y:.676296}]
  const anchors=viewer?.anchors() || stillAnchors.map(point=>({
    id:point.id,
    x:.5 + (point.x-.5)*1200*imageScale/w,
    y:.5 + (point.y-.5)*730*imageScale/h
  }))
  for(const {id,x,y} of anchors){
    const el=wrap.querySelector('[data-pick="'+id+'"]'),line=wrap.querySelector('[data-line="'+id+'"]')
    if(!el)continue
    const visible=x>.03&&x<.97&&y>.04&&y<.96
    el.hidden=!visible
    line.setAttribute('visibility',visible?'visible':'hidden')
    if(!visible)continue
    const px=x*w,py=y*h,ship=id==='ship',d=w<430?20:55
    const bx=Math.max(3,Math.min(w-el.offsetWidth-4,px+(ship?-d-el.offsetWidth:d)))
    const by=Math.max(4,Math.min(h-el.offsetHeight-15,py+(ship?-d:d)-el.offsetHeight/2))
    el.style.transform='translate('+bx+'px,'+by+'px)'
    const ex=bx+(ship?el.offsetWidth:0),ey=by+el.offsetHeight/2
    line.innerHTML='<path d="M '+px+' '+py+' L '+(ex+(ship?12:-12))+' '+ey+' H '+ex+'" fill="none" stroke="#b7c8d4" stroke-width=".8"/><circle cx="'+px+'" cy="'+py+'" r="3" stroke="#15212b" fill="#ff965e"/>'
  }
}
viewport.addEventListener('viewchange',updateAnchors)
new ResizeObserver(updateAnchors).observe(viewport)
function staticMode() {
  fallback = true
  viewer?.dispose()
  viewer = undefined
  viewport.querySelector('canvas')?.remove()
  poster.hidden = false
  spread.step = '100'
  $('#gesture span').textContent = '静态渲染 · 可放大、拆解'
  paintExplosion(state.explosion)
  syncLabels()
  updateStatic()
}
async function boot() {
  syncLabels()
  try {
    const { createViewer } = await import('./scene.js')
    viewer = createViewer(viewport)
    renderSubject()
    poster.hidden = true
    viewport.querySelector('canvas').addEventListener('webglcontextlost',event=>{event.preventDefault();staticMode()},{once:true})
  } catch (error) {
    console.warn('三维渲染不可用，载入静态模型图。',error.message)
    staticMode()
  }
  updateAnchors()
}
boot()


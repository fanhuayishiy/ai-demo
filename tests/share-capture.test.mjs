import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const capture = await import('../shared/share-capture.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

function scene({blank = false, tainted = false, frame = false} = {}) {
  const dom = new JSDOM(`<!doctype html><body><canvas style="width:800px;height:600px"></canvas>${frame ? '<iframe src="https://foreign.test/"></iframe>' : ''}<ai-demo-github></ai-demo-github></body>`, {url:'https://example.test/demo/',pretendToBeVisual:true});
  const {window} = dom;
  let requests = 0;
  window.requestAnimationFrame = callback => {requests++; return window.setTimeout(() => callback(1), 0);};
  window.cancelAnimationFrame = id => window.clearTimeout(id);
  window.HTMLElement.prototype.getBoundingClientRect = () => ({left:0,top:0,right:800,bottom:600,width:800,height:600});
  window.HTMLCanvasElement.prototype.getContext = () => ({
    drawImage() {if (tainted) throw new Error('SecurityError');},
    getImageData() {return {data:blank ? new Uint8ClampedArray(16) : new Uint8ClampedArray([20,40,60,255,220,180,20,255,0,0,0,255,255,255,255,255])};},
  });
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,stable';
  return {dom,window,document:window.document,get requests() {return requests;}};
}

test('viewport and explicit tab capture helpers exist', () => {
  assert.equal(typeof capture.captureViewport, 'function');
  assert.equal(typeof capture.captureCurrentTab, 'function');
});

test('DOM capture preserves canvas pixels in the clone and excludes the shared utility', async () => {
  const env = scene();
  try {
    const output = {width:1024,height:768};
    let selected;
    const result = await capture.captureViewport({...env,html2canvas:async (element, options) => {
      selected = element;
      assert.ok(options.scale * options.width <= 1920);
      assert.ok(options.ignoreElements(env.document.querySelector('ai-demo-github')));
      const cloned = env.document.implementation.createHTMLDocument('clone');
      cloned.body.innerHTML = '<canvas style="width:800px;height:600px"></canvas>';
      await options.onclone(cloned);
      assert.equal(cloned.querySelector('canvas'), null);
      assert.equal(cloned.querySelector('img').src, 'data:image/png;base64,stable');
      assert.equal(cloned.querySelector('img').style.width, '800px');
      return output;
    }});
    assert.equal(result, output);
    assert.equal(selected, env.document.documentElement);
    assert.equal(env.document.querySelectorAll('canvas').length, 1, 'source canvas is never replaced');
    assert.equal(env.requests, 1);
  } finally {env.dom.window.close();}
});

test('blank and tainted canvases require explicit fallback after bounded retries', async () => {
  for (const mode of [{blank:true}, {tainted:true}]) {
    const env = scene(mode);
    try {
      await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Incomplete capture must not run')}), error => error.code === 'tab-capture-required');
      assert.ok(env.requests <= 3);
    } finally {env.dom.window.close();}
  }
});

test('visible cross-origin frames cannot silently disappear from a shared image', async () => {
  const env = scene({frame:true});
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Should need tab capture')}), error => error.code === 'tab-capture-required');
    assert.equal(env.requests, 0);
  } finally {env.dom.window.close();}
});

test('failed DOM captures clean up only their own temporary clone frames', async () => {
  const env = scene();
  const previous = env.document.createElement('iframe');
  previous.className = 'html2canvas-container';
  previous.style.display = 'none';
  env.document.body.append(previous);
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => {
      const owned = env.document.createElement('iframe');
      owned.className = 'html2canvas-container';
      owned.style.display = 'none';
      env.document.body.append(owned);
      return Promise.reject(new Error('Unsupported CSS'));
    }}), /Unsupported CSS/);
    assert.deepEqual([...env.document.querySelectorAll('.html2canvas-container')], [previous]);
  } finally {env.dom.window.close();}
});

function tabEnvironment({surface = 'browser', failPlay = false} = {}) {
  let stopped = 0, paused = 0, options;
  const track = {stop() {stopped++;},getSettings:() => ({displaySurface:surface})};
  const stream = {getTracks:() => [track],getVideoTracks:() => [track]};
  const video = {videoWidth:1920,videoHeight:1080,readyState:4,play:() => failPlay ? Promise.reject(new Error('play failed')) : Promise.resolve(),pause() {paused++;},remove() {}};
  const canvas = {getContext:() => ({drawImage() {}})};
  const window = {navigator:{mediaDevices:{getDisplayMedia(value) {options = value; return Promise.resolve(stream);}}}};
  return {window,document:{createElement:name => name === 'video' ? video : canvas},stream,video,canvas,get stopped() {return stopped;},get paused() {return paused;},get options() {return options;}};
}

test('explicit tab capture asks for browser video only and stops tracks after one frame', async () => {
  const env = tabEnvironment();
  const result = await capture.captureCurrentTab(env);
  assert.equal(env.options.audio, false);
  assert.equal(env.options.preferCurrentTab, true);
  assert.equal(env.options.video.displaySurface, 'browser');
  assert.equal(result, env.canvas);
  assert.equal(env.stopped, 1);
  assert.equal(env.video.srcObject, null);
  assert.equal(env.paused, 1);
});

test('all capture tracks stop on permission selection mismatch, playback error and cancellation', async () => {
  for (const config of [{surface:'monitor'}, {surface:'window'}, {failPlay:true}]) {
    const env = tabEnvironment(config);
    await assert.rejects(() => capture.captureCurrentTab(env));
    assert.equal(env.stopped, 1);
  }
  const env = tabEnvironment();
  let grant;
  env.window.navigator.mediaDevices.getDisplayMedia = () => new Promise(resolve => {grant = resolve;});
  const controller = new AbortController();
  const promise = capture.captureCurrentTab({...env,signal:controller.signal});
  controller.abort();
  grant(env.stream);
  await assert.rejects(() => promise, {name:'AbortError'});
  assert.equal(env.stopped, 1);
});

test('an already cancelled operation never opens a permission chooser', async () => {
  const env = tabEnvironment();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => capture.captureCurrentTab({...env,signal:controller.signal}), {name:'AbortError'});
  assert.equal(env.options, undefined);
});

test('canvases excluded with utility ancestors cannot shift cloned scene canvas indexes', async () => {
  const env = scene();
  const utility = env.document.createElement('div');
  utility.setAttribute('data-ai-demo-utility', '');
  utility.innerHTML = '<canvas></canvas>';
  env.document.body.prepend(utility);
  try {
    await capture.captureViewport({...env,html2canvas:async (_element, options) => {
      const clone = env.document.implementation.createHTMLDocument('clone');
      clone.body.innerHTML = '<canvas id="scene"></canvas>';
      await options.onclone(clone);
      assert.equal(clone.querySelector('#scene').tagName, 'IMG');
      return {width:800,height:600};
    }});
  } finally {env.dom.window.close();}
});

test('missing displaySurface metadata cannot authorize an unverified screen capture', async () => {
  const env = tabEnvironment({surface:''});
  await assert.rejects(() => capture.captureCurrentTab(env), /browser tab/);
  assert.equal(env.stopped, 1);
});

test('original full-size canvas clones are budgeted before html2canvas can allocate them', async () => {
  for (const hidden of [false, true]) {
    const env = scene();
    const large = env.document.createElement('canvas');
    large.width = large.height = 12000;
    if (hidden) large.style.display = 'none';
    env.document.body.append(large);
    try {
      await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Original canvas must never be cloned')}), /memory|dimensions/);
    } finally {env.dom.window.close();}
  }
});

test('visible videos require tab capture instead of shifting canvas clones to the wrong scene', async () => {
  const env = scene();
  env.document.body.prepend(env.document.createElement('video'));
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Mixed media needs tab capture')}), error => error.code === 'tab-capture-required');
  } finally {env.dom.window.close();}
});

test('hidden videos and frames are excluded from the clone while the scene remains mapped', async () => {
  const env = scene();
  const video = env.document.createElement('video');
  video.style.display = 'none';
  env.document.body.prepend(video);
  try {
    await capture.captureViewport({...env,html2canvas:async (_element, options) => {
      assert.equal(options.ignoreElements(video), true);
      assert.equal(options.ignoreElements(env.document.createElement('iframe')), true);
      return {width:800,height:600};
    }});
  } finally {env.dom.window.close();}
});

test('custom shadow canvases trigger safe fallback before unbudgeted library cloning', async () => {
  const env = scene();
  const widget = env.document.createElement('scene-widget');
  widget.attachShadow({mode:'open'}).innerHTML = '<canvas></canvas>';
  env.document.body.append(widget);
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Unmapped shadow canvas')}), error => error.code === 'tab-capture-required');
  } finally {env.dom.window.close();}
});

test('original clone dimensions are revalidated synchronously after RAF changes', async () => {
  const env = scene();
  const raf = env.window.requestAnimationFrame;
  env.window.requestAnimationFrame = callback => raf(() => {
    const canvas = env.document.querySelector('canvas');
    canvas.width = canvas.height = 12000;
    callback(1);
  });
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Resized original must not be cloned')}), /memory|dimensions/);
  } finally {env.dom.window.close();}
});

test('unknown nested shadow content cannot bypass the clone memory or embedded-frame checks', async () => {
  for (const content of ['iframe','nested-widget']) {
    const env = scene();
    const widget = env.document.createElement('scene-widget');
    const shadow = widget.attachShadow({mode:'open'});
    shadow.innerHTML = '<' + content + '></' + content + '>';
    if (content === 'nested-widget') shadow.firstChild.attachShadow({mode:'open'}).innerHTML = '<canvas width="12000" height="12000"></canvas>';
    env.document.body.append(widget);
    try {
      await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Unverified shadow contents')}), error => error.code === 'tab-capture-required');
    } finally {env.dom.window.close();}
  }
});

test('unverified custom elements with closed shadow content cannot silently disappear', async () => {
  const env = scene();
  const widget = env.document.createElement('scene-widget');
  widget.attachShadow({mode:'closed'}).innerHTML = '<h1>Scene content</h1><canvas></canvas>';
  env.document.body.append(widget);
  assert.equal(widget.shadowRoot, null, 'closed roots cannot be inspected');
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Custom scene cannot be verified')}), error => error.code === 'tab-capture-required');
  } finally {env.dom.window.close();}
});

test('customized built-in elements with closed shadow content also require tab capture', async () => {
  const env = scene();
  const widget = env.document.createElement('div');
  widget.setAttribute('is', 'scene-widget');
  widget.attachShadow({mode:'closed'}).innerHTML = '<h1>Scene content</h1><canvas></canvas>';
  env.document.body.append(widget);
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Custom scene cannot be verified')}), error => error.code === 'tab-capture-required');
  } finally {env.dom.window.close();}
});

test('registered customized built-ins are detected without reconstructing the custom element', async () => {
  const env = scene();
  let constructions = 0;
  class SceneWidget extends env.window.HTMLDivElement {
    constructor() {
      super();
      constructions++;
      this.attachShadow({mode:'closed'}).innerHTML = '<h1>Scene content</h1><canvas></canvas>';
    }
  }
  env.window.customElements.define('scene-widget', SceneWidget, {extends:'div'});
  const widget = env.document.createElement('div', {is:'scene-widget'});
  env.document.body.append(widget);
  assert.equal(widget.hasAttribute('is'), false, 'the internal custom-element is value need not be an attribute');
  assert.equal(widget.constructor, SceneWidget);
  try {
    await assert.rejects(() => capture.captureViewport({...env,html2canvas:() => assert.fail('Custom scene cannot be verified')}), error => error.code === 'tab-capture-required');
    assert.equal(constructions, 1, 'preflight must not invoke application constructors');
  } finally {env.dom.window.close();}
});

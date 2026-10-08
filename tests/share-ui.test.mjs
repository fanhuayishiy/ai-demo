import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const ui = await import('../shared/share-ui.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

function harness(overrides = {}) {
  const dom = new JSDOM('<!doctype html><title>Current scene</title><main>Original app</main><ai-demo-github></ai-demo-github>', {url:'https://example.test/current/?scene=2#camera'});
  const {window} = dom, {document} = window;
  const host = document.querySelector('ai-demo-github');
  const shadow = host.attachShadow({mode:'open'});
  const source = readFileSync(new URL('../shared/github-entry.html', import.meta.url), 'utf8');
  shadow.innerHTML = source.match(/shadow\.innerHTML = `([\s\S]*?)`;/u)[1];
  const revoked = [];
  window.URL.createObjectURL = () => 'blob:https://example.test/generated-image';
  window.URL.revokeObjectURL = url => revoked.push(url);
  Object.defineProperty(window.navigator, 'mediaDevices', {value:{getDisplayMedia() {}}});
  const calls = [];
  const blob = new Blob(['png'], {type:'image/png'});
  const cleanup = ui.connectShareUI({window,document,host,shadow,
    capture(mode, signal) {calls.push(['capture',mode,signal]); return Promise.resolve({width:800,height:600});},
    makeBlob(image, metadata) {calls.push(['card',image,metadata]); return Promise.resolve(blob);},
    copy(promise) {calls.push(['copy',promise]); return promise.then(() => ({ok:true}), () => ({ok:false}));},
    ...overrides,
  });
  return {dom,window,document,host,shadow,calls,blob,revoked,cleanup,button:action => shadow.querySelector(`[data-action="${action}"]`),close() {cleanup();dom.window.close();}};
}

test('share UI controller exists', () => assert.equal(typeof ui.connectShareUI, 'function'));

test('share click starts the promised image copy immediately and preserves the current URL', async () => {
  const env = harness();
  try {
    env.button('share').click();
    assert.deepEqual(env.calls.map(call => call[0]), ['capture','copy']);
    env.button('share').click();
    assert.equal(env.calls.length, 2, 'repeat clicks cannot start another capture');
    await settle();
    assert.equal(env.calls.find(call => call[0] === 'card')[2].url, env.window.location.href);
    assert.match(env.shadow.querySelector('.status-message').textContent, /已复制.*图片/);
    assert.equal(env.shadow.querySelector('dialog').open, false);
    assert.equal(env.button('share').disabled, false);
  } finally {env.close();}
});

test('denied image copy retains a preview with copy-again and explicit PNG save', async () => {
  let attempts = 0;
  const env = harness({copy:promise => {attempts++; return promise.then(() => ({ok:attempts > 1}));}});
  try {
    env.button('share').click();
    await settle();
    const dialog = env.shadow.querySelector('dialog');
    assert.equal(dialog.open, true);
    assert.match(dialog.getAttribute('aria-labelledby'), /share-heading/);
    assert.equal(env.shadow.querySelector('.share-preview').src, 'blob:https://example.test/generated-image');
    assert.equal(env.button('save').download, 'ai-demo-share.png');
    assert.equal(env.button('copy-again').hidden, false);
    assert.doesNotMatch(env.shadow.querySelector('.share-explanation').textContent, /已复制/);
    env.button('copy-again').click();
    await settle();
    assert.equal(attempts, 2);
    assert.match(env.shadow.querySelector('.share-explanation').textContent, /已复制/);
    env.button('close-dialog').click();
    assert.equal(dialog.open, false);
    assert.equal(env.shadow.activeElement, env.button('share'));
    assert.equal(env.revoked.length, 1);
  } finally {env.close();}
});

test('capture failure offers an explicit current-tab action without opening a chooser itself', async () => {
  const modes = [];
  const env = harness({capture:mode => {modes.push(mode); return mode === 'dom' ? Promise.reject(new Error('Blank WebGL')) : Promise.resolve({width:800,height:600});}});
  try {
    env.button('share').click();
    await settle();
    assert.deepEqual(modes, ['dom']);
    assert.equal(env.shadow.querySelector('dialog').open, true);
    assert.equal(env.button('capture-tab').hidden, false);
    env.button('capture-tab').click();
    assert.deepEqual(modes, ['dom','tab']);
    assert.equal(env.host.hasAttribute('data-sharing-capture'), true, 'hide state must participate in the shadow cascade');
    await settle();
    assert.equal(env.host.hasAttribute('data-sharing-capture'), false);
  } finally {env.close();}
});

test('current-tab capture restores controls before delayed composition and clipboard work', async () => {
  let captureSignal;
  const env = harness({
    capture: (mode, signal) => {
      captureSignal = signal;
      return mode === 'dom' ? Promise.reject(new Error('Blank WebGL')) : Promise.resolve({width:800,height:600});
    },
    makeBlob: () => new Promise(() => {}),
  });
  try {
    env.button('share').click();
    await settle();
    env.button('capture-tab').click();
    assert.equal(env.host.hasAttribute('data-sharing-capture'), true);
    await settle();
    assert.equal(env.host.hasAttribute('data-sharing-capture'), false, 'hide only while taking the actual frame');
    assert.equal(env.button('cancel-share').hidden, false);
    env.button('cancel-share').click();
    assert.equal(captureSignal.aborted, true);
    assert.equal(env.button('share').disabled, false);
  } finally {env.close();}
});

test('dismissal aborts the running capture and cannot show a late success or retained image', async () => {
  let signal, grant;
  const env = harness({capture:(_mode, value) => {signal = value; return new Promise(resolve => {grant = resolve;});}});
  try {
    env.button('share').click();
    env.cleanup();
    assert.equal(signal.aborted, true);
    grant({width:800,height:600});
    await settle();
    assert.doesNotMatch(env.shadow.querySelector('.status-message').textContent, /已复制/);
    assert.equal(env.shadow.querySelector('dialog').open, false);
    assert.equal(env.calls.filter(call => call[0] === 'card').length, 0);
  } finally {env.close();}
});

test('cancel and Escape release resources while leaving the scene unchanged', async () => {
  const env = harness({copy:promise => promise.then(() => ({ok:false}))});
  try {
    env.button('share').click();
    await settle();
    env.shadow.querySelector('dialog').dispatchEvent(new env.window.KeyboardEvent('keydown', {key:'Escape',bubbles:true,cancelable:true}));
    assert.equal(env.shadow.querySelector('dialog').open, false);
    assert.equal(env.revoked.length, 1);
    assert.equal(env.document.querySelector('main').textContent, 'Original app');
  } finally {env.close();}
});

test('closing a pending second copy cancels its UI lifecycle and cannot announce late success', async () => {
  let attempts = 0, finish;
  const env = harness({copy:promise => ++attempts === 1 ? promise.then(() => ({ok:false})) : new Promise(resolve => {finish = resolve;})});
  try {
    env.button('share').click();
    await settle();
    env.button('copy-again').click();
    env.button('close-dialog').click();
    assert.equal(env.button('share').disabled, false);
    finish({ok:true});
    await settle();
    assert.doesNotMatch(env.shadow.querySelector('.status-message').textContent, /已复制/);
    assert.equal(env.revoked.length, 1);
  } finally {env.close();}
});

test('URL or PNG composition errors never offer an unrelated tab permission request', async () => {
  const env = harness({makeBlob:() => Promise.reject(new Error('Share URL exceeds QR limit'))});
  try {
    env.button('share').click();
    await settle();
    assert.equal(env.shadow.querySelector('dialog').open, true);
    assert.equal(env.button('capture-tab').hidden, true);
    assert.match(env.shadow.querySelector('.share-explanation').textContent, /合成|编码|网址/);
    assert.doesNotMatch(env.shadow.querySelector('.share-explanation').textContent, /请求截图权限/);
  } finally {env.close();}
});

test('BFCache suspension releases temporary images but leaves sharing usable on return', async () => {
  const env = harness({copy:promise => promise.then(() => ({ok:false}))});
  try {
    env.button('share').click();
    await settle();
    env.window.dispatchEvent(new env.window.PageTransitionEvent('pagehide', {persisted:true}));
    assert.equal(env.shadow.querySelector('dialog').open, false);
    assert.equal(env.revoked.length, 1);
    env.window.dispatchEvent(new env.window.PageTransitionEvent('pageshow', {persisted:true}));
    env.button('share').click();
    await settle();
    assert.equal(env.calls.filter(call => call[0] === 'capture').length, 2);
    assert.equal(env.shadow.querySelector('dialog').open, true);
  } finally {env.close();}
});

test('keyboard cancellation returns focus to the share button', () => {
  const env = harness({capture:() => new Promise(() => {})});
  try {
    env.button('share').click();
    env.button('cancel-share').focus();
    env.button('cancel-share').click();
    assert.equal(env.shadow.activeElement, env.button('share'));
    assert.equal(env.button('share').disabled, false);
  } finally {env.close();}
});

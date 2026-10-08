import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import * as implementation from '../shared/pageviews.mjs';

const production = 'https://fanhuayishiy.github.io/ai-demo/example/preview.html';

test('application iframe CSS cannot make the analytics utility occupy the preview', t => {
  const f = fixture(t);
  f.start();
  const iframe = f.document.querySelector('iframe');
  assert.equal(iframe.style.getPropertyValue('display'), 'none');
  assert.equal(iframe.style.getPropertyPriority('display'), 'important');
  assert.equal(iframe.style.width, '0px');
  assert.equal(iframe.style.height, '0px');
});

function api(name) {
  assert.equal(typeof implementation[name], 'function', `${name} must be implemented`);
  return implementation[name];
}

// Neither harness enables jsdom resources or automatic scripts. No third-party
// endpoint is requested; only our own srcdoc bootstrap is explicitly evaluated.
function fixture(t, url = production) {
  const dom = new JSDOM('<!doctype html><html><head><title>Scene</title></head><body><main id="scene">Unchanged app</main></body></html>', {
    url, runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const counts = [];
  const unavailable = [];
  const options = { window: dom.window, document: dom.window.document, onCount: (count) => counts.push(count), onUnavailable: () => unavailable.push(true) };
  return { ...options, counts, unavailable, start: (overrides = {}) => api('startPageviews')({ ...options, ...overrides }) };
}

function bootstrap(t, iframe) {
  const child = new JSDOM(iframe.srcdoc, { url: production, runScripts: 'outside-only' });
  t.after(() => child.window.close());
  const messages = [];
  child.window.parent.postMessage = (data, target) => messages.push({ data, target });
  const inline = [...child.window.document.scripts].filter((script) => !script.src);
  assert.equal(inline.length, 1, 'srcdoc has one local bootstrap');
  child.window.eval(inline[0].textContent);
  const external = [...child.window.document.scripts].filter((script) => script.src);
  assert.equal(external.length, 1, 'one JSONP request is assembled in the child');
  const script = external[0];
  const callback = new URL(script.src).searchParams.get('jsonpCallback');
  return {
    child: child.window, script, messages,
    payload(count = 23) {
      child.window[callback]({ site_pv: 999, site_uv: 555, page_pv: count });
      return messages.at(-1).data;
    },
  };
}

function deliver(f, iframe, data, overrides = {}) {
  f.window.dispatchEvent(new f.window.MessageEvent('message', {
    data, origin: 'null', source: iframe.contentWindow, ...overrides,
  }));
}

test('counts production preview URLs and ignores fragments', () => {
  const count = api('shouldCount');
  for (const url of [production, `${production}#camera`, `${production}#?private=fragment`, 'https://fanhuayishiy.github.io:443/ai-demo/example/']) {
    assert.equal(count(new URL(url), {}), true, url);
  }
  assert.equal(count(production, {}), true, 'URL strings are accepted too');
});

for (const url of [
  'http://localhost:5185/ai-demo/example/',
  'http://127.0.0.1/ai-demo/example/',
  'file:///E:/ai-demo/example/preview.html',
  'http://fanhuayishiy.github.io/ai-demo/example/',
  'https://fanhuayishiy.github.io:444/ai-demo/example/',
  'https://fanhuayishiy.github.io.evil.test/ai-demo/example/',
  'https://evil.test/ai-demo/example/',
  'https://user:secret@fanhuayishiy.github.io/ai-demo/example/',
  'https://fanhuayishiy.github.io/',
  'https://fanhuayishiy.github.io/ai-demo',
  'https://fanhuayishiy.github.io/ai-demo/',
  'https://fanhuayishiy.github.io/ai-demo/index.html',
  'https://fanhuayishiy.github.io/ai-demo//',
  'https://fanhuayishiy.github.io/ai-demo-other/example/',
  'https://fanhuayishiy.github.io/AI-DEMO/example/',
  'https://fanhuayishiy.github.io/ai-demo/example/../',
  `${production}?token=private`,
  `${production}?`,
  `${production}?#safe-looking`,
  'not a URL',
]) {
  test(`does not count excluded URL ${JSON.stringify(url)}`, () => {
    assert.equal(api('shouldCount')(url, {}), false);
  });
}

test('honors navigator privacy preferences without treating DNT 0 as opt-out', () => {
  const count = api('shouldCount');
  for (const navigator of [{ doNotTrack: '1' }, { msDoNotTrack: '1' }, { globalPrivacyControl: true }]) {
    assert.equal(count(production, navigator), false);
  }
  assert.equal(count(production, { doNotTrack: '0', globalPrivacyControl: false }), true);
});

test('skips local URLs with unavailable, no frame, no network and no fake zero', (t) => {
  const f = fixture(t, 'http://localhost:5185/example/');
  const cleanup = f.start();
  cleanup();
  cleanup();
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.document.querySelectorAll('iframe, script[src]').length, 0);
});

test('start also honors legacy window.doNotTrack', (t) => {
  const f = fixture(t);
  f.window.doNotTrack = '1';
  f.start();
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.document.querySelector('iframe'), null);
});

test('isolates one Busuanzi script in a hidden opaque-origin frame', (t) => {
  const f = fixture(t);
  const beforeHead = f.document.head.innerHTML;
  const beforeScene = f.document.querySelector('main').outerHTML;
  const cleanup = f.start();
  const iframe = f.document.querySelector('iframe');
  assert.ok(iframe);
  assert.equal(iframe.getAttribute('sandbox'), 'allow-scripts');
  assert.equal(iframe.hidden, true);
  assert.equal(iframe.getAttribute('aria-hidden'), 'true');
  assert.equal(iframe.tabIndex, -1);
  assert.equal(iframe.getAttribute('referrerpolicy'), 'no-referrer-when-downgrade');
  assert.equal(f.document.querySelector('script'), null, 'provider never executes in app document');
  assert.equal(f.document.head.innerHTML, beforeHead);
  assert.equal(f.document.querySelector('main').outerHTML, beforeScene);
  const child = bootstrap(t, iframe);
  const endpoint = new URL(child.script.src);
  assert.equal(endpoint.origin, 'https://busuanzi.ibruce.info');
  assert.equal(endpoint.pathname, '/busuanzi');
  assert.deepEqual([...endpoint.searchParams.keys()], ['jsonpCallback']);
  assert.match(endpoint.searchParams.get('jsonpCallback'), /^[A-Za-z_$][\w$]*$/u);
  assert.equal(child.script.getAttribute('referrerpolicy'), 'no-referrer-when-downgrade');
  const data = child.payload();
  assert.equal(data.type, 'ai-demo-pageviews');
  assert.equal(typeof data.token, 'string');
  assert.ok(data.token.length >= 16);
  assert.equal(data.page_pv, 23);
  assert.equal(child.messages[0].target, '*', 'opaque origin requires wildcard target; receiver verifies source');
  assert.equal(Object.hasOwn(f.window, endpoint.searchParams.get('jsonpCallback')), false);
  cleanup();
});

test('marks the counter frame for explicit utility exclusion from screenshots', (t) => {
  const f = fixture(t);
  const cleanup = f.start();
  assert.equal(f.document.querySelector('iframe').hasAttribute('data-ai-demo-utility'), true);
  cleanup();
});

test('accepts only safe page counts and removes resources before notifying', (t) => {
  const f = fixture(t);
  const removeListener = t.mock.method(f.window, 'removeEventListener');
  const clearTimer = t.mock.method(f.window, 'clearTimeout');
  const cleanup = f.start({ onCount(count) {
    assert.equal(f.document.querySelector('iframe'), null);
    f.counts.push(count);
  } });
  const iframe = f.document.querySelector('iframe');
  const data = bootstrap(t, iframe).payload(0);
  deliver(f, iframe, data);
  deliver(f, iframe, data);
  cleanup();
  cleanup();
  assert.deepEqual(f.counts, [0], 'a genuine provider zero is valid');
  assert.deepEqual(f.unavailable, []);
  assert.equal(removeListener.mock.calls.filter(({ arguments: args }) => args[0] === 'message').length, 1);
  assert.equal(clearTimer.mock.callCount(), 1);
});

test('ignores forged source, token, origin and type', (t) => {
  const f = fixture(t);
  f.start();
  const iframe = f.document.querySelector('iframe');
  const data = bootstrap(t, iframe).payload(42);
  deliver(f, iframe, data, { source: f.window });
  deliver(f, iframe, data, { source: null });
  deliver(f, iframe, data, { origin: 'https://busuanzi.ibruce.info' });
  deliver(f, iframe, data, { origin: 'https://fanhuayishiy.github.io' });
  deliver(f, iframe, { ...data, token: 'wrong-token' });
  deliver(f, iframe, { ...data, type: 'different-counter' });
  deliver(f, iframe, { ...data, token: 'wrong-token', unavailable: true });
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, []);
  assert.equal(iframe.isConnected, true);
  deliver(f, iframe, data);
  assert.deepEqual(f.counts, [42]);
});

test('ignores invalid page counts without coercion, then accepts a valid count', (t) => {
  const f = fixture(t);
  f.start();
  const iframe = f.document.querySelector('iframe');
  const data = bootstrap(t, iframe).payload(17);
  for (const page_pv of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '12', null, undefined, true, {}, []]) {
    deliver(f, iframe, { ...data, page_pv });
  }
  for (const malformed of [null, undefined, 'string', 12]) deliver(f, iframe, malformed);
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, []);
  deliver(f, iframe, { ...data, page_pv: Number.MAX_SAFE_INTEGER });
  assert.deepEqual(f.counts, [Number.MAX_SAFE_INTEGER]);
});

test('child script errors report unavailable and clean the pending request', (t) => {
  const f = fixture(t);
  f.start();
  const iframe = f.document.querySelector('iframe');
  const child = bootstrap(t, iframe);
  child.script.dispatchEvent(new child.child.Event('error'));
  deliver(f, iframe, child.messages.at(-1).data);
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(iframe.isConnected, false);
});

test('invalid JSONP payload reports unavailable rather than inventing zero', (t) => {
  const f = fixture(t);
  f.start();
  const iframe = f.document.querySelector('iframe');
  const child = bootstrap(t, iframe);
  deliver(f, iframe, child.payload('42'));
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(iframe.isConnected, false);
});

test('frame load error cleans up and reports unavailable exactly once', (t) => {
  const f = fixture(t);
  const cleanup = f.start();
  const iframe = f.document.querySelector('iframe');
  iframe.dispatchEvent(new f.window.Event('error'));
  iframe.dispatchEvent(new f.window.Event('error'));
  cleanup();
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(iframe.isConnected, false);
});

test('times out once and never reports a fake count', async (t) => {
  const f = fixture(t);
  const cleanup = f.start({ timeoutMs: 5 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  cleanup();
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(f.document.querySelector('iframe'), null);
});

test('defaults to a finite eight-second timeout', (t) => {
  const f = fixture(t);
  const timer = t.mock.method(f.window, 'setTimeout');
  const cleanup = f.start();
  assert.equal(timer.mock.calls[0].arguments[1], 8000);
  cleanup();
});

test('manual cleanup is silent, idempotent and ignores subsequent results', (t) => {
  const f = fixture(t);
  const original = f.document.body.innerHTML;
  const cleanup = f.start();
  const iframe = f.document.querySelector('iframe');
  const data = bootstrap(t, iframe).payload(10);
  cleanup();
  cleanup();
  deliver(f, iframe, data);
  iframe.dispatchEvent(new f.window.Event('error'));
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, []);
  assert.equal(f.document.body.innerHTML, original);
});

test('concurrent subscribers share one request and completed results are reused', (t) => {
  const f = fixture(t);
  const firstCleanup = f.start();
  const iframe = f.document.querySelector('iframe');
  const secondCounts = [];
  const secondCleanup = f.start({ onCount: (count) => secondCounts.push(count) });
  assert.equal(f.document.querySelectorAll('iframe').length, 1);
  deliver(f, iframe, bootstrap(t, iframe).payload(9));
  assert.deepEqual(f.counts, [9]);
  assert.deepEqual(secondCounts, [9]);
  f.start();
  assert.deepEqual(f.counts, [9, 9], 'late subscriber receives cached result without recounting');
  assert.equal(f.document.querySelector('iframe'), null);
  firstCleanup();
  secondCleanup();
});

test('a subscriber exception does not prevent another subscriber receiving the result', (t) => {
  const f = fixture(t);
  const errors = [];
  f.window.reportError = (error) => errors.push(error);
  f.window.addEventListener('error', (event) => event.preventDefault());
  const consumerError = new Error('Broken UI subscriber');
  f.start({ onCount: () => { throw consumerError; } });
  f.start();
  const iframe = f.document.querySelector('iframe');
  deliver(f, iframe, bootstrap(t, iframe).payload(25));
  assert.deepEqual(f.counts, [25]);
  assert.deepEqual(errors, [consumerError]);
  assert.equal(f.document.querySelector('iframe'), null);
});

test('a cancelled subscriber stays silent while another receives the shared result', (t) => {
  const f = fixture(t);
  const cleanup = f.start();
  const second = [];
  f.start({ onCount: (count) => second.push(count) });
  const iframe = f.document.querySelector('iframe');
  cleanup();
  deliver(f, iframe, bootstrap(t, iframe).payload(13));
  assert.deepEqual(f.counts, []);
  assert.deepEqual(second, [13]);
});

test('cleanup during another subscriber callback suppresses pending notification', (t) => {
  const f = fixture(t);
  let cleanupSecond;
  f.start({ onCount: () => cleanupSecond() });
  cleanupSecond = f.start();
  const iframe = f.document.querySelector('iframe');
  deliver(f, iframe, bootstrap(t, iframe).payload(13));
  assert.deepEqual(f.counts, []);
});

test('subscriber cleanup keeps another subscription alive but never recounts after full cancellation', (t) => {
  const f = fixture(t);
  const cleanup = f.start();
  const second = [];
  const lastCleanup = f.start({ onCount: (count) => second.push(count) });
  const iframe = f.document.querySelector('iframe');
  cleanup();
  assert.equal(iframe.isConnected, true);
  lastCleanup();
  assert.equal(iframe.isConnected, false);
  f.start();
  assert.equal(f.document.querySelector('iframe'), null);
  assert.deepEqual(f.counts, []);
  assert.deepEqual(second, []);
  assert.deepEqual(f.unavailable, [true]);
});

test('different documents use unique unpredictable message tokens', (t) => {
  const first = fixture(t);
  const second = fixture(t);
  const cleanupFirst = first.start();
  const cleanupSecond = second.start();
  const one = bootstrap(t, first.document.querySelector('iframe')).payload();
  const two = bootstrap(t, second.document.querySelector('iframe')).payload();
  assert.notEqual(one.token, two.token);
  cleanupFirst();
  cleanupSecond();
});

test('frame creation failure degrades to unavailable without leaving resources', (t) => {
  const f = fixture(t);
  t.mock.method(f.document.body, 'appendChild', () => { throw new Error('Frame creation denied'); });
  const cleanup = f.start();
  cleanup();
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(f.document.querySelector('iframe'), null);
});

test('unavailable cryptographic randomness prevents any request', (t) => {
  const f = fixture(t);
  t.mock.method(f.window.crypto, 'getRandomValues', () => { throw new Error('Randomness unavailable'); });
  f.start();
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.document.querySelector('iframe'), null);
});

test('invalid timeout inputs retain the finite default', (t) => {
  for (const timeoutMs of [NaN, Infinity, -1, '100']) {
    const f = fixture(t);
    const timer = t.mock.method(f.window, 'setTimeout');
    const cleanup = f.start({ timeoutMs });
    assert.equal(timer.mock.calls[0].arguments[1], 8000);
    cleanup();
  }
});

test('browser helper stays import-free and adds no storage, polling or app-global JSONP', async () => {
  const source = await readFile(new URL('../shared/pageviews.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s/mu);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|setInterval|indexedDB)\b|document\.cookie/u);
  assert.doesNotMatch(source, /export\s+(?:default|\{)/u);
  assert.doesNotMatch(source, /<\/script/iu, 'text bundling must not prematurely terminate the app script');
});

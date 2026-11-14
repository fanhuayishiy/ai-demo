import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import * as implementation from '../shared/pageviews.mjs';

const production = 'https://fanhuayishiy.github.io/ai-demo/example/preview.html';

function api(name) {
  assert.equal(typeof implementation[name], 'function', `${name} must be implemented`);
  return implementation[name];
}

function fixture(t, url = production) {
  const dom = new JSDOM('<!doctype html><html><head><title>Scene</title></head><body><main id="scene">Unchanged app</main></body></html>', {
    url, runScripts: 'outside-only',
  });
  t.after(() => dom.window.close());
  const counts = [];
  const unavailable = [];
  const options = {
    window: dom.window,
    document: dom.window.document,
    onCount: (count) => counts.push(count),
    onUnavailable: () => unavailable.push(true),
  };
  return {
    ...options,
    counts,
    unavailable,
    start: (overrides = {}) => api('startPageviews')({ ...options, ...overrides }),
    script: () => dom.window.document.querySelector('script[data-ai-demo-pageviews]'),
  };
}

function request(f) {
  const script = f.script();
  assert.ok(script, 'a direct JSONP script should exist');
  const endpoint = new URL(script.src);
  const callback = endpoint.searchParams.get('jsonpCallback');
  assert.match(callback, /^__aiDemoPageviews_[a-f0-9]{32}$/u);
  assert.equal(typeof f.window[callback], 'function');
  return {
    script,
    endpoint,
    callback,
    payload(...args) {
      const page_pv = args.length ? args[0] : 23;
      f.window[callback]({ site_pv: 999, site_uv: 555, page_pv });
    },
  };
}

function siteRequest(f) {
  const script = f.document.querySelector('script[data-ai-demo-site-pageviews]');
  assert.ok(script, 'the aggregate statistics page should request site PV');
  const endpoint = new URL(script.src);
  const callback = endpoint.searchParams.get('jsonpCallback');
  assert.match(callback, /^__aiDemoSitePageviews_[a-f0-9]{32}$/u);
  assert.equal(typeof f.window[callback], 'function');
  return {
    script,
    endpoint,
    callback,
    payload(data) {
      f.window[callback](data);
    },
  };
}

test('counts the production homepage and parameter-free child pages', () => {
  const count = api('shouldCount');
  for (const url of [
    'https://fanhuayishiy.github.io/ai-demo',
    'https://fanhuayishiy.github.io/ai-demo/',
    'https://fanhuayishiy.github.io/ai-demo/index.html',
    production,
    `${production}#camera`,
    `${production}#?private=fragment`,
    'https://fanhuayishiy.github.io:443/ai-demo/example/',
  ]) assert.equal(count(url, {}), true, url);
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
  'https://fanhuayishiy.github.io/ai-demo//',
  'https://fanhuayishiy.github.io/ai-demo-other/example/',
  'https://fanhuayishiy.github.io/AI-DEMO/example/',
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

test('local pages make no external request and report unavailable without a fake zero', (t) => {
  const f = fixture(t, 'http://localhost:5185/example/');
  const cleanup = f.start();
  cleanup();
  cleanup();
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.script(), null);
});

test('also honors legacy window.doNotTrack', (t) => {
  const f = fixture(t);
  f.window.doNotTrack = '1';
  f.start();
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.script(), null);
});

test('runs one top-level JSONP request that can identify the page referrer', (t) => {
  const f = fixture(t);
  const beforeHead = f.document.head.innerHTML;
  const beforeScene = f.document.querySelector('main').outerHTML;
  const cleanup = f.start();
  const direct = request(f);
  assert.equal(direct.endpoint.origin, 'https://busuanzi.ibruce.info');
  assert.equal(direct.endpoint.pathname, '/busuanzi');
  assert.deepEqual([...direct.endpoint.searchParams.keys()], ['jsonpCallback']);
  assert.equal(direct.script.getAttribute('referrerpolicy'), 'no-referrer-when-downgrade');
  assert.equal(f.document.querySelector('iframe'), null, 'analytics must not use an opaque-origin frame');
  assert.notEqual(f.document.head.innerHTML, beforeHead);
  assert.equal(f.document.querySelector('main').outerHTML, beforeScene);
  direct.payload(23);
  assert.deepEqual(f.counts, [23]);
  assert.deepEqual(f.unavailable, []);
  assert.equal(f.script(), null);
  assert.equal(Object.hasOwn(f.window, direct.callback), false);
  cleanup();
});

test('the existing page request also exposes site totals without a second network call', (t) => {
  const f = fixture(t);
  const received = [];
  f.start({ onCount: (count, stats) => received.push({ count, stats }) });
  request(f).payload(7);
  assert.deepEqual(received, [{ count: 7, stats: { sitePv: 999, siteUv: 555 } }]);
  assert.equal(f.document.querySelectorAll('script[data-ai-demo-pageviews]').length, 0);
});

test('accepts a genuine zero count and removes every transient resource', (t) => {
  const f = fixture(t);
  t.mock.method(f.window, 'clearTimeout');
  const cleanup = f.start({ onCount(count) {
    assert.equal(f.script(), null);
    f.counts.push(count);
  } });
  request(f).payload(0);
  cleanup();
  cleanup();
  assert.deepEqual(f.counts, [0]);
  assert.deepEqual(f.unavailable, []);
  assert.equal(f.window.clearTimeout.mock.callCount(), 1);
});

for (const page_pv of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '12', null, undefined, true, {}, []]) {
  test(`rejects invalid page count without coercion: ${String(page_pv)}`, (t) => {
    const f = fixture(t);
    f.start();
    request(f).payload(page_pv);
    assert.deepEqual(f.counts, []);
    assert.deepEqual(f.unavailable, [true]);
    assert.equal(f.script(), null);
  });
}

test('accepts the largest safe integer count', (t) => {
  const f = fixture(t);
  f.start();
  request(f).payload(Number.MAX_SAFE_INTEGER);
  assert.deepEqual(f.counts, [Number.MAX_SAFE_INTEGER]);
});

test('script errors report unavailable exactly once and clean up', (t) => {
  const f = fixture(t);
  f.start();
  const direct = request(f);
  direct.script.dispatchEvent(new f.window.Event('error'));
  direct.script.dispatchEvent(new f.window.Event('error'));
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(f.script(), null);
});

test('times out once and never reports a fake count', async (t) => {
  const f = fixture(t);
  const cleanup = f.start({ timeoutMs: 5 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  cleanup();
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(f.script(), null);
});

test('defaults to a finite eight-second timeout', (t) => {
  const f = fixture(t);
  const timer = t.mock.method(f.window, 'setTimeout');
  const cleanup = f.start();
  assert.equal(timer.mock.calls[0].arguments[1], 8000);
  cleanup();
});

test('manual cleanup is silent, idempotent and ignores late callbacks', (t) => {
  const f = fixture(t);
  const original = f.document.body.innerHTML;
  const cleanup = f.start();
  const direct = request(f);
  const callback = f.window[direct.callback];
  cleanup();
  cleanup();
  callback({ page_pv: 10 });
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, []);
  assert.equal(f.script(), null);
  assert.equal(f.document.body.innerHTML, original);
});

test('concurrent subscribers share one request and completed results are reused', (t) => {
  const f = fixture(t);
  const firstCleanup = f.start();
  const secondCounts = [];
  const secondCleanup = f.start({ onCount: (count) => secondCounts.push(count) });
  assert.equal(f.document.querySelectorAll('script[data-ai-demo-pageviews]').length, 1);
  request(f).payload(9);
  assert.deepEqual(f.counts, [9]);
  assert.deepEqual(secondCounts, [9]);
  f.start();
  assert.deepEqual(f.counts, [9, 9], 'late subscriber receives cached result without recounting');
  assert.equal(f.script(), null);
  firstCleanup();
  secondCleanup();
});

test('a subscriber exception does not prevent another subscriber receiving the result', (t) => {
  const f = fixture(t);
  const errors = [];
  f.window.reportError = (error) => errors.push(error);
  const consumerError = new Error('Broken UI subscriber');
  f.start({ onCount: () => { throw consumerError; } });
  f.start();
  request(f).payload(25);
  assert.deepEqual(f.counts, [25]);
  assert.deepEqual(errors, [consumerError]);
});

test('cancelling the last subscriber aborts silently and never recounts', (t) => {
  const f = fixture(t);
  const cleanup = f.start();
  const direct = request(f);
  cleanup();
  assert.equal(f.script(), null);
  assert.equal(Object.hasOwn(f.window, direct.callback), false);
  f.start();
  assert.deepEqual(f.counts, []);
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.script(), null);
});

test('different documents use unique unpredictable callbacks', (t) => {
  const first = fixture(t);
  const second = fixture(t);
  const cleanupFirst = first.start();
  const cleanupSecond = second.start();
  assert.notEqual(request(first).callback, request(second).callback);
  cleanupFirst();
  cleanupSecond();
});

test('script creation failure degrades to unavailable without leaving resources', (t) => {
  const f = fixture(t);
  t.mock.method(f.document.head, 'appendChild', () => { throw new Error('Script creation denied'); });
  const cleanup = f.start();
  cleanup();
  assert.deepEqual(f.unavailable, [true]);
  assert.deepEqual(f.counts, []);
  assert.equal(f.script(), null);
});

test('unavailable cryptographic randomness prevents any request', (t) => {
  const f = fixture(t);
  t.mock.method(f.window.crypto, 'getRandomValues', () => { throw new Error('Randomness unavailable'); });
  f.start();
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.script(), null);
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

test('the statistics page reads one validated site-wide PV and UV total', (t) => {
  const f = fixture(t, 'https://fanhuayishiy.github.io/ai-demo/stats/');
  const stats = [];
  const cleanup = api('startSitePageviews')({
    window: f.window,
    document: f.document,
    onStats: value => stats.push(value),
    onUnavailable: () => f.unavailable.push(true),
  });
  const direct = siteRequest(f);
  assert.equal(direct.endpoint.origin, 'https://busuanzi.ibruce.info');
  assert.equal(direct.script.getAttribute('referrerpolicy'), 'no-referrer-when-downgrade');
  direct.payload({ site_pv: 124, site_uv: 108, page_pv: 3 });
  assert.deepEqual(stats, [{ sitePv: 124, siteUv: 108 }]);
  assert.deepEqual(f.unavailable, []);
  assert.equal(f.document.querySelector('script[data-ai-demo-site-pageviews]'), null);
  cleanup();
});

test('the aggregate total rejects malformed site PV without inventing a value', (t) => {
  const f = fixture(t, 'https://fanhuayishiy.github.io/ai-demo/stats/');
  const values = [];
  api('startSitePageviews')({
    window: f.window,
    document: f.document,
    onStats: value => values.push(value),
    onUnavailable: () => f.unavailable.push(true),
  });
  siteRequest(f).payload({ site_pv: '124', site_uv: 108 });
  assert.deepEqual(values, []);
  assert.deepEqual(f.unavailable, [true]);
});

test('aggregate statistics honor local-only privacy without a network request', (t) => {
  const f = fixture(t, 'http://localhost:5185/ai-demo/stats/');
  api('startSitePageviews')({
    window: f.window,
    document: f.document,
    onUnavailable: () => f.unavailable.push(true),
  });
  assert.deepEqual(f.unavailable, [true]);
  assert.equal(f.document.querySelector('script[data-ai-demo-site-pageviews]'), null);
});

test('browser helper stays import-free and adds no storage, polling or persistent global', async () => {
  const source = await readFile(new URL('../shared/pageviews.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s/mu);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|setInterval|indexedDB)\b|document\.cookie/u);
  assert.doesNotMatch(source, /export\s+(?:default|\{)/u);
  assert.doesNotMatch(source, /<\/script/iu, 'text bundling must not prematurely terminate the app script');
});

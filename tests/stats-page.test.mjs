import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { connectSiteVisitTotal, renderSiteVisitTotal } from '../assets/site-visit-total.mjs';
import { connectStatsPage, syncProjectCount } from '../stats/stats.mjs';

const root = new URL('../', import.meta.url);
const statsHtml = await readFile(new URL('stats/index.html', root), 'utf8');
const homeHtml = await readFile(new URL('index.html', root), 'utf8');
const production = 'https://fanhuayishiy.github.io/ai-demo/stats/';

function fixture(url = production) {
  const dom = new JSDOM(statsHtml, { url, runScripts: 'outside-only' });
  return dom;
}

test('the homepage links to a dedicated aggregate statistics page', () => {
  const dom = new JSDOM(homeHtml);
  try {
    const links = [...dom.window.document.querySelectorAll('a[href="./stats/"]')];
    assert.ok(links.length >= 2, 'header and footer should both provide a stable route');
    assert.match(links[0].textContent, /项目合计/);
    assert.equal(dom.window.document.querySelector('#site-visit-total').textContent.trim(), '—');
    assert.equal(dom.window.document.querySelector('script[src="./assets/site-visit-total.mjs"]').getAttribute('type'), 'module');
  } finally {
    dom.window.close();
  }
});

test('the homepage renders the site-wide total from the shared pageview response', () => {
  const dom = new JSDOM('<a id="site-visit-link"><strong id="site-visit-total" data-state="loading">—</strong></a>', {
    url: 'https://fanhuayishiy.github.io/ai-demo/',
  });
  try {
    assert.equal(renderSiteVisitTotal({ document: dom.window.document, stats: { sitePv: 12345, siteUv: 678 } }), true);
    assert.equal(dom.window.document.querySelector('#site-visit-total').textContent, '12,345');
    assert.equal(dom.window.document.querySelector('#site-visit-total').dataset.state, 'live');
    assert.match(dom.window.document.querySelector('#site-visit-link').getAttribute('aria-label'), /12,345/);
  } finally {
    dom.window.close();
  }
});

test('the homepage listens for totals that arrive after its module starts', () => {
  const dom = new JSDOM('<strong id="site-visit-total">—</strong>', { url: 'https://fanhuayishiy.github.io/ai-demo/' });
  try {
    const cleanup = connectSiteVisitTotal({ window: dom.window, document: dom.window.document });
    dom.window.dispatchEvent(new dom.window.CustomEvent('ai-demo-site-pageviews', { detail: { sitePv: 128, siteUv: 111 } }));
    assert.equal(dom.window.document.querySelector('#site-visit-total').textContent, '128');
    cleanup();
  } finally {
    dom.window.close();
  }
});

test('the statistics page presents one total and labels the provider metric honestly', () => {
  const dom = fixture();
  try {
    const document = dom.window.document;
    assert.match(document.title, /项目统计/);
    assert.equal(document.querySelector('#aggregate-count').textContent.trim(), '—');
    assert.equal(document.querySelector('#aggregate-projects').textContent.trim(), '24');
    assert.match(document.querySelector('.method').textContent, /站点 PV/);
    assert.match(document.querySelector('.method').textContent, /不代表独立人数/);
    assert.equal(document.querySelectorAll('iframe').length, 0);
    assert.equal(document.querySelector('script[src="./stats.mjs"]').getAttribute('type'), 'module');
  } finally {
    dom.window.close();
  }
});

test('the statistics page renders a real aggregate PV and UV', () => {
  const dom = fixture();
  try {
    let options;
    const cleanup = connectStatsPage({
      window: dom.window,
      document: dom.window.document,
      start: value => { options = value; return () => {}; },
    });
    assert.equal(typeof options.onStats, 'function');
    options.onStats({ sitePv: 124567, siteUv: 108 });
    assert.equal(dom.window.document.querySelector('#aggregate-count').textContent, '124,567');
    assert.equal(dom.window.document.querySelector('#aggregate-uv').textContent, '108');
    assert.equal(dom.window.document.querySelector('#aggregate-status').dataset.state, 'live');
    assert.equal(dom.window.document.querySelector('#service').dataset.state, 'live');
    assert.equal(dom.window.document.querySelector('#aggregate-retry').hidden, true);
    cleanup();
  } finally {
    dom.window.close();
  }
});

test('provider failure exposes an honest retry state instead of zero', () => {
  const dom = fixture();
  try {
    let options;
    connectStatsPage({
      window: dom.window,
      document: dom.window.document,
      start: value => { options = value; return () => {}; },
    });
    options.onUnavailable();
    assert.equal(dom.window.document.querySelector('#aggregate-count').textContent.trim(), '—');
    assert.match(dom.window.document.querySelector('#aggregate-status').textContent, /暂时不可用/);
    assert.equal(dom.window.document.querySelector('#aggregate-retry').hidden, false);
  } finally {
    dom.window.close();
  }
});

for (const [name, url, message] of [
  ['local preview', 'http://localhost:5185/ai-demo/stats/', /本地预览/],
  ['query-bearing URL', `${production}?campaign=private`, /查询参数/],
]) {
  test(`${name} does not contact the statistics provider`, () => {
    const dom = fixture(url);
    try {
      let starts = 0;
      connectStatsPage({
        window: dom.window,
        document: dom.window.document,
        start: () => { starts++; return () => {}; },
      });
      assert.equal(starts, 0);
      assert.match(dom.window.document.querySelector('#aggregate-status').textContent, message);
    } finally {
      dom.window.close();
    }
  });
}

test('privacy preferences suppress the aggregate request', () => {
  const dom = fixture();
  try {
    Object.defineProperty(dom.window.navigator, 'globalPrivacyControl', { configurable: true, value: true });
    let starts = 0;
    connectStatsPage({
      window: dom.window,
      document: dom.window.document,
      start: () => { starts++; return () => {}; },
    });
    assert.equal(starts, 0);
    assert.match(dom.window.document.querySelector('#aggregate-status').textContent, /隐私设置/);
  } finally {
    dom.window.close();
  }
});

test('the project count follows the current homepage cards instead of staying hardcoded', async () => {
  const dom = fixture();
  try {
    const page = '<a class="badge cover" href="one/">1</a><a class="cover badge" href="two/">2</a><a class="badge">3</a>';
    await syncProjectCount({
      window: dom.window,
      document: dom.window.document,
      fetchPage: async () => ({ ok: true, text: async () => page }),
    });
    assert.equal(dom.window.document.querySelector('#aggregate-projects').textContent, '2');
    assert.equal(dom.window.document.querySelector('#dial-count').textContent, '2');
    assert.match(dom.window.document.querySelector('#project-dial').getAttribute('aria-label'), /^2 个项目入口/);
  } finally {
    dom.window.close();
  }
});

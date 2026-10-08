import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildEntry } from '../scripts/build-entry.mjs';

const file = new URL('../shared/github-entry.html', import.meta.url);
async function mount(beforeParse) {
  assert.ok(existsSync(file), 'shared GitHub entry fragment must exist');
  const { JSDOM } = await import('jsdom');
  const fragment = await buildEntry({sourceDir:fileURLToPath(new URL('../', import.meta.url)),template:readFileSync(file, 'utf8')});
  const dom = new JSDOM(`<!doctype html><html><body><main>Demo</main>${fragment}</body></html>`, {
    runScripts: 'dangerously', url: 'https://example.test/ai-demo/future-project/dist/', beforeParse,
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  return dom;
}

test('one isolated link advertises the repository with safe navigation', async () => {
  const dom = await mount();
  try {
    const host = dom.window.document.querySelector('ai-demo-github');
    assert.ok(host?.shadowRoot);
    const link = host.shadowRoot.querySelector('a');
    assert.equal(link.href, 'https://github.com/fanhuayishiy/ai-demo');
    assert.equal(link.target, '_blank');
    assert.ok(link.rel.includes('noopener') && link.rel.includes('noreferrer'));
    assert.match(link.getAttribute('aria-label'), /GitHub.*源码.*提示词/);
    assert.match(link.textContent, /GitHub/);
    assert.equal(dom.window.document.querySelectorAll('ai-demo-github').length, 1);
  } finally { dom.window.close(); }
});

test('reexecuting the fragment does not add a duplicate entry', async () => {
  const dom = await mount();
  try {
    const script = dom.window.document.querySelector('script').textContent;
    dom.window.eval(script);
    assert.equal(dom.window.document.querySelectorAll('ai-demo-github').length, 1);
  } finally { dom.window.close(); }
});

test('entry interactions do not trigger scene mouse or keyboard handlers', async () => {
  const dom = await mount();
  try {
    let pointerEvents = 0;
    let keyEvents = 0;
    dom.window.document.addEventListener('pointerdown', () => pointerEvents++);
    dom.window.document.addEventListener('keydown', () => keyEvents++);
    const link = dom.window.document.querySelector('ai-demo-github').shadowRoot.querySelector('a');
    link.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true, composed: true }));
    link.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    assert.equal(pointerEvents, 0);
    assert.equal(keyEvents, 0);
    const outside = dom.window.document.querySelector('main');
    outside.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
    assert.equal(pointerEvents, 1);
  } finally { dom.window.close(); }
});

test('dismiss only removes the badge and leaves the application intact', async () => {
  const dom = await mount();
  try {
    const host = dom.window.document.querySelector('ai-demo-github');
    const button = host.shadowRoot.querySelector('[data-action="dismiss"]');
    assert.ok(button, 'dismiss must be explicit when there are multiple buttons');
    assert.match(button.getAttribute('aria-label'), /关闭/);
    button.click();
    assert.equal(dom.window.document.querySelector('ai-demo-github'), null);
    assert.equal(dom.window.document.querySelector('main').textContent, 'Demo');
  } finally { dom.window.close(); }
});

test('sharing and initially hidden pageviews do not replace or resize the original controls', async () => {
  const dom = await mount();
  try {
    const shadow = dom.window.document.querySelector('ai-demo-github').shadowRoot;
    const share = shadow.querySelector('[data-action="share"]');
    assert.ok(share);
    assert.match(share.getAttribute('aria-label'), /分享.*截图.*二维码/);
    assert.equal(shadow.querySelector('.pageviews').hidden, true);
    assert.equal(shadow.querySelector('dialog').hasAttribute('open'), false);
    assert.ok(shadow.querySelector('[role="status"]'));
    assert.match(shadow.querySelector('style').textContent, /width:\s*44px;\s*height:\s*44px/);
    assert.match(shadow.querySelector('style').textContent, /:host\(\[data-sharing-capture\]\)\s*\{\s*visibility:\s*hidden\s*!important/);
  } finally {dom.window.close();}
});

test('component includes narrow-screen, keyboard and safe-area styling without network dependencies', async () => {
  const dom = await mount();
  try {
    const style = dom.window.document.querySelector('ai-demo-github').shadowRoot.querySelector('style').textContent;
    assert.match(style, /@media\s*\(max-width:\s*600px\)/);
    assert.match(style, /:focus-visible/);
    assert.match(style, /safe-area-inset/);
    assert.equal(dom.window.document.querySelectorAll('script[src],link[href],img[src]').length, 0);
  } finally { dom.window.close(); }
});

test('placement avoids existing controls at the default corner', async () => {
  const dom = await mount(window => {
    // jsdom does not lay out boxes; supply measurements, not implementation behavior.
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.tagName === 'AI-DEMO-GITHUB') return { x:14,y:708,left:14,top:708,right:246,bottom:754,width:232,height:46 };
      if (this.tagName === 'BUTTON') return { x:0,y:650,left:0,top:650,right:320,bottom:768,width:320,height:118 };
      return { x:0,y:0,left:0,top:0,right:0,bottom:0,width:0,height:0 };
    };
    window.document.addEventListener('DOMContentLoaded', () => {
      const button = window.document.createElement('button');
      button.textContent = 'Existing scene control';
      window.document.body.append(button);
    }, {once:true});
  });
  try {
    const host = dom.window.document.querySelector('ai-demo-github');
    assert.ok(host.style.getPropertyValue('--entry-x'), 'placement should set a measured position');
    const left = parseFloat(host.style.getPropertyValue('--entry-x')), top = parseFloat(host.style.getPropertyValue('--entry-y'));
    assert.ok(left >= 320 || top + 46 <= 650, `entry overlaps control at ${left}, ${top}`);
  } finally { dom.window.close(); }
});

test('measured placement respects device safe-area edges', async () => {
  const dom = await mount(window => {
    const computed = window.getComputedStyle.bind(window);
    window.getComputedStyle = e => e.className === 'safe-area'
      ? { paddingTop:'44px', paddingRight:'20px', paddingBottom:'34px', paddingLeft:'20px' }
      : computed(e);
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return this.tagName === 'AI-DEMO-GITHUB'
        ? {left:14,top:708,right:246,bottom:754,width:232,height:46}
        : {left:0,top:0,right:0,bottom:0,width:0,height:0};
    };
  });
  try {
    const style = dom.window.document.querySelector('ai-demo-github').style;
    const x = parseFloat(style.getPropertyValue('--entry-x'));
    const y = parseFloat(style.getPropertyValue('--entry-y'));
    assert.ok(x >= 20 && x + 232 <= 1024 - 20);
    assert.ok(y >= 44 && y + 46 <= 768 - 34);
  } finally { dom.window.close(); }
});

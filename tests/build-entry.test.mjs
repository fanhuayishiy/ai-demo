import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';
import { parse } from 'parse5';

const builder = await import('../scripts/build-entry.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const sourceDir = fileURLToPath(new URL('../', import.meta.url));
const template = '<script>(() => { /* AI_DEMO_SHARED_RUNTIME */ globalThis.getLibraries = getShareLibraries; globalThis.card = ShareCard; })();</script>';
function* walk(node) { yield node; for (const child of node.childNodes ?? []) yield* walk(child); }

test('shared runtime builder exists', () => assert.equal(typeof builder.buildEntry, 'function'));

test('custom simple packaging fragments remain byte-for-byte unchanged', async () => {
  assert.equal(await builder.buildEntry({sourceDir,template:'<div>Fixture</div>'}), '<div>Fixture</div>');
});

test('the bundle is inline, lazy, scoped and valid JavaScript with real dependencies', async () => {
  const html = await builder.buildEntry({sourceDir,template});
  const scripts = [...walk(parse(html))].filter(node => node.tagName === 'script');
  assert.equal(scripts.length, 1);
  assert.ok(scripts[0].childNodes[0].value.endsWith('})();'));
  assert.doesNotMatch(html, /AI_DEMO_SHARED_RUNTIME|sourceMappingURL/);
  assert.doesNotMatch(html, /<script\s+src=|import\s*\(|eval\(/);
  assert.match(html, /html2canvas 1\.4\.1/);
  assert.match(html, /QR Code Generator/);
  assert.ok(html.includes('Permission is hereby granted, free of charge'), 'standalone HTML must retain the MIT permission notice');
  const context = createContext({URL,Uint8ClampedArray,setTimeout,clearTimeout,define:Object.assign(() => {throw new Error('AMD global must not be touched');}, {amd:true})});
  new Script(html.slice('<script>'.length, -'</script>'.length)).runInContext(context);
  assert.equal(context.qrcode, undefined);
  assert.equal(context.html2canvas, undefined);
  assert.equal(context.card.normalizeShareUrl('https://example.test/#current'), 'https://example.test/#current');
  const first = context.getLibraries();
  assert.equal(typeof first.html2canvas, 'function');
  assert.equal(typeof first.qrcode, 'function');
  assert.equal(first, context.getLibraries(), 'initialize only once after first sharing request');
  assert.equal(context.qrcode, undefined);
  parse(html); // Ensure the generated script remains a single HTML element.
});

test('duplicate or unresolved build placeholders fail before publishing', async () => {
  await assert.rejects(() => builder.buildEntry({sourceDir,template:template + template}), /placeholder/);
  await assert.rejects(() => builder.buildEntry({sourceDir,template:'<script>/* AI_DEMO_MISSING */</script>'}), /placeholder/);
});

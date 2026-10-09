import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../modular-fire-response/', import.meta.url));
const dist = path.join(root, 'dist');

function* walk(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* walk(child);
}

test('FIRELINK ships a built entry and subdirectory-safe local JS/CSS assets', () => {
  const entry = path.join(dist, 'index.html');
  assert.ok(existsSync(entry), 'Build and include modular-fire-response/dist before publishing');
  const nodes = [...walk(parse(readFileSync(entry, 'utf8')))];
  const assets = nodes.flatMap(node => (node.attrs ?? []).filter(attr =>
    (node.tagName === 'script' && attr.name === 'src') || (node.tagName === 'link' && attr.name === 'href'))
    .map(attr => attr.value));
  assert.ok(assets.length >= 2);
  for (const asset of assets) {
    assert.ok(asset.startsWith('./assets/'), `Not relative to the built page: ${asset}`);
    assert.ok(existsSync(path.join(dist, asset)), `Missing built asset: ${asset}`);
  }
  assert.ok(nodes.some(node => node.tagName === 'div' && node.attrs.some(attr => attr.name === 'id' && attr.value === 'root')));
  const title = nodes.find(node => node.tagName === 'title');
  assert.match(title.childNodes.map(node => node.value ?? '').join(''), /FIRELINK/);
});

test('all seven reference thumbnails and their relative provenance manifest are published', () => {
  const directory = path.join(dist, 'reference-equipment');
  assert.ok(existsSync(directory), 'Build must copy public/reference-equipment');
  const manifest = JSON.parse(readFileSync(path.join(directory, 'source.json'), 'utf8'));
  assert.match(manifest.source, /not distributed/);
  assert.equal(manifest.assets.length, 7);
  for (const asset of manifest.assets) {
    assert.match(asset.output, /^\.\/[a-z-]+\.webp$/);
    const built = readFileSync(path.join(directory, asset.output));
    assert.equal(built.toString('ascii', 0, 4), 'RIFF');
    assert.equal(built.toString('ascii', 8, 12), 'WEBP');
    assert.deepEqual(built, readFileSync(path.join(root, 'public/reference-equipment', asset.output)));
  }
});

test('the static FIRELINK build does not include development and machine-local artifacts', () => {
  assert.ok(existsSync(dist), 'Production dist must exist');
  const names = readdirSync(dist, { recursive: true }).map(name => String(name).replaceAll('\\', '/'));
  assert.equal(names.some(name => /(^|\/)(node_modules|artifacts|src|\.env)(\/|$)|\.(?:log|tsbuildinfo|map)$/i.test(name)), false);
});

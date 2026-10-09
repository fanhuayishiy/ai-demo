import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('uses a relative Vite base for nested Pages paths', () => {
  const config = readFileSync(path.join(root, 'vite.config.mjs'), 'utf8');
  assert.match(config, /base:\s*["']\.\/["']/);
});

test('built entry references existing local assets below its own directory', () => {
  const client = path.join(root, 'dist/client');
  const html = readFileSync(path.join(client, 'index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
  assert.ok(assets.length >= 2);
  for (const asset of assets) {
    assert.ok(asset.startsWith('./assets/'), `not a relative asset: ${asset}`);
    assert.ok(existsSync(path.resolve(client, asset)), `missing asset: ${asset}`);
  }
});

test('collection keeps warehouse immediately after sunset without changing the first entry', () => {
  const html = readFileSync(path.join(root, '../index.html'), 'utf8');
  const cards = [...html.matchAll(/class="badge cover" href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(cards[0], './habitat-interactive-home/dist/index.html');
  const sunsetIndex = cards.indexOf('./sunset-flight-study/dist/index.html');
  assert.ok(sunsetIndex > 0);
  assert.equal(cards[sunsetIndex + 1], './warehouse-demo/dist/client/index.html');
  const readme = readFileSync(path.join(root, '../README.md'), 'utf8');
  const rows = readme.split('\n').filter(line => /^\| [a-z][\w-]+ \|/.test(line));
  const sunsetRowIndex = rows.findIndex(row => row.startsWith('| sunset-flight-study |'));
  assert.ok(sunsetRowIndex > 0);
  assert.match(rows[sunsetRowIndex + 1], /^\| warehouse-demo \|/);
});

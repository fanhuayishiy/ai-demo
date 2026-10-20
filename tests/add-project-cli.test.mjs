import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = ['scripts/add-project.mjs', '--dir', 'future-screenshot-demo', '--title', 'Future demo',
  '--tag', 'THREE.JS', '--summary', '简介', '--desc', '项目速览', '--dry-run'];

test('the official project command rejects missing screenshots before changing either index', () => {
  const before = ['index.html', 'README.md'].map(file => readFileSync(root + file, 'utf8'));
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'A new project without a screenshot must not pass preflight');
  assert.match(result.stderr, /截图|screenshot/u);
  assert.deepEqual(['index.html', 'README.md'].map(file => readFileSync(root + file, 'utf8')), before);
});

test('the project command rejects a supplied but nonexistent screenshot', () => {
  const before = ['index.html', 'README.md'].map(file => readFileSync(root + file, 'utf8'));
  const result = spawnSync(process.execPath, [...args, '--screenshot', './assets/project-thumbnails/future-screenshot-demo.webp'], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /截图/u);
  assert.deepEqual(['index.html', 'README.md'].map(file => readFileSync(root + file, 'utf8')), before);
});

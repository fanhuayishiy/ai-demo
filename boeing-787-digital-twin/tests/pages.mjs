import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const project = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(project, '..');
const readme = await readFile(resolve(repository, 'README.md'), 'utf8');
const rows = readme.split('\n').filter((line) => /^\| [a-z].*\|/.test(line));
assert.ok(rows[2].startsWith('| boeing-787-digital-twin |'), 'README lists AEROSTRUCT third');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

// Mirror the repository's GitHub Pages subpath, never falling back to a SPA entry.
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/ai-demo/')) {
      response.writeHead(404).end();
      return;
    }
    let filename = resolve(repository, pathname.slice('/ai-demo/'.length));
    const within = relative(repository, filename);
    if (within === '..' || within.startsWith(`..${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(filename)).isDirectory()) filename = resolve(filename, 'index.html');
    const body = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': types[extname(filename)] || 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/ai-demo/`;
try {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['tests/browser.mjs'], {
      cwd: project,
      stdio: 'inherit',
      env: {
        ...process.env,
        AEROSTRUCT_URL: `${base}boeing-787-digital-twin/dist/`,
        AEROSTRUCT_COLLECTION_URL: base,
      },
    });
    child.once('error', reject);
    child.once('exit', resolve);
  });
  assert.equal(code, 0, 'Published build passes browser and collection checks');
} finally {
  await new Promise((resolve) => server.close(resolve));
}

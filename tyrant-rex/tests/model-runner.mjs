import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.resolve(source, '../teardown/package.json'));
const out = path.join(source, '.checks/model.test.mjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
await require('esbuild').build({
  entryPoints: [path.join(source, 'tests/model.test.mjs')],
  outfile: out, bundle: true, platform: 'node', format: 'esm',
  nodePaths: [path.resolve(source, '../teardown/node_modules')], logLevel: 'error',
});
execFileSync(process.execPath, ['--test', out], {stdio: 'inherit'});

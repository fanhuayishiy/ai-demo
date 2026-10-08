import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Script } from 'node:vm';

const marker = '/* AI_DEMO_SHARED_RUNTIME */';
const helpers = [
  ['ShareCard', 'share-card'], ['ShareCapture', 'share-capture'],
  ['ShareClipboard', 'share-clipboard'], ['Pageviews', 'pageviews'], ['ShareUI', 'share-ui'],
];

function safeScript(source) {
  return source.replace(/<\/script/giu, '<\\/script').replace(/^\/\/# sourceMappingURL=.*$/gmu, '');
}

async function scopedHelper(sourceDir, name, file) {
  const source = await readFile(path.join(sourceDir, 'shared', `${file}.mjs`), 'utf8');
  const names = [...source.matchAll(/^export (?:async )?(?:function|const) ([A-Za-z_$][\w$]*)/gmu)].map(match => match[1]);
  const body = source.replace(/^export (?=(?:async )?function |const )/gmu, '');
  if (!names.length || /^\s*(?:import|export)\b/mu.test(body)) throw new Error(`Unsupported browser helper exports: ${file}`);
  return `const ${name} = (() => {\n${body}\nreturn {${names.join(',')}};\n})();`;
}

async function inlineLibrary(sourceDir, name, file, expectedVersion) {
  const base = path.join(sourceDir, 'node_modules', name);
  const metadata = JSON.parse(await readFile(path.join(base, 'package.json'), 'utf8'));
  if (metadata.version !== expectedVersion) throw new Error(`Expected ${name}@${expectedVersion}; install the committed lockfile`);
  const source = await readFile(path.join(base, file), 'utf8');
  // UMD libraries see only this private CommonJS scope, not a preview's AMD loader.
  return `(() => { const module = {exports:{}}; const exports = module.exports; const define = undefined;\n${source}\nreturn module.exports; })()`;
}

/** Build-time assembly; visitors never fetch/eval a sharing dependency. */
export async function buildEntry({sourceDir, template}) {
  const occurrences = template.split(marker).length - 1;
  if (occurrences !== 1) {
    if (!occurrences && !/\/\*\s*AI_DEMO_[A-Z_]+\s*\*\//u.test(template)) return template;
    throw new Error('Shared entry must have exactly one runtime placeholder and no unresolved placeholders');
  }
  const [modules, canvasLibrary, qrLibrary, licenses] = await Promise.all([
    Promise.all(helpers.map(([name, file]) => scopedHelper(sourceDir, name, file))),
    inlineLibrary(sourceDir, 'html2canvas', 'dist/html2canvas.min.js', '1.4.1'),
    inlineLibrary(sourceDir, 'qrcode-generator', 'qrcode.js', '1.4.4'),
    readFile(path.join(sourceDir, 'shared', 'THIRD_PARTY.md'), 'utf8'),
  ]);
  const runtime = `/*\n${licenses.replace(/\*\//gu, '* /')}\n*/\n${modules.join('\n')}\nlet shareLibraries;\nfunction getShareLibraries() {\n`
    + `if (!shareLibraries) shareLibraries = {html2canvas:${canvasLibrary},qrcode:${qrLibrary}};\n`
    + 'return shareLibraries;\n}';
  // Validate our restricted module assembly before touching a staged page.
  new Script(runtime, {filename:'ai-demo-shared-runtime.js'});
  const result = template.replace(marker, () => safeScript(runtime));
  if (/\/\*\s*AI_DEMO_[A-Z_]+\s*\*\//u.test(result)) throw new Error('Unresolved shared entry placeholder');
  return result;
}

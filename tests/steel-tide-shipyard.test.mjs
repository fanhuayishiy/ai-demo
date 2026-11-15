// Keep the shipyard's deterministic engineering regression suite in collection CI.
import '../steel-tide-shipyard/tests/engine.test.mjs';

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('shipyard publishes the validated self-contained offline artifact',()=>{
  const root=new URL('../steel-tide-shipyard/',import.meta.url);
  const preview=readFileSync(new URL('dist/index.html',root));
  const offline=readFileSync(new URL('钢潮入海.html',root));
  assert.deepEqual(preview,offline);
  assert.doesNotMatch(offline.toString('utf8'),/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']https?:/iu);
  assert.match(offline.toString('utf8'),/Three\.js runtime license:/u);
  const manifest=JSON.parse(readFileSync(new URL('docs/delivery-manifest.json',root),'utf8'));
  assert.equal(createHash('sha256').update(offline).digest('hex'),manifest.sha256);
  assert.equal(manifest.reviewRegressions,4);
});

test('shipyard documents its original request and actual validation limits',()=>{
  const root=new URL('../steel-tide-shipyard/',import.meta.url);
  const readme=readFileSync(new URL('README.md',root),'utf8');
  assert.match(readme,/## 主生成提示（原文）/u);
  assert.ok(readme.includes('请设计并实现一个可在浏览器中实时运行、可交互游览的三维体素风格作品。'));
  assert.ok(readme.includes('明确标注各项的验证状态。'));
  const validation=readFileSync(new URL('docs/验证记录.md',root),'utf8');
  assert.ok(validation.includes('资源管理器物理双击：受限，未核验'));
  assert.ok(validation.includes('23/23 通过'));
});

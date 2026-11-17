import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
// Include the project's conflict, timing and pedestrian safety regressions in collection CI.
import '../smart-traffic-intersection/tests/simulation.test.js';
import '../smart-traffic-intersection/tests/conflicts.test.js';
const project=new URL('../smart-traffic-intersection/',import.meta.url);
test('smart traffic ships nested static assets with relative Vite paths',()=>{
 const html=readFileSync(new URL('dist/index.html',project),'utf8');
 const references=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/gu)].map(m=>m[1]);
 assert.ok(references.length>=4);
 for(const ref of references)assert.ok(existsSync(new URL(`dist/${ref}`,project)),ref);
 assert.ok(!html.includes('src="/assets/'));
 assert.match(readFileSync(new URL('vite.config.js',project),'utf8'),/base:\s*'\.\/'/u);
});
test('smart traffic documents original generation request and current straight-through model limits',()=>{
 const readme=readFileSync(new URL('README.md',project),'utf8');
 assert.ok(readme.includes('## 主生成提示（原文）'));
 assert.ok(readme.includes('请用 Three.js 创建一个可交互的 3D 智能交通路口演示网页，场景包含道路、斑马线、红绿灯、行驶与排队车辆、行人和摄像头/雷达感知可视化'));
 for(const concept of ['最后 3 秒锁定','平行直行车流继续通行','未实现转弯','真实摄像头视频识别'])assert.ok(readme.includes(concept));
});

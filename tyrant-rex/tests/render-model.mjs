import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.resolve(root, '../teardown/package.json'));
const built = await require('esbuild').build({
  stdin: {
    contents: `
      import {createStage,CAMERAS,INSPECTION} from './stage.js';
      import {createRex} from './model.js';
      import {poseRex,posePatrol,PATROL,ROAR} from './kinematics.mjs';
      const canvas=document.querySelector('canvas');
      const stage=createStage(canvas,document.body);
      const rex=createRex(); stage.scene.add(rex.root);
      rex.update(poseRex(.075)); await stage.warm();
      const views={
        'blink-open':{position:[-3.3,5.3,2.4],target:[-2.37,4.90,.60]},
        'blink-closed':{position:[-3.3,5.3,2.4],target:[-2.37,4.90,.60]},
        'heart-a':{position:[-1.5,3.65,3.9],target:[-.22,3.10,.20]},
        'heart-b':{position:[-1.5,3.65,3.9],target:[-.22,3.10,.20]},
        'heart-c':{position:[-1.5,3.65,3.9],target:[-.22,3.10,.20]},
        'heart-right':{position:[-1.5,3.65,-3.9],target:[-.22,3.10,-.20]},
        'skull-front':{position:[-8.6,5.2,.10],target:[-2.85,4.71,0]},
        'skull-side':{position:[-2.85,4.85,5.7],target:[-2.85,4.71,0]},
        'skull-top':{position:[-4.5,8.7,3.6],target:[-2.85,4.71,0]},
        'skull-under':{position:[-5.8,3.1,4.8],target:[-2.85,4.71,0]},
        'skull-right':{position:[-5.9,5.65,-5.5],target:[-2.82,4.69,0]},
        'skull-rear':{position:[2.5,5.5,4.4],target:[-2.3,4.65,0]},
        'skull-closed':INSPECTION.skull,'skull-open':INSPECTION.skull,
        'skull-exploded':{position:[-7.5,6.8,7.5],target:[-3.5,4.7,0]},
        'roar-detail':{position:[-6.5,4.8,6.3],target:[-2.85,4.44,0]},
      };
      const phases={
        'skull-closed':0,'skull-open':ROAR.peak,'heart-b':.205,'heart-c':.405,
        'roar-coil':.215,'roar-peak':ROAR.peak,'roar-detail':ROAR.peak,'roar-recover':.69,
      };
      const patrolFrames = {
        'patrol-walk': 1.04, 'patrol-roar': PATROL.walk + ROAR.duration * ROAR.peak,
        'patrol-turn': PATROL.walk + ROAR.duration + .9,
        'patrol-return': PATROL.run + 1.15, 'patrol-return-roar': PATROL.run + PATROL.walk + ROAR.duration * ROAR.peak,
      };
      window.show=(name)=>{
        const phase=phases[name]??.075;
        const pose = name in patrolFrames ? posePatrol(patrolFrames[name]) : poseRex(name.startsWith('blink-') ? 0 : phase);
        if (name === 'blink-closed') pose.blink = 1;
        rex.update(pose,{explode:name==='exploded'?1:name==='skull-exploded'?.8:0,xray:name==='core'});
        stage.updateFootShadows(rex.getFeet());
        for(const m of rex.modules) m.group.visible=!name.startsWith('skull-')||m.id==='skull';
        stage.plinth.visible=!name.startsWith('skull-');
        stage.controls.maxPolarAngle=name==='skull-under'?Math.PI:Math.PI/2+.06;
        stage.setCamera(views[name]|| (name==='skull'?INSPECTION.skull:name==='core'?INSPECTION.core:name==='exploded'?{...CAMERAS.hero,distance:1.22}:CAMERAS.hero),true);
        stage.render();
      };
      const gl=stage.renderer.getContext();
      const debug=gl.getExtension('WEBGL_debug_renderer_info');
      window.modelStats=()=>({
        parts:rex.partCount,meshes:rex.meshCount,calls:stage.renderer.info.render.calls,
        triangles:stage.renderer.info.render.triangles,
        gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)
      });
      window.show('hero'); window.READY=true;
    `,
    resolveDir: root, sourcefile: 'preview.js',
  },
  bundle: true, format: 'esm', nodePaths: [path.resolve(root, '../teardown/node_modules')],
  write: false,
  plugins: [{name: 'kit', setup(b) { b.onResolve({filter: /^teardown-kit\//}, a => ({path: path.resolve(root, '../teardown/sims/kit', a.path.slice(13))})); }}],
});
const html = `<html><body style="margin:0;width:100vw;height:100vh;background:#e9edef"><canvas style="width:100%;height:100%"></canvas><script type="module">${built.outputFiles[0].text}</script></body></html>`;
fs.mkdirSync(path.join(root, '.checks'), {recursive: true});
fs.mkdirSync(path.join(root, 'screenshots'), {recursive: true});
fs.writeFileSync(path.join(root, '.checks/model-preview.html'), html);
const browser = await require('playwright').chromium.launch({args: ['--use-angle=d3d11', '--ignore-gpu-blocklist']});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  page.on('pageerror', e => { throw e; });
  await page.goto(pathToFileURL(path.join(root, '.checks/model-preview.html')).href);
  await page.waitForFunction(() => window.READY, {timeout: 60000});
  const requested = process.argv.slice(2);
  for (const name of requested.length ? requested : ['hero', 'skull', 'core', 'exploded', 'skull-front', 'skull-side', 'skull-top', 'skull-under', 'skull-closed', 'skull-open', 'skull-exploded', 'skull-right', 'skull-rear', 'heart-a', 'heart-b', 'heart-c', 'heart-right', 'roar-coil', 'roar-peak', 'roar-detail', 'roar-recover']) {
    await page.evaluate(name => window.show(name), name);
    await page.screenshot({path: path.join(root, `screenshots/model-${name}.png`)});
  }
  console.log(JSON.stringify(await page.evaluate(() => window.modelStats())));
  console.log('Rendered the requested model views.');
} finally { await browser.close(); }

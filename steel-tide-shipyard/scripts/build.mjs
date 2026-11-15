import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const root=path.resolve(import.meta.dirname,'..');
export async function buildProject(){
  const [html,css,license]=await Promise.all([fs.readFile(path.join(root,'src/index.html'),'utf8'),fs.readFile(path.join(root,'src/style.css'),'utf8'),fs.readFile(path.join(root,'node_modules/three/LICENSE'),'utf8')]);
  const result=await build({entryPoints:[path.join(root,'src/main.js')],bundle:true,minify:true,format:'iife',target:'es2020',write:false,legalComments:'inline'});
  const js=result.outputFiles[0].text.replaceAll('</script','<\\/script');
  const page=html.replace('<!-- STYLES -->',`<!-- Three.js runtime license:\n${license}\n-->\n<style>${css}</style>`).replace('<!-- SCRIPT -->',`<script>${js}</script>`);
  await fs.mkdir(path.join(root,'dist'),{recursive:true});
  await Promise.all([fs.writeFile(path.join(root,'dist/index.html'),page),fs.writeFile(path.join(root,'钢潮入海.html'),page)]);
  console.log(`Built offline HTML · ${(Buffer.byteLength(page)/1024).toFixed(0)} KiB · no external assets`);
  return page;
}
if(process.argv[1]===import.meta.filename)await buildProject();

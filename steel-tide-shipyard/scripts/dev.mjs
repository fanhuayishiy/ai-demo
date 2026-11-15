import http from 'node:http';
import {watch} from 'node:fs';
import path from 'node:path';
import {buildProject} from './build.mjs';
let page=await buildProject();
let pending,queue=Promise.resolve();watch(path.resolve(import.meta.dirname,'../src'),{recursive:true},()=>{clearTimeout(pending);pending=setTimeout(()=>{queue=queue.then(async()=>{page=await buildProject();}).catch(console.error);},200);});
const port=Number(process.env.PORT||5173);
http.createServer(async(req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}try{if(req.url==='/__rebuild'){page=await buildProject();res.end('rebuilt');return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(page);}catch(e){res.writeHead(500);res.end(String(e));}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));

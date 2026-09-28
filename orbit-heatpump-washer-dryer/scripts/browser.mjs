import { chromium } from '@playwright/test';
import { access,readdir } from 'node:fs/promises';
import path from 'node:path';
export async function launchBrowser(){
  const candidates=[process.env.CHROME_PATH,chromium.executablePath()].filter(Boolean);
  if(process.env.LOCALAPPDATA){const cache=path.join(process.env.LOCALAPPDATA,'ms-playwright');try{for(const dir of (await readdir(cache)).filter(d=>/^chromium-/.test(d)).sort().reverse())candidates.push(path.join(cache,dir,'chrome-win64','chrome.exe'));}catch{}}
  for(const executablePath of candidates){try{await access(executablePath);return await chromium.launch({headless:true,executablePath,args:['--enable-webgl','--ignore-gpu-blocklist']});}catch{}}
  return await chromium.launch({headless:true});
}

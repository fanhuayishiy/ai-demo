// 加载状态实拍：不等 built，在启动后第 N 毫秒直接截图。
// 常规截图工具都等 window.__DIORAMA__.built，那张图里加载层早被摘掉了，永远拍不到它。
// node tools/boot-shot.mjs [--url=] [--at=2500] [--out=shots] [--w=1600] [--h=900]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:4173/');
const AT = Number(arg('at', 2500));
const OUT = arg('out', 'shots');

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: Number(arg('w', 1600)), height: Number(arg('h', 900)) } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForTimeout(AT);
const state = await page.evaluate('window.__DIORAMA__ ? { v: +window.__DIORAMA__.progress.v.toFixed(3), label: window.__DIORAMA__.progress.label, built: !!window.__DIORAMA__.built } : "引擎还没起来"');
mkdirSync(OUT, { recursive: true });
const file = `${OUT}/boot-${AT}ms.png`;
await page.screenshot({ path: file });
console.log(`第 ${AT} ms：`, JSON.stringify(state), '→', file);
// 顺带确认加载层最终真的从 DOM 里消失了（成品画面必须零 UI）
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200 });
await page.waitForFunction('!document.getElementById("boot")', { polling: 100, timeout: 60000 });
console.log('built 后加载层已从 DOM 摘除 ✓');
await browser.close();

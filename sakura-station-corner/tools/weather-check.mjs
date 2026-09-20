// 天气切换的输入路径检查：键盘 1–5 / W 是画面零 UI 前提下唯一的切换手段，
// 所以只能在无头里按真键来验，不能靠 setWeather() 绕过。
// node tools/weather-check.mjs [--url=] [--shots=0]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const BASE = arg('url', 'http://127.0.0.1:4173/');

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 560 } })).newPage();
page.setDefaultTimeout(300000);
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 200 });
await page.waitForFunction('!document.getElementById("boot")', { polling: 100 });

const read = () => page.evaluate(() => {
  const e = window.__DIORAMA__;
  return {
    name: e.weather.current,
    sun: +e.lights.sun.intensity.toFixed(3),
    fog: +e.scene.fog.density.toFixed(4),
    exposure: +e.renderer.toneMappingExposure.toFixed(3),
    rain: e.rainShower ? e.rainShower.mesh.count : -1,
    petals: e.petalStorm ? e.petalStorm.airMesh.count : -1,
  };
});

console.log('默认   ', JSON.stringify(await read()));
for (const k of ['2', '3', '4', '5', '1']) {
  await page.keyboard.press(k);
  await page.waitForFunction('!window.__DIORAMA__.weather.easing', { polling: 100 });
  console.log(`按 ${k} →`, JSON.stringify(await read()));
}
await page.keyboard.press('w');
await page.waitForFunction('!window.__DIORAMA__.weather.easing', { polling: 100 });
console.log('按 w  →', JSON.stringify(await read()));
console.log(errs.length ? 'ERRORS: ' + errs[0] : '无 pageerror ✓');
await browser.close();

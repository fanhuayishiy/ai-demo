"""Smoke-check the actual production bundle (npm run preview -- --port 4173)."""
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

out=Path(__file__).resolve().parents[1]/'test-results'
out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url))
    page.on('response',lambda r:errors.append(f'{r.status}: {r.url}') if r.status>=400 else None)
    page.goto('http://127.0.0.1:4173/')
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('#loading',state='detached')
    assert page.locator('canvas').is_visible()
    assert page.locator('#prompt').is_visible()
    assert page.evaluate('window.__town===undefined')
    page.keyboard.press('e')
    assert page.locator('#speaker').inner_text()=='杏子'
    assert page.locator('#dialogue').is_visible()
    page.keyboard.press('Escape')
    assert not page.locator('#dialogue').is_visible()
    page.screenshot(path=str(out/'production.png'))
    gpu=page.evaluate("""()=>{
      const gl=document.querySelector('canvas').getContext('webgl2');
      const ext=gl.getExtension('WEBGL_debug_renderer_info');
      return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'Unavailable';
    }""")
    assert not errors,errors
    assert all(urlparse(url).netloc=='127.0.0.1:4173' for url in requests if url.startswith('http')),requests
    report={'production':'passed','javascriptErrors':errors,'networkRequests':requests,'externalAssets':0,'renderer':gpu}
    (out/'production-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    browser.close()

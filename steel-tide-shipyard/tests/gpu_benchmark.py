from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,platform,hashlib
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=['--enable-gpu','--use-angle=d3d11','--ignore-gpu-blocklist'])
    context=browser.new_context(viewport={'width':1440,'height':960},device_scale_factor=1,offline=True)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'钢潮入海.html').as_uri(),wait_until='load')
    page.wait_for_function('!!window.__shipyard',timeout=30000)
    page.wait_for_timeout(4000)
    samples=[]
    for i in range(6):
        page.wait_for_timeout(1100)
        state=page.evaluate('window.__shipyard.inspect()')
        samples.append({k:state[k] for k in ['fps','drawCalls','triangles','stage','progress','renderScale']})
        print(json.dumps(samples[-1]),flush=True)
    state=page.evaluate('window.__shipyard.inspect()')
    report={'date':'2026-11-15','artifactSha256':hashlib.sha256((ROOT/'钢潮入海.html').read_bytes()).hexdigest(),'browser':browser.version,'gpuName':state['gpuName'],'softwareRenderer':state['softwareRenderer'],'samples':samples,'errors':errors,'viewport':'1440x960','mode':'Chrome headless / ANGLE D3D11 / offline file://'}
    (ROOT/'docs'/'performance-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    page.get_by_role('button',name='暂停全部',exact=True).click()
    page.screenshot(path=str(ROOT/'docs'/'screenshots'/'hardware-initial.png'))
    print(json.dumps(report,ensure_ascii=False),flush=True)
    browser.close()

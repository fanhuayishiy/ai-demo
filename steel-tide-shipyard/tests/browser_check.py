from playwright.sync_api import sync_playwright
from pathlib import Path
import json, sys, time

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'screenshots'
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    chrome='--chrome' in sys.argv
    browser = p.chromium.launch(channel='chrome' if chrome else None,headless=True,args=['--enable-gpu','--use-angle=d3d11','--ignore-gpu-blocklist'] if chrome else ['--enable-webgl','--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 960}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type=='error' else None)
    page.goto((ROOT/'钢潮入海.html').as_uri(), wait_until='networkidle')
    page.wait_for_function('!!window.__shipyard', timeout=30000)
    page.wait_for_timeout(1800)
    page.get_by_role('button', name='暂停全部', exact=True).click()
    page.screenshot(path=str(OUT/'01-initial.png'))
    initial=page.evaluate('window.__shipyard.inspect()')
    print('Initial rendered',flush=True)
    page.evaluate('window.__shipyard.camera.position.set(-425,355,470)')
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT/'01-angle-land.png'))
    stages=[]
    for i in range(8):
        page.locator(f'[data-stage="{i}"]').click()
        v=[.5,.58,.76,.74,.76,.37,.78,.48][i]
        page.locator('#progress').evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',v)
        if i==6:
            page.locator('[data-view="pier"]').click()
            page.wait_for_timeout(1500)
        if i==7:
            page.locator('[data-view="sea"]').click()
            page.wait_for_timeout(1800)
        page.wait_for_timeout(300)
        state=page.evaluate('window.__shipyard.inspect()')
        assert state['stage']==i
        stages.append(state)
        page.screenshot(path=str(OUT/f'stage-{i+1:02d}.png'))
        print(f'Stage {i+1} rendered',flush=True)
    report={'browser':browser.version,'initial':initial,'stages':stages,'errors':errors}
    (ROOT/'docs'/('visual-check-chrome.json' if chrome else 'visual-check.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'browser':browser.version,'fps':initial['fps'],'stages':len(stages),'errors':errors},ensure_ascii=False))
    browser.close()

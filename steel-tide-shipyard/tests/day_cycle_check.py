from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib,time
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=['--enable-gpu','--use-angle=d3d11'])
    context=browser.new_context(viewport={'width':1440,'height':960},offline=True)
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'钢潮入海.html').as_uri());page.wait_for_function('!!window.__shipyard')
    page.get_by_role('button',name='暂停全部',exact=True).click()
    page.locator('[data-stage="6"]').click()
    page.locator('#progress').evaluate('(el)=>{el.value=1;el.dispatchEvent(new Event("input",{bubbles:true}));}')
    page.locator('#autoplay').click()
    page.locator('#clock-speed').select_option('96')
    page.locator('#daytime').evaluate('(el)=>{el.value=8;el.dispatchEvent(new Event("input",{bubbles:true}));}')
    page.evaluate('''window.__dayCycle=[];window.__dayTimer=setInterval(()=>{const s=window.__shipyard.inspect();let lights=0;window.__shipyard.scene.traverse(o=>{if(o.isPointLight&&o.visible&&o.intensity>0)lights++;});window.__dayCycle.push({h:s.time,day:s.day,stage:s.stage,p:s.progress,shift:s.world.shift.mode,location:s.world.location,mooring:s.world.mooring,sky:window.__shipyard.scene.background.getHexString(),lights});},90);''')
    day=page.evaluate('window.__shipyard.engine.day');start=time.monotonic()
    page.get_by_role('button',name='继续全部',exact=True).click()
    page.wait_for_function(f'window.__shipyard.engine.day>{day}&&window.__shipyard.engine.time>=8',timeout=45000)
    samples=page.evaluate('clearInterval(window.__dayTimer);window.__dayCycle')
    hours={int(s['h']) for s in samples};shifts={s['shift'] for s in samples}
    assert hours==set(range(24)),hours
    assert shifts=={'night','prepare','work','closing'},shifts
    assert all(s['stage']==6 and s['p']==1 and s['mooring'] and s['location']=='berth' for s in samples)
    assert max(s['lights'] for s in samples if s['shift']=='night')>=4
    assert len({s['sky'] for s in samples})>20
    assert not errors,errors
    report={'date':'2026-11-15','artifactSha256':hashlib.sha256((ROOT/'钢潮入海.html').read_bytes()).hexdigest(),'seconds':round(time.monotonic()-start,2),'clockRate':96,'all24Hours':sorted(hours),'shifts':sorted(shifts),'samples':samples,'errors':errors}
    (ROOT/'docs'/'day-cycle-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='samples'},ensure_ascii=False));browser.close()

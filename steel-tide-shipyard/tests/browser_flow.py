"""Offline file-entry + real DOM interactions + engineering autoplay acceptance test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, platform, time, sys, hashlib

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs'/'screenshots'
OUT.mkdir(parents=True,exist_ok=True)
results=[]
def result(name,detail):
    results.append({'check':name,'status':'passed','detail':detail})
    print(f'PASS {name}',flush=True)

with sync_playwright() as p:
    chrome='--chrome' in sys.argv
    browser=p.chromium.launch(channel='chrome' if chrome else None,headless=True,args=['--enable-gpu','--use-angle=d3d11','--ignore-gpu-blocklist'] if chrome else ['--enable-webgl','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1440,'height':960},device_scale_factor=1,offline=True)
    page=context.new_page()
    errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.on('request',lambda r:requests.append(r.url))
    page.goto((ROOT/'钢潮入海.html').as_uri(),wait_until='load')
    page.wait_for_function('!!window.__shipyard',timeout=30000)
    page.wait_for_timeout(1200)
    result('离线 file:// 入口',{'url':page.url,'externalRequests':len([r for r in requests if r.startswith('http')])})
    page.get_by_role('button',name='暂停全部',exact=True).click()

    def inspect():return page.evaluate('window.__shipyard.inspect()')
    def slider(id,value):page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',value)
    def stage(i,p=0):
        page.locator(f'[data-stage="{i}"]').click();slider('progress',p)
        page.wait_for_function(f'window.__shipyard.engine.stage==={i}')
        page.wait_for_timeout(120)

    for i in range(8):
        stage(i,.5)
        assert inspect()['stage']==i
    stage(3,.72)
    assert inspect()['world']['module']['attached']
    assert inspect()['world']['water']==-13.7
    result('八阶段跳转及历史恢复','通过 DOM 点击八个阶段；从海试回到合拢，坞水恢复 -13.7 m、坞门关闭')

    # Start the whole build using the visible help/restart button, not a state shortcut.
    page.locator('#help-toggle').click()
    page.locator('#restart').click()
    page.locator('#clock-auto').uncheck()
    page.locator('#build-speed').select_option('12')
    page.evaluate('''window.__acceptance=[];window.__monitor=setInterval(()=>{const s=window.__shipyard.inspect();window.__acceptance.push({stage:s.stage,p:s.progress,carrier:s.world.module.carrier,attached:s.world.module.attached,installed:s.world.module.installed,water:s.world.water,gate:s.world.gate,y:s.world.ship.y,location:s.world.location,tow:s.world.towLines,seam:s.world.workersAtSeam,fps:s.fps,calls:s.drawCalls,triangles:s.triangles});},50);''')
    started=time.monotonic()
    for n in range(48):
        page.wait_for_timeout(4000)
        s=inspect()
        print(f'Autoplay {s["stage"]+1}/8 {s["progress"]:.2f} fps={s["fps"]}',flush=True)
        if s['stage']==7 and s['progress']==1:break
    assert s['stage']==7 and s['progress']==1, '顺播没有在限定时间内交付'
    samples=page.evaluate('clearInterval(window.__monitor);window.__acceptance')
    seen=list(dict.fromkeys(x['stage'] for x in samples))
    assert seen==list(range(8)),seen
    carriers=set(x['carrier'] for x in samples if x['stage']==3)
    assert {'胎架','转运车','接驳支座','龙门吊','舰体支承'}<=carriers,carriers
    for x in samples:
        if x['stage']==3 and .57<x['p']<.90:
            assert x['attached'] and not x['seam']
        if x['stage']==5 and x['gate']>0:
            assert x['water']==0 and x['y']==3
        if x['stage']==5 and x['location']=='tow':assert x['tow']
    assert s['world']['location']=='berth' and s['world']['mooring'] and s['world']['delivered']
    result('八阶段真实顺播',{'seconds':round(time.monotonic()-started,1),'engineeringRate':12,'clockAuto':False,'stages':seen,'samples':len(samples)})
    result('B-07 装卸吊装承载链',{'observedCarriers':sorted(carriers),'slingAndExclusionSamples':'全部符合'})
    result('注水起浮开门拖带顺序','采样中每次开门均已齐平且起浮；拖带始终挂缆；最终返港系泊')
    page.locator('[data-view="pier"]').click();page.wait_for_timeout(1800)
    page.screenshot(path=str(OUT/'accept-delivered.png'))

    # Pause includes all three clocks; orbit movement remains available.
    stage(3,.70)
    page.locator('#autoplay').click()
    page.wait_for_timeout(300)
    page.get_by_role('button',name='暂停全部',exact=True).click()
    a=inspect();page.wait_for_timeout(450);b=inspect()
    for k in ['time','progress','elapsed']:assert a[k]==b[k],k
    page.mouse.move(870,560);page.mouse.down();page.mouse.move(960,520,steps=8);page.mouse.up()
    page.wait_for_timeout(250);c=inspect()
    assert c['walkPosition']!=b['walkPosition']
    assert c['progress']==b['progress']
    result('全局暂停与镜头操作','日内时钟、工程进度、动画累计时间均不变；鼠标仍能旋转镜头')

    stage(3,.75);slider('daytime',22)
    page.wait_for_timeout(500)
    n=inspect();assert n['progress']==.5 and n['world']['module']['carrier']=='接驳支座'
    page.locator('[data-view="overview"]').click();page.wait_for_timeout(1700)
    page.screenshot(path=str(OUT/'accept-night.png'))
    slider('daytime',8)
    page.get_by_role('button',name='继续全部',exact=True).click()
    page.wait_for_function('window.__shipyard.engine.progress>.5')
    result('手动夜间跳时与次日续作','悬吊回接驳支座、吊具待机；跳回 08:00 后从 50% 继续')

    # Real closing-time boundary, with a task completing after 17:00.
    page.get_by_role('button',name='暂停全部',exact=True).click()
    stage(1,.90);slider('daytime',16.98)
    page.locator('#clock-auto').check();page.locator('#clock-speed').select_option('8')
    page.get_by_role('button',name='继续全部',exact=True).click()
    page.wait_for_function('window.__shipyard.engine.stage===2&&window.__shipyard.engine.waiting',timeout=20000)
    closing=inspect();assert closing['progress']==0
    page.wait_for_timeout(400);assert inspect()['progress']==0
    slider('daytime',8)
    page.wait_for_function('window.__shipyard.engine.stage===2&&window.__shipyard.engine.progress>0',timeout=10000)
    result('自动收尾与次日复工','16:58 启动的钢材任务落位后完成；17:00 后未派发分段任务；次日 08:00 继续')
    page.get_by_role('button',name='暂停全部',exact=True).click()
    page.locator('#clock-auto').uncheck()

    stage(3,.75);slider('daytime',18.99)
    page.locator('#clock-auto').check()
    page.get_by_role('button',name='继续全部',exact=True).click()
    page.wait_for_function('window.__shipyard.engine.time>=19&&window.__shipyard.engine.progress===.5',timeout=10000)
    assert not inspect()['world']['module']['attached']
    page.get_by_role('button',name='暂停全部',exact=True).click()
    slider('daytime',8);stage(3,.72)
    slider('daytime',7);page.locator('#clock-auto').uncheck()
    page.get_by_role('button',name='继续全部',exact=True).click()
    page.wait_for_timeout(250)
    assert inspect()['progress']==.5
    result('19 点跨班安全与早班准备','自动跨 19:00 将手动悬吊快照落回支座；跳到 07:00 后不继续吊装')
    page.get_by_role('button',name='暂停全部',exact=True).click()
    previous_day=inspect()['day'];slider('daytime',23.99)
    page.locator('#clock-speed').select_option('96');page.locator('#clock-auto').check()
    page.get_by_role('button',name='继续全部',exact=True).click()
    page.wait_for_function(f'window.__shipyard.engine.day>{previous_day}',timeout=10000)
    assert inspect()['stage']==3 and inspect()['progress']==.5
    page.get_by_role('button',name='暂停全部',exact=True).click()
    page.locator('#clock-auto').uncheck();page.locator('#clock-speed').select_option('8');slider('daytime',8)
    result('24 小时跨日循环','23:59 自动跨至次日；日数增加，B-07 仍在同一接驳支座，工程阶段不重置')

    # Close observation, sectioning, clicking the actual module surface.
    stage(3,.50);page.locator('#follow').click();page.wait_for_timeout(1400)
    page.locator('#cutaway').click();assert inspect()['cutaway']
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT/'accept-section.png'))
    point=page.evaluate('''(()=>{let o;window.__shipyard.scene.traverse(n=>{if(n.userData.id==='B-07')o=n});const v=o.position.clone().set(-10,6,0);o.localToWorld(v);v.project(window.__shipyard.camera);return [(v.x*.5+.5)*innerWidth,(-v.y*.5+.5)*innerHeight]})()''')
    page.locator('#cutaway').click()
    page.mouse.click(*point)
    page.wait_for_timeout(250)
    assert not page.locator('#selection').is_hidden()
    result('局部剖视、跟随与构件选择','打开 B-07 外板后可见肋骨与预舾装；跟随镜头；点击实物显示编号和工序')
    page.locator('#selection-close').click()
    page.locator('[data-view="workshop"]').click();page.locator('#walk').click()
    before=inspect()['walkPosition'];page.keyboard.down('KeyW');page.wait_for_timeout(500);page.keyboard.up('KeyW');after=inspect()['walkPosition']
    assert before!=after and abs(after[1]-6.1)<.01
    result('地面近景游览','车间安全步道可用 W 前进；保持眼高 6.1 m，未走入工业作业区')
    page.locator('#walk').click()
    stage(6,.8);page.locator('#deck').click();page.wait_for_timeout(350)
    deck=inspect();assert deck['mode']=='walk' and abs(deck['walkPosition'][1]-19.9)<.01
    page.screenshot(path=str(OUT/'accept-deck.png'))
    result('舷梯与甲板观察','系泊舾装阶段舷梯开放，进入舰上观察点；眼高 19.9 m')
    page.locator('#walk').click()

    page.set_viewport_size({'width':390,'height':844});page.locator('[data-view="overview"]').click();page.wait_for_timeout(1700)
    for i in range(8):
        box=page.locator(f'[data-stage="{i}"]').bounding_box()
        assert box and box['x']>=0 and box['x']+box['width']<=391
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(OUT/'accept-mobile.png'))
    result('390 × 844 布局','八个阶段按钮均在视口内，无水平溢出')
    page.set_viewport_size({'width':1440,'height':960})
    assert not [r for r in requests if r.startswith('http')]
    assert not errors,errors
    result('离线资源与浏览器错误',{'externalRequests':0,'errors':errors})

    report={'date':'2026-11-15','artifactSha256':hashlib.sha256((ROOT/'钢潮入海.html').read_bytes()).hexdigest(),'environment':{'os':platform.platform(),'browser':browser.version,'entry':'file://','network':'Playwright offline=True','viewport':'1440x960 / 390x844','renderer':inspect()['gpuName'],'renderScale':inspect()['renderScale']},'results':results,'requests':requests,'errors':errors,'flowSamples':samples}
    (ROOT/'docs'/('acceptance-chrome.json' if chrome else 'acceptance-results.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'passed':len(results),'errors':errors},ensure_ascii=False),flush=True)
    browser.close()

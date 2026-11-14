"""End-to-end checks using keyboard events, never teleportation.
Requires: pip install playwright; python -m playwright install chromium
Run with the Vite dev server at 127.0.0.1:5173.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / 'test-results'
OUT.mkdir(exist_ok=True)
checks = []

def record(label):
    checks.append(label)
    print('PASS:', label, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':960,'height':640}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.goto('http://127.0.0.1:5173/?test')
    page.wait_for_load_state('networkidle')
    page.wait_for_function('window.__town && !document.querySelector("#loading")')
    def snapshot():
        return page.evaluate('window.__town.snapshot()')

    def chord(keys,event):
        codes={'d':'KeyD','s':'KeyS','a':'KeyA','w':'KeyW'}
        page.evaluate("([codes,type])=>codes.forEach(code=>window.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true})))",[[codes[k] for k in keys],event])

    def press_for_frames(keys, frames):
        start = snapshot()['frames']
        if len(keys)>1: chord(keys,'keydown')
        else:
            for key in keys: page.keyboard.down(key)
        try:
            page.wait_for_function('(n)=>window.__town.snapshot().frames>=n',arg=start+frames, timeout=60000)
            return snapshot()
        finally:
            if len(keys)>1: chord(keys,'keyup')
            else:
                for key in keys: page.keyboard.up(key)

    def move_axis(axis, value):
        current = snapshot()['position'][axis]
        if abs(value-current) < .16: return
        positive = value > current
        keys = (['d','s'] if positive else ['a','w']) if axis=='x' else (['a','s'] if positive else ['d','w'])
        codes={'d':'KeyD','s':'KeyS','a':'KeyA','w':'KeyW'}
        try:
            # Release in the rendering frame that reaches the waypoint. External
            # protocol latency must not add extra held-key frames on software GPUs.
            page.evaluate("""async ([axis,value,positive,codes])=>{
              const send=type=>codes.forEach(code=>window.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true})));
              send('keydown');const start=performance.now();
              await new Promise((resolve,reject)=>{
                function check(){
                  const p=window.__town.snapshot().position[axis];
                  if(positive?p>=value-.1:p<=value+.1){send('keyup');resolve();}
                  else if(performance.now()-start>30000){send('keyup');reject(new Error('Waypoint blocked'));}
                  else requestAnimationFrame(check);
                }
                requestAnimationFrame(check);
              });
            }""",[axis,value,positive,[codes[k] for k in keys]])
        except Exception:
            page.screenshot(path=str(OUT/'navigation-failure.png'))
            raise AssertionError(f'Cannot reach {axis}={value}, current={snapshot()["position"]}')
        finally:
            page.evaluate("codes=>codes.forEach(code=>window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true})))",[codes[k] for k in keys])

    def go(x,z,order='xz'):
        for axis in order: move_axis(axis, x if axis=='x' else z)

    def interact(expected):
        try:
            page.wait_for_function('(id)=>window.__town.snapshot().current===id',arg=expected,timeout=4000)
        except Exception:
            page.screenshot(path=str(OUT/'interaction-failure.png'))
            raise AssertionError(f'Expected {expected}; state={snapshot()}')
        assert page.locator('#prompt').is_visible()
        page.keyboard.press('e')
        assert page.locator('#dialogue').is_visible()

    initial = snapshot()
    assert initial['current']=='apricot'
    page.screenshot(path=str(OUT/'town.png'))
    interact('apricot')
    assert page.locator('#speaker').inner_text()=='杏子'
    before=snapshot()['position']
    press_for_frames(['d'],3)
    assert snapshot()['position']==before
    page.screenshot(path=str(OUT/'dialogue.png'))
    page.keyboard.press('Escape')
    assert not page.locator('#dialogue').is_visible()
    record('NPC dialogue, prompt, Escape and paused movement while reading')

    # W/arrow up really move toward screen up; the camera follows with easing.
    start=snapshot()
    end=press_for_frames(['ArrowUp'],4)
    dx=end['position']['x']-start['position']['x']
    dz=end['position']['z']-start['position']['z']
    assert dx<0 and dz<0 and abs(dx-dz)<.01
    assert end['camera']!=start['camera']
    assert abs(end['camera']['x']-end['position']['x'])>.001
    assert abs(end['gait'])>.01
    press_for_frames(['ArrowDown'],4)
    # All cardinal keys agree with the screen projection, using unobstructed ground.
    go(-9,2.1)
    for key,sx,sy in [('ArrowRight',1,0),('ArrowLeft',-1,0),('ArrowDown',0,1),('ArrowUp',0,-1)]:
        a=snapshot()['position'];press_for_frames([key],2);b=snapshot()['position']
        screen_x=(b['x']-a['x'])-(b['z']-a['z'])
        screen_y=(b['x']-a['x'])+(b['z']-a['z'])
        assert sx==0 or screen_x*sx>0
        assert sy==0 or screen_y*sy>0
    record('Screen-aligned arrow movement, walking animation and smooth camera follow')

    go(-8,3.8,order='zx')
    interact('notice')
    assert '欢迎来到松风镇' in page.locator('#message').inner_text()
    page.keyboard.press('e')
    record('Notice board introduction and E to close')
    go(-10,3.8)
    go(-10,9.5)
    go(-10.6,9.5)
    interact('farmer')
    assert page.locator('#speaker').inner_text()=='阿禾'
    page.keyboard.press('e')
    record('Garden gate and farmer reached along connecting roads')

    # All eighteen crops are harvested through the same E interaction used by players.
    go(-12.5,9.5)
    for row in [1,0,2]:
        z=6+row*2.5
        go(-12.5,z)
        for col in range(5,-1,-1):
            go(-18.9+col*1.15,z)
            interact(f'crop-{row}-{col}')
            assert '新鲜的胡萝卜' in page.locator('#message').inner_text()
            page.keyboard.press('e')
        go(-12.5,z)
    assert snapshot()['harvests']==18
    assert all(o['harvested'] for o in snapshot()['interactions'] if o['type']=='crop')
    page.screenshot(path=str(OUT/'harvested-garden.png'))
    record('All 18 crops harvested once, with text feedback and removal')

    go(-12.5,9)
    go(-10,9)
    go(-10,2.2)
    go(8,2.2)
    go(8,6)
    press_for_frames(['d','s'],30)
    assert 9.4<snapshot()['position']['x']<9.75
    record('River blocks crossing outside the bridge')
    go(8,6)
    go(8,1.5)
    go(16,1.5)
    assert snapshot()['position']['x']>14.5
    go(19.5,2.3)
    interact('woodworker')
    assert page.locator('#speaker').inner_text()=='林叔'
    page.keyboard.press('e')
    page.screenshot(path=str(OUT/'bridge-and-grove.png'))
    record('Bridge crossed normally and grove villager reached')

    go(16,2.3)
    go(16,-6)
    press_for_frames(['d','s'],14)
    assert snapshot()['position']['x']<17.4
    record('Tree trunk blocks movement in the actual rendered grove')
    go(16,-6)
    go(16,1.5)
    go(8,1.5)
    record('Bridge crossed back in the opposite direction')

    # House facade: approach the green house from the path without entering it.
    go(6,1.5)
    go(6,-4.5)
    go(2.5,-4.5)
    press_for_frames(['d','w'],20)
    assert snapshot()['position']['z']>-6.75
    record('House exterior blocks walking through the front wall')

    a=snapshot();press_for_frames([],5);b=snapshot()
    assert a['trees']!=b['trees'] and a['water']!=b['water']
    record('Tree sway and water animation advance over time')
    page.mouse.wheel(0,650)
    page.wait_for_timeout(400)
    page.screenshot(path=str(OUT/'overview.png'))

    # Separate touch surface uses real pointer events and stays inside the viewport.
    mobile=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    mp=mobile.new_page()
    mp.goto('http://127.0.0.1:5173/?test')
    mp.wait_for_load_state('networkidle')
    mp.wait_for_function('window.__town && !document.querySelector("#loading")')
    assert mp.locator('#touch-controls').is_visible()
    start=mp.evaluate('window.__town.snapshot().position')
    button=mp.locator('[data-key="ArrowDown"]')
    bounds=button.bounding_box()
    mp.mouse.move(bounds['x']+20,bounds['y']+20)
    mp.mouse.down()
    mp.wait_for_function('(s)=>window.__town.snapshot().position.x>s.x+.1',arg=start)
    mp.mouse.up()
    assert mp.evaluate('document.documentElement.scrollWidth<=innerWidth')
    mp.screenshot(path=str(OUT/'mobile.png'))
    mobile.close()
    record('Portrait layout and pointer-based touch controls')

    assert not errors, errors
    record('No JavaScript or browser console errors')
    (OUT/'browser-report.json').write_text(json.dumps({'checks':checks,'errors':errors,'final':snapshot()},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print(f'Browser checks passed: {len(checks)}', flush=True)

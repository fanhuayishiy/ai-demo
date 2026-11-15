"""Regression coverage for the independent pre-publication review."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib,json,math,sys,unittest

ROOT=Path(__file__).resolve().parents[1]

class ReviewRegressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start()
        cls.browser=cls.p.chromium.launch(channel='chrome',headless=True,args=['--enable-gpu','--use-angle=d3d11'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop()

    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1440,'height':960},offline=True)
        self.page=self.context.new_page();self.errors=[]
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.goto((ROOT/'钢潮入海.html').as_uri())
        self.page.wait_for_function('!!window.__shipyard')
        self.page.get_by_role('button',name='暂停全部',exact=True).click()
        self.page.locator('#clock-auto').uncheck()

    def tearDown(self):
        self.assertEqual(self.errors,[])
        self.context.close()

    def slider(self,id,value):
        self.page.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',value)

    def stage(self,i,p=0):
        self.page.locator(f'[data-stage="{i}"]').click();self.slider('progress',p)
        self.page.wait_for_timeout(150)

    def inspect(self):return self.page.evaluate('window.__shipyard.inspect()')

    def test_withdrawn_gangway_returns_midpoint_visitor_to_pier(self):
        for stage,progress in [(3,.22),(7,.2)]:
            with self.subTest(stage=stage):
                self.stage(6,.8)
                self.page.locator('[data-view="pier"]').click()
                if self.inspect()['mode']!='walk':self.page.locator('#walk').click()
                self.page.evaluate('window.__shipyard.camera.position.set(263.8,6.1,-46)')
                self.page.wait_for_timeout(150)
                self.assertAlmostEqual(self.inspect()['walkPosition'][1],13,places=1)
                self.stage(stage,progress)
                position=self.inspect()['walkPosition']
                self.assertGreaterEqual(position[0],272,'撤梯后应返回码头，不能留在水面')
                self.assertAlmostEqual(position[1],6.1,places=2)
                self.page.keyboard.down('KeyW');self.page.wait_for_timeout(250);self.page.keyboard.up('KeyW')
                self.assertNotEqual(position,self.inspect()['walkPosition'])

    def test_day_speed_does_not_cancel_an_active_closing_lift(self):
        self.stage(3,.72);self.slider('daytime',16.9)
        self.page.get_by_role('button',name='继续全部',exact=True).click()
        self.page.wait_for_function('window.__shipyard.engine.taskActive')
        self.slider('daytime',18)
        before=self.inspect()['progress']
        self.page.locator('#clock-speed').select_option('8')
        self.page.wait_for_timeout(300)
        after=self.inspect()
        self.assertGreater(after['progress'],before,'调整日速应保留正在收尾的吊装任务')
        self.assertFalse(after['waiting'])
        self.assertTrue(after['world']['module']['attached'])

    def test_hidden_hull_is_not_selected_in_an_empty_dock(self):
        self.stage(1,.2)
        self.page.locator('[data-view="dock"]').click();self.page.locator('#walk').click()
        self.page.evaluate('window.__shipyard.camera.position.set(0,6.1,-64)')
        self.page.wait_for_timeout(150)
        pitch,yaw=self.page.evaluate('[window.__shipyard.camera.rotation.x,window.__shipyard.camera.rotation.y]')
        dx=-(-math.pi/2-yaw)/.004;dy=pitch/.003
        self.page.mouse.move(760,450);self.page.mouse.down();self.page.mouse.move(760+dx,450+dy,steps=6);self.page.mouse.up()
        self.page.wait_for_timeout(150)
        direction=self.page.evaluate('(()=>{const c=window.__shipyard.camera;return c.getWorldDirection(c.position.clone().set(0,0,0)).toArray()})()')
        self.assertGreater(direction[0],.99)
        self.page.mouse.click(720,480);self.page.wait_for_timeout(150)
        self.assertTrue(self.page.locator('#selection').is_hidden(),'空船坞不能选中隐藏的历史舰体')

    def test_historical_module_and_island_clear_sea_trial_rotation(self):
        self.stage(7,.5)
        rotations=lambda:self.page.evaluate('(()=>{const r={};window.__shipyard.scene.traverse(o=>{if(["B-07","IS-01"].includes(o.userData.id))r[o.userData.id]=[o.rotation.x,o.rotation.y,o.rotation.z]});return r})()')
        sea=rotations();self.assertGreater(abs(sea['B-07'][0])+abs(sea['B-07'][2]),.001)
        self.stage(3,.5)
        for id,rotation in rotations().items():
            self.assertLess(max(map(abs,rotation)),1e-8,f'{id} 待装时应恢复水平支承姿态')

if __name__=='__main__':
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ReviewRegressions))
    report={'date':'2026-11-15','artifactSha256':hashlib.sha256((ROOT/'钢潮入海.html').read_bytes()).hexdigest(),'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'passed':result.wasSuccessful()}
    (ROOT/'docs'/'review-regressions.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    sys.exit(0 if result.wasSuccessful() else 1)

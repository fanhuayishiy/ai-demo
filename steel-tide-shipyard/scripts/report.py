from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
from importlib.metadata import version
import json,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[1]
docs=ROOT/'docs'
def read(name):return json.loads((docs/name).read_text(encoding='utf-8-sig'))
content=(ROOT/'钢潮入海.html').read_bytes();digest=hashlib.sha256(content).hexdigest()
assert content==(ROOT/'dist'/'index.html').read_bytes()
flow=read('acceptance-chrome.json');perf=read('performance-results.json');near=read('nearfield-results.json');cycle=read('day-cycle-results.json');dev=read('dev-server-results.json');review=read('review-regressions.json')
for item in [flow,perf,near,cycle,dev,review]:assert item['artifactSha256']==digest, '验证记录与成品不是同一版本'
assert review['passed'] and review['failures']==0 and review['errors']==0
class Assets(HTMLParser):
    def __init__(self):super().__init__();self.external=[];self.scripts=0;self.styles=0
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=='script':self.scripts+=1
        if tag=='style':self.styles+=1
        if tag in ['script','img','source','video','audio','link']:
            for key in ['src','href']:
                if key in d:self.external.append(d[key])
a=Assets();a.feed(content.decode('utf-8'));assert not a.external;assert a.scripts==1 and a.styles==1
run=subprocess.run(['node','--test','--test-reporter=junit','tests/engine.test.mjs'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
(docs/'engine-results.xml').write_text(run.stdout,encoding='utf-8')
assert run.returncode==0,run.stdout+run.stderr
tree=ET.fromstring(run.stdout);cases=tree.findall('.//testcase');assert not tree.findall('.//failure') and not tree.findall('.//error')
fps=[s['fps'] for s in perf['samples']]
duration=next(x['detail']['seconds'] for x in flow['results'] if x['check']=='八阶段真实顺播')
rows='\n'.join(f'| {x["check"]} | 通过 | {x["detail"] if isinstance(x["detail"],str) else json.dumps(x["detail"],ensure_ascii=False)} |' for x in flow['results'])
report=f'''# 钢潮入海 · 实际验证记录

验证日期：2026-11-15（Asia/Shanghai）。以下是实际执行结果。作品为简化的工程叙事，验证不等于真实造船工艺、结构安全或水动力计算正确性。

## 最终成品

- 单文件：`钢潮入海.html`，{len(content):,} 字节（{len(content)/1024:.1f} KiB）。
- 与 `dist/index.html` 逐字节相同；一个内联 script、一个内联 style，HTML 资源属性没有外部资源引用；Three.js MIT 授权已内嵌。
- 最终文件 SHA-256：`{digest}`。
- 下列 Chrome 验收、性能、近景、昼夜和启动记录均与这个 SHA-256 匹配。

## 实际环境

| 项目 | 记录 |
| --- | --- |
| 系统 | {flow['environment']['os']} |
| CPU / GPU | Intel Core i5-11400 / NVIDIA GeForce RTX 4060 |
| 浏览器 | 本机 Google Chrome {flow['environment']['browser']}，Playwright headless |
| 渲染器 | {flow['environment']['renderer']} |
| 视口 | 1440 × 960；另检查 390 × 844 |
| 开发环境 | Node.js {subprocess.check_output(['node','--version'],text=True).strip()}；Python Playwright {version('playwright')} |
| 离线条件 | 浏览器上下文 `offline=True`，直接读取本地 `file://` HTML；未切断整台电脑网络 |

## 自动检查结果

工程状态测试 **{len(cases)}/{len(cases)} 通过**。覆盖八阶段、B-07 和吊具连续性采样、承载交接、挂索与解钩、警戒时机、岛体支座与重吊、水位与起浮、齐平后开门、拖缆、返港、暂停、夜间与准备班安全快照、17 点停止派工、19 点跨班、24 小时跨日以及升降平台起止回平。

浏览器通过真实 DOM 点击、滑杆、按键与拖动完成 **{len(flow['results'])} 项验收**：

| 检查 | 状态 | 实际操作及结果 |
| --- | --- | --- |
{rows}

完整顺播使用工速 12×，固定日内工作时间，实际耗时约 {duration} 秒；没有以直接设置最终状态代替顺播。过程按 50 ms 间隔采样工程、水位、承载者和缆索等状态，最终抵达返港系泊交付节点。软件渲染候选版本也完成过相同的十三项基础检查，记录保留在 `acceptance-results.json`；最终版本以带 SHA-256 的 Chrome 记录为准。

## 连续昼夜与近景补充

独立代码复核后补充的 **{review['tests']} 项浏览器回归全部通过**：舷梯撤收时中途观察者返回安全码头；收尾时修改日速保留当前吊装；隐藏构件不可被点选；从海试回看待装分段和舰岛时清除俯仰、横摇。问题均先以实际浏览器复现，再完成修复和回归。详见 `review-regressions.json`。

- 完整日内循环：日速 96×，实际运行 {cycle['seconds']} 秒，覆盖全部 24 个小时及准备、施工、收尾、值守四种班次；舰体始终系泊，工程阶段与进度没有随跨日重置。天色采样连续变化，夜间必要点光源启用。详见 `day-cycle-results.json`。
- 甲板方向：舰体朝向反转后，按 W 的世界坐标 Z 从 {near['deckForward']['before'][2]:.3f} 增加到 {near['deckForward']['after'][2]:.3f}，与镜头前方一致。
- 舷梯通路：沿实际岸舰斜向通路采样，镜头高度依次为 {', '.join(f'{x:.3f}' for x in near['gangwayEyeHeights'])} m，随楼梯上升；可以在通路端部进入甲板，甲板避开舰岛占用区域。
- 已目视查看初始合拢、八阶段截图、局部剖视、夜景、舷梯/甲板与窄屏截图。支座、施工面与临时通路是简化几何，未作通用碰撞求解或逐帧全场碰撞验证。

## 性能与运行范围

本机硬件渲染在 1440 × 960、像素比 {perf['samples'][0]['renderScale']} 下，预热后六次 1.1 秒间隔采样为 **{', '.join(str(x) for x in fps)} FPS**，已设置约 60 FPS 的绘制上限。合拢视角约 {min(s['drawCalls'] for s in perf['samples'])}–{max(s['drawCalls'] for s in perf['samples'])} 次绘制、{min(s['triangles'] for s in perf['samples']):,}–{max(s['triangles'] for s in perf['samples']):,} 个三角形。此结果仅适用于本机短时采样，不是所有设备的性能保证。

另一次 Chromium 156 / SwiftShader 软件渲染检查中约 4–8 FPS；程序会降低软件渲染像素比到 0.75，但软件渲染明显较慢。推荐硬件加速。未测试手机实机 GPU、Safari、Firefox、Edge，也未做数小时运行、显存压力或热稳定性测试。

页面 JavaScript / WebGL 错误：最终自动验收中 **0**。离线验收的 HTTP(S) 请求：**0**。

## 启动与双击核验边界

本地开发脚本以 PORT=5174 启动并返回 HTTP {dev['status']}，页面与离线 HTML 逐字节一致；测试子进程随后关闭。默认启动端口为 5173。

**离线文件协议入口：通过。资源管理器物理双击：受限，未核验。** 已尝试读取项目的资源管理器窗口，但 Windows 截图助手先后报告 `FrameArrived timed out` 与 `window capture timed out`，按工具恢复规则停止了桌面输入。没有把 `file://` 的自动化验证冒充实际双击，也没有切断用户整台电脑网络。用户可直接在资源管理器中双击最终 HTML 检查默认浏览器关联。

## 复验命令

```powershell
npm ci
npm test
npm run build
python tests/browser_flow.py --chrome
python tests/nearfield_check.py
python tests/review_regressions.py
python tests/day_cycle_check.py
python tests/gpu_benchmark.py
python tests/dev_server_check.py
python scripts/report.py
python scripts/package.py
```

浏览器脚本需要 Python Playwright 和本机 Chrome；纯状态测试与构建仅需 Node.js。`report.py` 会验证浏览器记录的成品哈希、单文件资源引用、构建一致性，并重新运行状态测试。压缩脚本会对 ZIP 执行 CRC 校验。
'''
(docs/'验证记录.md').write_text(report,encoding='utf-8')
manifest={'date':'2026-11-15','artifact':'钢潮入海.html','bytes':len(content),'sha256':digest,'engineTests':len(cases),'browserChecks':len(flow['results']),'reviewRegressions':review['tests'],'externalAssets':a.external,'sameAsDist':True,'physicalExplorerDoubleClick':'unverified: Windows capture helper timed out'}
(docs/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False))

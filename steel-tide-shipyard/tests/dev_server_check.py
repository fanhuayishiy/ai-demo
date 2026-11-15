from pathlib import Path
import subprocess,os,time,urllib.request,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
env=dict(os.environ);env['PORT']='5174'
proc=subprocess.Popen(['node','scripts/dev.mjs'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
try:
    for n in range(40):
        try:
            with urllib.request.urlopen('http://127.0.0.1:5174',timeout=1) as r:
                status=r.status;data=r.read()
            break
        except Exception:
            if proc.poll() is not None:raise RuntimeError('Development server exited')
            time.sleep(.15)
    else:raise RuntimeError('Development server did not respond')
    assert status==200
    assert data==(ROOT/'钢潮入海.html').read_bytes()
    report={'date':'2026-11-15','status':status,'bytes':len(data),'artifactSha256':hashlib.sha256(data).hexdigest(),'note':'以 PORT=5174 启动同一 dev.mjs，读取页面与离线 HTML 逐字节一致；测试结束后关闭子进程'}
    (ROOT/'docs'/'dev-server-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))
finally:
    proc.terminate();proc.communicate(timeout=5)

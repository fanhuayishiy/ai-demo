from pathlib import Path
import zipfile

ROOT=Path(__file__).resolve().parents[1]
target=ROOT/'钢潮入海-完整项目.zip'
files=[]
for folder in ['src','scripts','tests','docs','dist']:
    files.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
for name in ['.gitattributes','.gitignore','README.md','package.json','package-lock.json','THIRD_PARTY_LICENSES.md','钢潮入海.html']:
    files.append(ROOT/name)
assert (ROOT/'钢潮入海.html').read_bytes()==(ROOT/'dist'/'index.html').read_bytes()
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for f in sorted(set(files)):z.write(f,f.relative_to(ROOT))
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    print(f'Packed {len(z.namelist())} files; {target.stat().st_size/1024/1024:.2f} MiB; CRC verified')

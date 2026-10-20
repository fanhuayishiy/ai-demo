import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateProjectScreenshot as validate } from '../scripts/project-screenshot.mjs';

const source = await readFile(new URL('../assets/project-thumbnails/roadster-escape-toll.webp', import.meta.url));
const dir = 'sample-project';
const screenshot = `./assets/project-thumbnails/${dir}.webp`;

async function fixture(t, bytes = source) {
  const root = await mkdtemp(path.join(tmpdir(), 'project-screenshot-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets/project-thumbnails'), { recursive: true });
  await writeFile(path.join(root, screenshot), bytes);
  return { root, dir, screenshot };
}

function chunk(type, payload) {
  const bytes = Buffer.alloc(8 + payload.length + (payload.length % 2));
  bytes.write(type, 0, 'ascii');
  bytes.writeUInt32LE(payload.length, 4);
  payload.copy(bytes, 8);
  return bytes;
}
function riff(...chunks) {
  const body = Buffer.concat([Buffer.from('WEBP'), ...chunks]);
  const header = Buffer.alloc(8);
  header.write('RIFF');
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
function vp8x(flags = 0, width = 640, height = 360) {
  const payload = Buffer.alloc(10);
  payload[0] = flags;
  payload.writeUIntLE(width - 1, 4, 3);
  payload.writeUIntLE(height - 1, 7, 3);
  return chunk('VP8X', payload);
}
const originalChunk = source.subarray(12);

test('真实静态WebP通过并返回规范路径、尺寸及字节数', async (t) => {
  const options = await fixture(t);
  assert.deepEqual(await validate(options), { screenshot, width: 640, height: 360, size: source.length });
  assert.equal((await validate({ ...options, screenshot: screenshot.slice(2) })).screenshot, screenshot);
});

test('截图必填，目录和路径必须符合项目专属命名', async (t) => {
  const options = await fixture(t);
  for (const invalid of [undefined, '', '../sample-project.webp', '/assets/project-thumbnails/sample-project.webp', './assets/project-thumbnails/other.webp', 'https://example.com/a.webp', './assets/../assets/project-thumbnails/sample-project.webp']) {
    await assert.rejects(validate({ ...options, screenshot: invalid }), /截图/u);
  }
  await assert.rejects(validate({ ...options, dir: '../bad' }), /截图/u);
});

test('截图必须存在且为普通文件', async (t) => {
  const options = await fixture(t);
  await rm(path.join(options.root, screenshot));
  await assert.rejects(validate(options), /截图/u);
  await mkdir(path.join(options.root, screenshot));
  await assert.rejects(validate(options), /截图/u);
});

test('截图字节数必须严格位于1000与80000之间', async (t) => {
  for (const size of [1000, 80000, 80001]) {
    const options = await fixture(t, Buffer.alloc(size));
    await assert.rejects(validate(options), /截图/u);
  }
});

test('解析扩展VP8X尺寸并确认内部图像一致', async (t) => {
  const bytes = riff(vp8x(), originalChunk);
  const options = await fixture(t, bytes);
  assert.equal((await validate(options)).width, 640);
  await writeFile(path.join(options.root, screenshot), riff(vp8x(0, 641), originalChunk));
  await assert.rejects(validate(options), /截图/u);
});

test('解析VP8L尺寸并拒绝错误版本', async (t) => {
  const payload = Buffer.alloc(1100);
  payload[0] = 0x2f;
  const packed = ((360 - 1) << 14) | (640 - 1);
  payload.writeUInt32LE(packed, 1);
  const options = await fixture(t, riff(chunk('VP8L', payload)));
  assert.equal((await validate(options)).height, 360);
  payload[4] |= 0xe0;
  await writeFile(path.join(options.root, screenshot), riff(chunk('VP8L', payload)));
  await assert.rejects(validate(options), /截图/u);
});

test('拒绝错误尺寸、动画和损坏或截断的WebP容器', async (t) => {
  const wrongSize = Buffer.from(source);
  wrongSize.writeUInt16LE(641, 26);
  const brokenSignature = Buffer.from(source);
  brokenSignature[23] = 0;
  const wrongRiff = Buffer.from(source);
  wrongRiff.write('NOPE');
  const chunkTooLong = Buffer.from(source);
  chunkTooLong.writeUInt32LE(source.length, 16);
  const invalid = [wrongSize, brokenSignature, wrongRiff, chunkTooLong,
    source.subarray(0, -1), Buffer.concat([source, Buffer.from([0])]),
    riff(vp8x(2), originalChunk), riff(chunk('ANIM', Buffer.alloc(6)), originalChunk),
    riff(chunk('ANMF', Buffer.alloc(16)), originalChunk), riff(chunk('JUNK', Buffer.alloc(1100))),
    riff(vp8x(), originalChunk, originalChunk)];
  for (const bytes of invalid) {
    const options = await fixture(t, bytes);
    await assert.rejects(validate(options), /截图/u);
  }
});

test('拒绝截图文件符号链接（权限可用时）', async (t) => {
  const options = await fixture(t);
  const target = path.join(options.root, 'source.webp');
  await writeFile(target, source);
  await rm(path.join(options.root, screenshot));
  try { await symlink(target, path.join(options.root, screenshot), 'file'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) return t.skip('系统不允许创建文件符号链接'); throw error; }
  await assert.rejects(validate(options), /截图/u);
});

test('拒绝截图父目录符号链接或Windows目录联接', async (t) => {
  const options = await fixture(t);
  const target = path.join(options.root, 'other-assets');
  await mkdir(path.join(target, 'project-thumbnails'), { recursive: true });
  await writeFile(path.join(target, `project-thumbnails/${dir}.webp`), source);
  await rm(path.join(options.root, 'assets'), { recursive: true });
  try { await symlink(target, path.join(options.root, 'assets'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) return t.skip('系统不允许创建目录符号链接'); throw error; }
  await assert.rejects(validate(options), /截图/u);
});

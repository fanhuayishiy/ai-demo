import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

function invalid(message) {
  throw new Error(`截图${message}`);
}

// 检查容器边界和图像头；无需引入图像解码依赖。
function staticWebpDimensions(bytes) {
  if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF'
    || bytes.toString('ascii', 8, 12) !== 'WEBP'
    || bytes.readUInt32LE(4) + 8 !== bytes.length) {
    invalid('不是完整的 RIFF/WEBP 文件，可能已损坏或截断');
  }
  let image;
  let canvas;
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) invalid('的 WebP 数据块头已截断');
    const type = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    const next = end + (length % 2);
    if (next > bytes.length) invalid('的 WebP 数据块已截断');
    const payload = bytes.subarray(start, end);
    if (type === 'ANIM' || type === 'ANMF') invalid('必须是静态 WebP，不能使用动画');
    if (type === 'VP8X') {
      if (canvas || offset !== 12 || length !== 10) invalid('的 VP8X 扩展头损坏');
      if (payload[0] & 0x02) invalid('必须是静态 WebP，不能使用动画');
      if ((payload[0] & 0xc1) || payload[1] || payload[2] || payload[3]) invalid('的 VP8X 保留位无效');
      canvas = { width: payload.readUIntLE(4, 3) + 1, height: payload.readUIntLE(7, 3) + 1 };
    } else if (type === 'VP8 ' || type === 'VP8L') {
      if (image) invalid('包含重复的 WebP 图像数据块');
      if (type === 'VP8 ') {
        if (length < 10 || (payload[0] & 1) || payload[3] !== 0x9d || payload[4] !== 0x01 || payload[5] !== 0x2a) {
          invalid('的 VP8 图像头损坏');
        }
        image = { width: payload.readUInt16LE(6) & 0x3fff, height: payload.readUInt16LE(8) & 0x3fff };
      } else {
        if (length < 5 || payload[0] !== 0x2f || (payload[4] & 0xe0)) invalid('的 VP8L 图像头损坏');
        const packed = payload.readUInt32LE(1);
        image = { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1 };
      }
    }
    offset = next;
  }
  if (!image) invalid('缺少 VP8 或 VP8L 图像数据');
  if (canvas && (canvas.width !== image.width || canvas.height !== image.height)) invalid('的画布尺寸与图像尺寸不一致');
  return image;
}

/** 验证项目的本地静态截图，并返回统一路径和图像信息。 */
export async function validateProjectScreenshot({ root, dir, screenshot } = {}) {
  if (typeof dir !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(dir)) invalid('所属项目目录必须是安全的小写 kebab-case');
  const normalized = `./assets/project-thumbnails/${dir}.webp`;
  if (typeof screenshot !== 'string' || ![normalized, normalized.slice(2)].includes(screenshot)) {
    invalid(`路径必须是 ${normalized}`);
  }
  if (typeof root !== 'string' || !root) invalid('校验需要有效的仓库根目录');
  const resolvedRoot = path.resolve(root);
  const parts = ['assets', 'project-thumbnails', `${dir}.webp`];
  let current = resolvedRoot;
  try {
    // 根目录及每一层父目录也不能通过链接跳到其他位置。
    const rootStat = await lstat(current);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) invalid('仓库根目录不能是符号链接，且必须是目录');
    for (let index = 0; index < parts.length; index++) {
      current = path.join(current, parts[index]);
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) invalid('文件及父目录不能使用符号链接或目录联接');
      if (index < parts.length - 1) {
        if (!stat.isDirectory()) invalid('父路径必须是目录');
      } else {
        if (!stat.isFile()) invalid('必须是已存在的普通文件');
        if (stat.size <= 1000 || stat.size >= 80000) invalid('大小必须大于 1000 且小于 80000 字节');
      }
    }
    const bytes = await readFile(current);
    if (bytes.length <= 1000 || bytes.length >= 80000) invalid('大小必须大于 1000 且小于 80000 字节');
    const { width, height } = staticWebpDimensions(bytes);
    if (width !== 640 || height !== 360) invalid(`尺寸必须是 640×360，当前为 ${width}×${height}`);
    return { screenshot: normalized, width, height, size: bytes.length };
  } catch (error) {
    if (error.message.startsWith('截图')) throw error;
    invalid(`文件无法读取，请确认文件存在且具有读取权限（${error.code ?? '读取失败'}）`);
  }
}

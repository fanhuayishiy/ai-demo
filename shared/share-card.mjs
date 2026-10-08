export function normalizeShareUrl(value) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error('Invalid share URL');
  let url;
  try { url = new URL(value); }
  catch { throw new Error('Invalid share URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 2048) {
    throw new Error('Share URL must be HTTP(S), without credentials, and at most 2048 characters');
  }
  return url.href;
}

/** Integer-sized modules and a four-module quiet zone remain readable after saving. */
export function renderQrPixels(value, qrcode) {
  const url = normalizeShareUrl(value);
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const code = qrcode(0, 'M');
  code.addData(url, 'Byte');
  code.make();
  const modules = code.getModuleCount(), quiet = 4;
  const cellSize = Math.max(3, Math.ceil(160 / (modules + quiet * 2)));
  const width = (modules + quiet * 2) * cellSize;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let row = 0; row < modules; row++) {
    for (let column = 0; column < modules; column++) {
      if (!code.isDark(row, column)) continue;
      for (let y = 0; y < cellSize; y++) {
        for (let x = 0; x < cellSize; x++) {
          const index = (((row + quiet) * cellSize + y) * width + (column + quiet) * cellSize + x) * 4;
          data[index] = data[index + 1] = data[index + 2] = 0;
        }
      }
    }
  }
  return { data, width, height: width, cellSize, quiet };
}

export function shareCardLayout({ width, height }, qrSize) {
  if (![width, height, qrSize].every(value => Number.isFinite(value) && value > 0) || qrSize > 1000) {
    throw new Error('Invalid share image dimensions');
  }
  const outputWidth = Math.max(qrSize + 32, Math.min(1920, Math.max(320, Math.round(width))));
  const beside = outputWidth >= qrSize + 250;
  const footerHeight = qrSize + (beside ? 32 : 108);
  const scale = Math.min(outputWidth / width, (4096 - footerHeight) / height,
    (6000000 / outputWidth - footerHeight) / height);
  const sceneWidth = Math.max(1, Math.floor(width * scale));
  const sceneHeight = Math.max(1, Math.floor(height * scale));
  return {
    width: outputWidth, height: sceneHeight + footerHeight,
    sceneX: Math.floor((outputWidth - sceneWidth) / 2), sceneWidth, sceneHeight,
    footerY: sceneHeight,
    qrX: beside ? outputWidth - qrSize - 16 : Math.floor((outputWidth - qrSize) / 2),
    qrY: sceneHeight + (beside ? 16 : 76),
    textX: 24, textY: sceneHeight + (beside ? Math.max(40, footerHeight / 2 - 22) : 30),
    textMaxWidth: beside ? outputWidth - qrSize - 64 : outputWidth - 48,
    beside,
  };
}

function clippedText(context, text, width) {
  const characters = Array.from(String(text).replace(/\s+/gu, ' ').trim()).slice(0, 180);
  if (context.measureText(characters.join('')).width <= width) return characters.join('');
  while (characters.length && context.measureText(characters.join('') + '…').width > width) characters.pop();
  return characters.join('') + '…';
}

export function composeShareCard({ document, image, title, url, qrcode }) {
  const currentUrl = normalizeShareUrl(url);
  const qr = renderQrPixels(currentUrl, qrcode);
  const layout = shareCardLayout({width:image.width, height:image.height}, qr.width);
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas is unavailable');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, layout.sceneX, 0, layout.sceneWidth, layout.sceneHeight);
  context.fillStyle = '#ffffff';
  context.fillRect(0, layout.footerY, canvas.width, canvas.height - layout.footerY);
  context.fillStyle = '#172126';
  context.font = '600 20px system-ui, "Microsoft YaHei", sans-serif';
  context.fillText(clippedText(context, title || 'AI Demo', layout.textMaxWidth), layout.textX, layout.textY);
  context.fillStyle = '#53666f';
  context.font = '14px system-ui, "Microsoft YaHei", sans-serif';
  context.fillText('扫码打开当前预览 · AI Demo', layout.textX, layout.textY + 26);
  if (layout.beside) {
    context.font = '12px system-ui, sans-serif';
    context.fillText(clippedText(context, currentUrl, layout.textMaxWidth), layout.textX, layout.textY + 50);
  }
  const pixels = context.createImageData(qr.width, qr.height);
  pixels.data.set(qr.data);
  context.putImageData(pixels, layout.qrX, layout.qrY);
  return canvas;
}

export function canvasToPng(canvas) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('PNG encoding timed out')), 15000);
    try {
      canvas.toBlob(blob => {
        clearTimeout(timeout);
        if (!blob || blob.type !== 'image/png') reject(new Error('PNG encoding failed'));
        else resolve(blob);
      }, 'image/png');
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

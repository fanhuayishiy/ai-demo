import test from 'node:test';
import assert from 'node:assert/strict';
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';

const card = await import('../shared/share-card.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

test('share card helpers exist', () => {
  for (const name of ['normalizeShareUrl', 'renderQrPixels', 'shareCardLayout', 'composeShareCard', 'canvasToPng']) {
    assert.equal(typeof card[name], 'function', `${name} must be implemented`);
  }
});

test('the QR URL preserves the current path, query and hash', () => {
  const value = 'https://example.test/demo/?view=2#camera';
  assert.equal(card.normalizeShareUrl(value), value);
  assert.equal(card.normalizeShareUrl('https://example.test/中文/#镜头'), new URL('https://example.test/中文/#镜头').href);
});

test('unsafe, credentialed, malformed and excessive URLs are rejected', () => {
  for (const value of ['javascript:alert(1)', 'data:text/plain,hi', '/relative', 'https://a:b@example.test/', 'https://x.test/\nprivate', `https://x.test/${'x'.repeat(2048)}`]) {
    assert.throws(() => card.normalizeShareUrl(value), /URL/);
  }
});

test('actual QR pixels decode to the complete current URL including Unicode and state', () => {
  for (const value of ['https://example.test/demo/?view=2#camera', 'https://example.test/中文/?镜头=侧面#测试', `https://example.test/${'x'.repeat(1800)}`]) {
    const qr = card.renderQrPixels(value, qrcode);
    assert.ok(qr.cellSize >= 3 && Number.isInteger(qr.cellSize));
    assert.equal(qr.width, qr.height);
    assert.equal(qr.quiet, 4);
    assert.equal(jsQR(qr.data, qr.width, qr.height)?.data, new URL(value).href);
    assert.ok(qr.data.slice(0, qr.width * qr.quiet * qr.cellSize * 4).every(value => value === 255));
  }
});

test('card footer cannot cover the scene and output memory is bounded', () => {
  for (const [width, height, qrSize] of [[1440, 900, 164], [390, 844, 192], [100000, 50000, 500], [1, 100000, 500]]) {
    const layout = card.shareCardLayout({ width, height }, qrSize);
    assert.equal(layout.footerY, layout.sceneHeight);
    assert.ok(layout.qrY >= layout.footerY);
    assert.ok(layout.qrX >= 0 && layout.qrX + qrSize <= layout.width);
    assert.ok(layout.qrY + qrSize <= layout.height);
    assert.ok(layout.width <= 4096 && layout.height <= 4096);
    assert.ok(layout.width * layout.height <= 6000000);
    assert.ok(layout.sceneWidth > 0 && layout.sceneHeight > 0);
  }
  for (const size of [{width:0,height:100}, {width:Infinity,height:3}, {width:1,height:NaN}]) {
    assert.throws(() => card.shareCardLayout(size, 160));
  }
});

test('a PNG conversion failure is not reported as an image', async () => {
  await assert.rejects(() => card.canvasToPng({toBlob: callback => callback(null)}), /PNG/);
  const blob = new Blob(['png'], {type:'image/png'});
  assert.equal(await card.canvasToPng({toBlob: callback => callback(blob)}), blob);
});

test('the composed card paints a scene then an opaque footer with a real QR', () => {
  const calls = [];
  const context = {
    fillRect(...args) { calls.push(['fill', this.fillStyle, ...args]); },
    drawImage(...args) { calls.push(['scene', ...args]); },
    fillText(...args) { calls.push(['text', ...args]); },
    measureText(text) { return {width:text.length * 10}; },
    createImageData(width, height) { return {data:new Uint8ClampedArray(width * height * 4),width,height}; },
    putImageData(pixels, x, y) { calls.push(['qr', pixels, x, y]); },
  };
  const canvas = {getContext:() => context};
  const image = {width:800,height:600};
  const result = card.composeShareCard({document:{createElement:() => canvas},image,title:'Current demo',url:'https://example.test/current/#view',qrcode});
  assert.equal(result, canvas);
  assert.equal(calls.find(call => call[0] === 'scene')[1], image);
  const qrCall = calls.find(call => call[0] === 'qr');
  assert.ok(qrCall[3] >= 600);
  assert.equal(jsQR(qrCall[1].data, qrCall[1].width, qrCall[1].height).data, 'https://example.test/current/#view');
  assert.ok(calls.some(call => call[0] === 'text' && call[1] === 'Current demo'));
});

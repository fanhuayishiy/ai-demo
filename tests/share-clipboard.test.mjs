import test from 'node:test';
import assert from 'node:assert/strict';

const clipboard = await import('../shared/share-clipboard.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

test('clipboard helper exists', () => assert.equal(typeof clipboard.beginImageCopy, 'function'));

test('the deferred PNG is handed to clipboard.write synchronously within the click stack', async () => {
  const order = [];
  let resolveBlob, finishWrite;
  const blob = new Promise(resolve => { resolveBlob = resolve; });
  class Item { constructor(types) { this.types = types; } }
  const result = clipboard.beginImageCopy({ClipboardItem:Item,navigator:{clipboard:{write(items) {
    order.push('write');
    assert.equal(items[0].types['image/png'], blob);
    return new Promise(resolve => {finishWrite = resolve;});
  }}}}, blob);
  order.push('after click');
  assert.deepEqual(order, ['write', 'after click']);
  let settled = false;
  result.then(() => {settled = true;});
  resolveBlob(new Blob(['png'], {type:'image/png'}));
  await Promise.resolve();
  assert.equal(settled, false, 'image creation alone is not clipboard success');
  finishWrite();
  assert.deepEqual(await result, {ok:true});
});

test('a rejected or synchronously throwing clipboard write never reports success', async () => {
  class Item { constructor(types) { this.types = types; } }
  for (const write of [() => Promise.reject(new Error('Denied')), () => {throw new Error('Denied');}]) {
    const result = await clipboard.beginImageCopy({ClipboardItem:Item,navigator:{clipboard:{write}}}, Promise.resolve(new Blob(['png'])));
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'rejected');
  }
});

test('unsupported clipboard and image type return a usable fallback result', async () => {
  assert.deepEqual(await clipboard.beginImageCopy({navigator:{}}, Promise.resolve(new Blob())), {ok:false,reason:'unsupported'});
  class Item { static supports() { return false; } }
  const result = await clipboard.beginImageCopy({ClipboardItem:Item,navigator:{clipboard:{write() {throw new Error('Must not write');}}}}, Promise.resolve(new Blob()));
  assert.deepEqual(result, {ok:false,reason:'unsupported'});
});

test('unsupported browsers still consume generation rejections immediately', async () => {
  const result = clipboard.beginImageCopy({navigator:{}}, Promise.reject(new Error('Capture failed')));
  assert.equal((await result).ok, false);
  await new Promise(resolve => setTimeout(resolve, 0));
});

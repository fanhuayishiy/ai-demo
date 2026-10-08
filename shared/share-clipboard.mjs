/** Keep this call in the original click stack; the PNG may resolve asynchronously. */
export function beginImageCopy({ navigator, ClipboardItem }, blobPromise) {
  const image = Promise.resolve(blobPromise);
  // Generation can also fail in browsers without ClipboardItem support.
  image.catch(() => {});
  if (!navigator?.clipboard?.write || !ClipboardItem
      || (ClipboardItem.supports && !ClipboardItem.supports('image/png'))) {
    return Promise.resolve({ ok: false, reason: 'unsupported' });
  }
  try {
    const item = new ClipboardItem({ 'image/png': image });
    return Promise.resolve(navigator.clipboard.write([item])).then(
      () => ({ ok: true }),
      () => ({ ok: false, reason: 'rejected' }),
    );
  } catch {
    return Promise.resolve({ ok: false, reason: 'rejected' });
  }
}

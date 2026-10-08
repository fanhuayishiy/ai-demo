/** Browser operations are injected so the interaction lifecycle is independently testable. */
export function connectShareUI({window, document, host, shadow, capture, makeBlob, copy}) {
  const action = name => shadow.querySelector('[data-action="' + name + '"]');
  const share = action('share'), tab = action('capture-tab'), again = action('copy-again'), save = action('save');
  const dialog = shadow.querySelector('dialog'), preview = shadow.querySelector('.share-preview');
  const explanation = shadow.querySelector('.share-explanation');
  const status = shadow.querySelector('.status'), statusMessage = shadow.querySelector('.status-message');
  const cancel = action('cancel-share');
  let closed = false, busy = false, sequence = 0, controller, blob, objectUrl, statusTimer;
  const listeners = [];
  const on = (element, event, handler) => {element.addEventListener(event, handler); listeners.push([element,event,handler]);};

  function setBusy(value) {
    busy = value;
    share.disabled = tab.disabled = again.disabled = value;
    share.setAttribute('aria-busy', String(value));
    cancel.hidden = !value;
  }

  function announce(message) {
    window.clearTimeout(statusTimer);
    statusMessage.textContent = message;
    status.hidden = false;
    if (!busy) statusTimer = window.setTimeout(() => {status.hidden = true;}, 5000);
  }

  function restoreVisibility() {
    host.removeAttribute('data-sharing-capture');
  }

  function releaseImage() {
    if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    objectUrl = blob = undefined;
    preview.removeAttribute('src');
    preview.hidden = true;
    save.removeAttribute('href');
    save.hidden = again.hidden = true;
  }

  function hideDialog() {
    if (dialog.open && dialog.close) dialog.close();
    dialog.removeAttribute('open');
  }

  function closeDialog() {
    if (busy) cancelShare();
    hideDialog();
    releaseImage();
    if (!closed) share.focus();
  }

  function showDialog(message, allowTab) {
    explanation.textContent = message;
    tab.hidden = !allowTab || !window.navigator.mediaDevices?.getDisplayMedia;
    if (blob) {
      objectUrl = window.URL.createObjectURL(blob);
      preview.src = objectUrl;
      preview.hidden = false;
      save.href = objectUrl;
      save.download = 'ai-demo-share.png';
      save.hidden = again.hidden = false;
    }
    if (!dialog.open) {
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    (blob ? again : !tab.hidden ? tab : action('close-dialog')).focus();
  }

  function cancelledError() {
    const error = new Error('Sharing cancelled');
    error.name = 'AbortError';
    return error;
  }

  function start(mode) {
    if (closed || busy) return;
    hideDialog();
    releaseImage();
    controller = new window.AbortController();
    const signal = controller.signal, id = ++sequence;
    const active = () => !closed && sequence === id && !signal.aborted;
    const metadata = {url:window.location.href, title:document.title};
    setBusy(true);
    announce(mode === 'tab' ? '请在权限窗口选择当前标签页…' : '正在生成截图与二维码…');
    if (mode === 'tab') {
      host.setAttribute('data-sharing-capture', '');
    }
    let stage = 'capture';
    const generation = (async () => {
      const image = await capture(mode, signal);
      try {
        if (!active()) throw cancelledError();
        // The frame is already captured. Keep cancel/retry controls reachable
        // while PNG composition or clipboard permission is still pending.
        restoreVisibility();
        stage = 'compose';
        const result = await makeBlob(image, metadata);
        if (!active()) throw cancelledError();
        return result;
      } finally {
        image.width = image.height = 0;
      }
    })();
    // No await before this call: browsers may consume the original click activation.
    const write = copy(generation);
    (async () => {
      try {
        const imageBlob = await generation;
        const result = await write;
        if (!active()) return;
        restoreVisibility();
        setBusy(false);
        if (result.ok) announce('已复制分享图片，可直接粘贴');
        else {
          blob = imageBlob;
          announce('图片已生成，剪贴板暂不可用');
          showDialog('图片已生成，但浏览器未允许复制。可再次复制或保存 PNG 图片。', false);
        }
      } catch (error) {
        if (!active()) return;
        restoreVisibility();
        setBusy(false);
        if (error.name === 'AbortError') {announce('已取消分享'); return;}
        announce('未生成分享图片');
        if (stage === 'compose') {
          showDialog('截图已获取，但图片合成或二维码编码失败。页面网址可能过长，或浏览器无法生成 PNG；请关闭后重试。', false);
          return;
        }
        const supported = Boolean(window.navigator.mediaDevices?.getDisplayMedia);
        const message = mode === 'tab'
          ? '未完成标签页截图。请重新授权，并选择当前标签页（不要选择窗口或整个屏幕）。'
          : '当前画面无法完整自动截图，可能包含受限的三维画布或嵌入内容。';
        showDialog(message + (supported ? '点击下方按钮后，浏览器才会请求截图权限。' : '当前浏览器不支持标签页截图，请使用桌面版 Chrome 或 Edge。'), supported);
      }
    })();
  }

  function cancelShare() {
    if (!busy) return;
    sequence++;
    controller?.abort();
    restoreVisibility();
    setBusy(false);
    announce('已取消分享');
    if (!closed) (dialog.open && blob ? again : share).focus();
  }

  on(share, 'click', () => start('dom'));
  on(tab, 'click', () => start('tab'));
  on(cancel, 'click', cancelShare);
  on(action('close-dialog'), 'click', closeDialog);
  on(again, 'click', () => {
    if (closed || busy || !blob) return;
    const id = ++sequence;
    setBusy(true);
    announce('正在复制分享图片…');
    copy(Promise.resolve(blob)).then(result => {
      if (closed || sequence !== id) return;
      setBusy(false);
      explanation.textContent = result.ok ? '已复制分享图片，可直接粘贴。' : '仍未获得剪贴板权限，请保存 PNG 图片。';
      announce(result.ok ? '已复制分享图片，可直接粘贴' : '请使用保存图片');
    });
  });
  on(dialog, 'cancel', event => {event.preventDefault(); closeDialog();});
  on(dialog, 'keydown', event => {
    if (event.key === 'Escape') {event.preventDefault(); closeDialog(); return;}
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button,a[href]')].filter(element => !element.hidden && !element.disabled);
    const first = controls[0], last = controls.at(-1), current = shadow.activeElement;
    if (event.shiftKey && (current === first || !controls.includes(current))) {event.preventDefault(); last?.focus();}
    else if (!event.shiftKey && (current === last || !controls.includes(current))) {event.preventDefault(); first?.focus();}
  });

  function resetTemporaryState() {
    sequence++;
    controller?.abort();
    controller = undefined;
    restoreVisibility();
    hideDialog();
    releaseImage();
    window.clearTimeout(statusTimer);
    status.hidden = true;
    setBusy(false);
  }

  function cleanup() {
    if (closed) return;
    closed = true;
    resetTemporaryState();
    for (const [element,event,handler] of listeners) element.removeEventListener(event, handler);
    listeners.length = 0;
  }
  on(window, 'pagehide', event => {
    // BFCache freezes this document instead of destroying it. Release images and
    // pending work, but retain listeners so the same controls work after return.
    if (event.persisted) resetTemporaryState();
    else cleanup();
  });
  return cleanup;
}

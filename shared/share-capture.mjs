function cancelled() {
  const error = new Error('Sharing cancelled');
  error.name = 'AbortError';
  return error;
}

function checkSignal(signal) {
  if (signal?.aborted) throw cancelled();
}

function needsTab(message) {
  const error = new Error(message);
  error.code = 'tab-capture-required';
  return error;
}

function withinTime(promise, milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const finish = (handler, value) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      handler(value);
    };
    const abort = () => finish(reject, cancelled());
    const timer = setTimeout(() => finish(reject, needsTab('Capture timed out')), milliseconds);
    signal?.addEventListener('abort', abort, {once:true});
    Promise.resolve(promise).then(value => finish(resolve, value), error => finish(reject, error));
    if (signal?.aborted) abort();
  });
}

function visible(window, element) {
  if (element.closest('ai-demo-github,[data-ai-demo-utility]')) return false;
  const style = window.getComputedStyle(element);
  const box = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
    && box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0
    && box.left < window.innerWidth && box.top < window.innerHeight;
}

function inFrame(window, action, signal) {
  return new Promise((resolve, reject) => {
    let frame;
    const finish = (handler, value) => {
      clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      signal?.removeEventListener('abort', abort);
      handler(value);
    };
    const abort = () => finish(reject, cancelled());
    const timer = setTimeout(() => finish(reject, needsTab('No animation frame available')), 1200);
    signal?.addEventListener('abort', abort, {once:true});
    frame = window.requestAnimationFrame(() => {
      try { checkSignal(signal); finish(resolve, action()); }
      catch (error) { finish(reject, error); }
    });
    if (signal?.aborted) abort();
  });
}

function captureSize(width, height) {
  if (![width, height].every(value => Number.isFinite(value) && value > 0)) throw needsTab('No visible capture frame');
  const scale = Math.min(1, 1920 / width, 2880 / height, Math.sqrt(3000000 / (width * height)));
  return {width:Math.max(1, Math.floor(width * scale)), height:Math.max(1, Math.floor(height * scale)), scale};
}

// Runs synchronously inside RAF, while non-preserved WebGL buffers are still readable.
function snapshotCanvases(window, document) {
  const snapshots = [];
  let pixels = 0;
  const canvases = [...document.querySelectorAll('canvas')]
    .filter(canvas => !canvas.closest('ai-demo-github,[data-ai-demo-utility],[data-html2canvas-ignore]'));
  for (const [index, source] of canvases.entries()) {
    if (!visible(window, source)) continue;
    if (snapshots.length >= 16) throw needsTab('Too many visible canvases');
    const size = captureSize(source.width, source.height);
    pixels += size.width * size.height;
    if (pixels > 6000000) throw needsTab('Canvas snapshot exceeds memory limit');
    const stable = document.createElement('canvas');
    stable.width = size.width;
    stable.height = size.height;
    try {
      const context = stable.getContext('2d');
      if (!context) throw needsTab('Canvas is unavailable');
      context.drawImage(source, 0, 0, size.width, size.height);
      const probe = document.createElement('canvas');
      probe.width = probe.height = 32;
      const probeContext = probe.getContext('2d', {willReadFrequently:true});
      probeContext.drawImage(stable, 0, 0, 32, 32);
      const data = probeContext.getImageData(0, 0, 32, 32).data;
      let varied = false, opaque = false;
      for (let pixel = 0; pixel < data.length; pixel += 4) {
        opaque ||= data[pixel + 3] > 0;
        varied ||= Math.abs(data[pixel] - data[0]) > 2 || Math.abs(data[pixel + 1] - data[1]) > 2
          || Math.abs(data[pixel + 2] - data[2]) > 2 || Math.abs(data[pixel + 3] - data[3]) > 2;
      }
      if (!opaque || !varied) throw needsTab('Canvas pixels are empty or unavailable');
      const computed = window.getComputedStyle(source);
      const styles = Array.from({length:computed.length}, (_, i) => [computed[i], computed.getPropertyValue(computed[i])]);
      snapshots.push({index, dataUrl:stable.toDataURL('image/png'), styles});
    } catch (error) {
      if (error.code === 'tab-capture-required') throw error;
      throw needsTab('Canvas pixels cannot be read safely');
    } finally {
      stable.width = stable.height = 0;
    }
  }
  return snapshots;
}

function assertSafeClone(window, document) {
  // These nodes are rewritten by the DOM renderer, so their canvas mapping and
  // pixels cannot be guaranteed. Offer explicit tab capture instead of a wrong image.
  const nativePrototypes = new Map();
  for (const element of document.querySelectorAll('*')) {
    if (element.closest('ai-demo-github,[data-ai-demo-utility],[data-html2canvas-ignore]')) continue;
    // Closed roots are deliberately unobservable. Treat custom elements as
    // unverified even when shadowRoot is null; a clone can silently omit them.
    let custom = false;
    if (element.namespaceURI === 'http://www.w3.org/1999/xhtml') {
      const name = element.localName;
      custom = name.includes('-') || element.hasAttribute('is');
      if (!custom) {
        // createElement(name, {is}) can store its custom type internally without
        // an is attribute. A detached plain built-in supplies the native prototype
        // without invoking that custom constructor or modifying the live scene.
        if (!nativePrototypes.has(name)) nativePrototypes.set(name, Object.getPrototypeOf(document.createElement(name)));
        custom = Object.getPrototypeOf(element) !== nativePrototypes.get(name);
      }
    }
    if (element.shadowRoot || custom) throw needsTab('Shadow or custom content requires current-tab capture');
  }
  for (const video of document.querySelectorAll('video')) {
    if (visible(window, video)) throw needsTab('Video content requires current-tab capture');
  }
  // html2canvas allocates full-size canvas copies BEFORE onclone. Budget the
  // originals too, including hidden canvases, rather than only our scaled images.
  let clonePixels = 0;
  for (const canvas of document.querySelectorAll('canvas')) {
    if (canvas.closest('ai-demo-github,[data-ai-demo-utility],[data-html2canvas-ignore]')) continue;
    clonePixels += canvas.width * canvas.height;
    if (canvas.width > 4096 || canvas.height > 4096 || clonePixels > 6000000) {
      throw needsTab('Original canvas dimensions exceed the capture memory limit');
    }
  }
  for (const frame of document.querySelectorAll('iframe')) {
    if (!visible(window, frame)) continue;
    // Even same-origin embedded renderers may contain non-preserved WebGL buffers.
    throw needsTab('An embedded page requires current-tab capture');
  }
}

/** No scene mutation: stable canvas images are inserted only into html2canvas's clone. */
export async function captureViewport({window, document, html2canvas, signal}) {
  checkSignal(signal);
  assertSafeClone(window, document);
  let snapshots;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { snapshots = await inFrame(window, () => snapshotCanvases(window, document), signal); break; }
    catch (error) { if (error.name === 'AbortError' || attempt === 2) throw error; }
  }
  checkSignal(signal);
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = document.documentElement.clientHeight || window.innerHeight;
  const size = captureSize(width, height);
  const previous = new Set(document.querySelectorAll('iframe.html2canvas-container'));
  let owned = [], finished = false;
  try {
    // RAF and application microtasks may resize/insert media. Revalidate in the
    // same synchronous segment as the library's original-size clone allocation.
    assertSafeClone(window, document);
    const work = html2canvas(document.documentElement, {
      width, height, x:window.scrollX, y:window.scrollY, scrollX:window.scrollX, scrollY:window.scrollY,
      windowWidth:width, windowHeight:height, scale:size.scale,
      useCORS:true, allowTaint:false, backgroundColor:null, logging:false, imageTimeout:8000,
      removeContainer:true,
      ignoreElements: element => ['AI-DEMO-GITHUB','IFRAME','VIDEO'].includes(element.tagName) || element.hasAttribute('data-ai-demo-utility'),
      onclone(clonedDocument) {
        checkSignal(signal);
        if (finished) throw cancelled();
        const clones = [...clonedDocument.querySelectorAll('canvas')];
        for (const snapshot of snapshots) {
          const clone = clones[snapshot.index];
          if (!clone) throw needsTab('Canvas layout changed during capture');
          const image = clonedDocument.createElement('img');
          for (const {name,value} of clone.attributes) image.setAttribute(name, value);
          for (const [name,value] of snapshot.styles) image.style.setProperty(name, value);
          image.src = snapshot.dataUrl;
          clone.replaceWith(image);
        }
      },
    });
    // The library appends its container synchronously before its first await.
    // Track this call's frames, never remove existing captures owned by the app.
    owned = [...document.querySelectorAll('iframe.html2canvas-container')].filter(frame => !previous.has(frame));
    const canvas = await withinTime(work, 20000, signal);
    checkSignal(signal);
    return canvas;
  } finally {
    finished = true;
    for (const frame of owned) frame.remove();
    snapshots.length = 0;
  }
}

/** Call only from the explicitly labelled current-tab capture button. */
export async function captureCurrentTab({window, document, signal}) {
  checkSignal(signal);
  if (!window.navigator.mediaDevices?.getDisplayMedia) throw needsTab('Tab capture is unavailable in this browser');
  // This call occurs before the first await, retaining the user's click activation.
  const stream = await window.navigator.mediaDevices.getDisplayMedia({
    video:{displaySurface:'browser'}, audio:false, preferCurrentTab:true,
    selfBrowserSurface:'include', surfaceSwitching:'exclude',
  });
  let video, frameCallback;
  try {
    checkSignal(signal);
    const track = stream.getVideoTracks()[0];
    const surface = track?.getSettings?.().displaySurface;
    if (!track || surface !== 'browser') throw needsTab('Please select the current browser tab, not a window or screen');
    video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await withinTime(video.play(), 8000, signal);
    if (video.requestVideoFrameCallback) {
      await withinTime(new Promise(resolve => {frameCallback = video.requestVideoFrameCallback(resolve);}), 8000, signal);
    }
    checkSignal(signal);
    const size = captureSize(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw needsTab('Canvas is unavailable');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    for (const track of stream.getTracks()) track.stop();
    if (video) {
      if (frameCallback !== undefined) video.cancelVideoFrameCallback?.(frameCallback);
      video.pause();
      video.srcObject = null;
      video.remove();
    }
  }
}

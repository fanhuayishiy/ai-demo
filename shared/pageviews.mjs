const pageviewRequests = new WeakMap();
const pageviewMessageType = 'ai-demo-pageviews';
const pageviewProvider = 'https://busuanzi.ibruce.info/busuanzi';

/** Only public, parameter-free production previews may disclose their referrer. */
export function shouldCount(url, navigator = {}) {
  if (navigator?.doNotTrack === '1' || navigator?.msDoNotTrack === '1' || navigator?.globalPrivacyControl === true) return false;
  let target;
  try { target = new URL(String(url)); }
  catch { return false; }
  const prefix = '/ai-demo/';
  const page = target.pathname.slice(prefix.length);
  return target.protocol === 'https:' && target.hostname === 'fanhuayishiy.github.io'
    && target.port === '' && target.username === '' && target.password === ''
    && target.pathname.startsWith(prefix) && /[^/]/u.test(page) && page !== 'index.html'
    // URL.search is empty for a bare "?" too; inspect the pre-fragment URL.
    && !target.href.split('#', 1)[0].includes('?');
}

/**
 * One request per Document, with independent subscribers. A completed count or
 * unavailable result is reused synchronously by later subscribers. Cleanup is
 * silent and idempotent, including cancellation before callback delivery;
 * cancelling the last subscriber aborts the request and
 * permanently marks this Document unavailable, rather than counting it again.
 * State and tokens live only in memory and disappear with the Document.
 */
export function startPageviews({ window, document, onCount = () => {}, onUnavailable = () => {}, timeoutMs = 8000 }) {
  const subscriber = { onCount, onUnavailable, active: true };

  function notify(listener, status, count) {
    if (!listener.active) return;
    listener.active = false;
    try {
      if (status === 'count') listener.onCount(count);
      else listener.onUnavailable();
    } catch (error) {
      // A consumer failure must not strand another subscriber or change an
      // already-settled result. Surface it through normal browser diagnostics.
      if (typeof window.reportError === 'function') window.reportError(error);
      else window.console?.error?.(error);
    }
  }

  let request = pageviewRequests.get(document);
  if (request && request.status !== 'pending') {
    notify(subscriber, request.status, request.count);
    return () => {};
  }
  if (request) {
    request.subscribers.add(subscriber);
    return unsubscribe;
  }

  request = { status: 'pending', subscribers: new Set([subscriber]), stop: () => {} };
  pageviewRequests.set(document, request);
  let iframe;
  let timer;
  let receive;
  const fail = () => finish('unavailable');

  request.stop = () => {
    if (receive) {
      window.removeEventListener('message', receive);
      receive = undefined;
    }
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    if (iframe) {
      iframe.removeEventListener('error', fail);
      iframe.remove();
      iframe = undefined;
    }
  };

  function unsubscribe() {
    if (!subscriber.active) return;
    subscriber.active = false;
    request.subscribers.delete(subscriber);
    if (request.status === 'pending' && request.subscribers.size === 0) {
      request.status = 'cancelled';
      request.stop();
    }
  }

  function finish(status, count) {
    if (request.status !== 'pending') return;
    request.status = status;
    request.count = count;
    request.stop();
    const subscribers = [...request.subscribers];
    request.subscribers.clear();
    for (const listener of subscribers) notify(listener, status, count);
  }

  if (window.doNotTrack === '1' || !shouldCount(window.location.href, window.navigator)) {
    fail();
    return unsubscribe;
  }

  try {
    const random = window.crypto.getRandomValues(new Uint32Array(4));
    const token = Array.from(random, (word) => word.toString(16).padStart(8, '0')).join('');
    const callback = `__aiDemoPageviews_${token}`;
    iframe = document.createElement('iframe');
    iframe.hidden = true;
    iframe.style.cssText = 'display:none!important;width:0!important;height:0!important;border:0!important;position:fixed!important;pointer-events:none!important;';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('data-ai-demo-utility', '');
    iframe.tabIndex = -1;
    iframe.title = 'Pageview counter';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    // The provider runs only in this opaque-origin child. The weaker referrer
    // policy requests the public path required by Busuanzi, subject to browser
    // sandbox/referrer behavior. shouldCount excludes queries, while browsers
    // always strip fragments.
    iframe.srcdoc = `<!doctype html><html><head><meta name="referrer" content="no-referrer-when-downgrade"><script>
(() => {
  const token = ${JSON.stringify(token)};
  const callback = ${JSON.stringify(callback)};
  const send = (payload) => parent.postMessage({ type: ${JSON.stringify(pageviewMessageType)}, token, ...payload }, '*');
  window[callback] = (data) => {
    if (data && Number.isSafeInteger(data.page_pv) && data.page_pv >= 0) send({ page_pv: data.page_pv });
    else send({ unavailable: true });
  };
  const script = document.createElement('script');
  script.src = ${JSON.stringify(pageviewProvider)} + '?jsonpCallback=' + callback;
  script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  script.onerror = () => send({ unavailable: true });
  document.head.appendChild(script);
})();
<\/script></head><body></body></html>`;
    receive = (event) => {
      if (request.status !== 'pending' || !iframe || event.source !== iframe.contentWindow || event.origin !== 'null') return;
      const data = event.data;
      if (!data || typeof data !== 'object' || data.type !== pageviewMessageType || data.token !== token) return;
      if (data.unavailable === true) fail();
      else if (Number.isSafeInteger(data.page_pv) && data.page_pv >= 0) finish('count', data.page_pv);
    };
    window.addEventListener('message', receive);
    iframe.addEventListener('error', fail);
    const delay = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? Math.min(timeoutMs, 2147483647) : 8000;
    timer = window.setTimeout(fail, delay);
    (document.body ?? document.documentElement).appendChild(iframe);
  } catch {
    fail();
  }
  return unsubscribe;
}

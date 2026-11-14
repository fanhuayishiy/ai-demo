const pageviewRequests = new WeakMap();
const sitePageviewRequests = new WeakMap();
const pageviewProvider = 'https://busuanzi.ibruce.info/busuanzi';

/** Only public, parameter-free production pages may disclose their referrer. */
export function shouldCount(url, navigator = {}) {
  if (navigator?.doNotTrack === '1' || navigator?.msDoNotTrack === '1' || navigator?.globalPrivacyControl === true) return false;
  let target;
  try { target = new URL(String(url)); }
  catch { return false; }
  const rootPath = target.pathname === '/ai-demo' || target.pathname === '/ai-demo/';
  const childPath = target.pathname.startsWith('/ai-demo/')
    && /[^/]/u.test(target.pathname.slice('/ai-demo/'.length));
  return target.protocol === 'https:' && target.hostname === 'fanhuayishiy.github.io'
    && target.port === '' && target.username === '' && target.password === ''
    && (rootPath || childPath)
    // URL.search is empty for a bare "?" too; inspect the pre-fragment URL.
    && !target.href.split('#', 1)[0].includes('?');
}

/**
 * One request per Document, with independent subscribers. A completed count or
 * unavailable result is reused synchronously by later subscribers. Cleanup is
 * silent and idempotent, including cancellation before callback delivery;
 * cancelling the last subscriber aborts the request and permanently marks this
 * Document unavailable, rather than counting it again.
 *
 * Busuanzi only records the page path when the top-level HTTPS document sends
 * the full Referer. A normal cross-origin script request sends only the origin,
 * so this integration sets no-referrer-when-downgrade on this one script.
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
  let callbackName;
  let script;
  let timer;

  function removeRequestResources() {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    if (script) {
      script.removeEventListener('error', fail);
      script.remove();
      script = undefined;
    }
    if (callbackName) {
      try { delete window[callbackName]; }
      catch { window[callbackName] = undefined; }
      callbackName = undefined;
    }
  }

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

  function fail() {
    finish('unavailable');
  }

  request.stop = removeRequestResources;

  if (window.doNotTrack === '1' || !shouldCount(window.location.href, window.navigator)) {
    fail();
    return unsubscribe;
  }

  try {
    const random = window.crypto.getRandomValues(new Uint32Array(4));
    const token = Array.from(random, (word) => word.toString(16).padStart(8, '0')).join('');
    callbackName = `__aiDemoPageviews_${token}`;
    window[callbackName] = (data) => {
      if (request.status !== 'pending') return;
      if (data && Number.isSafeInteger(data.page_pv) && data.page_pv >= 0) finish('count', data.page_pv);
      else fail();
    };

    script = document.createElement('script');
    script.async = true;
    script.dataset.aiDemoPageviews = '';
    script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.src = `${pageviewProvider}?jsonpCallback=${encodeURIComponent(callbackName)}`;
    script.addEventListener('error', fail);
    const delay = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? Math.min(timeoutMs, 2147483647) : 8000;
    timer = window.setTimeout(fail, delay);
    (document.head ?? document.body ?? document.documentElement).appendChild(script);
  } catch {
    fail();
  }
  return unsubscribe;
}

/**
 * Read the provider's site-wide PV/UV for the dedicated statistics page.
 * Busuanzi identifies the site from the public Referer and returns the same
 * aggregate from every page under this repository.
 */
export function startSitePageviews({ window, document, onStats = () => {}, onUnavailable = () => {}, timeoutMs = 8000 }) {
  const subscriber = { onStats, onUnavailable, active: true };

  function notify(listener, status, stats) {
    if (!listener.active) return;
    listener.active = false;
    try {
      if (status === 'stats') listener.onStats(stats);
      else listener.onUnavailable();
    } catch (error) {
      if (typeof window.reportError === 'function') window.reportError(error);
      else window.console?.error?.(error);
    }
  }

  let request = sitePageviewRequests.get(document);
  if (request && request.status !== 'pending') {
    notify(subscriber, request.status, request.stats);
    return () => {};
  }
  if (request) {
    request.subscribers.add(subscriber);
    return unsubscribe;
  }

  request = { status: 'pending', subscribers: new Set([subscriber]), stop: () => {} };
  sitePageviewRequests.set(document, request);
  let callbackName;
  let script;
  let timer;

  function removeRequestResources() {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    if (script) {
      script.removeEventListener('error', fail);
      script.remove();
      script = undefined;
    }
    if (callbackName) {
      try { delete window[callbackName]; }
      catch { window[callbackName] = undefined; }
      callbackName = undefined;
    }
  }

  function unsubscribe() {
    if (!subscriber.active) return;
    subscriber.active = false;
    request.subscribers.delete(subscriber);
    if (request.status === 'pending' && request.subscribers.size === 0) {
      request.status = 'cancelled';
      request.stop();
    }
  }

  function finish(status, stats) {
    if (request.status !== 'pending') return;
    request.status = status;
    request.stats = stats;
    request.stop();
    const subscribers = [...request.subscribers];
    request.subscribers.clear();
    for (const listener of subscribers) notify(listener, status, stats);
  }

  function fail() {
    finish('unavailable');
  }

  request.stop = removeRequestResources;

  if (window.doNotTrack === '1' || !shouldCount(window.location.href, window.navigator)) {
    fail();
    return unsubscribe;
  }

  try {
    const random = window.crypto.getRandomValues(new Uint32Array(4));
    const token = Array.from(random, (word) => word.toString(16).padStart(8, '0')).join('');
    callbackName = `__aiDemoSitePageviews_${token}`;
    window[callbackName] = (data) => {
      if (request.status !== 'pending') return;
      if (data && Number.isSafeInteger(data.site_pv) && data.site_pv >= 0) {
        const siteUv = Number.isSafeInteger(data.site_uv) && data.site_uv >= 0 ? data.site_uv : null;
        finish('stats', { sitePv: data.site_pv, siteUv });
      } else {
        fail();
      }
    };

    script = document.createElement('script');
    script.async = true;
    script.dataset.aiDemoSitePageviews = '';
    script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.src = `${pageviewProvider}?jsonpCallback=${encodeURIComponent(callbackName)}`;
    script.addEventListener('error', fail);
    const delay = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? Math.min(timeoutMs, 2147483647) : 8000;
    timer = window.setTimeout(fail, delay);
    (document.head ?? document.body ?? document.documentElement).appendChild(script);
  } catch {
    fail();
  }
  return unsubscribe;
}

import { startSitePageviews } from '../shared/pageviews.mjs';

const numberFormat = new Intl.NumberFormat('zh-CN');

function blockedMessage(window) {
  const navigator = window.navigator;
  if (window.doNotTrack === '1' || navigator?.doNotTrack === '1' || navigator?.msDoNotTrack === '1' || navigator?.globalPrivacyControl === true) {
    return '浏览器隐私设置已关闭统计请求。';
  }
  let url;
  try { url = new URL(window.location.href); }
  catch { return '当前地址无法读取统计。'; }
  if (url.protocol !== 'https:' || url.hostname !== 'fanhuayishiy.github.io' || !url.pathname.startsWith('/ai-demo/')) {
    return '本地预览或非正式域名不会读取线上统计。';
  }
  // Inspect the pre-fragment URL because URL.search is empty for a bare "?".
  if (url.href.split('#', 1)[0].includes('?')) return '带查询参数的地址不会请求统计。';
  return '';
}

function showUnavailable(document, message, retry = false) {
  const status = document.querySelector('#aggregate-status');
  const button = document.querySelector('#aggregate-retry');
  const service = document.querySelector('#service');
  const serviceLabel = document.querySelector('#service-label');
  if (status) {
    status.dataset.state = 'error';
    status.firstChild.textContent = message;
  }
  if (button) button.hidden = !retry;
  if (service) service.dataset.state = 'error';
  if (serviceLabel) serviceLabel.textContent = 'COUNTER UNAVAILABLE';
}

function showStats(document, { sitePv, siteUv }) {
  const count = document.querySelector('#aggregate-count');
  const uv = document.querySelector('#aggregate-uv');
  const status = document.querySelector('#aggregate-status');
  const button = document.querySelector('#aggregate-retry');
  const service = document.querySelector('#service');
  const serviceLabel = document.querySelector('#service-label');
  if (count) {
    count.textContent = numberFormat.format(sitePv);
    count.classList.add('is-ready');
  }
  if (uv) uv.textContent = siteUv === null ? '未提供' : numberFormat.format(siteUv);
  if (status) {
    status.dataset.state = 'live';
    status.firstChild.textContent = '合计数据已更新。';
  }
  if (button) button.hidden = true;
  if (service) service.dataset.state = 'live';
  if (serviceLabel) serviceLabel.textContent = 'LIVE · BUSUANZI';
}

/** Keep the visible project count aligned with the current homepage cards. */
export async function syncProjectCount({ window, document, fetchPage = window.fetch?.bind(window) }) {
  if (typeof fetchPage !== 'function') return;
  try {
    const response = await fetchPage(new URL('../', window.location.href), { cache: 'no-store' });
    if (!response.ok) return;
    const page = new window.DOMParser().parseFromString(await response.text(), 'text/html');
    const count = page.querySelectorAll('a[class~="badge"][class~="cover"]').length;
    if (count < 1) return;
    const projectMetric = document.querySelector('#aggregate-projects');
    const dialCount = document.querySelector('#dial-count');
    const dial = document.querySelector('#project-dial');
    if (projectMetric) projectMetric.textContent = numberFormat.format(count);
    if (dialCount) dialCount.textContent = numberFormat.format(count);
    if (dial) dial.setAttribute('aria-label', `${count} 个项目入口汇入一个全站总量`);
  } catch {
    // The static fallback remains usable if the homepage fetch is unavailable.
  }
}

/** Wire the statistics page; injectable for deterministic DOM tests. */
export function connectStatsPage({ window, document, start = startSitePageviews, fetchPage }) {
  syncProjectCount({ window, document, fetchPage });
  const blocked = blockedMessage(window);
  if (blocked) {
    showUnavailable(document, blocked);
    return () => {};
  }

  const retry = document.querySelector('#aggregate-retry');
  const reload = () => window.location.reload();
  retry?.addEventListener('click', reload);
  const cleanup = start({
    window,
    document,
    onStats: stats => showStats(document, stats),
    onUnavailable: () => showUnavailable(document, '统计服务暂时不可用，请稍后重试。', true),
  });
  return () => {
    retry?.removeEventListener('click', reload);
    cleanup?.();
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  connectStatsPage({ window, document });
}

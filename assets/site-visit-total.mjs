const formatter = new Intl.NumberFormat('zh-CN');

export function renderSiteVisitTotal({ document, stats }) {
  if (!stats || !Number.isSafeInteger(stats.sitePv) || stats.sitePv < 0) return false;
  const value = document.querySelector('#site-visit-total');
  const link = document.querySelector('#site-visit-link');
  if (!value) return false;
  value.textContent = formatter.format(stats.sitePv);
  value.dataset.state = 'live';
  link?.setAttribute('aria-label', `项目统计：全站累计访问 ${formatter.format(stats.sitePv)} 次`);
  return true;
}

export function connectSiteVisitTotal({ window, document }) {
  renderSiteVisitTotal({ document, stats: window.__aiDemoSiteViews });
  const receive = event => renderSiteVisitTotal({ document, stats: event.detail });
  window.addEventListener('ai-demo-site-pageviews', receive);
  return () => window.removeEventListener('ai-demo-site-pageviews', receive);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  connectSiteVisitTotal({ window, document });
}

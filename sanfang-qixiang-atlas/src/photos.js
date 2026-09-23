const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset = path => `${import.meta.env.BASE_URL}${path}`;
let photos = {};
export async function loadPhotos() {
  try {
    const response = await fetch(asset('data/photos.json'));
    if (!response.ok) throw new Error('照片索引未能载入');
    photos = await response.json();
  } catch (error) { console.warn(error); }
}
export function photoMarkup(id) {
  const p = photos[id];
  if (!p) return '<p class="photo-unavailable">此景点的实景照片暂未收录</p>';
  return `<figure class="place-photo"><button class="photo-preview" data-photo="${escape(id)}" aria-label="放大查看${escape(p.caption)}"><img src="${escape(asset(p.src))}" alt="${escape(p.caption)}" loading="eager" decoding="async"><span>实景照片 · 点击放大 ↗</span></button><figcaption>${escape(p.caption)}<small>摄影：${escape(p.author)} · <a href="${escape(p.source)}" target="_blank" rel="noopener noreferrer">${escape(p.license)} / 来源</a></small></figcaption></figure>`;
}

const viewer = document.createElement('dialog');
viewer.id = 'photo-viewer';
viewer.setAttribute('aria-labelledby', 'photo-title');
viewer.innerHTML = `<header class="photo-toolbar"><div><h2 id="photo-title"></h2><span id="photo-credit"></span></div><div class="photo-actions"><button type="button" data-zoom="out" aria-label="缩小照片">−</button><button type="button" data-zoom="reset" aria-label="重置照片缩放">100%</button><button type="button" data-zoom="in" aria-label="放大照片">＋</button><button type="button" data-photo-close aria-label="关闭实景照片">×</button></div></header><div class="photo-viewport"><img alt="" draggable="false"><p class="photo-error" hidden>照片加载失败，请关闭后重试，或打开来源查看。</p></div><footer class="photo-viewer-footer">滚轮缩放 · 放大后拖动查看 · Esc 关闭<a id="photo-source" target="_blank" rel="noopener noreferrer">查看照片来源 ↗</a></footer>`;
document.body.append(viewer);
const viewport = viewer.querySelector('.photo-viewport'), image = viewport.querySelector('img');
let scale = 1, x = 0, y = 0, drag = null;
const apply = () => {
  const boundX = Math.max(0, (image.clientWidth * scale - viewport.clientWidth) / 2);
  const boundY = Math.max(0, (image.clientHeight * scale - viewport.clientHeight) / 2);
  x = Math.max(-boundX, Math.min(boundX, x));
  y = Math.max(-boundY, Math.min(boundY, y));
  image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  viewport.classList.toggle('zoomed', scale > 1);
  viewer.querySelector('[data-zoom="reset"]').textContent = `${Math.round(scale * 100)}%`;
};
function zoom(value) { scale = Math.max(1, Math.min(4, value)); apply(); }
function open(id) {
  const p = photos[id];
  if (!p) return;
  scale = 1; x = y = 0;
  image.hidden = false;
  viewer.querySelector('.photo-error').hidden = true;
  image.alt = p.caption;
  image.src = asset(p.src);
  viewer.querySelector('#photo-title').textContent = p.caption;
  viewer.querySelector('#photo-credit').textContent = `摄影：${p.author} · ${p.license}`;
  viewer.querySelector('#photo-source').href = p.source;
  viewer.showModal();
  apply();
}
document.addEventListener('click', e => {
  const preview = e.target.closest('[data-photo]');
  if (preview) open(preview.dataset.photo);
});
// Capture image failures without inserting executable inline HTML handlers.
document.addEventListener('error', e => {
  if (!e.target.matches?.('.photo-preview img')) return;
  const button = e.target.closest('button');
  button.disabled = true;
  e.target.hidden = true;
  button.querySelector('span').textContent = '照片暂时无法加载';
}, true);
image.addEventListener('load', apply);
image.addEventListener('error', () => { image.hidden = true; viewer.querySelector('.photo-error').hidden = false; });
viewer.addEventListener('click', e => {
  if (e.target === viewer || e.target.closest('[data-photo-close]')) viewer.close();
  const action = e.target.closest('[data-zoom]')?.dataset.zoom;
  if (action) zoom(action === 'reset' ? 1 : scale * (action === 'in' ? 1.3 : 1 / 1.3));
});
viewport.addEventListener('wheel', e => { e.preventDefault(); zoom(scale * Math.exp(-e.deltaY * .002)); }, { passive: false });
viewport.addEventListener('pointerdown', e => {
  if (scale <= 1 || e.button !== 0) return;
  drag = { x: e.clientX - x, y: e.clientY - y };
  viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener('pointermove', e => { if (drag) { x = e.clientX - drag.x; y = e.clientY - drag.y; apply(); } });
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) viewport.addEventListener(event, () => { drag = null; });
viewer.addEventListener('close', () => { drag = null; zoom(1); });
viewer.addEventListener('keydown', e => {
  if (e.key === '+' || e.key === '=') zoom(scale * 1.3);
  if (e.key === '-') zoom(scale / 1.3);
  // Let the dialog handle Escape without closing the underlying place details.
  e.stopPropagation();
});
window.addEventListener('resize', apply);

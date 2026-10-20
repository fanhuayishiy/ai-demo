(() => {
  const grid = document.querySelector('.grid');
  if (!grid) return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const hover = document.createElement('div');
  hover.className = 'shot-hover';
  hover.hidden = true;
  hover.setAttribute('aria-hidden', 'true');
  hover.innerHTML = '<img alt=""><div class="shot-hover-title"></div>';
  document.body.append(hover);

  const dialog = document.createElement('dialog');
  dialog.className = 'shot-dialog';
  dialog.setAttribute('aria-labelledby', 'shot-dialog-title');
  dialog.innerHTML = '<button class="shot-close" type="button" aria-label="关闭图片预览">×</button>' +
    '<img class="shot-dialog-image" alt=""><div class="shot-dialog-footer">' +
    '<h2 id="shot-dialog-title"></h2><a class="shot-project-link">进入项目 →</a></div>';
  document.body.append(dialog);
  let timer, pendingImage, activeImage, opener;
  const hideHover = () => {
    clearTimeout(timer);
    pendingImage = activeImage = null;
    hover.hidden = true;
  };
  const titleOf = image => image.closest('.card').querySelector('h2').textContent;
  const showHover = image => {
    if (!finePointer.matches || dialog.open || !image.isConnected) return;
    const rect = image.getBoundingClientRect();
    if (innerHeight < 120 || innerWidth < 200) return;
    const width = Math.min(640, innerWidth - 32, (innerHeight - 80) * 16 / 9);
    const height = width * 9 / 16 + 48;
    let left = rect.right + 16;
    if (left + width > innerWidth - 16) left = rect.left - width - 16;
    left = Math.max(16, Math.min(left, innerWidth - width - 16));
    const top = Math.max(16, Math.min(rect.top + rect.height / 2 - height / 2, innerHeight - height - 16));
    hover.style.left = `${left}px`;
    hover.style.top = `${top}px`;
    hover.style.width = `${width}px`;
    hover.querySelector('img').src = image.currentSrc || image.src;
    hover.querySelector('.shot-hover-title').textContent = titleOf(image);
    hover.hidden = false;
    activeImage = image;
  };
  const openImage = (image, button) => {
    hideHover();
    opener = button;
    dialog.querySelector('img').src = image.currentSrc || image.src;
    dialog.querySelector('img').alt = image.alt;
    dialog.querySelector('h2').textContent = titleOf(image);
    dialog.querySelector('a').href = image.closest('.card').querySelector('a.badge.cover').href;
    dialog.showModal();
    document.documentElement.classList.add('shot-preview-open');
  };

  for (const image of grid.querySelectorAll('.project-shot')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shot-zoom';
    button.textContent = '放大 ⤢';
    button.setAttribute('aria-label', `放大预览：${titleOf(image)}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => openImage(image, button));
    image.after(button);
  }
  grid.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType === 'touch' || dialog.open) return;
    const image = event.target.closest('.card')?.querySelector('.project-shot');
    const rect = image?.getBoundingClientRect();
    if (!rect || event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) { hideHover(); return; }
    if (activeImage === image || pendingImage === image) return;
    hideHover();
    pendingImage = image;
    timer = setTimeout(() => { pendingImage = null; showHover(image); }, 180);
  });
  grid.addEventListener('pointerleave', hideHover);
  window.addEventListener('scroll', hideHover, { passive: true, capture: true });
  window.addEventListener('resize', hideHover);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideHover(); });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('shot-preview-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
})();

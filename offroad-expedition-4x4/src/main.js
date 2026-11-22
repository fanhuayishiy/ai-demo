import { startPreview } from './preview.js';

const viewport = document.querySelector('[data-viewport]');
const status = viewport.querySelector('[role=status]');

try {
  const preview = startPreview(viewport, () => {
    viewport.dataset.ready = 'true';
    status.hidden = true;
  });
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  for (const button of viewButtons) {
    button.addEventListener('click', () => {
      preview.setView(button.dataset.view);
      for (const other of viewButtons) other.setAttribute('aria-pressed', String(other === button));
    });
  }
  for (const button of document.querySelectorAll('[data-door], [data-lights]')) {
    button.addEventListener('click', () => {
      const pressed = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(pressed));
      if (button.dataset.door) preview.setDoor(button.dataset.door, pressed);
      else preview.setLights(pressed);
    });
  }
  preview.onOrbit(() => {
    for (const button of viewButtons) button.setAttribute('aria-pressed', 'false');
  });
} catch (error) {
  status.textContent = '三维预览无法启动。请确认浏览器支持 WebGL 2 并启用硬件加速。';
  console.error(error);
}

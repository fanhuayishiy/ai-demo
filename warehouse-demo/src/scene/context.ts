export function listenForContext(canvas: HTMLCanvasElement, notify: (lost: boolean) => void) {
  const lost = (event: Event) => { event.preventDefault(); notify(true); };
  const restored = () => notify(false);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  return () => {
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
  };
}

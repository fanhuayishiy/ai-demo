/** A cached page is suspended, not unloaded: retain its GPU/audio resources. */
export function bindSceneLifecycle(target, { suspend, resume, dispose }) {
  let suspended = false;
  let disposed = false;

  const onHide = (event) => {
    if (disposed) return;
    if (event.persisted) {
      suspended = true;
      suspend();
    } else {
      disposed = true;
      dispose();
    }
  };
  const onShow = (event) => {
    if (event.persisted && suspended && !disposed) {
      suspended = false;
      resume();
    }
  };
  target.addEventListener("pagehide", onHide);
  target.addEventListener("pageshow", onShow);
  return () => {
    target.removeEventListener("pagehide", onHide);
    target.removeEventListener("pageshow", onShow);
  };
}

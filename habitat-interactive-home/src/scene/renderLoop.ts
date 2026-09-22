type RenderLoopOptions = {
  maxFps?: number;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
};

/** Render only after invalidation, or while the callback reports an animation. */
export function createRenderLoop(
  render: (time: number, dt: number) => boolean,
  options: RenderLoopOptions = {},
) {
  const maxFps = options.maxFps ?? 30;
  const interval =
    1000 / (Number.isFinite(maxFps) && maxFps > 0 ? maxFps : 30);
  const requestFrame =
    options.requestFrame ?? ((callback) => requestAnimationFrame(callback));
  const cancelFrame = options.cancelFrame ?? ((id) => cancelAnimationFrame(id));
  let pendingFrame: number | null = null;
  let lastRenderTime: number | null = null;
  let active = true;
  let disposed = false;
  let rendering = false;

  function schedule() {
    if (active && !disposed && pendingFrame === null) {
      pendingFrame = requestFrame(frame);
    }
  }

  function frame(time: number) {
    pendingFrame = null;
    if (!active || disposed) return;

    // A small tolerance avoids skipping an extra refresh due to timestamp rounding.
    if (lastRenderTime !== null && time - lastRenderTime < interval - 0.1) {
      schedule();
      return;
    }

    const dt =
      lastRenderTime === null
        ? 1 / 30
        : Math.min((time - lastRenderTime) / 1000, 0.05);
    lastRenderTime = time;
    rendering = true;
    let keepAnimating: boolean;
    try {
      keepAnimating = render(time, dt);
    } finally {
      rendering = false;
    }
    if (keepAnimating) schedule();
  }

  function invalidate() {
    // OrbitControls emits change synchronously from update(). That change is
    // already drawn by this frame; it must not keep an otherwise idle loop alive.
    if (!rendering) schedule();
  }

  function setActive(nextActive: boolean) {
    if (disposed || active === nextActive) return;
    active = nextActive;
    lastRenderTime = null;
    if (active) {
      schedule();
    } else if (pendingFrame !== null) {
      cancelFrame(pendingFrame);
      pendingFrame = null;
    }
  }

  function dispose() {
    disposed = true;
    if (pendingFrame !== null) {
      cancelFrame(pendingFrame);
      pendingFrame = null;
    }
  }

  return { invalidate, setActive, dispose };
}

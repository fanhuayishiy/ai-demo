const DIRECTIONS = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

const MIN_TAP_SECONDS = 0.075;
const MAX_SAMPLE_SECONDS = 0.1;

function ownsKeyboard(target) {
  return Boolean(
    target?.closest?.("input,textarea,select,[contenteditable],dialog[open]"),
  );
}

/** Keep UI axes instantaneous; sample(dt) preserves taps between render frames. */
export function bindPilotInput(
  document,
  window,
  { canControl, onReset, onChange = () => {} },
) {
  const held = new Set();
  const pending = { left: 0, right: 0, down: 0, up: 0 };
  const listeners = [];
  let disposed = false;
  const heldDirections = () => new Set([...held].map((code) => DIRECTIONS[code]));
  const axes = () => {
    const directions = heldDirections();
    return {
      x: Number(directions.has("right")) - Number(directions.has("left")),
      y: Number(directions.has("up")) - Number(directions.has("down")),
    };
  };
  const notify = () => onChange(axes());
  const clear = () => {
    const changed = held.size > 0;
    held.clear();
    for (const direction of Object.keys(pending)) pending[direction] = 0;
    if (changed) notify();
  };
  const sample = (dt) => {
    if (disposed || !canControl() || document.hidden) {
      clear();
      return { x: 0, y: 0 };
    }
    if (!Number.isFinite(dt) || dt <= 0) return axes();
    const seconds = Math.min(dt, MAX_SAMPLE_SECONDS);
    const directions = heldDirections();
    const weights = {};
    for (const direction of Object.keys(pending)) {
      // A fractional last frame preserves the same integrated impulse at every FPS.
      weights[direction] = directions.has(direction)
        ? 1
        : Math.min(pending[direction], seconds) / seconds;
      // Held time counts toward the minimum too: a long hold has no release tail.
      pending[direction] = Math.max(0, pending[direction] - seconds);
    }
    return { x: weights.right - weights.left, y: weights.up - weights.down };
  };
  const on = (target, type, handler) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };
  const yieldsKeyboard = (event) =>
    disposed ||
    !canControl() ||
    document.hidden ||
    ownsKeyboard(event.target) ||
    event.isComposing ||
    event.keyCode === 229;
  on(document, "keydown", (event) => {
    if (yieldsKeyboard(event)) {
      clear();
      return;
    }
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.code === "KeyG") {
      if (!event.repeat) {
        clear();
        onReset();
      }
      return;
    }
    if (!Object.hasOwn(DIRECTIONS, event.code)) return;
    // OS repeat following pause/blur must not resurrect a cancelled press.
    if (event.repeat && !held.has(event.code)) return;
    event.preventDefault();
    if (!held.has(event.code)) {
      const direction = DIRECTIONS[event.code];
      if (!heldDirections().has(direction)) {
        // Saturate, don't queue: aliases and rapid inter-frame taps remain bounded.
        pending[direction] = MIN_TAP_SECONDS;
      }
      held.add(event.code);
      notify();
    }
  });
  on(document, "keyup", (event) => {
    if (yieldsKeyboard(event)) {
      clear();
      return;
    }
    if (held.delete(event.code)) notify();
  });
  on(window, "blur", clear);
  on(window, "pagehide", clear);
  on(document, "visibilitychange", () => {
    if (document.hidden) clear();
  });
  on(document, "focusin", (event) => {
    if (ownsKeyboard(event.target)) clear();
  });
  on(document, "compositionstart", clear);
  return {
    axes,
    sample,
    clear,
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      listeners.forEach((remove) => remove());
    },
  };
}

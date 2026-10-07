import { describe, expect, it, vi } from 'vitest';
import { listenForContext } from './context';
describe('WebGL context lifecycle', () => {
  it('prevents default loss, publishes restore and removes both listeners', () => {
    const canvas = document.createElement('canvas');
    const notify = vi.fn();
    const cleanup = listenForContext(canvas, notify);
    const lost = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(notify).toHaveBeenLastCalledWith(true);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(notify).toHaveBeenLastCalledWith(false);
    cleanup();
    canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(notify).toHaveBeenCalledTimes(2);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBoxResources, retainSceneResources } from './resources';

const cleanups: (() => void)[] = [];
function retain() {
  const cleanup = retainSceneResources();
  cleanups.push(cleanup);
  return cleanup;
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup());
  vi.runAllTimers();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('shared scene box resources', () => {
  it('reuses one unit box geometry and the same material for matching colors', () => {
    retain();
    const blue = getBoxResources('#2861e7');
    const anotherBlue = getBoxResources('#2861e7');
    const white = getBoxResources('#ffffff');
    expect(anotherBlue).toBe(blue);
    expect(white.geometry).toBe(blue.geometry);
    expect(white.material).not.toBe(blue.material);
    expect(blue.geometry.parameters).toMatchObject({ width: 1, height: 1, depth: 1 });
    expect(blue.material.color.getHexString()).toBe('2861e7');
    expect(blue.material.roughness).toBe(.76);
  });

  it('defers disposal until the final scene owner releases its resources', () => {
    const releaseFirst = retain();
    const releaseSecond = retain();
    const blue = getBoxResources('#2861e7');
    const white = getBoxResources('#ffffff');
    const geometryDispose = vi.spyOn(blue.geometry, 'dispose');
    const blueDispose = vi.spyOn(blue.material, 'dispose');
    const whiteDispose = vi.spyOn(white.material, 'dispose');
    releaseFirst();
    vi.runAllTimers();
    expect(geometryDispose).not.toHaveBeenCalled();
    releaseSecond();
    expect(geometryDispose).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(blueDispose).toHaveBeenCalledOnce();
    expect(whiteDispose).toHaveBeenCalledOnce();
  });

  it('cancels pending release when StrictMode immediately mounts another owner', () => {
    const releaseFirst = retain();
    const resources = getBoxResources('#2861e7');
    const geometryDispose = vi.spyOn(resources.geometry, 'dispose');
    const materialDispose = vi.spyOn(resources.material, 'dispose');
    releaseFirst();
    const releaseSecond = retain();
    vi.runAllTimers();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    expect(getBoxResources('#2861e7')).toBe(resources);
    releaseSecond();
    vi.runAllTimers();
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it('clears the registry after real unmount and creates fresh resources on remount', () => {
    const release = retain();
    const old = getBoxResources('#2861e7');
    release();
    vi.runAllTimers();
    retain();
    const current = getBoxResources('#2861e7');
    expect(current.geometry).not.toBe(old.geometry);
    expect(current.material).not.toBe(old.material);
  });

  it('makes each cleanup idempotent without releasing a different scene owner', () => {
    const releaseFirst = retain();
    const releaseSecond = retain();
    const resources = getBoxResources('#2861e7');
    const dispose = vi.spyOn(resources.geometry, 'dispose');
    releaseFirst();
    releaseFirst();
    vi.runAllTimers();
    expect(dispose).not.toHaveBeenCalled();
    releaseSecond();
    releaseSecond();
    vi.runAllTimers();
    expect(dispose).toHaveBeenCalledOnce();
  });
});

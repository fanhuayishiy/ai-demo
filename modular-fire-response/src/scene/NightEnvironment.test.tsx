// @vitest-environment node
import { Scene, Texture, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installNightEnvironment } from "./NightEnvironment";

const resources = vi.hoisted(() => ({ disposeGenerator: vi.fn(), targets: [] as WebGLRenderTarget[], sigmas: [] as number[] }));
vi.mock("three", async original => {
  const actual = await original<typeof import("three")>();
  return { ...actual, PMREMGenerator: class {
    fromScene(_scene: unknown, sigma: number) {
      resources.sigmas.push(sigma);
      const target = new actual.WebGLRenderTarget(16, 16);
      vi.spyOn(target, "dispose");
      resources.targets.push(target);
      return target;
    }
    dispose = resources.disposeGenerator;
  } };
});

function renderer() {
  return { domElement: new EventTarget() } as unknown as WebGLRenderer;
}

beforeEach(() => {
  resources.targets.length = 0;
  resources.sigmas.length = 0;
  resources.disposeGenerator.mockClear();
});

describe("local night reflections", () => {
  it("installs a locally rendered low-intensity environment and restores previous state", () => {
    const scene = new Scene(), previous = new Texture();
    scene.environment = previous;
    scene.environmentIntensity = .8;
    const cleanup = installNightEnvironment(renderer(), scene);
    expect(scene.environment).toBe(resources.targets[0].texture);
    expect(scene.environmentIntensity).toBe(.14);
    cleanup();
    expect(scene.environment).toBe(previous);
    expect(scene.environmentIntensity).toBe(.8);
    expect(resources.targets[0].dispose).toHaveBeenCalledTimes(1);
    expect(resources.disposeGenerator).toHaveBeenCalled();
  });
  it("does not overwrite another environment installed after it", () => {
    const scene = new Scene(), replacement = new Texture();
    const cleanup = installNightEnvironment(renderer(), scene);
    scene.environment = replacement;
    scene.environmentIntensity = .6;
    cleanup();
    expect(scene.environment).toBe(replacement);
    expect(scene.environmentIntensity).toBe(.6);
  });

  it("regenerates the PMREM after context restoration while preserving the current background", () => {
    const gl = renderer(), scene = new Scene(), background = new Texture();
    const cleanup = installNightEnvironment(gl, scene);
    const original = scene.environment;
    scene.background = background;
    scene.environmentIntensity = .37;

    gl.domElement.dispatchEvent(new Event("webglcontextrestored"));

    expect(scene.environment === original).toBe(false);
    expect(resources.targets).toHaveLength(2);
    expect(scene.environment).toBe(resources.targets[1].texture);
    expect(scene.background).toBe(background);
    expect(scene.environmentIntensity).toBe(.37);
    expect(resources.targets[0].dispose).toHaveBeenCalledTimes(1);
    expect(resources.targets[1].dispose).not.toHaveBeenCalled();
    expect(resources.disposeGenerator).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it("removes the restoration listener and releases each successive render target on cleanup", () => {
    const gl = renderer(), scene = new Scene(), previous = new Texture();
    const add = vi.spyOn(gl.domElement, "addEventListener");
    const remove = vi.spyOn(gl.domElement, "removeEventListener");
    scene.environment = previous;
    scene.environmentIntensity = .72;
    const cleanup = installNightEnvironment(gl, scene);
    const listener = add.mock.calls.find(([event]) => event === "webglcontextrestored")?.[1];
    expect(listener).toBeTypeOf("function");
    gl.domElement.dispatchEvent(new Event("webglcontextrestored"));
    gl.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(resources.targets).toHaveLength(3);

    cleanup();

    expect(remove).toHaveBeenCalledWith("webglcontextrestored", listener);
    expect(scene.environment).toBe(previous);
    expect(scene.environmentIntensity).toBe(.72);
    for (const target of resources.targets) expect(target.dispose).toHaveBeenCalledTimes(1);
    gl.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(resources.targets).toHaveLength(3);
    expect(scene.environment).toBe(previous);
  });

  it("does not reclaim another owner's environment when the context is restored", () => {
    const gl = renderer(), scene = new Scene(), replacement = new Texture(), background = new Texture();
    const disposeReplacement = vi.spyOn(replacement, "dispose");
    const cleanup = installNightEnvironment(gl, scene);
    scene.environment = replacement;
    scene.environmentIntensity = .6;
    scene.background = background;

    gl.domElement.dispatchEvent(new Event("webglcontextrestored"));

    expect(resources.targets).toHaveLength(1);
    expect(scene.environment).toBe(replacement);
    expect(scene.environmentIntensity).toBe(.6);
    expect(scene.background).toBe(background);
    cleanup();
    expect(scene.environment).toBe(replacement);
    expect(scene.environmentIntensity).toBe(.6);
    expect(resources.targets[0].dispose).toHaveBeenCalledTimes(1);
    expect(disposeReplacement).not.toHaveBeenCalled();
  });

  it("keeps the PMREM blur inside its sampling budget on installation and recovery", () => {
    const gl = renderer(), scene = new Scene();
    const cleanup = installNightEnvironment(gl, scene);
    expect(resources.sigmas).toEqual([.02]);
    gl.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(resources.sigmas).toEqual([.02, .02]);
    cleanup();
  });
});

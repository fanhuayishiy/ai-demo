import { StrictMode, type ReactElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { DataTexture, ShaderLib } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UrbanSurfaceMaterial, UrbanSurfaceProvider, type UrbanSurfaceMaterialProps } from "./UrbanSurfaceMaterial";
import * as surfaceTextures from "./urbanSurfaceTextures";

const rendering = vi.hoisted(() => ({ gl: { domElement: new EventTarget() } }));
vi.mock("@react-three/fiber", () => ({ useThree: () => rendering }));

type MaterialProps = {
  color: string;
  roughness: number;
  metalness: number;
  emissive: string;
  emissiveIntensity: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  map?: DataTexture;
  roughnessMap?: DataTexture;
  onBeforeCompile: (shader: { vertexShader: string; fragmentShader: string }) => void;
  customProgramCacheKey: () => string;
};
const rendered = new Map<string, ReactElement<MaterialProps>>();
const frames: ReactElement<MaterialProps>[] = [];

function Probe({ id = "material", ...props }: UrbanSurfaceMaterialProps & { id?: string }) {
  const node = UrbanSurfaceMaterial(props) as ReactElement<MaterialProps>;
  rendered.set(id, node);
  frames.push(node);
  return null;
}

afterEach(() => {
  cleanup();
  rendered.clear();
  frames.length = 0;
  vi.restoreAllMocks();
});

describe("urban surface material selection", () => {
  it("preserves the supplied Box material parameters", () => {
    const props = { color: "#30383d", roughness: .93, metalness: 0, emissive: "#20303c", emissiveIntensity: .06 };
    render(<UrbanSurfaceProvider><Probe surface="asphalt" {...props} /></UrbanSurfaceProvider>);
    expect(rendered.get("material")!.props).toMatchObject(props);
  });

  it("retains the existing default Box finish and opt-in emission", () => {
    render(<Probe surface="concrete" />);
    expect(rendered.get("material")!.props).toMatchObject({
      color: "#edf2f3", roughness: .65, metalness: .04, emissive: "#000000", emissiveIntensity: 0,
    });
  });

  it("adds only a restrained rough clearcoat to the asphalt", () => {
    render(<UrbanSurfaceProvider><Probe surface="asphalt" color="#20272b" roughness={.96} metalness={0} /></UrbanSurfaceProvider>);
    const material = rendered.get("material")!;
    expect(material.type).toBe("meshPhysicalMaterial");
    expect(material.props.clearcoat).toBeGreaterThan(0);
    expect(material.props.clearcoat).toBeLessThanOrEqual(.2);
    expect(material.props.clearcoatRoughness).toBeGreaterThanOrEqual(.35);
    expect(material.props.clearcoatRoughness).toBeLessThanOrEqual(.6);
    expect(material.props.metalness).toBe(0);
  });

  it("keeps concrete nonmetal without the road clearcoat", () => {
    render(<UrbanSurfaceProvider><Probe surface="concrete" color="#4a5357" roughness={.94} metalness={0} /></UrbanSurfaceProvider>);
    const material = rendered.get("material")!;
    expect(material.type).toBe("meshStandardMaterial");
    expect(material.props.metalness).toBe(0);
    expect(material.props.clearcoat).toBeUndefined();
    expect(material.props.map).toBeInstanceOf(DataTexture);
    expect(material.props.roughnessMap).toBeInstanceOf(DataTexture);
  });

  it("shares four textures across every surface and rerender in one City provider", () => {
    const create = vi.spyOn(surfaceTextures, "createUrbanSurfaceTextures");
    const view = render(<UrbanSurfaceProvider>
      <Probe id="road-a" surface="asphalt" /><Probe id="road-b" surface="asphalt" />
      <Probe id="slab-a" surface="concrete" /><Probe id="slab-b" surface="concrete" />
    </UrbanSurfaceProvider>);
    const road = rendered.get("road-a")!.props, slab = rendered.get("slab-a")!.props;
    expect(rendered.get("road-b")!.props.map).toBe(road.map);
    expect(rendered.get("road-b")!.props.roughnessMap).toBe(road.roughnessMap);
    expect(rendered.get("slab-b")!.props.map).toBe(slab.map);
    expect(rendered.get("slab-b")!.props.roughnessMap).toBe(slab.roughnessMap);
    expect(new Set([road.map, road.roughnessMap, slab.map, slab.roughnessMap]).size).toBe(4);
    view.rerender(<UrbanSurfaceProvider><Probe id="road-a" surface="asphalt" color="#242b30" /></UrbanSurfaceProvider>);
    expect(rendered.get("road-a")!.props.map).toBe(road.map);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("changes the material key when shared maps become available so Three compiles their shader defines", () => {
    render(<UrbanSurfaceProvider><Probe surface="asphalt" /></UrbanSurfaceProvider>);
    const plain = frames.find(frame => !frame.props.map)!;
    const textured = frames.find(frame => frame.props.map)!;
    expect(plain).toBeDefined();
    expect(textured).toBeDefined();
    expect(textured.key).not.toBe(plain.key);
  });

  it("projects both maps onto world-aligned box faces without touching lighting or fragment calculations", () => {
    render(<UrbanSurfaceProvider><Probe id="road" surface="asphalt" /><Probe id="slab" surface="concrete" /></UrbanSurfaceProvider>);
    for (const [id, source] of [["road", ShaderLib.physical], ["slab", ShaderLib.standard]] as const) {
      const material = rendered.get(id)!.props;
      const shader = { vertexShader: source.vertexShader, fragmentShader: source.fragmentShader };
      material.onBeforeCompile(shader);
      expect(shader.fragmentShader).toBe(source.fragmentShader);
      expect(shader.vertexShader).toContain("inverseTransformDirection( transformedNormal, viewMatrix )");
      expect(shader.vertexShader).toContain("modelMatrix * vec4( transformed, 1.0 )");
      expect(shader.vertexShader).toContain("#ifdef USE_MAP");
      expect(shader.vertexShader).toContain("vMapUv = ( mapTransform * vec3( urbanUv, 1.0 ) ).xy;");
      expect(shader.vertexShader).toContain("#ifdef USE_ROUGHNESSMAP");
      expect(shader.vertexShader).toContain("vRoughnessMapUv = ( roughnessMapTransform * vec3( urbanUv, 1.0 ) ).xy;");
      expect(shader.vertexShader.indexOf("vec3 urbanWorldPosition")).toBeGreaterThan(shader.vertexShader.indexOf("#include <worldpos_vertex>"));
      expect(material.customProgramCacheKey()).toBe("urban-surface-world-uv-v1");
    }
  });
});

describe("City texture ownership", () => {
  it("reuploads retained CPU textures after context restoration without allocating replacements", () => {
    const create = vi.spyOn(surfaceTextures, "createUrbanSurfaceTextures");
    const view = render(<UrbanSurfaceProvider><Probe surface="asphalt" /></UrbanSurfaceProvider>);
    const map = rendered.get("material")!.props.map!;
    const version = map.version;
    rendering.gl.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(rendered.get("material")!.props.map).toBe(map);
    expect(map.version).toBe(version + 1);
    expect(create).toHaveBeenCalledTimes(1);
    view.unmount();
    const disposedVersion = map.version;
    rendering.gl.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(map.version).toBe(disposedVersion);
  });

  it("disposes all four provider-owned textures once at unmount", () => {
    const dispose = vi.spyOn(DataTexture.prototype, "dispose");
    const view = render(<UrbanSurfaceProvider><Probe surface="asphalt" /><Probe surface="concrete" /></UrbanSurfaceProvider>);
    expect(dispose).not.toHaveBeenCalled();
    view.unmount();
    expect(dispose).toHaveBeenCalledTimes(4);
    expect(new Set(dispose.mock.contexts).size).toBe(4);
  });

  it("cleans up StrictMode effect replay before owning a fresh texture set", () => {
    const create = vi.spyOn(surfaceTextures, "createUrbanSurfaceTextures");
    const dispose = vi.spyOn(DataTexture.prototype, "dispose");
    const add = vi.spyOn(rendering.gl.domElement, "addEventListener");
    const remove = vi.spyOn(rendering.gl.domElement, "removeEventListener");
    const view = render(<StrictMode><UrbanSurfaceProvider><Probe surface="asphalt" /></UrbanSurfaceProvider></StrictMode>);
    expect(create).toHaveBeenCalledTimes(2);
    expect(dispose).toHaveBeenCalledTimes(4);
    expect(new Set(dispose.mock.contexts).size).toBe(4);
    view.unmount();
    expect(dispose).toHaveBeenCalledTimes(8);
    expect(new Set(dispose.mock.contexts).size).toBe(8);
    expect(add.mock.calls.filter(([event]) => event === "webglcontextrestored")).toHaveLength(2);
    expect(remove.mock.calls.filter(([event]) => event === "webglcontextrestored")).toHaveLength(2);
  });
});

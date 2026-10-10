// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { Beam, Box, C, Cylinder } from "./Primitives";
import { UrbanSurfaceMaterial } from "./UrbanSurfaceMaterial";
import { MeshStandardMaterial, type MeshStandardMaterialParameters } from "three";
describe("night equipment materials", () => {
  it("separates flush finishes with unit-only depth bias while retaining physical occlusion", () => {
    const mesh = Box({ depthLayer: 3 }) as ReactElement<{ children: ReactElement<MeshStandardMaterialParameters>[] }>;
    const material = new MeshStandardMaterial(mesh.props.children[1].props);
    expect(material.polygonOffset).toBe(true);
    expect(material.polygonOffsetFactor).toBe(0);
    expect(material.polygonOffsetUnits).toBe(-12);
    expect(material.transparent).toBe(false);
    expect(material.depthTest).toBe(true);
    expect(material.depthWrite).toBe(true);
    material.dispose();
  });
  it("forwards depth priority to textured city surfaces but leaves equipment unbiased", () => {
    const city = Box({ surface: "concrete", depthLayer: 2 }) as ReactElement<{ children: ReactElement[] }>;
    expect(city.props.children[1].props).toMatchObject({ surface: "concrete", depthLayer: 2 });
    const equipment = Box({ color: C.red }) as ReactElement<{ children: ReactElement<MeshStandardMaterialParameters>[] }>;
    const material = new MeshStandardMaterial(equipment.props.children[1].props);
    expect(material.polygonOffset).toBe(false);
    expect(material.polygonOffsetUnits).toBe(0);
    material.dispose();
  });
  it("opts city surfaces into shared texture finishes without changing equipment materials", () => {
    const city = Box({ surface: "asphalt", color: "#20272b", roughness: .96, metalness: 0 }) as ReactElement<{ children: ReactElement[] }>;
    expect(city.props.children[1].type).toBe(UrbanSurfaceMaterial);
    expect(city.props.children[1].props).toMatchObject({ surface: "asphalt", color: "#20272b", roughness: .96, metalness: 0 });
    const equipment = Box({ color: C.red }) as ReactElement<{ children: ReactElement[] }>;
    expect(equipment.props.children[1].type).toBe("meshStandardMaterial");
  });
  it("gives enamel apparatus and cabin glazing controlled highlights", () => {
    const paint = Box({ color: C.red }) as ReactElement<{ children: ReactElement<{ roughness: number; metalness: number }>[] }>;
    const glass = Box({ color: C.glass }) as ReactElement<{ children: ReactElement<{ roughness: number; metalness: number }>[] }>;
    expect(Number(paint.props.children[1].props.roughness)).toBeLessThanOrEqual(.4);
    expect(Number(paint.props.children[1].props.metalness)).toBeGreaterThanOrEqual(.12);
    expect(Number(glass.props.children[1].props.roughness)).toBeLessThan(.25);
  });
  it("retains neutral materials unless emission is requested", () => {
    const mesh = Box({}) as ReactElement<{ children: ReactElement[] }>;
    expect(mesh.props.children[1].props).toMatchObject({
      emissive: "#000000",
      emissiveIntensity: 0,
    });
  });
  it("applies explicit emission on box and cylinder lamps", () => {
    for (const node of [
      Box({ emissive: "#ffc678", emissiveIntensity: 2 }),
      Cylinder({ emissive: "#4bdfe8", emissiveIntensity: 1.5 }),
    ]) {
      const mesh = node as ReactElement<{ children: ReactElement[] }>;
      expect(
        (mesh.props.children[1].props as { emissiveIntensity: number })
          .emissiveIntensity,
      ).toBeGreaterThan(0);
    }
  });
  it("respects independent roughness and metalness for concrete and fixtures", () => {
    const concrete = Box({ roughness: .94, metalness: 0 }) as ReactElement<{ children: ReactElement[] }>;
    const steel = Cylinder({ roughness: .28, metalness: .72 }) as ReactElement<{ children: ReactElement[] }>;
    expect(concrete.props.children[1].props).toMatchObject({ roughness: .94, metalness: 0 });
    expect(steel.props.children[1].props).toMatchObject({ roughness: .28, metalness: .72 });
  });
  it("keeps rubber matte while exposing modest steel highlights", () => {
    const rubber = Cylinder({ color: C.tire }) as ReactElement<{ children: ReactElement[] }>;
    const steel = Beam({ from: [0,0,0], to: [0,1,0] }) as ReactElement<{ children: ReactElement[] }>;
    expect(rubber.props.children[1].props).toMatchObject({ roughness: .95, metalness: 0 });
    expect(steel.props.children[1].props).toMatchObject({ roughness: .44, metalness: .42 });
  });
});

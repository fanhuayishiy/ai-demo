// @vitest-environment node
import { Children, isValidElement, type ReactNode } from "react";
import { AdditiveBlending, Color, NormalBlending } from "three";
import { describe, expect, it, vi } from "vitest";
import { IncidentParticles } from "./IncidentParticles";

vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown) => factory(),
  useRef: () => ({ current: null }),
  useLayoutEffect: vi.fn(),
}));
vi.mock("@react-three/fiber", () => ({ useFrame: vi.fn() }));

type Props = {
  children?: ReactNode;
  kind?: string;
  blending?: number;
  uniforms?: { uCold: { value: Color }; uHot: { value: Color } };
  depthWrite?: boolean;
};
function nodes(node: ReactNode): { type: unknown; props: Props }[] {
  if (!isValidElement<Props>(node)) return [];
  return [{ type: node.type, props: node.props }, ...Children.toArray(node.props.children).flatMap(nodes)];
}
function material(kind: string) {
  const cloud = nodes(IncidentParticles({ time: 65, intensity: .9 }))
    .find(node => node.props.kind === kind)!;
  return nodes((cloud.type as (props: Props) => ReactNode)(cloud.props))
    .find(node => node.type === "shaderMaterial")!.props;
}

describe("readable fire and smoke materials", () => {
  it("keeps overlapping flames warm instead of adding every layer to white", () => {
    const flame = material("flame");
    expect(flame.blending).toBe(NormalBlending);
    expect(flame.uniforms!.uHot.value.b).toBeLessThan(.12);
    expect(flame.uniforms!.uHot.value.r).toBeGreaterThan(.85);
    expect(flame.depthWrite).toBe(false);
    expect(material("ember").blending).toBe(AdditiveBlending);
  });

  it("keeps smoke dark and translucent without obscuring the depth buffer", () => {
    const smoke = material("smoke");
    const cold = smoke.uniforms!.uCold.value;
    expect(Math.max(cold.r, cold.g, cold.b)).toBeLessThan(.1);
    expect(smoke.blending).toBe(NormalBlending);
    expect(smoke.depthWrite).toBe(false);
  });
});

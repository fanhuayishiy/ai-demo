import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, Color, NormalBlending, QuadraticBezierCurve3, ShaderMaterial, Vector3 } from "three";
import type { Vec3 } from "../types";
import { incidentParticle, waterParticle, type IncidentParticleKind, type ParticleSample } from "./particlePaths";

const vertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  attribute float aHeat;
  attribute float aSeed;
  uniform float uViewportHeight;
  varying float vOpacity;
  varying float vHeat;
  varying float vSeed;
  void main() {
    vOpacity = aOpacity;
    vHeat = aHeat;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uViewportHeight * projectionMatrix[1][1] * 0.5, 1.0, 140.0);
  }
`;

const fragmentShader = `
  uniform vec3 uCold;
  uniform vec3 uHot;
  uniform float uSmoke;
  varying float vOpacity;
  varying float vHeat;
  varying float vSeed;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float n = sin(p.x * 8.0 + vSeed * 31.0) * sin(p.y * 7.0 - vSeed * 19.0) * 0.12;
    n += sin(p.x * 17.0 + p.y * 11.0 + vSeed * 13.0) * 0.035;
    float radius = length(p) + n * uSmoke;
    float edge = 1.0 - smoothstep(0.28, 1.0, radius);
    float alpha = edge * edge * vOpacity;
    if (alpha < 0.004) discard;
    vec3 color = mix(uCold, uHot, clamp(vHeat * 0.65 + edge * 0.35, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function ParticleCloud({ kind, count, sample }: {
  kind: IncidentParticleKind | "water";
  count: number;
  sample: (index: number) => ParticleSample;
}) {
  const geometry = useRef<BufferGeometry>(null);
  const material = useRef<ShaderMaterial>(null);
  const buffers = useMemo(() => ({
    position: new Float32Array(count * 3),
    size: new Float32Array(count),
    opacity: new Float32Array(count),
    heat: new Float32Array(count),
    seed: Float32Array.from({ length: count }, (_, index) => (index * .61803398875) % 1),
  }), [count]);
  const uniforms = useMemo(() => ({
    uViewportHeight: { value: 900 },
    uSmoke: { value: kind === "smoke" ? 1 : .15 },
    uCold: { value: new Color(kind === "smoke" ? "#39434b" : kind === "water" ? "#a3cadb" : "#dc3708") },
    uHot: { value: new Color(kind === "smoke" ? "#917159" : kind === "water" ? "#ecfaff" : "#ffbc45") },
  }), [kind]);
  useLayoutEffect(() => {
    for (let index = 0; index < count; index++) {
      const particle = sample(index);
      buffers.position.set(particle.position, index * 3);
      buffers.size[index] = particle.diameter;
      buffers.opacity[index] = particle.opacity;
      buffers.heat[index] = particle.heat;
    }
    if (geometry.current) for (const name of ["position", "aSize", "aOpacity", "aHeat"]) {
      geometry.current.getAttribute(name).needsUpdate = true;
    }
  }, [sample, count, buffers]);
  useFrame(({ size, gl }) => {
    if (material.current) material.current.uniforms.uViewportHeight.value = size.height * gl.getPixelRatio();
  });
  return (
    <points name={`${kind}-particles`} frustumCulled={false}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[buffers.position, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[buffers.size, 1]} />
        <bufferAttribute attach="attributes-aOpacity" args={[buffers.opacity, 1]} />
        <bufferAttribute attach="attributes-aHeat" args={[buffers.heat, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[buffers.seed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={kind === "ember" ? AdditiveBlending : NormalBlending}
      />
    </points>
  );
}

export function IncidentParticles({ name, time, intensity }: { name?: string; time: number; intensity: number }) {
  return (
    <group name={name}>
      <ParticleCloud kind="smoke" count={24} sample={index => incidentParticle("smoke", time, index, intensity)} />
      <ParticleCloud kind="flame" count={32} sample={index => incidentParticle("flame", time, index, intensity)} />
      <ParticleCloud kind="ember" count={14} sample={index => incidentParticle("ember", time, index, intensity)} />
    </group>
  );
}

export function WaterJet({ points, time, radius = .13 }: { points: [Vec3, Vec3, Vec3]; time: number; radius?: number }) {
  const [from, control, to] = points;
  const curve = useMemo(() => new QuadraticBezierCurve3(new Vector3(...from), new Vector3(...control), new Vector3(...to)),
    [from[0], from[1], from[2], control[0], control[1], control[2], to[0], to[1], to[2]]);
  return (
    <group name="water-jet-mist">
      <mesh>
        <tubeGeometry args={[curve, 24, radius * .45, 5, false]} />
        <meshBasicMaterial color="#e3f6ff" transparent opacity={.65} depthWrite={false} />
      </mesh>
      <ParticleCloud kind="water" count={52} sample={index => waterParticle(points, time, index)} />
    </group>
  );
}

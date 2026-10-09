import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { createUrbanSurfaceTextures, disposeUrbanSurfaceTextures, refreshUrbanSurfaceTextures, type UrbanSurface, type UrbanSurfaceTextures } from "./urbanSurfaceTextures";

export type { UrbanSurface } from "./urbanSurfaceTextures";

const SurfaceContext = createContext<UrbanSurfaceTextures | null>(null);

function projectSurfaceUvs(shader: { vertexShader: string }) {
  // World-scale projection keeps box dimensions and station rotations from stretching the grain.
  shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", `
    #include <worldpos_vertex>
    vec3 urbanWorldPosition = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
    vec3 urbanWorldNormal = abs( inverseTransformDirection( transformedNormal, viewMatrix ) );
    vec2 urbanUv = urbanWorldNormal.y >= max( urbanWorldNormal.x, urbanWorldNormal.z )
      ? urbanWorldPosition.xz
      : urbanWorldNormal.x > urbanWorldNormal.z ? urbanWorldPosition.zy : urbanWorldPosition.xy;
    #ifdef USE_MAP
      vMapUv = ( mapTransform * vec3( urbanUv, 1.0 ) ).xy;
    #endif
    #ifdef USE_ROUGHNESSMAP
      vRoughnessMapUv = ( roughnessMapTransform * vec3( urbanUv, 1.0 ) ).xy;
    #endif
  `);
}

const programKey = () => "urban-surface-world-uv-v1";

export type UrbanSurfaceMaterialProps = {
  surface: UrbanSurface;
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

export function UrbanSurfaceProvider({ children }: { children: ReactNode }) {
  const { gl } = useThree();
  const [surfaces, setSurfaces] = useState<UrbanSurfaceTextures | null>(null);
  useEffect(() => {
    // Effect ownership also disposes the first allocation during StrictMode replay.
    const textures = createUrbanSurfaceTextures();
    setSurfaces(textures);
    const restored = () => refreshUrbanSurfaceTextures(textures);
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () => {
      gl.domElement.removeEventListener("webglcontextrestored", restored);
      disposeUrbanSurfaceTextures(textures);
    };
  }, [gl]);
  return <SurfaceContext.Provider value={surfaces}>{children}</SurfaceContext.Provider>;
}

export function UrbanSurfaceMaterial({
  surface,
  color = "#edf2f3",
  roughness = color === "#bbc7cd" ? .4 : color === "#d63d42" ? .36 : color === "#304a58" ? .2 : .65,
  metalness = color === "#bbc7cd" ? .45 : color === "#d63d42" ? .18 : color === "#304a58" ? .24 : .04,
  emissive = "#000000",
  emissiveIntensity = 0,
}: UrbanSurfaceMaterialProps) {
  const textures = useContext(SurfaceContext)?.[surface];
  const props = {
    color, roughness, metalness, emissive, emissiveIntensity,
    map: textures?.map,
    roughnessMap: textures?.roughnessMap,
    onBeforeCompile: projectSurfaceUvs,
    customProgramCacheKey: programKey,
  };
  // Map presence changes shader defines, so replace the initial untextured material.
  const key = `${surface}-${textures ? "textured" : "plain"}`;
  return surface === "asphalt"
    ? <meshPhysicalMaterial key={key} {...props} clearcoat={.18} clearcoatRoughness={.46} />
    : <meshStandardMaterial key={key} {...props} />;
}

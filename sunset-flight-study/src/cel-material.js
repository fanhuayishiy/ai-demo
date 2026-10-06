import * as THREE from 'three';

// Authored colors are sRGB at the API boundary; THREE.Color stores linear values.
// No light uniforms are enabled: bright environment fill cannot erase these bands.
const celVertex = /* glsl */ `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec3 vPaintPosition;
  #include <fog_pars_vertex>
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;
    vPaintPosition = position;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const celFragment = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uLitColor;
  uniform vec3 uShadowColor;
  uniform vec3 uLightDirection;
  uniform float uBrushStrength;
  uniform float uEdgeHighlight;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec3 vPaintPosition;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    vec3 normal = normalize(vViewNormal);
    vec3 lightDirection = normalize((viewMatrix * vec4(uLightDirection, 0.0)).xyz);
    float ndl = dot(normal, lightDirection);
    // Very narrow antialiased transitions retain three intentional painted values.
    float shadowBand = smoothstep(0.10, 0.135, ndl);
    float lightBand = smoothstep(0.59, 0.625, ndl);
    vec3 paint = mix(uShadowColor, uBaseColor, shadowBand);
    paint = mix(paint, uLitColor, lightBand);
    // Broad, object-locked pigment variation: no screen-space grain or swimming noise.
    float pigment = sin(vPaintPosition.x * 1.7 + sin(vPaintPosition.z * 0.83))
      * sin(vPaintPosition.z * 2.1 + vPaintPosition.y * 0.65);
    paint *= 1.0 + pigment * uBrushStrength;
    // A fine sunward edge, not a glossy hotspot covering the curved surfaces.
    float grazing = 1.0 - abs(dot(normal, normalize(vViewPosition)));
    float edge = smoothstep(0.955, 0.995, grazing) * smoothstep(0.25, 0.48, ndl);
    paint = mix(paint, uLitColor * 1.16, edge * uEdgeHighlight);
    gl_FragColor = vec4(paint, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const outlineVertex = /* glsl */ `
  uniform float uThickness;
  #include <fog_pars_vertex>
  void main() {
    // Normal matrix cancels inherited nonuniform scale. Expanding in view space
    // gives every shell the same world-space width, including thin ellipsoids.
    vec3 viewNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    mvPosition.xyz += viewNormal * uThickness;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const outlineFragment = /* glsl */ `
  uniform vec3 uOutlineColor;
  #include <fog_pars_fragment>
  void main() {
    gl_FragColor = vec4(uOutlineColor, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function createCelMaterial({
  base = '#ce362f', lit = '#e64936', shadow = '#73333c',
  lightDirection = [-0.52, 0.76, -0.39], brushStrength = 0.018,
  edgeHighlight = 0.23,
} = {}) {
  const material = new THREE.ShaderMaterial({
    name: 'authored-cel-paint',
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uBaseColor: { value: new THREE.Color(base) },
        uLitColor: { value: new THREE.Color(lit) },
        uShadowColor: { value: new THREE.Color(shadow) },
        uLightDirection: { value: new THREE.Vector3(...lightDirection).normalize() },
        uBrushStrength: { value: brushStrength },
        uEdgeHighlight: { value: edgeHighlight },
      },
    ]),
    vertexShader: celVertex,
    fragmentShader: celFragment,
    lights: false,
    fog: true,
    toneMapped: false,
  });
  material.userData.celPaint = true;
  return material;
}

export function createOutlineMaterial({ color = '#572a34', thickness = 0.022 } = {}) {
  const material = new THREE.ShaderMaterial({
    name: 'colored-silhouette-ink',
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { uOutlineColor: { value: new THREE.Color(color) }, uThickness: { value: thickness } },
    ]),
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
    // Exposed shell pixels must occlude transparent cloud cards drawn afterward.
    // Depth testing still lets the base paint hide the shell's interior faces.
    depthWrite: true,
    fog: true,
    lights: false,
    toneMapped: false,
  });
  material.userData.aircraftOutline = true;
  return material;
}

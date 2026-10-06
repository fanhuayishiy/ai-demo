import * as THREE from "three";

const SAMPLES = 64;
const STREAKS = 22;
const HISTORY = 1.5;
const LOOP_DURATION = 24;

function ribbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(SAMPLES * 6), 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const opacity = new Float32Array(SAMPLES * 2);
  const indices = [];
  for (let i = 0; i < SAMPLES; i++) {
    const alpha = Math.pow(1 - i / (SAMPLES - 1), 1.25) * 0.46;
    opacity[i * 2] = alpha;
    opacity[i * 2 + 1] = alpha;
    if (i < SAMPLES - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  geometry.setAttribute("aOpacity", new THREE.BufferAttribute(opacity, 1));
  geometry.setIndex(indices);
  return geometry;
}

/** Deterministic wing-tip condensation, not targeting or combat projectiles. */
export function createReferenceEffects(
  scene,
  sampleFlight,
  wingTips,
  { quality = "high" } = {},
) {
  const root = new THREE.Group();
  root.name = "reference-airflow";
  const ribbonMaterial = new THREE.ShaderMaterial({
    name: "lavender-vapor-ribbon",
    uniforms: {
      uColor: { value: new THREE.Color("#ead9f7").multiplyScalar(1.15) },
    },
    vertexShader: `
      attribute float aOpacity;
      varying float vOpacity;
      void main() {
        vOpacity = aOpacity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vOpacity;
      void main() {
        gl_FragColor = vec4(uColor, vOpacity);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const ribbons = wingTips.slice(0, 2).map((tip, i) => {
    const mesh = new THREE.Mesh(ribbonGeometry(), ribbonMaterial);
    mesh.name = `wing-ribbon-${i}`;
    mesh.frustumCulled = false;
    root.add(mesh);
    return { mesh, tip: tip.clone() };
  });
  const streakGeometry = new THREE.BufferGeometry();
  streakGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(STREAKS * 6), 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  streakGeometry.setAttribute(
    "aOpacity",
    new THREE.BufferAttribute(new Float32Array(STREAKS * 2), 1).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const streaks = new THREE.LineSegments(
    streakGeometry,
    new THREE.ShaderMaterial({
      name: "warm-peripheral-airflow",
      uniforms: {
        uColor: { value: new THREE.Color("#ffdeb9").multiplyScalar(1.6) },
      },
      vertexShader: ribbonMaterial.vertexShader,
      fragmentShader: ribbonMaterial.fragmentShader,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  streaks.name = "airflow-streaks";
  streaks.frustumCulled = false;
  root.add(streaks);
  scene.add(root);
  let disposed = false;
  const point = new THREE.Vector3();
  const right = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3();
  const setQuality = (next) => {
    if (!disposed)
      streakGeometry.setDrawRange(0, next === "low" ? 20 : STREAKS * 2);
  };
  setQuality(quality);
  return {
    root,
    setQuality,
    update(time) {
      if (disposed || !Number.isFinite(time)) return;
      const poses = Array.from(
        { length: SAMPLES },
        (_, i) => sampleFlight(time - (i / (SAMPLES - 1)) * HISTORY).red,
      );
      for (const { mesh, tip } of ribbons) {
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < SAMPLES; i++) {
          const pose = poses[i];
          const age = i / (SAMPLES - 1);
          const halfWidth = 0.13 + age * 1.7;
          right.set(1, 0, 0).applyQuaternion(pose.quaternion);
          point.copy(tip).applyQuaternion(pose.quaternion).add(pose.position);
          // A faint upward dispersion keeps the oldest vapor from resembling a rigid rail.
          point.y += age * age * 1.4;
          positions.setXYZ(
            i * 2,
            point.x - right.x * halfWidth,
            point.y - right.y * halfWidth,
            point.z - right.z * halfWidth,
          );
          positions.setXYZ(
            i * 2 + 1,
            point.x + right.x * halfWidth,
            point.y + right.y * halfWidth,
            point.z + right.z * halfWidth,
          );
        }
        positions.needsUpdate = true;
      }
      const pose = poses[0];
      right.set(1, 0, 0).applyQuaternion(pose.quaternion);
      forward.set(0, 0, 1).applyQuaternion(pose.quaternion);
      up.set(0, 1, 0).applyQuaternion(pose.quaternion);
      for (let i = 0; i < STREAKS; i++) {
        // Fifteen complete cycles per film: deterministic seeking and no loop pop.
        const age =
          (((time * (15 / LOOP_DURATION) + i * 0.6180339887) % 1) + 1) % 1;
        const opacity =
          0.36 *
          THREE.MathUtils.smoothstep(age, 0, 0.12) *
          (1 - THREE.MathUtils.smoothstep(age, 0.78, 1));
        streakGeometry.attributes.aOpacity.setX(i * 2, opacity);
        streakGeometry.attributes.aOpacity.setX(i * 2 + 1, opacity);
        const side = i % 3 ? 1 : -1;
        point
          .copy(pose.position)
          .addScaledVector(right, side * (16 + ((i * 7) % 19)))
          .addScaledVector(up, -4 + ((i * 11) % 15))
          .addScaledVector(forward, 60 - age * 135);
        streakGeometry.attributes.position.setXYZ(
          i * 2,
          point.x,
          point.y,
          point.z,
        );
        point.addScaledVector(forward, 0.6 + age * age * 6);
        streakGeometry.attributes.position.setXYZ(
          i * 2 + 1,
          point.x,
          point.y,
          point.z,
        );
      }
      streakGeometry.attributes.position.needsUpdate = true;
      streakGeometry.attributes.aOpacity.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ribbons.forEach(({ mesh }) => mesh.geometry.dispose());
      ribbonMaterial.dispose();
      streakGeometry.dispose();
      streaks.material.dispose();
      scene.remove(root);
    },
  };
}

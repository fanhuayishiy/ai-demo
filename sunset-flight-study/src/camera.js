/** Dolly out for narrow viewports without multiplying a low shot's vertical drop. */
export function frameCamera(position, target, aspect) {
  const scale = Math.max(1, 1.35 / Math.max(0.1, aspect));
  const framed = position.clone().sub(target);
  framed.x *= scale;
  framed.z *= scale;
  framed.add(target);
  framed.y = Math.max(6, framed.y);
  return framed;
}

/** Preserve rolled framing while allowing for the reference's off-center subject. */
export function frameReferenceCamera(position, target, aspect) {
  const scale = Math.max(1, 1.3 / Math.max(0.1, aspect));
  return position.clone().sub(target).multiplyScalar(scale).add(target);
}

export function constrainOrbitCamera(camera, target) {
  if (camera.position.y < 6) {
    camera.position.y = 6;
    camera.lookAt(target);
  }
}

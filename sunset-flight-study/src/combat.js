import { Vector3 } from "three";

/** Brief stylized tracer bursts, only when the target lies in the forward cone. */
export function sampleGunfire(time, flight) {
  if (Math.sin(time * 13) < 0.3) return null;
  for (const [shooter, target] of [
    ["blue", "red"],
    ["red", "blue"],
  ]) {
    const pose = flight[shooter];
    const origin = new Vector3(0, 0.55, 5.3)
      .applyQuaternion(pose.quaternion)
      .add(pose.position);
    const direction = flight[target].position.clone().sub(origin);
    const distance = direction.length();
    direction.normalize();
    const forward = new Vector3(0, 0, 1).applyQuaternion(pose.quaternion);
    if (distance > 8 && distance < 80 && forward.dot(direction) > 0.85) {
      return { shooter, origin, direction, distance };
    }
  }
  return null;
}

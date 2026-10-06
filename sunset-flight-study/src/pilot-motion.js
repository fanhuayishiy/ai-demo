import * as THREE from "three";

export const PILOT_CAMERA_FOLLOW = 0.55;
export const PILOT_LIMITS = Object.freeze({ x: 20, y: 12 });

const VELOCITY_RESPONSE = 24;
const ATTITUDE_RESPONSE = 24;
const CAMERA_BLEND_SECONDS = 0.4;
const UP = new THREE.Vector3(0, 1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);

function screenRotation(frame) {
  // Match PerspectiveCamera.lookAt(target), followed by its local rotateZ.
  // A hand-built world-up basis without this roll would reverse controls during
  // the reference route's banked turns.
  return new THREE.Quaternion()
    .setFromRotationMatrix(
      new THREE.Matrix4().lookAt(frame.position, frame.target, UP),
    )
    .multiply(new THREE.Quaternion().setFromAxisAngle(FORWARD, frame.roll));
}

function screenOffset(frame, x, y) {
  return new THREE.Vector3(x, y, 0).applyQuaternion(screenRotation(frame));
}

function retainScreenAnchor(frame, authored, position) {
  const original = position.clone().sub(authored.position)
    .applyQuaternion(screenRotation(authored).invert());
  const rotation = screenRotation(frame);
  const current = position.clone().sub(frame.position)
    .applyQuaternion(rotation.clone().invert());
  const distanceRatio = frame.position.distanceTo(frame.target) /
    authored.position.distanceTo(authored.target);
  const fovRatio = Math.tan(THREE.MathUtils.degToRad(frame.fov / 2)) /
    Math.tan(THREE.MathUtils.degToRad(authored.fov / 2));
  const desired = original.multiplyScalar(distanceRatio);
  desired.x *= fovRatio;
  desired.y *= fovRatio;
  // Keep depth / target-distance proportional too: narrow-view dollying scales
  // target-distance, so preserving only aspect=1 NDC would drift on phones.
  // Translating position and target together changes no viewing direction.
  const correction = current.sub(desired).applyQuaternion(rotation);
  frame.position.add(correction);
  frame.target.add(correction);
}

function inputAxis(value) {
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

function integrateAxis(position, velocity, target, limit, dt, blend) {
  // Integrating the exponential analytically keeps displacement independent of
  // frame rate, unlike multiplying the newly eased velocity by dt.
  const next =
    position + target * dt + ((velocity - target) * blend) / VELOCITY_RESPONSE;
  const clamped = Math.max(-limit, Math.min(limit, next));
  const nextVelocity = velocity + (target - velocity) * blend;
  return [clamped, clamped !== next ? 0 : nextVelocity];
}

/** Screen-relative input layered over the deterministic reference flight. */
export class PilotMotion {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.bank = 0;
    this.pitch = 0;
    this.engaged = false;
    this.engagementTime = 0;
    this.cameraBlend = 0;
  }

  get active() {
    return (
      this.engaged ||
      [this.x, this.y, this.vx, this.vy, this.bank, this.pitch].some(
        (value) => Math.abs(value) > 1e-6,
      )
    );
  }

  update(dt, input = {}, playing = true) {
    if (!playing || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.1);
    let x = inputAxis(input?.x);
    let y = inputAxis(input?.y);
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    if (length > 0) this.engaged = true;
    if (this.engaged) {
      this.engagementTime = Math.min(
        CAMERA_BLEND_SECONDS,
        this.engagementTime + dt,
      );
      const progress = this.engagementTime / CAMERA_BLEND_SECONDS;
      this.cameraBlend = progress * progress * (3 - 2 * progress);
    }
    const blend = -Math.expm1(-VELOCITY_RESPONSE * dt);
    [this.x, this.vx] = integrateAxis(this.x, this.vx, x * 16, PILOT_LIMITS.x, dt, blend);
    [this.y, this.vy] = integrateAxis(this.y, this.vy, y * 10, PILOT_LIMITS.y, dt, blend);
    const attitudeBlend = -Math.expm1(-ATTITUDE_RESPONSE * dt);
    this.bank += (x * 0.52 - this.bank) * attitudeBlend;
    // With the aircraft's +Z nose, negative local-X rotation pitches upward.
    this.pitch += (-y * 0.24 - this.pitch) * attitudeBlend;
  }

  /** Stabilize a close rear view without moving its existing on-screen anchor. */
  steeringCamera(frame, pose) {
    const result = {
      ...frame,
      position: frame.position.clone(),
      target: frame.target.clone(),
    };
    if (this.cameraBlend === 0) return result;
    // Local +Z is the nose; removing its vertical component keeps the horizon
    // stable during climbs, and scripted bank cannot affect this rear offset.
    const forward = FORWARD.clone().applyQuaternion(pose.quaternion);
    forward.y = 0;
    forward.normalize();
    const rear = pose.position
      .clone()
      .addScaledVector(forward, -34)
      .addScaledVector(UP, 8);
    result.position.lerp(rear, this.cameraBlend);
    result.target.lerp(pose.position, this.cameraBlend);
    result.fov = THREE.MathUtils.lerp(frame.fov, 52, this.cameraBlend);
    result.roll = THREE.MathUtils.lerp(frame.roll, 0, this.cameraBlend);
    retainScreenAnchor(result, frame, pose.position);
    return result;
  }

  applyPose(pose, frame, { stabilize = true } = {}) {
    const position = pose.position
      .clone()
      .add(screenOffset(frame, this.x, this.y));
    const quaternion = pose.quaternion.clone();
    if (stabilize && this.cameraBlend > 0) {
      const forward = FORWARD.clone().applyQuaternion(pose.quaternion);
      const right = new THREE.Vector3().crossVectors(UP, forward).normalize();
      const up = new THREE.Vector3().crossVectors(forward, right).normalize();
      const level = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(right, up, forward),
      );
      // Preserve the route's heading and climb while handing bank authority to
      // the pilot. Orbit can opt out so inspecting the original pose still works.
      quaternion.slerp(level, this.cameraBlend);
    }
    if (this.bank !== 0 || this.pitch !== 0) {
      quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(FORWARD, this.bank),
      );
      quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(RIGHT, this.pitch),
      );
      quaternion.normalize();
    }
    return { ...pose, position, quaternion };
  }

  applyCamera(frame) {
    const offset = screenOffset(frame, this.x, this.y).multiplyScalar(
      PILOT_CAMERA_FOLLOW,
    );
    return {
      ...frame,
      position: frame.position.clone().add(offset),
      target: frame.target.clone().add(offset),
    };
  }
}

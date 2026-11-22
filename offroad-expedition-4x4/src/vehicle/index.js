import { buildBody, chassis } from './body.js';
import { buildCabin } from './cabin.js';
import { buildRoofRack, mountSideEquipment } from './equipment.js';
import { buildBumpers, buildFrontFittings, buildRearFittings, mountRackLamps } from './fittings.js';
import { assembly } from './geometry.js';
import { createMaterials } from './materials.js';
import { buildUnderbody } from './underbody.js';
import { bakeWeatherCoordinates } from './weathering.js';
import { buildWheel } from './wheel.js';

export function createVehicle() {
  const m = createMaterials();
  const root = assembly(null, 'expedition-4x4');
  const { body, front, doors, rearDoor, tailHinge } = buildBody(root, m);
  buildCabin(body, m);
  buildUnderbody(root, m);
  const headlightBeams = buildFrontFittings(front, m);
  buildBumpers(root, m);
  const rack = buildRoofRack(body, m);
  mountRackLamps(rack, m);
  mountSideEquipment(body, m);

  const { frontAxle, rearAxle, axleHeight, halfTrack } = chassis;
  const wheel = buildWheel(m);
  buildRearFittings(body, rearDoor, m, wheel.clone());

  const wheels = assembly(root, 'road-wheels');
  for (const z of [frontAxle, rearAxle]) {
    for (const side of [-1, 1]) {
      const roadWheel = wheel.clone();
      roadWheel.position.set(side * halfTrack, axleHeight, z);
      const treadPhase = (z === frontAxle ? 0 : Math.PI / 2) + (side < 0 ? 0 : Math.PI);
      roadWheel.rotation.set(0, side * Math.PI / 2, treadPhase);
      wheels.add(roadWheel);
    }
  }
  bakeWeatherCoordinates(root);

  const articulated = {
    driver: { hinge: doors.get(-1), openAngle: 1.02, target: 0 },
    rear: { hinge: tailHinge, openAngle: -1.14, target: 0 },
  };

  function setDoor(name, open) {
    const door = articulated[name];
    door.target = open ? door.openAngle : 0;
  }

  function setLights(on) {
    m.lens.opacity = on ? 0.82 : 0.36;
    m.lens.emissiveIntensity = on ? 3.1 : 0;
    m.lampCore.emissiveIntensity = on ? 3.2 : 0;
    m.tailLens.emissiveIntensity = on ? 0.65 : 0;
    for (const beam of headlightBeams) beam.intensity = on ? 55 : 0;
  }

  function update(seconds, immediate = false) {
    let changed = false;
    const follow = immediate ? 1 : 1 - Math.exp(-8 * seconds);
    for (const { hinge, target } of Object.values(articulated)) {
      const current = hinge.rotation.y;
      if (current === target) continue;
      hinge.rotation.y = Math.abs(target - current) < 0.004 ? target : current + (target - current) * follow;
      changed = true;
    }
    return changed;
  }

  return { root, setDoor, setLights, update };
}

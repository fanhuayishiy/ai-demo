import { assembly, beam, box, cylinder, fasteners, panel, profile, rod, tube } from './geometry.js';

export const chassis = Object.freeze({
  frontAxle: 1.25,
  rearAxle: -1.24,
  axleHeight: 0.433,
  halfTrack: 0.759,
  sill: 0.568,
  archRadius: 0.484,
});

const sideX = (side, y) => side * (0.812 - (y - 1.24) * 0.113);
const sideCorners = (side, points, inset = 0) => points.map(([z, y]) => [sideX(side, y) - side * inset, y, z]);
const frontCorners = (points, inset = 0) => points.map(([x, y]) => [x, y, 0.619 - (y - 1.25) * 0.155 - inset]);
const rearCorners = (points, inset = 0) => points.map(([x, y]) => [x, y, -1.862 + (y - 1.25) * 0.045 + inset]);

export function wheelArch(center, radius = chassis.archRadius) {
  const { sill, axleHeight } = chassis;
  const start = Math.asin((sill - axleHeight) / radius);
  return Array.from({ length: 29 }, (_, i) => {
    const angle = Math.PI - start - (Math.PI - 2 * start) * i / 28;
    return [center + radius * Math.cos(angle), axleHeight + radius * Math.sin(angle)];
  });
}

function quarter(parent, m, side, start, end, axle, height) {
  const { sill } = chassis;
  const cut = wheelArch(axle);
  const points = [[start, sill], ...cut, [end - 0.024, sill], [end, sill + 0.035], [end, height], [start, height]];
  profile(parent, m.olive, points, 'x', side * 0.781, 0.082, 0.006);
  const innerTub = wheelArch(axle, 0.465);
  profile(parent, m.seal, [[start, sill], ...innerTub, [end, sill], [end, height - 0.025], [start, height - 0.025]], 'x', side * 0.62, 0.025, 0.004);
  const liner = [...wheelArch(axle, 0.497), ...wheelArch(axle, 0.469).reverse()];
  profile(parent, m.seal, liner, 'x', side * 0.706, 0.216, 0.002);
  const bulkhead = [[axle - 0.457, 0.477], [axle + 0.457, 0.477], ...wheelArch(axle, 0.482).reverse()];
  profile(parent, m.seal, bulkhead, 'x', side * 0.601, 0.015, 0.003);
}

function framedWindow(parent, m, map, outside, inside) {
  panel(parent, m.olive, map(outside), 0.034, 0.005, [map(inside)]);
  const center = inside.reduce(([sumX, sumY], [x, y]) => [sumX + x / inside.length, sumY + y / inside.length], [0, 0]);
  const gasket = (ratio) => inside.map(([x, y]) => [center[0] + (x - center[0]) * ratio, center[1] + (y - center[1]) * ratio]);
  panel(parent, m.seal, map(gasket(1.012), 0.005), 0.023, 0.004, [map(gasket(0.947), 0.005)]).name = 'window-seal';
  const glass = panel(parent, m.glazing, map(gasket(0.973), 0.014), 0.008, 0);
  glass.name = 'glazing';
  glass.castShadow = false;
  glass.receiveShadow = false;
}

function hinge(parent, name, pivot) {
  const anchor = assembly(parent, name, pivot);
  const shell = assembly(anchor, `${name}-skin`, pivot.map((value) => -value));
  return { anchor, shell };
}

function doorFittings(door, m, side) {
  const x = side * 0.822;
  const insideX = side * 0.74;
  box(door, m.saddle, 0.036, 0.41, 1.088, insideX, 0.974, -0.014, 0.026);
  box(door, m.seal, 0.05, 0.054, 0.318, insideX - side * 0.02, 1.053, -0.136, 0.019);
  panel(door, m.olive, [[x, 0.80, -0.567], [x, 0.80, 0.494], [x, 0.851, 0.536], [x, 1.119, 0.536], [x, 1.141, -0.567]], 0.011, 0.009);
  box(door, m.seal, 0.025, 0.018, 1.206, side * 0.824, 1.224, -0.016, 0.006);
  box(door, m.gunmetal, 0.025, 0.053, 0.172, side * 0.833, 1.153, -0.48, 0.012);
  beam(door, m.rawSteel, [x + side * 0.023, 1.158, -0.537], [x + side * 0.023, 1.158, -0.439], 0.012, 0.018);
  cylinder(door, m.steel, 0.012, 0.013, side * 0.838, 1.105, -0.523, 'x', 12);

  for (const y of [0.824, 1.168]) {
    box(door, m.steel, 0.022, 0.055, 0.114, side * 0.831, y, 0.554, 0.007);
    cylinder(door, m.gunmetal, 0.013, 0.078, side * 0.841, y, 0.601, 'y', 12);
    fasteners(door, m.rawSteel, [[side * 0.845, y, 0.522], [side * 0.845, y, 0.568]], 0.006, 'x');
  }

  const mirror = assembly(door, 'side-mirror');
  box(mirror, m.seal, 0.034, 0.082, 0.076, side * 0.811, 1.348, 0.453, 0.011);
  tube(mirror, m.steel, [[side * 0.814, 1.352, 0.451], [side * 0.902, 1.365, 0.443], [side * 0.923, 1.435, 0.435]], 0.014);
  box(mirror, m.gunmetal, 0.133, 0.114, 0.062, side * 0.91, 1.454, 0.432, 0.022);
  const mirrorGlass = box(mirror, m.glazeMirror, 0.108, 0.088, 0.008, side * 0.91, 1.456, 0.399, 0.004);
  mirrorGlass.castShadow = false;
}

export function buildBody(root, m) {
  const body = assembly(root, 'body');
  const { frontAxle, rearAxle } = chassis;
  box(body, m.olive, 1.22, 0.095, 3.73, 0, 0.633, 0.004, 0.035);
  box(body, m.seal, 1.45, 0.1, 0.87, 0, 1.177, 0.975, 0.042);

  const front = assembly(body, 'front-clip');
  const nose = [[-0.76, 0.601], [0.76, 0.601], [0.811, 0.68], [0.81, 1.148], [0.723, 1.22], [-0.723, 1.22], [-0.81, 1.148], [-0.811, 0.68]];
  profile(front, m.olive, nose, 'z', 1.901, 0.078, 0.019);
  panel(front, m.bonnet, [
    [-0.597, 1.232, 1.885], [0.597, 1.232, 1.885], [0.63, 1.234, 1.831],
    [0.647, 1.274, 0.631], [-0.647, 1.274, 0.631], [-0.63, 1.234, 1.831],
  ], 0.064, 0.015).name = 'bonnet';
  box(front, m.olive, 1.57, 0.108, 0.157, 0, 1.246, 0.568, 0.02);

  const doors = new Map();
  for (const side of [-1, 1]) {
    quarter(front, m, side, 0.617, 1.916, frontAxle, 1.208);
    const wing = [
      [side * 0.651, 1.238, 0.648], [side * 0.654, 1.213, 1.855],
      [side * 0.758, 1.213, 1.879], [side * 0.807, 1.213, 1.844], [side * 0.825, 1.238, 0.648],
    ];
    panel(front, m.olive, wing, 0.04, 0.012);
    quarter(body, m, side, -1.864, -0.638, rearAxle, 1.258);
    box(body, m.olive, 0.114, 0.08, 1.444, side * 0.758, 0.614, -0.011, 0.012);

    const lower = [[-0.627, 0.67], [0.579, 0.67], [0.602, 0.715], [0.604, 1.242], [-0.631, 1.242]];
    const { anchor, shell: door } = hinge(body, side < 0 ? 'driver-door' : 'passenger-door', [side * 0.827, 0.87, 0.607]);
    doors.set(side, anchor);
    profile(door, m.olive, lower, 'x', side * 0.779, 0.07, 0.008);
    const outside = [[-0.63, 1.243], [0.605, 1.243], [0.492, 1.869], [-0.634, 1.869]];
    const inside = [[-0.562, 1.339], [0.522, 1.339], [0.438, 1.812], [-0.562, 1.812]];
    framedWindow(door, m, (points, inset) => sideCorners(side, points, inset), outside, inside);
    doorFittings(door, m, side);
    tube(body, m.seal, [
      [side * 0.754, 0.686, -0.625], [side * 0.756, 0.686, 0.583], [side * 0.768, 1.228, 0.586],
      [side * 0.727, 1.861, 0.483], [side * 0.733, 1.861, -0.623], [side * 0.773, 1.236, -0.627],
    ], 0.009, { segments: 70, closed: true, smooth: false });

    const cargoOutside = [[-1.866, 1.254], [-0.641, 1.254], [-0.643, 1.88], [-1.784, 1.88], [-1.858, 1.79]];
    const cargoInside = [[-1.719, 1.364], [-0.745, 1.364], [-0.747, 1.795], [-1.699, 1.795], [-1.719, 1.766]];
    framedWindow(body, m, (points, inset) => sideCorners(side, points, inset), cargoOutside, cargoInside);
    beam(body, m.gunmetal, sideCorners(side, [[-1.22, 1.367]])[0], sideCorners(side, [[-1.22, 1.792]])[0], 0.023);
    box(body, m.gunmetal, 0.064, 0.062, 1.29, side * 0.812, 0.596, -0.014, 0.015);
    tube(body, m.steel, [[side * 0.757, 0.551, 0.648], [side * 0.827, 0.548, 0.55], [side * 0.853, 0.548, 0.437], [side * 0.853, 0.548, -0.448], [side * 0.814, 0.548, -0.587], [side * 0.762, 0.55, -0.638]], 0.027);

    for (const axle of [frontAxle, rearAxle]) {
      const flange = [...wheelArch(axle, 0.539), ...wheelArch(axle, 0.467).reverse()];
      profile(body, m.rubber, flange, 'x', side * 0.857, 0.079, 0.005);
      const edge = wheelArch(axle, 0.476).map(([z, y]) => [side * 0.896, y, z]);
      tube(body, m.seal, edge, 0.005, { segments: 30 });
      const fixings = wheelArch(axle, 0.516).filter((_, index) => index % 6 === 2);
      fasteners(body, m.gunmetal, fixings.map(([z, y]) => [side * 0.9, y, z]), 0.006, 'x');
      const mudflap = box(body, m.seal, 0.246, 0.235, 0.028, side * 0.76, 0.393, axle - 0.467, 0.009);
      mudflap.rotation.x = -0.11;
    }
  }

  const windshield = [[-0.811, 1.25], [0.811, 1.25], [0.758, 1.875], [-0.758, 1.875]];
  const windHole = [[-0.726, 1.321], [0.726, 1.321], [0.684, 1.813], [-0.684, 1.813]];
  framedWindow(body, m, frontCorners, windshield, windHole);
  beam(body, m.olive, [0, 1.317, 0.616], [0, 1.818, 0.538], 0.032);
  for (const x of [-0.621, 0.125]) {
    cylinder(body, m.gunmetal, 0.017, 0.019, x, 1.346, 0.623, 'z', 16);
    rod(body, m.steel, [x, 1.349, 0.635], [x + 0.263, 1.404, 0.617], 0.009);
    beam(body, m.seal, [x + 0.10, 1.392, 0.623], [x + 0.43, 1.427, 0.612], 0.015, 0.018);
  }

  const { anchor: tailHinge, shell: rearDoor } = hinge(body, 'tailgate', [0.672, 1.065, -1.915]);
  const rearOutline = [[-0.657, 1.246], [0.657, 1.246], [0.666, 1.864], [-0.666, 1.864]];
  const rearGlass = [[-0.573, 1.344], [0.573, 1.344], [0.573, 1.775], [-0.573, 1.775]];
  framedWindow(rearDoor, m, rearCorners, rearOutline, rearGlass);
  box(rearDoor, m.olive, 1.303, 0.614, 0.067, 0, 0.94, -1.871, 0.018);
  box(rearDoor, m.saddle, 1.18, 0.425, 0.027, 0, 0.964, -1.825, 0.032);
  box(rearDoor, m.gunmetal, 0.071, 0.091, 0.025, -0.545, 1.184, -1.918, 0.008);
  beam(rearDoor, m.rawSteel, [-0.561, 1.156, -1.94], [-0.552, 1.201, -1.94], 0.012);
  for (const y of [0.802, 1.274, 1.71]) {
    box(rearDoor, m.steel, 0.121, 0.044, 0.028, 0.612, y, -1.895, 0.006);
    cylinder(rearDoor, m.gunmetal, 0.013, 0.073, 0.674, y, -1.915, 'y', 12);
    fasteners(rearDoor, m.rawSteel, [[0.577, y, -1.912], [0.629, y, -1.912]], 0.006, 'z');
  }
  cylinder(rearDoor, m.gunmetal, 0.018, 0.016, -0.31, 1.365, -1.866, 'z', 12);
  rod(rearDoor, m.steel, [-0.31, 1.365, -1.878], [-0.081, 1.438, -1.865], 0.008);
  beam(rearDoor, m.seal, [-0.175, 1.416, -1.872], [0.118, 1.482, -1.855], 0.013);
  for (const side of [-1, 1]) {
    box(body, m.olive, 0.173, 0.607, 0.082, side * 0.745, 0.95, -1.841, 0.019);
    beam(body, m.olive, [side * 0.741, 1.236, -1.848], [side * 0.709, 1.862, -1.825], 0.125, 0.08);
  }
  tube(body, m.seal, [[-0.662, 0.648, -1.851], [0.662, 0.648, -1.851], [0.668, 1.228, -1.848], [0.648, 1.864, -1.827], [-0.648, 1.864, -1.827], [-0.668, 1.228, -1.848]], 0.01, { segments: 70, closed: true, smooth: false });

  panel(body, m.top, [
    [-0.699, 1.91, 0.582], [0.699, 1.91, 0.582], [0.768, 1.91, 0.514], [0.768, 1.91, -1.761],
    [0.699, 1.91, -1.856], [-0.699, 1.91, -1.856], [-0.768, 1.91, -1.761], [-0.768, 1.91, 0.514],
  ], 0.066, 0.024).name = 'roof';
  for (const side of [-1, 1]) {
    box(body, m.olive, 0.043, 0.036, 2.35, side * 0.765, 1.898, -0.62, 0.013);
  }

  for (const x of [-0.51, -0.26, 0, 0.26, 0.51]) {
    box(body, m.top, 0.034, 0.018, 2.018, x, 1.958, -0.64, 0.008);
  }

  return { body, front, doors, rearDoor, tailHinge };
}

import { assembly, beam, box, cylinder, ring, rod, tube } from './geometry.js';

export function buildCabin(body, m) {
  const cabin = assembly(body, 'cabin');
  box(cabin, m.gunmetal, 1.52, 0.071, 2.33, 0, 0.683, -0.629, 0.026);
  box(cabin, m.saddle, 1.363, 0.051, 0.94, 0, 0.731, -1.309, 0.021);
  box(cabin, m.seal, 0.218, 0.145, 1.04, 0, 0.773, -0.004, 0.037);
  box(cabin, m.gunmetal, 1.395, 0.172, 0.276, 0, 1.19, 0.439, 0.032);
  box(cabin, m.seal, 1.409, 0.048, 0.293, 0, 1.282, 0.438, 0.017);
  box(cabin, m.saddle, 0.54, 0.076, 0.09, 0.349, 1.183, 0.299, 0.007);
  box(cabin, m.gunmetal, 0.302, 0.121, 0.125, -0.381, 1.276, 0.326, 0.029);
  for (const x of [-0.442, -0.325]) {
    cylinder(cabin, m.rawSteel, 0.041, 0.008, x, 1.272, 0.26, 'z');
    cylinder(cabin, m.seal, 0.035, 0.009, x, 1.272, 0.254, 'z');
    beam(cabin, m.ivory, [x, 1.269, 0.249], [x + 0.018, 1.285, 0.249], 0.0035);
  }

  for (const x of [-0.389, 0.389]) {
    const seat = assembly(cabin, 'seat', [x, 0.74, -0.12]);
    box(seat, m.steel, 0.376, 0.096, 0.37, 0, 0.064, -0.018, 0.019);
    box(seat, m.saddle, 0.431, 0.138, 0.449, 0, 0.162, 0, 0.054);
    const back = assembly(seat, 'seat-back', [0, 0.174, -0.178]);
    back.rotation.x = -0.17;
    box(back, m.saddle, 0.417, 0.475, 0.126, 0, 0.238, 0, 0.048);
    box(back, m.webbing, 0.279, 0.351, 0.026, 0, 0.241, 0.06, 0.011);
    for (const y of [0.129, 0.206, 0.283, 0.36]) {
      box(back, m.saddle, 0.259, 0.007, 0.008, 0, y, 0.075, 0.003);
    }
    for (const pin of [-0.073, 0.073]) cylinder(back, m.rawSteel, 0.008, 0.082, pin, 0.471, 0, 'y', 10);
    box(back, m.saddle, 0.247, 0.133, 0.119, 0, 0.552, 0, 0.043);
  }

  const steering = assembly(cabin, 'steering-wheel', [-0.398, 1.267, 0.178]);
  steering.rotation.x = -0.27;
  ring(steering, m.seal, 0.148, 0.016, 0, 0, 0);
  cylinder(steering, m.gunmetal, 0.054, 0.043, 0, 0, 0.012, 'z');
  for (const angle of [0, 2.094, 4.188]) {
    beam(steering, m.steel, [0, 0, 0.014], [Math.sin(angle) * 0.135, -Math.cos(angle) * 0.135, 0], 0.027, 0.014);
  }
  rod(cabin, m.gunmetal, [-0.398, 1.266, 0.186], [-0.395, 1.133, 0.448], 0.029);
  tube(cabin, m.rawSteel, [[-0.036, 0.858, 0.209], [-0.039, 0.958, 0.177], [-0.051, 1.008, 0.131]], 0.009);
  box(cabin, m.seal, 0.055, 0.041, 0.052, -0.052, 1.017, 0.126, 0.018);
  beam(cabin, m.gunmetal, [0.113, 0.818, -0.229], [0.111, 0.93, -0.072], 0.027);

  box(cabin, m.roll, 0.66, 0.25, 0.51, -0.28, 0.889, -1.431, 0.025);
  box(cabin, m.gunmetal, 0.683, 0.044, 0.536, -0.28, 1.013, -1.431, 0.01);
  for (const x of [-0.478, -0.117]) {
    box(cabin, m.webbing, 0.031, 0.014, 0.544, x, 1.041, -1.431, 0.004);
    box(cabin, m.webbing, 0.031, 0.279, 0.015, x, 0.907, -1.703, 0.003);
    box(cabin, m.rawSteel, 0.041, 0.042, 0.014, x, 0.97, -1.715, 0.003);
  }
}

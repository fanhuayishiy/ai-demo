import type { Vec3 } from "../types";

export interface ParticleSample {
  position: Vec3;
  diameter: number;
  opacity: number;
  heat: number;
}

export type IncidentParticleKind = "flame" | "smoke" | "ember";
const fraction = (value: number) => value - Math.floor(value);

export function incidentParticle(kind: IncidentParticleKind, time: number, index: number, intensity: number): ParticleSample {
  const strength = Math.max(0, Math.min(1, intensity));
  const seed = index * .61803398875;
  if (kind === "smoke") {
    const life = fraction(time * .064 + seed);
    return {
      position: [Math.sin(index * 2.37 + life * 5) * 1.6 + life * 5, 3 + life * 18, .6 + life * 4 + Math.cos(index) * .4],
      diameter: (3.5 + life * 6) * (.5 + strength * .5),
      opacity: Math.pow(Math.sin(Math.PI * life), .6) * .6 * strength,
      heat: Math.pow(1 - life, 4),
    };
  }
  if (kind === "ember") {
    const life = fraction(time * .25 + seed);
    return {
      position: [Math.sin(index * 3.7) * 2.3 + life * 3, 1 + life * 15, .7 + Math.sin(index * 2) * .8 + life * 1.7],
      diameter: .08 + (1 - life) * .1,
      opacity: (1 - life) * strength,
      heat: 1 - life,
    };
  }
  const life = fraction(time * 1.18 + seed);
  return {
    position: [Math.sin(index * 2.37 + life * 2) * (2.1 - life * 1.4) * strength, life * 6.5 - .4, .35 + Math.cos(index * 4.3) * .62],
    diameter: (1.8 - life * .65) * (.6 + strength * .6),
    opacity: Math.sin(Math.PI * life) * .92 * strength,
    heat: 1 - life,
  };
}

export function waterParticle(points: [Vec3, Vec3, Vec3], time: number, index: number): ParticleSample {
  const phase = fraction(time * 1.2 + index * .61803398875);
  const impact = index >= 40;
  const t = impact ? .92 + phase * .08 : phase;
  const inverse = 1 - t;
  const position = [0, 1, 2].map(axis =>
    inverse * inverse * points[0][axis] + 2 * inverse * t * points[1][axis] + t * t * points[2][axis],
  ) as Vec3;
  const spread = impact ? .55 : .015 + t * t * .24;
  position[0] += Math.sin(index * 5 + t * 11) * spread;
  position[1] += Math.sin(index * 3 + t * 8) * spread * (.5 + t);
  // No depth scatter: the impact cloud never travels through the facade plane.
  return {
    position,
    diameter: impact ? .18 + phase * .45 : .055 + t * .12,
    opacity: impact ? (1 - phase) * .3 : Math.sin(Math.PI * phase) * .68,
    heat: impact ? .3 : .8,
  };
}

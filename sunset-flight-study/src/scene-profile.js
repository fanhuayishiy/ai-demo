import * as classicFlight from "./flight.js";
import * as referenceFlight from "./reference-flight.js";
import { createAircraft } from "./aircraft.js";
import { createReferenceAircraft } from "./reference-aircraft.js";
import { createWorld } from "./world.js";
import { createSunsetWorld } from "./sunset-world.js";

const profiles = {
  classic: Object.freeze({
    id: "classic",
    duration: classicFlight.DURATION,
    shots: classicFlight.SHOTS,
    sampleFlight: classicFlight.sampleFlight,
    sampleCamera: classicFlight.sampleCamera,
    createAircraft: () => createAircraft("red"),
    createWorld,
    showOpponent: true,
    bloom: 0,
    propellerSpeed: 70,
  }),
  sunset: Object.freeze({
    id: "sunset",
    duration: referenceFlight.DURATION,
    shots: referenceFlight.SHOTS,
    sampleFlight: referenceFlight.sampleFlight,
    sampleCamera: referenceFlight.sampleCamera,
    createAircraft: createReferenceAircraft,
    createWorld: createSunsetWorld,
    showOpponent: false,
    bloom: 0.24,
    propellerSpeed: (267 * Math.PI * 2) / referenceFlight.DURATION,
  }),
};

export function getSceneProfile(search = "") {
  return profiles[
    new URLSearchParams(search).get("scene") === "classic"
      ? "classic"
      : "sunset"
  ];
}

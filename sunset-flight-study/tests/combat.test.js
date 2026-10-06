import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { Vector3 } from "three";
import { sampleFlight } from "../src/flight.js";

test("gunfire only appears when an opponent is ahead of the firing aircraft", async () => {
  assert.ok(existsSync("src/combat.js"), "forward firing model exists");
  const { sampleGunfire } = await import("../src/combat.js");
  const shots = { red: 0, blue: 0 };
  for (let time = 0; time < 72; time += 0.05) {
    const flight = sampleFlight(time);
    const burst = sampleGunfire(time, flight);
    if (!burst) continue;
    shots[burst.shooter]++;
    const forward = new Vector3(0, 0, 1).applyQuaternion(
      flight[burst.shooter].quaternion,
    );
    assert.ok(
      forward.dot(burst.direction) > 0.85,
      "guns never fire backward or broadside",
    );
    assert.ok(burst.distance > 8 && burst.distance < 80);
    assert.ok(burst.origin.toArray().every(Number.isFinite));
  }
  assert.ok(
    shots.blue > 5 && shots.red > 5,
    "both aircraft have valid intermittent firing opportunities",
  );
});

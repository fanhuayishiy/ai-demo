import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPreset,
  initialDevices,
  readDevices,
  rooms,
  STORAGE_KEY,
} from "../src/data.ts";

function withStorage(value: string | null, run: () => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => (key === STORAGE_KEY ? value : null) },
  });
  try {
    run();
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
}

test("every device has a unique id and belongs to an existing room", () => {
  assert.equal(
    new Set(initialDevices.map((device) => device.id)).size,
    initialDevices.length,
  );
  const roomIds = new Set(
    rooms.filter((room) => room.id !== "all").map((room) => room.id),
  );
  for (const device of initialDevices) {
    assert.ok(roomIds.has(device.room), `${device.id} has a valid room`);
    assert.ok(
      device.position.every(Number.isFinite),
      `${device.id} has a finite 3D position`,
    );
  }
});

test("living room, bedroom, study and kitchen each provide independent lighting circuits", () => {
  for (const room of ["living", "bedroom", "study", "kitchen"]) {
    const lights = initialDevices.filter(
      (device) => device.room === room && device.type === "light",
    );
    assert.ok(
      lights.length >= 2,
      `${room} has at least two individually addressable lights`,
    );
  }
});

test("every scene preserves refrigerator power and does not mutate incoming state", () => {
  const snapshot = structuredClone(initialDevices);
  for (const preset of ["home", "movie", "night", "away"] as const) {
    const result = applyPreset(initialDevices, preset);
    assert.equal(result.length, initialDevices.length);
    assert.equal(result.find((device) => device.type === "fridge")?.on, true);
    for (let index = 0; index < result.length; index++)
      assert.notEqual(result[index], initialDevices[index]);
  }
  assert.deepEqual(initialDevices, snapshot);
});

test("away scene leaves only the refrigerator running", () => {
  assert.deepEqual(
    applyPreset(initialDevices, "away")
      .filter((device) => device.on)
      .map((device) => device.id),
    ["kitchen-fridge"],
  );
});

test("movie scene turns on the TV with low ambient lighting", () => {
  const devices = applyPreset(initialDevices, "movie");
  assert.equal(devices.find((device) => device.id === "living-tv")?.on, true);
  assert.equal(
    devices.find((device) => device.id === "living-pendant")?.on,
    false,
  );
  assert.equal(
    devices.find((device) => device.id === "living-strip")?.on,
    true,
  );
  assert.ok(
    devices
      .filter((device) => device.type === "light" && device.on)
      .every((device) => device.value <= 35),
  );
  assert.equal(devices.find((device) => device.type === "curtain")?.value, 0);
});

test("night scene leaves a dim bedside lamp and closes bedroom curtains", () => {
  const devices = applyPreset(initialDevices, "night");
  assert.deepEqual(
    devices
      .filter((device) => device.type === "light" && device.on)
      .map((device) => device.id),
    ["bedroom-bedside"],
  );
  assert.equal(
    devices.find((device) => device.id === "bedroom-bedside")?.value,
    20,
  );
  assert.equal(devices.find((device) => device.type === "curtain")?.value, 0);
});

test("home scene restores the original device settings after another scene", () => {
  assert.deepEqual(
    applyPreset(applyPreset(initialDevices, "away"), "home"),
    initialDevices,
  );
});

test("saved individual lamp settings remain independent within one room", () => {
  withStorage(
    JSON.stringify([
      { id: "living-pendant", on: false, value: 12, temperature: 2700 },
      { id: "living-floor", on: true, value: 88, temperature: 4200 },
    ]),
    () => {
      const devices = readDevices();
      assert.equal(
        devices.find((device) => device.id === "living-pendant")?.on,
        false,
      );
      assert.equal(
        devices.find((device) => device.id === "living-pendant")?.value,
        12,
      );
      assert.equal(
        devices.find((device) => device.id === "living-floor")?.on,
        true,
      );
      assert.equal(
        devices.find((device) => device.id === "living-floor")?.value,
        88,
      );
      assert.deepEqual(
        devices.find((device) => device.id === "living-strip"),
        initialDevices.find((device) => device.id === "living-strip"),
      );
    },
  );
});

test("missing, malformed and incompatible persistence safely fall back to defaults", () => {
  for (const saved of [
    null,
    "{broken",
    "{}",
    "null",
    "true",
    "42",
    '"old-version"',
  ]) {
    withStorage(saved, () => {
      const devices = readDevices();
      assert.deepEqual(devices, initialDevices);
      assert.notEqual(devices, initialDevices);
      assert.notEqual(devices[0], initialDevices[0]);
    });
  }
});

test("unrecognized devices and invalid entries do not replace trusted device metadata", () => {
  withStorage(
    JSON.stringify([
      null,
      { id: "invented", on: true, value: 10 },
      { id: "living-pendant", on: "yes", value: 50 },
      { id: "living-tv", on: true, value: "loud" },
      {
        id: "living-floor",
        on: false,
        value: 10,
        name: "untrusted",
        room: "kitchen",
        watts: 999,
        position: [99, 99, 99],
      },
    ]),
    () => {
      const devices = readDevices();
      assert.equal(devices.length, initialDevices.length);
      assert.deepEqual(
        devices.find((device) => device.id === "living-pendant"),
        initialDevices.find((device) => device.id === "living-pendant"),
      );
      assert.deepEqual(
        devices.find((device) => device.id === "living-tv"),
        initialDevices.find((device) => device.id === "living-tv"),
      );
      const lamp = devices.find((device) => device.id === "living-floor")!;
      const original = initialDevices.find(
        (device) => device.id === "living-floor",
      )!;
      assert.equal(lamp.on, false);
      assert.equal(lamp.name, original.name);
      assert.equal(lamp.room, original.room);
      assert.equal(lamp.watts, original.watts);
      assert.deepEqual(lamp.position, original.position);
    },
  );
});

test("persisted numeric values and light temperatures are clamped to device limits", () => {
  withStorage(
    JSON.stringify([
      { id: "living-pendant", on: true, value: 999, temperature: 9999 },
      { id: "living-floor", on: true, value: -20, temperature: 2000 },
      { id: "living-ac", on: true, value: 100 },
      { id: "bedroom-ac", on: true, value: -10 },
      { id: "kitchen-fridge", on: true, value: 100 },
      { id: "kitchen-oven", on: true, value: 5 },
      { id: "bathroom-heater", on: true, value: 1000 },
    ]),
    () => {
      const devices = readDevices();
      const get = (id: string) => devices.find((device) => device.id === id)!;
      assert.equal(get("living-pendant").value, 100);
      assert.equal(get("living-pendant").temperature, 6500);
      assert.equal(get("living-floor").value, 0);
      assert.equal(get("living-floor").temperature, 2700);
      assert.equal(get("living-ac").value, 30);
      assert.equal(get("bedroom-ac").value, 16);
      assert.equal(get("kitchen-fridge").value, 8);
      assert.equal(get("kitchen-oven").value, 80);
      assert.equal(get("bathroom-heater").value, 65);
    },
  );
});

test("blocked storage access does not prevent the home from starting", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Storage unavailable");
    },
  });
  try {
    assert.deepEqual(readDevices(), initialDevices);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("persisted appliance values respect the available controls at both range boundaries", () => {
  const ranges = [
    ["kitchen-hood", 1, 3],
    ["balcony-washer", 20, 60],
    ["kitchen-oven", 80, 250],
    ["living-ac", 16, 30],
    ["kitchen-fridge", 2, 8],
    ["bathroom-heater", 35, 65],
    ["living-tv", 0, 100],
    ["living-robot", 0, 100],
    ["living-speaker", 0, 100],
    ["bedroom-curtain", 0, 100],
  ] as const;
  for (const boundary of ["minimum", "maximum"] as const) {
    const value = boundary === "minimum" ? -1000 : 1000;
    withStorage(
      JSON.stringify(ranges.map(([id]) => ({ id, on: true, value }))),
      () => {
        const devices = readDevices();
        for (const [id, minimum, maximum] of ranges) {
          assert.equal(
            devices.find((device) => device.id === id)?.value,
            boundary === "minimum" ? minimum : maximum,
            `${id} ${boundary}`,
          );
        }
      },
    );
  }
});

test("valid appliance modes are restored while unsupported or cross-device modes fall back", () => {
  const validModes = [
    ["living-ac", "制热"],
    ["living-tv", "电影"],
    ["balcony-washer", "快速洗"],
    ["kitchen-oven", "热风"],
    ["living-robot", "定点清扫"],
    ["living-speaker", "钢琴"],
    ["kitchen-hood", "手动"],
    ["bathroom-heater", "速热"],
    ["kitchen-fridge", "假日"],
  ] as const;
  withStorage(
    JSON.stringify(
      validModes.map(([id, mode]) => ({ id, mode, on: true, value: 30 })),
    ),
    () => {
      const devices = readDevices();
      for (const [id, mode] of validModes)
        assert.equal(devices.find((device) => device.id === id)?.mode, mode);
    },
  );
  for (const invalidMode of ["unknown-mode", "电影", null, {}, 42]) {
    withStorage(
      JSON.stringify([
        { id: "living-ac", on: true, value: 22, mode: invalidMode },
      ]),
      () => {
        const ac = readDevices().find((device) => device.id === "living-ac")!;
        assert.equal(ac.mode, "制冷");
        assert.equal(
          ac.value,
          22,
          "invalid mode does not discard valid independent settings",
        );
      },
    );
  }
});

test("JSON numeric overflow cannot introduce infinite light temperatures or device values", () => {
  withStorage(
    '[{"id":"living-pendant","on":true,"value":66,"temperature":1e309},{"id":"living-floor","on":false,"value":1e309}]',
    () => {
      const devices = readDevices();
      const pendant = devices.find((device) => device.id === "living-pendant")!;
      assert.equal(pendant.value, 66);
      assert.equal(pendant.temperature, 3000);
      assert.deepEqual(
        devices.find((device) => device.id === "living-floor"),
        initialDevices.find((device) => device.id === "living-floor"),
      );
    },
  );
});

test("devices without mode or color-temperature controls ignore injected settings", () => {
  withStorage(
    JSON.stringify([
      { id: "living-pendant", on: true, value: 50, mode: "电影" },
      {
        id: "bedroom-curtain",
        on: true,
        value: 50,
        mode: "制热",
        temperature: 5000,
      },
    ]),
    () => {
      const devices = readDevices();
      assert.equal(
        devices.find((device) => device.id === "living-pendant")?.mode,
        undefined,
      );
      assert.equal(
        devices.find((device) => device.id === "bedroom-curtain")?.mode,
        undefined,
      );
      assert.equal(
        devices.find((device) => device.id === "bedroom-curtain")?.temperature,
        undefined,
      );
    },
  );
});

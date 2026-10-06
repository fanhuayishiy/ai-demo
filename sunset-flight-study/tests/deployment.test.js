import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

test("production asset URLs support nested GitHub Pages project directories", async () => {
  const configUrl = new URL("../vite.config.js", import.meta.url);
  assert.ok(existsSync(configUrl), "Vite must declare a relative deployment base");
  const { default: config } = await import(configUrl.href);
  assert.equal(config.base, "./");
});

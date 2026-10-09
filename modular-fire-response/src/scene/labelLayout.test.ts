import { describe, expect, it } from "vitest";
import { placeSceneLabels, type LabelAnchor, type LabelPlacement } from "./labelLayout";

const bounds = { left: 20, top: 170, right: 980, bottom: 812 };
const label = (id: number, x: number, y: number, priority = 1): LabelAnchor => ({
  id, x, y, width: 108, height: 24, priority,
});
const overlaps = (a: LabelPlacement, b: LabelPlacement) =>
  a.left < b.left + b.width + 5 && a.left + a.width + 5 > b.left &&
  a.top < b.top + b.height + 5 && a.top + a.height + 5 > b.top;

describe("projected annotation layout", () => {
  it("keeps an isolated annotation on its original anchor", () => {
    expect(placeSceneLabels([label(1, 300, 400)], bounds)).toEqual([
      { id: 1, left: 246, top: 388, width: 108, height: 24, anchorX: 300, anchorY: 400 },
    ]);
  });

  it("separates a crowded fire, cargo, and supply group without hiding them", () => {
    const placed = placeSceneLabels([
      label(1, 500, 440, 90), label(2, 494, 442, 80),
      label(3, 508, 443, 70), label(4, 499, 445, 60),
    ], bounds);
    expect(placed).toHaveLength(4);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i], placed[j])).toBe(false);
    }
  });

  it("keeps every visible rectangle inside the unobstructed scene area", () => {
    const placed = placeSceneLabels([
      label(1, 22, 173), label(2, 979, 174), label(3, 21, 810), label(4, 978, 811),
    ], bounds);
    expect(placed).toHaveLength(4);
    for (const p of placed) {
      expect(p.left).toBeGreaterThanOrEqual(bounds.left);
      expect(p.top).toBeGreaterThanOrEqual(bounds.top);
      expect(p.left + p.width).toBeLessThanOrEqual(bounds.right);
      expect(p.top + p.height).toBeLessThanOrEqual(bounds.bottom);
    }
  });

  it("keeps the selected annotation when only one label can fit", () => {
    const small = { left: 0, top: 0, right: 110, bottom: 26 };
    const placed = placeSceneLabels([label(1, 54, 12, 10), label(2, 54, 12, 100)], small);
    expect(placed.map(p => p.id)).toEqual([2]);
  });

  it("does not depend on React registration order for equal-priority labels", () => {
    const input = [label(3, 500, 400), label(1, 500, 400), label(2, 500, 400)];
    expect(placeSceneLabels(input, bounds)).toEqual(placeSceneLabels([...input].reverse(), bounds));
  });

  it("omits invalid, oversized, or off-scene annotations", () => {
    expect(placeSceneLabels([
      label(1, Number.NaN, 400), label(2, -100, 400),
      { ...label(3, 400, 400), width: 1200 },
      { ...label(4, 400, 400), height: 0 },
      label(5, 400, 900),
    ], bounds)).toEqual([]);
  });

  it("resolves a dense mobile cluster without overlapping visible labels", () => {
    const mobile = { left: 16, top: 244, right: 374, bottom: 626 };
    const placed = placeSceneLabels(Array.from({ length: 12 }, (_, i) => label(i, 195 + i % 3, 420 + i % 2, i)), mobile);
    expect(placed.length).toBeGreaterThanOrEqual(4);
    expect(placed.map(p => p.id)).toContain(11);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i], placed[j])).toBe(false);
    }
  });

  it("avoids floating scene controls and an open mobile inspector", () => {
    const control = { left: 20, top: 600, right: 240, bottom: 650 };
    const placed = placeSceneLabels([label(1, 130, 610, 100)], bounds, [control]);
    expect(placed).toHaveLength(1);
    expect(placed[0].top + placed[0].height).toBeLessThan(control.top);
    expect(placeSceneLabels([label(1, 300, 400)], bounds, [bounds])).toEqual([]);
  });

  it("does not leave an annotation beneath an expanded mobile equipment rail", () => {
    const mobile = { left: 16, top: 244, right: 374, bottom: 626 };
    const expandedRail = { left: 0, top: 540, right: 390, bottom: 844 };
    const placed = placeSceneLabels([label(1, 195, 575)], mobile, [expandedRail]);
    expect(placed.every(p => p.top + p.height + 8 <= expandedRail.top)).toBe(true);
  });
});

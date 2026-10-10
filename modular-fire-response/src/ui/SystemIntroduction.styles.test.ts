/// <reference types="vite/client" />
import { parse } from "postcss";
import { describe, expect, it } from "vitest";
import source from "./SystemIntroduction.css?raw";

const sheet = parse(source);
function value(selector: string, property: string, media: string | null = null) {
  const matches: string[] = [];
  sheet.walkRules(rule => {
    const scope = rule.parent?.type === "atrule" ? rule.parent.params : null;
    if (!rule.selectors.includes(selector) || scope !== media) return;
    rule.walkDecls(property, declaration => { matches.push(declaration.value); });
  });
  return matches.at(-1);
}

describe("system introduction layout contracts", () => {
  it("bounds the modal to the viewport and keeps long content in its own scroll area", () => {
    expect(value(".system-introduction", "width")).toBe("min(820px, calc(100% - 32px))");
    expect(value(".system-introduction", "max-height")).toBe("calc(100dvh - 32px)");
    expect(value(".system-introduction", "overflow")).toBe("hidden");
    expect(value(".system-introduction[open]", "display")).toBe("grid");
    expect(value(".system-introduction", "grid-template-rows")).toBe("auto minmax(0, 1fr) auto");
    expect(value(".system-introduction-body", "overflow-y")).toBe("auto");
    expect(value(".system-introduction-body", "min-height")).toBe("0");
    expect(value(".system-introduction-body", "overscroll-behavior")).toBe("contain");
  });

  it("uses flat wrapping content and a one-column reading order on mobile", () => {
    expect(value(".system-introduction-advantages", "grid-template-columns")).toBe("repeat(2, minmax(0, 1fr))");
    expect(value(".system-introduction-advantages", "grid-template-columns", "(max-width: 600px)")).toBe("minmax(0, 1fr)");
    expect(value(".system-introduction", "overflow-wrap")).toBe("anywhere");
    expect(value(".system-introduction", "letter-spacing")).toBe("0");
    expect(value(".system-introduction-advantage", "border-radius")).toBeUndefined();
    expect(source).not.toMatch(/font-size:\s*[^;]*vw/);
  });

  it("reserves separate second-row space for the named command on small screens", () => {
    const mobile = "(max-width: 800px)";
    expect(value(".topbar .system-introduction-trigger", "position", mobile)).toBe("absolute");
    expect(value(".topbar .system-introduction-trigger", "right", mobile)).toBe("12px");
    expect(value(".topbar .system-introduction-trigger", "width", mobile)).toBe("96px");
    expect(value(".topbar .system-introduction-trigger", "height", mobile)).toBe("40px");
    expect(value(".dashboard .topbar .view-tabs", "right", mobile)).toBe("116px");
    expect(value(".dashboard .topbar .view-tabs button", "padding", mobile)).toBe("0 6px");
  });

  it("keeps the new command within the narrow desktop topbar budget", () => {
    const narrow = "(min-width: 801px) and (max-width: 1050px)";
    expect(value(".dashboard .topbar", "gap", narrow)).toBe("8px");
    expect(value(".dashboard .topbar .search-wrap input", "width", narrow)).toBe("80px");
    expect(value(".topbar .system-introduction-trigger", "width")).toBe("96px");
    expect(value(".topbar .system-introduction-trigger", "flex-shrink")).toBe("0");
  });
});

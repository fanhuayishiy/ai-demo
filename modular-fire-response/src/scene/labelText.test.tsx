import { describe, it, expect } from "vitest";
import { Fragment } from "react";
import { labelText } from "./labelText";
describe("projected label content", () => {
  it("preserves mixed text and numeric children without markup", () => {
    expect(labelText(["机器犬入内 · ", 2, "/", 3])).toBe("机器犬入内 · 2/3");
  });
  it("flattens fragments and ignores non-rendered values", () => {
    expect(
      labelText(
        <Fragment>
          空中水炮 {false}
          {null}
          <span>· 前瞻概念</span>
        </Fragment>,
      ),
    ).toBe("空中水炮 · 前瞻概念");
  });
});

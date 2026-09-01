import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("loading motion accessibility", () => {
  it("neutralizes every loading animation when reduced motion is requested", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation-duration: .01ms !important");
    expect(css).toContain(".loading-track i, .cooking-track i, .indeterminate-scores i b");
  });
});

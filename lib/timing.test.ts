import { describe, expect, it } from "vitest";
import { elapsedMilliseconds } from "./timing";

describe("development timing", () => {
  it("rounds elapsed time and never reports a negative duration", () => {
    expect(elapsedMilliseconds(100, 125.6)).toBe(26);
    expect(elapsedMilliseconds(100, 90)).toBe(0);
  });
});

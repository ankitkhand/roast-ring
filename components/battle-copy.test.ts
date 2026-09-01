import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("battle opponent labels", () => {
  it("uses character-first labels in the battle UI", () => {
    const source = readFileSync(new URL("./battle-game.tsx", import.meta.url), "utf8");

    expect(source).toContain("YOUR OPPONENT");
    expect(source).toContain("<small>MOUTH</small>");
    expect(source).not.toContain("<small>AI</small>");
  });
});

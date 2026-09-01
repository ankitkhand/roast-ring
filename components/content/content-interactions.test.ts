import { afterEach, describe, expect, it, vi } from "vitest";
import { copyJokeText } from "./content-interactions";

afterEach(() => vi.unstubAllGlobals());

describe("joke copy interaction", () => {
  it("copies the joke through the clipboard without needing an account", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(copyJokeText("Yo mama test joke")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("Yo mama test joke");
  });

  it("fails quietly when clipboard access is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(copyJokeText("Yo mama test joke")).resolves.toBe(false);
  });
});

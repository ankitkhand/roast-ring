import { describe, expect, it, vi } from "vitest";
import {
  battleLoadingMessages,
  judgeLoadingMessages,
  loadingMessageAt,
  minimumDelayRemaining,
  opponentLoadingMessages,
  SingleFlight,
} from "./loading";

describe("theatrical loading helpers", () => {
  it("keeps varied copy centralized for every waiting phase", () => {
    for (const messages of [battleLoadingMessages, opponentLoadingMessages, judgeLoadingMessages]) {
      expect(messages.length).toBeGreaterThanOrEqual(5);
      expect(new Set(messages).size).toBe(messages.length);
      expect(messages.every((message) => message.length <= 64)).toBe(true);
    }
  });

  it("rotates predictably and wraps in both directions", () => {
    expect(loadingMessageAt(["one", "two"], 0)).toBe("one");
    expect(loadingMessageAt(["one", "two"], 2)).toBe("one");
    expect(loadingMessageAt(["one", "two"], -1)).toBe("two");
  });

  it("only holds fast responses for the remaining theatrical minimum", () => {
    expect(minimumDelayRemaining(1_000, 1_000)).toBe(420);
    expect(minimumDelayRemaining(1_000, 1_200)).toBe(220);
    expect(minimumDelayRemaining(1_000, 1_500)).toBe(0);
  });

  it("coalesces duplicate in-flight work but allows the next round", async () => {
    const singleFlight = new SingleFlight();
    let release!: (value: string) => void;
    const pending = new Promise<string>((resolve) => { release = resolve; });
    const task = vi.fn(() => pending);
    const first = singleFlight.run("round-1", task);
    const duplicate = singleFlight.run("round-1", task);
    expect(task).toHaveBeenCalledTimes(1);
    release("joke");
    await expect(Promise.all([first, duplicate])).resolves.toEqual(["joke", "joke"]);
    const nextTask = vi.fn(async () => "next joke");
    await expect(singleFlight.run("round-1", nextTask)).resolves.toBe("next joke");
    expect(nextTask).toHaveBeenCalledTimes(1);
  });

  it("clears failed work so the retry can recover", async () => {
    const singleFlight = new SingleFlight();
    await expect(singleFlight.run("round-1", async () => { throw new Error("missed cue"); })).rejects.toThrow("missed cue");
    await expect(singleFlight.run("round-1", async () => "recovered joke")).resolves.toBe("recovered joke");
  });
});

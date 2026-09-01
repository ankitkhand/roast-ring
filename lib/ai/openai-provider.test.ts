import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiBattleProvider } from "./openai-provider";

const aiJoke = "Yo mama so late, she showed up to tomorrow with an apology.";

afterEach(() => vi.restoreAllMocks());

describe("OpenAI judge safeguards", () => {
  it("recomputes inflated model totals from the categories", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ output_text: JSON.stringify({ userScore: 9.9, aiScore: 7, creativity: 2, savagery: 2, originality: 2, roundWinner: "user", commentary: "The setup forgot the punchline." }) }),
    })));
    const result = await new OpenAiBattleProvider("test-key").judge(aiJoke, "Yo mama so bland, she is just bland.", 1);
    expect(result.userScore).toBe(2);
    expect(result.roundWinner).toBe("ai");
  });

  it("retries malformed structured output, then uses the calibrated fallback", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ output_text: "not-json" }) }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = await new OpenAiBattleProvider("test-key").judge(aiJoke, "Yo mama so funny she is funny.", 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.userScore).toBeGreaterThanOrEqual(2);
    expect(result.userScore).toBeLessThan(4);
  });

  it("does not repeat an expensive judge request after a network failure", async () => {
    const fetchMock = vi.fn(async () => { throw new Error("network down"); });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = await new OpenAiBattleProvider("test-key").judge(aiJoke, "Yo mama so funny she is funny.", 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.userScore).toBeGreaterThanOrEqual(2);
    expect(result.userScore).toBeLessThan(4);
  });

  it("requests concise non-persistent structured judging output", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return {
        ok: true,
        json: async () => ({ output_text: JSON.stringify({ userScore: 6, aiScore: 7, creativity: 6, savagery: 6, originality: 6, roundWinner: "ai", commentary: "A clean attempt, but the payoff needed another turn." }) }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    await new OpenAiBattleProvider("test-key").judge(aiJoke, "Yo mama so late the calendar sent a search party.", 1);
    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body)) as { store?: boolean; prompt_cache_key?: string; text?: { verbosity?: string } };
    expect(body.store).toBe(false);
    expect(body.prompt_cache_key).toBe("roast-arena-judge-v2");
    expect(body.text?.verbosity).toBe("low");
  });
});

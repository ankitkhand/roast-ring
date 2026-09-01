import { describe, expect, it } from "vitest";
import { finalizeJudgement, jokeSimilarity, scoreFromDimensions } from "./judging";
import { judgementSchema } from "./schema";

describe("judging invariants", () => {
  it("recomputes an inflated model score and winner", () => {
    const result = finalizeJudgement(
      { creativity: 4, savagery: 5, originality: 6, aiScore: 7, commentary: "It landed." },
      "Yo mama so late, tomorrow sent a search party.",
      "Yo mama so slow, it takes all day to cross the street.",
    );
    expect(result.userScore).toBe(scoreFromDimensions(result));
    expect(result.userScore).toBe(4.9);
    expect(result.roundWinner).toBe("ai");
    expect(judgementSchema.safeParse(result).success).toBe(true);
  });

  it("rejects internally incoherent structured output", () => {
    const malformed = { creativity: 2, savagery: 2, originality: 2, userScore: 9.9, aiScore: 7, roundWinner: "user", commentary: "Nope." };
    expect(judgementSchema.safeParse(malformed).success).toBe(false);
  });

  it("recognises exact and close copies", () => {
    const original = "Yo mama so loud, her whisper came with a noise complaint.";
    expect(jokeSimilarity(original, original)).toBe(1);
    expect(jokeSimilarity(original, "Yo mama is so loud that her whisper came with a noise complaint.")).toBeGreaterThan(0.7);
  });

  it("cannot be tricked into inflating obvious word salad", () => {
    const result = finalizeJudgement(
      { creativity: 9, savagery: 9, originality: 9, aiScore: 7, commentary: "Contradictory model output." },
      "Yo mama so late, she showed up to tomorrow with an apology.",
      "banana television purple 4729",
    );
    expect(result.userScore).toBeLessThan(1);
  });
});

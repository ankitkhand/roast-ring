import { describe, expect, it } from "vitest";
import { decodeChallenge, decodeResult, encodeChallenge, encodeResult } from "./codec";
import type { BattleResult } from "./types";

const judgement = { userScore: 8, aiScore: 7, creativity: 8, savagery: 8, originality: 8, roundWinner: "user" as const, commentary: "Clean hit." };
const result: BattleResult = {
  version: 1,
  id: "abc123",
  completedAt: "2026-08-25T00:00:00.000Z",
  rounds: [1, 2, 3].map((roundNumber) => ({ roundNumber, aiJoke: "AI joke", userJoke: "User joke", judgement })),
  userTotal: 24,
  aiTotal: 21,
  winner: "user",
  bestLine: "User joke",
};

describe("share codecs", () => {
  it("round-trips a public battle result", () => expect(decodeResult(encodeResult(result))).toEqual(result));
  it("round-trips a challenge", () => {
    const challenge = { version: 1 as const, sourceId: "abc123", challenger: "Ankit", scoreToBeat: 24 };
    expect(decodeChallenge(encodeChallenge(challenge))).toEqual(challenge);
  });
  it("rejects malformed payloads", () => expect(decodeResult("not-a-result")).toBeNull());
});

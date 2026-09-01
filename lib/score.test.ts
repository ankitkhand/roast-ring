import { describe, expect, it } from "vitest";
import { bestLine, getWinner, totals } from "./score";
import type { BattleRound } from "./types";

const round = (roundNumber: number, userScore: number, aiScore: number): BattleRound => ({
  roundNumber,
  aiJoke: `AI ${roundNumber}`,
  userJoke: `User ${roundNumber}`,
  judgement: { userScore, aiScore, creativity: userScore, savagery: userScore, originality: userScore, roundWinner: getWinner(userScore, aiScore), commentary: "Verdict" },
});

describe("battle scoring", () => {
  const rounds = [round(1, 8.2, 7.4), round(2, 7.1, 7.8), round(3, 9.3, 8.1)];
  it("sums three rounds and selects a winner", () => expect(totals(rounds)).toEqual({ userTotal: 24.6, aiTotal: 23.3, winner: "user" }));
  it("selects the highest-scoring line", () => expect(bestLine(rounds)).toBe("User 3"));
});

import type { BattleRound, Winner } from "./types";

export const round1 = (value: number) => Math.round(value * 10) / 10;

export function getWinner(user: number, ai: number): Winner {
  if (Math.abs(user - ai) < 0.05) return "tie";
  return user > ai ? "user" : "ai";
}

export function totals(rounds: BattleRound[]) {
  const userTotal = round1(rounds.reduce((sum, round) => sum + round.judgement.userScore, 0));
  const aiTotal = round1(rounds.reduce((sum, round) => sum + round.judgement.aiScore, 0));
  return { userTotal, aiTotal, winner: getWinner(userTotal, aiTotal) };
}

export function bestLine(rounds: BattleRound[]) {
  const candidates = rounds.flatMap((round) => [
    { line: round.userJoke, score: round.judgement.userScore },
    { line: round.aiJoke, score: round.judgement.aiScore },
  ]);
  return candidates.sort((a, b) => b.score - a.score)[0]?.line ?? "No knockout line recorded.";
}

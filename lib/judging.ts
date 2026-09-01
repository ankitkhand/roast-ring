import { round1 } from "./score";
import type { JudgeContext, Judgement, ScoreBreakdown, Winner } from "./types";

export const SCORE_WEIGHTS = { creativity: 0.4, savagery: 0.3, originality: 0.3 } as const;

export type JudgementCandidate = ScoreBreakdown & {
  aiScore: number;
  commentary: string;
};

export type JudgingFlag = "minimal" | "nonsense" | "prompt-injection" | "ai-copy" | "duplicate" | null;

const clamp = (value: number) => round1(Math.min(10, Math.max(0, value)));

export function scoreFromDimensions(scores: ScoreBreakdown) {
  return round1(
    scores.creativity * SCORE_WEIGHTS.creativity +
    scores.savagery * SCORE_WEIGHTS.savagery +
    scores.originality * SCORE_WEIGHTS.originality,
  );
}

export function getRoundWinner(userScore: number, aiScore: number): Winner {
  if (Math.abs(userScore - aiScore) <= 0.15) return "tie";
  return userScore > aiScore ? "user" : "ai";
}

function normalizedTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !["yo", "mama", "mom", "your", "the", "a", "an"].includes(word));
}

export function jokeSimilarity(first: string, second: string) {
  const a = normalizedTokens(first);
  const b = normalizedTokens(second);
  if (!a.length || !b.length) return 0;
  if (a.join(" ") === b.join(" ")) return 1;
  const aSet = new Set(a);
  const bSet = new Set(b);
  const intersection = [...aSet].filter((token) => bSet.has(token)).length;
  const union = new Set([...aSet, ...bSet]).size;
  const tokenScore = intersection / union;
  const aPairs = new Set(a.slice(1).map((word, index) => `${a[index]} ${word}`));
  const bPairs = new Set(b.slice(1).map((word, index) => `${b[index]} ${word}`));
  const pairIntersection = [...aPairs].filter((pair) => bPairs.has(pair)).length;
  const pairScore = (2 * pairIntersection) / Math.max(1, aPairs.size + bPairs.size);
  return Math.max(tokenScore, pairScore);
}

export function detectJudgingFlag(aiJoke: string, userJoke: string, context: JudgeContext = { previousUserJokes: [] }): JudgingFlag {
  const wordCount = normalizedTokens(userJoke).length;
  if (wordCount <= 2) return "minimal";
  if (/\b(?:ignore|disregard|forget)\b.{0,45}\b(?:instruction|prompt|rule)s?\b|\b(?:give|score|rate)\b.{0,30}\b(?:10\s*(?:\/|out of)\s*10|ten out of ten)\b/i.test(userJoke)) {
    return "prompt-injection";
  }
  const hasBattleTarget = /\b(?:yo(?:ur)? mama|your mom|your mother)\b/i.test(userJoke);
  const hasSentenceStructure = /\b(?:is|are|was|has|have|takes?|asked|applied|filed|needs?|looks?|comes?|went|showed|reads?|races?|keeps?)\b/i.test(userJoke) && /[,.'!?—-]/.test(userJoke);
  if (!hasBattleTarget && !hasSentenceStructure) return "nonsense";
  if (jokeSimilarity(aiJoke, userJoke) >= 0.7) return "ai-copy";
  if (context.previousUserJokes.some((previous) => jokeSimilarity(previous, userJoke) >= 0.68)) return "duplicate";
  return null;
}

export function finalizeJudgement(
  candidate: JudgementCandidate,
  aiJoke: string,
  userJoke: string,
  context: JudgeContext = { previousUserJokes: [] },
): Judgement {
  let creativity = clamp(candidate.creativity);
  let savagery = clamp(candidate.savagery);
  let originality = clamp(candidate.originality);
  const flag = detectJudgingFlag(aiJoke, userJoke, context);

  if (flag === "minimal" || flag === "prompt-injection") {
    creativity = Math.min(creativity, 1.2);
    savagery = Math.min(savagery, 1.1);
    originality = Math.min(originality, 1.2);
  } else if (flag === "nonsense") {
    creativity = Math.min(creativity, 0.8);
    savagery = Math.min(savagery, 0.6);
    originality = Math.min(originality, 1.2);
  } else if (flag === "ai-copy") {
    creativity = Math.min(creativity, 1.8);
    savagery = Math.min(savagery, 2.5);
    originality = Math.min(originality, 0.2);
  } else if (flag === "duplicate") {
    creativity = Math.min(creativity, 4.5);
    originality = Math.min(originality, 0.5);
  }

  const userScore = scoreFromDimensions({ creativity, savagery, originality });
  const aiScore = clamp(candidate.aiScore);
  return {
    creativity,
    savagery,
    originality,
    userScore,
    aiScore,
    roundWinner: getRoundWinner(userScore, aiScore),
    commentary: candidate.commentary.trim().slice(0, 160),
  };
}

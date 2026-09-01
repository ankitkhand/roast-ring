import { detectJudgingFlag, finalizeJudgement, scoreFromDimensions } from "@/lib/judging";
import { round1 } from "@/lib/score";
import type { JudgeContext, OpponentContext, ScoreBreakdown } from "@/lib/types";
import type { BattleAiProvider } from "./provider";

const jokes = [
  "Yo mama so late, she showed up to tomorrow with an apology.",
  "Yo mama so dramatic, her grocery list has a season finale.",
  "Yo mama so loud, her whisper came with a noise complaint.",
  "Yo mama so clumsy, gravity keeps asking for a rematch.",
  "Yo mama so old-school, her emojis arrive by carrier pigeon.",
  "Yo mama so forgetful, she put a password on her password.",
  "Yo mama so extra, her shadow has a backup dancer.",
  "Yo mama cooks so badly, the smoke alarm leaves restaurant reviews.",
  "Yo mama so slow, snails pass her and yell, ‘Keep up!’",
  "Yo mama so unlucky, her four-leaf clover filed for a transfer.",
  "Yo mama so messy, even her junk drawer has a junk drawer.",
  "Yo mama so cheap, she asks free samples for a payment plan.",
  "Yo mama so nosy, surprise parties send her calendar invites.",
  "Yo mama so sleepy, her alarm clock applied for another job.",
  "Yo mama so competitive, she races the microwave and still trash-talks it.",
  "Yo mama dances so badly, the beat filed a restraining order.",
  "Yo mama so indecisive, even her coin flips land on ‘maybe.’",
  "Yo mama so impatient, she reads spoilers during the opening credits.",
];

const commentaryByBand = {
  nonsense: ["The judge is still looking for the joke.", "Those words met for the first time today.", "Even the scoreboard is confused.", "A sentence happened. A joke did not."],
  weak: ["That joke arrived without a punchline.", "The setup showed up. The comedy didn’t.", "The Mouth barely had to duck.", "That swing generated a light breeze."],
  average: ["It landed, but nobody needed medical attention.", "Decent swing. Predictable landing.", "The crowd nodded politely. Brutal room.", "A real joke—just not a dangerous one."],
  good: ["Okay, that one actually connected.", "The Mouth felt that one.", "Clean setup, solid hit. Now we’re battling.", "That got a proper noise out of the crowd."],
  strong: ["Somebody check on The Mouth. That was brutal.", "That one needs a replay.", "Sharp, clean, and straight through the guard.", "The Mouth is pretending that didn’t hurt."],
  exceptional: ["The arena just lost its mind.", "That was criminal.", "Stop the fight. We have a highlight reel.", "The judges stood up before the punchline finished."],
  duplicate: ["The judges remember that one. Originality does too.", "Same punch, second swing, much less damage.", "The replay booth says we’ve seen this already."],
  copy: ["You can’t steal The Mouth’s homework in front of The Mouth.", "That joke still has The Mouth’s fingerprints on it.", "Bold strategy: returning the opponent’s own punchline."],
} as const;

function hash(value: string) {
  return [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
}

const clamp = (value: number) => round1(Math.min(10, Math.max(0, value)));

function repeatedPunchline(joke: string) {
  const content = joke.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !["mama", "your", "she", "her", "that", "this", "with", "very", "really", "because"].includes(word));
  const finalWord = content.at(-1);
  return Boolean(finalWord && content.slice(0, -1).includes(finalWord) && content.length <= 8);
}

export function localDimensions(joke: string): ScoreBreakdown {
  const words = joke.trim().split(/\s+/).filter(Boolean);
  const lower = joke.toLowerCase();
  const hasTarget = /\b(?:yo(?:ur)? mama|your mom|your mother)\b/i.test(joke);
  const hasSetup = hasTarget && /\bso\b/i.test(joke);
  const hasClauseBreak = /[,;—-]/.test(joke);
  const hasPayoffSignal = /\b(?:even|asked|applied|filed|needs?|comes? with|after|when|because|until|still|landed|left|started)\b/i.test(joke);
  const hasVerb = /\b(?:is|are|was|has|have|takes?|asked|applied|filed|needs?|looks?|comes?|went|showed|reads?|races?|keeps?)\b/i.test(joke);
  const specificWords = words.filter((word) => word.replace(/[^a-z]/gi, "").length >= 7).length;
  const specificity = Math.min(1.4, specificWords * 0.35);
  const isConcise = words.length >= 8 && words.length <= 25;
  const isVerbose = words.length > 34;
  const tautology = /\bso\s+(\w+)(?:\s+\w+){0,5}\s+\1\b[.!?]*$/i.test(joke.trim()) || repeatedPunchline(joke);
  const cliche = /\bso\s+(?:fat|ugly|stupid|dumb|old)\b/i.test(joke) && !hasPayoffSignal;

  if (words.length <= 3) return { creativity: 0.7, savagery: 0.7, originality: 0.9 };
  if (!hasTarget && (!hasVerb || !/[,.!?]/.test(joke))) return { creativity: 0.6, savagery: 0.3, originality: 1.0 };
  if (!hasTarget) return { creativity: 1.2, savagery: 0.8, originality: 1.4 };
  if (tautology) return { creativity: 2.5, savagery: 2.2, originality: 2.8 };

  const twist = hasPayoffSignal ? 0.8 : 0;
  const personification = /\b(?:manager|alarm|clock|gravity|shadow|drawer|clover|beat|microwave|calendar|smoke alarm|password)\b.{0,28}\b(?:asked|applied|filed|needs?|keeps?|leaves?|landed|sends?)\b/i.test(lower) ? 0.5 : 0;
  const lengthPenalty = isVerbose ? 1.8 : words.length > 27 ? 0.7 : 0;
  const clichePenalty = cliche ? 1.2 : 0;

  return {
    creativity: clamp(2.1 + (hasTarget ? 0.5 : 0) + (hasSetup ? 0.5 : 0) + (hasPayoffSignal ? 0.9 : 0) + (hasClauseBreak ? 0.6 : 0) + specificity + twist + personification + (isConcise ? 0.3 : 0) - lengthPenalty - clichePenalty),
    savagery: clamp(2.4 + (hasTarget ? 0.5 : 0) + (hasSetup ? 0.4 : 0) + (hasClauseBreak ? 1.3 : 0) + (/\b(?:bad|slow|late|loud|messy|cheap|clumsy|forgetful|dramatic|sleepy|unlucky)\b/i.test(joke) ? 0.5 : 0) + (isConcise ? 0.4 : 0) + twist + Math.min(0.6, specificity) - lengthPenalty),
    originality: clamp(2.6 + (hasClauseBreak ? 1 : 0) + Math.min(1.6, specificity * 1.15) + twist + personification + (isConcise ? 0.3 : 0) - lengthPenalty - clichePenalty),
  };
}

export function localAiScore(joke: string) {
  return clamp(Math.min(8.2, Math.max(6.4, scoreFromDimensions(localDimensions(joke)) + 0.3)));
}

function pickCommentary(userScore: number, flag: ReturnType<typeof detectJudgingFlag>, userJoke: string, roundNumber: number) {
  const band = flag === "ai-copy" ? "copy" : flag === "duplicate" ? "duplicate" : userScore < 2 ? "nonsense" : userScore < 4 ? "weak" : userScore < 6 ? "average" : userScore < 7.5 ? "good" : userScore < 9.5 ? "strong" : "exceptional";
  const options = commentaryByBand[band];
  return options[hash(`${userJoke}:${roundNumber}`) % options.length];
}

export class LocalBattleProvider implements BattleAiProvider {
  async opponentJoke(roundNumber: number, battleSeed: string, context: OpponentContext = { previousAiJokes: [] }) {
    const start = hash(battleSeed) % jokes.length;
    const preferred = jokes[(start + (roundNumber - 1) * 7) % jokes.length];
    return context.previousAiJokes.includes(preferred) ? jokes[(start + roundNumber * 7 + 1) % jokes.length] : preferred;
  }

  async judge(aiJoke: string, userJoke: string, roundNumber: number, context: JudgeContext = { previousUserJokes: [] }) {
    const dimensions = localDimensions(userJoke);
    const aiScore = localAiScore(aiJoke);
    const initial = finalizeJudgement({ ...dimensions, aiScore, commentary: "Judging…" }, aiJoke, userJoke, context);
    return { ...initial, commentary: pickCommentary(initial.userScore, detectJudgingFlag(aiJoke, userJoke, context), userJoke, roundNumber) };
  }
}

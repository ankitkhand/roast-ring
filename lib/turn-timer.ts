import { localAiScore } from "./ai/local-provider";
import type { BattleRound, Judgement } from "./types";

export const TURN_DURATION_SECONDS = 45;

export const timerMessages = {
  thirtySeconds: "Clock’s ticking...",
  fifteenSeconds: "15 seconds. Don’t choke.",
  finalFive: "Final five. Make it hurt.",
  timeout: [
    "The Mouth takes the round.",
    "You got cooked by the clock.",
    "The scoreboard got tired of waiting.",
    "The Mouth wins by silence.",
  ],
} as const;

export type TimerStage = "normal" | "warning" | "pressure" | "final" | "expired";
export type TurnResolution = "idle" | "open" | "submitted" | "timed-out";
export type SubmissionClaim = "submitted" | "timed-out" | "closed";

export function turnDurationForBattle(challengeBattle = false) {
  void challengeBattle;
  return TURN_DURATION_SECONDS;
}

export function secondsRemaining(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}

export function formatTurnTime(seconds: number) {
  return `00:${Math.max(0, Math.min(99, seconds)).toString().padStart(2, "0")}`;
}

export function timerStage(seconds: number): TimerStage {
  if (seconds <= 0) return "expired";
  if (seconds <= 5) return "final";
  if (seconds <= 15) return "pressure";
  if (seconds <= 30) return "warning";
  return "normal";
}

export function timerSupportingCopy(seconds: number) {
  const stage = timerStage(seconds);
  if (stage === "warning") return timerMessages.thirtySeconds;
  if (stage === "pressure") return timerMessages.fifteenSeconds;
  if (stage === "final") return timerMessages.finalFive;
  return "";
}

export function timerAnnouncement(seconds: number) {
  const stage = timerStage(seconds);
  if (stage === "warning") return "30 seconds remaining. Clock’s ticking.";
  if (stage === "pressure") return "15 seconds remaining. Don’t choke.";
  if (stage === "final") return "5 seconds remaining.";
  if (stage === "expired") return "Time expired.";
  return "";
}

export function createTimeoutJudgement(aiJoke: string, roundNumber: number): Judgement {
  return {
    creativity: 0,
    savagery: 0,
    originality: 0,
    userScore: 0,
    aiScore: localAiScore(aiJoke),
    roundWinner: "ai",
    commentary: timerMessages.timeout[(roundNumber - 1) % timerMessages.timeout.length],
  };
}

export function createTimeoutRound(aiJoke: string, roundNumber: number): BattleRound {
  return {
    roundNumber,
    aiJoke,
    userJoke: "",
    judgement: createTimeoutJudgement(aiJoke, roundNumber),
    timedOut: true,
  };
}

export class TurnClock {
  private deadline = 0;
  private resolution: TurnResolution = "idle";

  start(now = Date.now(), durationSeconds = TURN_DURATION_SECONDS) {
    this.deadline = now + durationSeconds * 1_000;
    this.resolution = "open";
  }

  remaining(now = Date.now()) {
    return this.resolution === "idle" ? 0 : secondsRemaining(this.deadline, now);
  }

  claimSubmission(now = Date.now()): SubmissionClaim {
    if (this.resolution !== "open") return "closed";
    if (this.remaining(now) === 0) {
      this.resolution = "timed-out";
      return "timed-out";
    }
    this.resolution = "submitted";
    return "submitted";
  }

  claimTimeout(now = Date.now()) {
    if (this.resolution !== "open" || this.remaining(now) > 0) return false;
    this.resolution = "timed-out";
    return true;
  }

  status() {
    return this.resolution;
  }
}

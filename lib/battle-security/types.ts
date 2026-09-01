import type { BattleRound, Judgement } from "@/lib/types";
import type { RateLimitReason } from "./config";

export type BattleActionType = "opponent" | "judge" | "timeout";
export type BattleStatus = "active" | "completed" | "expired";
export type ExpectedBattleAction = "opponent" | "response" | null;

export type BattleActionResponse =
  | { action: "opponent"; roundNumber: number; joke: string }
  | { action: "judge"; roundNumber: number; judgement: Judgement; battleComplete: boolean }
  | { action: "timeout"; roundNumber: number; judgement: Judgement; timedOut: true; battleComplete: boolean };

export type StoredAction = {
  actionId: string;
  status: "in_progress" | "completed";
  startedAt: number;
  response?: BattleActionResponse;
};

export type StoredRound = Partial<BattleRound> & {
  roundNumber: number;
  aiJoke?: string;
  responseDeadlineAt?: number;
};

export type BattleSessionState = {
  version: 1;
  battleId: string;
  sessionKey: string;
  status: BattleStatus;
  currentRound: 1 | 2 | 3;
  expectedAction: ExpectedBattleAction;
  createdAt: number;
  expiresAt: number;
  challenged: boolean;
  calls: { opponent: number; judge: number };
  inFlight?: { actionId: string; action: BattleActionType; roundNumber: number; startedAt: number };
  actions: Record<string, StoredAction>;
  rounds: StoredRound[];
};

export type AbuseIdentity = {
  sessionId: string;
  sessionKey: string;
  networkKey: string;
  isNewSession: boolean;
};

export type StartBattleInput = {
  actionId: string;
  challenged: boolean;
};

export type BattleActionInput = {
  action: BattleActionType;
  actionId: string;
  battleId: string;
  roundNumber: number;
  userJoke?: string;
};

export type StartStoreResult =
  | { kind: "started"; battleId: string; roundNumber: 1; duplicate: boolean }
  | { kind: "limited"; reason: RateLimitReason; retryAfterSeconds: number };

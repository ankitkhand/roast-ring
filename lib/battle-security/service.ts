import { randomUUID } from "node:crypto";
import type { BattleAiProvider } from "@/lib/ai/provider";
import { createTimeoutRound, TURN_DURATION_SECONDS } from "@/lib/turn-timer";
import { BATTLE_LIMITS } from "./config";
import { BattleSecurityError, unavailableError } from "./errors";
import { securityLog } from "./logging";
import { BattleStoreUnavailableError, type BattleStore } from "./store";
import type {
  AbuseIdentity,
  BattleActionInput,
  BattleActionResponse,
  BattleSessionState,
  StartBattleInput,
} from "./types";

function actionKey(action: BattleActionInput["action"], roundNumber: number) {
  return `${action}:${roundNumber}`;
}

function battleReference(battleId: string) {
  return battleId.slice(0, 8);
}

export class BattleSessionService {
  constructor(
    private readonly store: BattleStore,
    private readonly provider: BattleAiProvider,
    private readonly options: { now?: () => number; randomId?: () => string } = {},
  ) {}

  private now() {
    return (this.options.now ?? Date.now)();
  }

  private randomId() {
    return (this.options.randomId ?? randomUUID)();
  }

  async start(identity: AbuseIdentity, input: StartBattleInput) {
    const now = this.now();
    const state: BattleSessionState = {
      version: 1,
      battleId: this.randomId(),
      sessionKey: identity.sessionKey,
      status: "active",
      currentRound: 1,
      expectedAction: "opponent",
      createdAt: now,
      expiresAt: now + BATTLE_LIMITS.battleTtlSeconds * 1_000,
      challenged: input.challenged,
      calls: { opponent: 0, judge: 0 },
      actions: {},
      rounds: [],
    };
    try {
      const result = await this.store.createBattle({ state, startActionId: input.actionId, networkKey: identity.networkKey });
      if (result.kind === "limited") {
        securityLog("rate_limit_hit", { reason: result.reason, retryAfterSeconds: result.retryAfterSeconds });
        const daily = result.reason === "session_daily" || result.reason === "ip_daily";
        throw new BattleSecurityError(
          "rate_limited",
          429,
          daily ? "THE ARENA IS CLOSED FOR YOU... FOR NOW." : "THE MOUTH NEEDS A MINUTE.",
          daily ? "You’ve hit today’s battle limit. Come back tomorrow." : "You’ve been roasting like it’s your full-time job. Try again shortly.",
          result.reason,
          result.retryAfterSeconds,
        );
      }
      return result;
    } catch (error) {
      if (error instanceof BattleSecurityError) throw error;
      securityLog("store_unavailable", { operation: "start" });
      throw unavailableError();
    }
  }

  private assertOwnership(state: BattleSessionState, identity: AbuseIdentity) {
    if (state.sessionKey !== identity.sessionKey) {
      securityLog("invalid_transition", { battle: battleReference(state.battleId), reason: "wrong_session" });
      throw new BattleSecurityError("battle_forbidden", 403, "This battle went cold. Start a new one.", undefined, "wrong_session");
    }
  }

  private async assertActive(state: BattleSessionState) {
    if (state.status === "completed") throw new BattleSecurityError("battle_completed", 409, "This battle is already over.");
    if (state.status === "expired" || state.expiresAt <= this.now()) {
      if (state.status !== "expired") {
        state.status = "expired";
        await this.store.setBattle(state);
      }
      securityLog("expired_battle", { battle: battleReference(state.battleId) });
      throw new BattleSecurityError("battle_expired", 410, "This battle went cold. Start a new one.");
    }
  }

  private completedDuplicate(state: BattleSessionState, input: BattleActionInput) {
    const stored = state.actions[actionKey(input.action, input.roundNumber)];
    if (stored?.status === "completed" && stored.actionId === input.actionId && stored.response) {
      securityLog("duplicate_action", { battle: battleReference(state.battleId), action: input.action, round: input.roundNumber });
      return stored.response;
    }
    return null;
  }

  private validateTransition(state: BattleSessionState, input: BattleActionInput) {
    if (!Number.isInteger(input.roundNumber) || input.roundNumber < 1 || input.roundNumber > BATTLE_LIMITS.battleRounds) {
      throw new BattleSecurityError("invalid_round", 409, "That round isn’t on the card.", undefined, "round_out_of_range");
    }
    if (input.roundNumber !== state.currentRound) {
      securityLog("invalid_transition", { battle: battleReference(state.battleId), action: input.action, round: input.roundNumber, expectedRound: state.currentRound });
      throw new BattleSecurityError("invalid_round", 409, "That round isn’t ready yet.", undefined, "wrong_round");
    }
    const expected = input.action === "opponent" ? "opponent" : "response";
    if (state.expectedAction !== expected) {
      securityLog("invalid_transition", { battle: battleReference(state.battleId), action: input.action, round: input.roundNumber, expected: state.expectedAction ?? "none" });
      throw new BattleSecurityError("invalid_round", 409, "That roast has already moved on.", undefined, "wrong_action");
    }
    const existing = state.actions[actionKey(input.action, input.roundNumber)];
    if (existing && existing.actionId !== input.actionId) {
      throw new BattleSecurityError("invalid_round", 409, "That roast has already moved on.", undefined, "action_already_recorded");
    }
    if (input.action === "opponent" && state.calls.opponent >= BATTLE_LIMITS.battleRounds) {
      securityLog("maximum_calls_reached", { battle: battleReference(state.battleId), action: input.action });
      throw new BattleSecurityError("maximum_calls_reached", 409, "This battle is already out of rounds.");
    }
    if (input.action === "judge" && state.calls.judge >= BATTLE_LIMITS.battleRounds) {
      securityLog("maximum_calls_reached", { battle: battleReference(state.battleId), action: input.action });
      throw new BattleSecurityError("maximum_calls_reached", 409, "The judge has closed the scorecard.");
    }
    if (input.action !== "opponent") {
      const round = state.rounds.find((candidate) => candidate.roundNumber === input.roundNumber);
      if (!round?.aiJoke) throw new BattleSecurityError("invalid_round", 409, "The Mouth hasn’t taken the stage yet.");
      if (input.action === "judge" && !input.userJoke) {
        throw new BattleSecurityError("invalid_round", 400, "The judge needs a joke to score.");
      }
      if (input.action === "timeout" && (!round.responseDeadlineAt || this.now() < round.responseDeadlineAt)) {
        throw new BattleSecurityError("invalid_round", 409, "The clock is still running.", undefined, "timeout_too_early");
      }
    }
  }

  private advanceAfterResponse(state: BattleSessionState) {
    if (state.currentRound === BATTLE_LIMITS.battleRounds) {
      state.status = "completed";
      state.expectedAction = null;
      return true;
    }
    state.currentRound = (state.currentRound + 1) as 1 | 2 | 3;
    state.expectedAction = "opponent";
    return false;
  }

  async act(identity: AbuseIdentity, input: BattleActionInput): Promise<{ response: BattleActionResponse; duplicate: boolean }> {
    let initial: BattleSessionState | null;
    try {
      initial = await this.store.getBattle(input.battleId);
    } catch {
      securityLog("store_unavailable", { operation: "read" });
      throw unavailableError();
    }
    if (!initial) throw new BattleSecurityError("battle_not_found", 404, "This battle went cold. Start a new one.");
    this.assertOwnership(initial, identity);
    const earlyDuplicate = this.completedDuplicate(initial, input);
    if (earlyDuplicate) return { response: earlyDuplicate, duplicate: true };

    const lockToken = this.randomId();
    let locked = false;
    let reserved = false;
    try {
      locked = await this.store.acquireBattleLock(input.battleId, lockToken, BATTLE_LIMITS.actionLockMs);
      if (!locked) {
        const latest = await this.store.getBattle(input.battleId);
        if (latest) {
          this.assertOwnership(latest, identity);
          const duplicate = this.completedDuplicate(latest, input);
          if (duplicate) return { response: duplicate, duplicate: true };
        }
        securityLog("concurrency_collision", { battle: battleReference(input.battleId), action: input.action, round: input.roundNumber });
        throw new BattleSecurityError("action_in_progress", 409, "That roast is already being judged.", "Give it a moment.", undefined, 2);
      }

      const state = await this.store.getBattle(input.battleId);
      if (!state) throw new BattleSecurityError("battle_not_found", 404, "This battle went cold. Start a new one.");
      this.assertOwnership(state, identity);
      const duplicate = this.completedDuplicate(state, input);
      if (duplicate) return { response: duplicate, duplicate: true };
      await this.assertActive(state);
      if (state.inFlight) {
        const stale = state.inFlight.startedAt + BATTLE_LIMITS.actionLockMs <= this.now();
        if (stale) {
          state.status = "expired";
          await this.store.setBattle(state);
          securityLog("expired_battle", { battle: battleReference(state.battleId), reason: "stale_action" });
          throw new BattleSecurityError("battle_expired", 410, "This battle went cold. Start a new one.");
        }
        throw new BattleSecurityError("action_in_progress", 409, "That roast is already being judged.", "Give it a moment.", undefined, 2);
      }
      this.validateTransition(state, input);

      const key = actionKey(input.action, input.roundNumber);
      state.inFlight = { actionId: input.actionId, action: input.action, roundNumber: input.roundNumber, startedAt: this.now() };
      state.actions[key] = { actionId: input.actionId, status: "in_progress", startedAt: this.now() };
      if (input.action === "opponent") state.calls.opponent += 1;
      if (input.action === "judge") state.calls.judge += 1;
      await this.store.setBattle(state);
      reserved = true;

      let response: BattleActionResponse;
      if (input.action === "opponent") {
        const previousAiJokes = state.rounds.flatMap((round) => round.aiJoke ? [round.aiJoke] : []);
        const joke = await this.provider.opponentJoke(input.roundNumber, state.battleId, { previousAiJokes });
        state.rounds.push({ roundNumber: input.roundNumber, aiJoke: joke, responseDeadlineAt: this.now() + TURN_DURATION_SECONDS * 1_000 });
        state.expectedAction = "response";
        response = { action: "opponent", roundNumber: input.roundNumber, joke };
      } else {
        const round = state.rounds.find((candidate) => candidate.roundNumber === input.roundNumber);
        if (!round?.aiJoke) throw new Error("Validated battle round disappeared");
        if (input.action === "judge") {
          if (!input.userJoke) throw new Error("Validated joke disappeared");
          const previousUserJokes = state.rounds.flatMap((candidate) => candidate.userJoke && !candidate.timedOut ? [candidate.userJoke] : []);
          const judgement = await this.provider.judge(round.aiJoke, input.userJoke, input.roundNumber, { previousUserJokes });
          Object.assign(round, { userJoke: input.userJoke, judgement, timedOut: false });
          const battleComplete = this.advanceAfterResponse(state);
          response = { action: "judge", roundNumber: input.roundNumber, judgement, battleComplete };
        } else {
          const timedOut = createTimeoutRound(round.aiJoke, input.roundNumber);
          Object.assign(round, timedOut);
          const battleComplete = this.advanceAfterResponse(state);
          response = { action: "timeout", roundNumber: input.roundNumber, judgement: timedOut.judgement, timedOut: true, battleComplete };
        }
      }

      state.actions[key] = { actionId: input.actionId, status: "completed", startedAt: state.actions[key].startedAt, response };
      delete state.inFlight;
      await this.store.setBattle(state);
      return { response, duplicate: false };
    } catch (error) {
      if (reserved && !(error instanceof BattleSecurityError)) {
        try {
          const state = await this.store.getBattle(input.battleId);
          if (state) {
            state.status = "expired";
            delete state.inFlight;
            await this.store.setBattle(state);
          }
        } catch {
          securityLog("store_unavailable", { operation: "expire_after_failure" });
        }
      }
      if (error instanceof BattleSecurityError) throw error;
      if (error instanceof BattleStoreUnavailableError) {
        securityLog("store_unavailable", { operation: "action" });
        throw unavailableError();
      }
      throw error;
    } finally {
      if (locked) {
        try {
          await this.store.releaseBattleLock(input.battleId, lockToken);
        } catch {
          securityLog("store_unavailable", { operation: "release_lock" });
        }
      }
    }
  }
}

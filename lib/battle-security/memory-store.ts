import { BATTLE_LIMITS, type RateLimitReason } from "./config";
import type { BattleStore } from "./store";
import type { BattleSessionState, StartStoreResult } from "./types";

type Counter = { count: number; expiresAt: number };
type Lock = { token: string; expiresAt: number };

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryBattleStore implements BattleStore {
  private readonly battles = new Map<string, BattleSessionState>();
  private readonly starts = new Map<string, { result: StartStoreResult; expiresAt: number }>();
  private readonly counters = new Map<string, Counter>();
  private readonly locks = new Map<string, Lock>();

  constructor(private readonly now: () => number = Date.now) {}

  private increment(key: string, max: number, windowSeconds: number) {
    const now = this.now();
    const bucket = Math.floor(now / (windowSeconds * 1_000));
    const bucketKey = `${key}:${bucket}`;
    const existing = this.counters.get(bucketKey);
    const record = existing && existing.expiresAt > now
      ? existing
      : { count: 0, expiresAt: (bucket + 1) * windowSeconds * 1_000 };
    record.count += 1;
    this.counters.set(bucketKey, record);
    return { allowed: record.count <= max, retryAfterSeconds: Math.max(1, Math.ceil((record.expiresAt - now) / 1_000)) };
  }

  async createBattle({ state, startActionId, networkKey }: { state: BattleSessionState; startActionId: string; networkKey: string }) {
    const idempotencyKey = `${state.sessionKey}:${startActionId}`;
    const previous = this.starts.get(idempotencyKey);
    if (previous && previous.expiresAt > this.now()) {
      return { ...clone(previous.result), duplicate: true } as StartStoreResult;
    }

    const checks: Array<[RateLimitReason, string, number, number]> = [
      ["session_short_window", `session-short:${state.sessionKey}`, BATTLE_LIMITS.sessionShortWindow.max, BATTLE_LIMITS.sessionShortWindow.windowSeconds],
      ["session_daily", `session-daily:${state.sessionKey}`, BATTLE_LIMITS.sessionDaily.max, BATTLE_LIMITS.sessionDaily.windowSeconds],
      ["ip_short_window", `network-short:${networkKey}`, BATTLE_LIMITS.ipShortWindow.max, BATTLE_LIMITS.ipShortWindow.windowSeconds],
      ["ip_daily", `network-daily:${networkKey}`, BATTLE_LIMITS.ipDaily.max, BATTLE_LIMITS.ipDaily.windowSeconds],
    ];
    for (const [reason, key, max, windowSeconds] of checks) {
      const result = this.increment(key, max, windowSeconds);
      if (!result.allowed) return { kind: "limited" as const, reason, retryAfterSeconds: result.retryAfterSeconds };
    }

    const result = { kind: "started" as const, battleId: state.battleId, roundNumber: 1 as const, duplicate: false };
    this.battles.set(state.battleId, clone(state));
    this.starts.set(idempotencyKey, { result, expiresAt: this.now() + BATTLE_LIMITS.startIdempotencySeconds * 1_000 });
    return result;
  }

  async getBattle(battleId: string) {
    const state = this.battles.get(battleId);
    if (!state) return null;
    if (state.expiresAt + BATTLE_LIMITS.expiredRecordGraceSeconds * 1_000 <= this.now()) {
      this.battles.delete(battleId);
      return null;
    }
    return clone(state);
  }

  async setBattle(state: BattleSessionState) {
    this.battles.set(state.battleId, clone(state));
  }

  async acquireBattleLock(battleId: string, token: string, ttlMs: number) {
    const existing = this.locks.get(battleId);
    if (existing && existing.expiresAt > this.now()) return false;
    this.locks.set(battleId, { token, expiresAt: this.now() + ttlMs });
    return true;
  }

  async releaseBattleLock(battleId: string, token: string) {
    if (this.locks.get(battleId)?.token === token) this.locks.delete(battleId);
  }

  reset() {
    this.battles.clear();
    this.starts.clear();
    this.counters.clear();
    this.locks.clear();
  }
}

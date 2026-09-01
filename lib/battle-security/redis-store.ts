import { Redis } from "@upstash/redis";
import { BATTLE_LIMITS } from "./config";
import type { BattleStore } from "./store";
import type { BattleSessionState, StartStoreResult } from "./types";

const START_SCRIPT = `
local previous = redis.call("GET", KEYS[1])
if previous then return previous end

for index = 2, 5 do
  local count = redis.call("INCR", KEYS[index])
  if count == 1 then redis.call("EXPIRE", KEYS[index], tonumber(ARGV[index - 1]) + 2) end
  if count > tonumber(ARGV[index + 3]) then
    return cjson.encode({kind="limited", reason=ARGV[index + 7], retryAfterSeconds=tonumber(ARGV[index + 11])})
  end
end

redis.call("SET", KEYS[6], ARGV[17], "EX", tonumber(ARGV[18]))
redis.call("SET", KEYS[1], ARGV[19], "EX", tonumber(ARGV[20]))
return ARGV[19]
`;

const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

function bucketKey(prefix: string, identity: string, windowSeconds: number, now: number) {
  return `ra:${prefix}:${identity}:${Math.floor(now / (windowSeconds * 1_000))}`;
}

export class RedisBattleStore implements BattleStore {
  private readonly redis: Redis;

  constructor(url: string, token: string, private readonly now: () => number = Date.now) {
    this.redis = new Redis({ url, token, automaticDeserialization: false });
  }

  private battleKey(battleId: string) {
    return `ra:battle:${battleId}`;
  }

  private lockKey(battleId: string) {
    return `ra:battle-lock:${battleId}`;
  }

  async createBattle({ state, startActionId, networkKey }: { state: BattleSessionState; startActionId: string; networkKey: string }) {
    const now = this.now();
    const windows = [
      BATTLE_LIMITS.sessionShortWindow.windowSeconds,
      BATTLE_LIMITS.sessionDaily.windowSeconds,
      BATTLE_LIMITS.ipShortWindow.windowSeconds,
      BATTLE_LIMITS.ipDaily.windowSeconds,
    ];
    const retryAfter = windows.map((windowSeconds) => windowSeconds - Math.floor((now / 1_000) % windowSeconds));
    const result: StartStoreResult = { kind: "started", battleId: state.battleId, roundNumber: 1, duplicate: false };
    const raw = await this.redis.eval<string[], string>(START_SCRIPT, [
      `ra:start:${state.sessionKey}:${startActionId}`,
      bucketKey("session-short", state.sessionKey, windows[0], now),
      bucketKey("session-daily", state.sessionKey, windows[1], now),
      bucketKey("network-short", networkKey, windows[2], now),
      bucketKey("network-daily", networkKey, windows[3], now),
      this.battleKey(state.battleId),
    ], [
      ...windows.map(String),
      String(BATTLE_LIMITS.sessionShortWindow.max),
      String(BATTLE_LIMITS.sessionDaily.max),
      String(BATTLE_LIMITS.ipShortWindow.max),
      String(BATTLE_LIMITS.ipDaily.max),
      "session_short_window",
      "session_daily",
      "ip_short_window",
      "ip_daily",
      ...retryAfter.map(String),
      JSON.stringify(state),
      String(BATTLE_LIMITS.battleTtlSeconds + BATTLE_LIMITS.expiredRecordGraceSeconds),
      JSON.stringify(result),
      String(BATTLE_LIMITS.startIdempotencySeconds),
    ]);
    const parsed = JSON.parse(raw) as StartStoreResult;
    return parsed.kind === "started" && parsed.battleId !== state.battleId ? { ...parsed, duplicate: true } : parsed;
  }

  async getBattle(battleId: string) {
    const raw = await this.redis.get<string>(this.battleKey(battleId));
    return raw ? JSON.parse(raw) as BattleSessionState : null;
  }

  async setBattle(state: BattleSessionState) {
    const ttl = Math.max(1, Math.ceil((state.expiresAt - this.now()) / 1_000) + BATTLE_LIMITS.expiredRecordGraceSeconds);
    await this.redis.set(this.battleKey(state.battleId), JSON.stringify(state), { ex: ttl });
  }

  async acquireBattleLock(battleId: string, token: string, ttlMs: number) {
    return await this.redis.set(this.lockKey(battleId), token, { nx: true, px: ttlMs }) === "OK";
  }

  async releaseBattleLock(battleId: string, token: string) {
    await this.redis.eval(RELEASE_LOCK_SCRIPT, [this.lockKey(battleId)], [token]);
  }
}

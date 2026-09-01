import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BattleAiProvider } from "@/lib/ai/provider";
import { MemoryBattleStore } from "./memory-store";
import { RedisBattleStore } from "./redis-store";
import { BattleSessionService } from "./service";
import {
  BattleStoreConfigurationError,
  getBattleStore,
  setBattleStoreForTests,
  validateBattleStoreConfiguration,
} from "./store-factory";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("BATTLE_STORE", undefined);
  vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
  vi.stubEnv("RATE_LIMIT_HASH_SECRET", undefined);
  setBattleStoreForTests(undefined);
});

afterEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  setBattleStoreForTests(undefined);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("explicit battle-store selection", () => {
  it("selects MemoryBattleStore for BATTLE_STORE=memory", () => {
    vi.stubEnv("BATTLE_STORE", "memory");
    expect(getBattleStore()).toBeInstanceOf(MemoryBattleStore);
  });

  it("selects RedisBattleStore for BATTLE_STORE=redis without contacting Redis", () => {
    vi.stubEnv("BATTLE_STORE", "redis");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.invalid");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token-not-a-secret");
    expect(getBattleStore()).toBeInstanceOf(RedisBattleStore);
  });

  it("fails safely when Redis mode is missing credentials", () => {
    vi.stubEnv("BATTLE_STORE", "redis");
    expect(() => getBattleStore()).toThrowError(BattleStoreConfigurationError);
    expect(() => getBattleStore()).toThrow("BATTLE_STORE=redis requires");
  });

  it("does not require Redis credentials in memory mode", () => {
    vi.stubEnv("BATTLE_STORE", "memory");
    expect(validateBattleStoreConfiguration()).toBe("memory");
  });

  it("fails clearly for an unknown backend instead of choosing a store", () => {
    vi.stubEnv("BATTLE_STORE", "filesystem");
    expect(() => getBattleStore()).toThrow("Unsupported BATTLE_STORE value");
  });

  it("requires explicit selection when BATTLE_STORE is missing", () => {
    expect(() => getBattleStore()).toThrow("BATTLE_STORE must be set");
  });

  it("requires identifier hashing in production memory mode", () => {
    vi.stubEnv("BATTLE_STORE", "memory");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => validateBattleStoreConfiguration()).toThrow("RATE_LIMIT_HASH_SECRET is required");
  });

  it("allows intentional production memory mode and emits its single-instance warning", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("BATTLE_STORE", "memory");
    vi.stubEnv("RATE_LIMIT_HASH_SECRET", "production-test-hash-secret");
    vi.stubEnv("NODE_ENV", "production");
    expect(validateBattleStoreConfiguration({ warnMemoryMode: true })).toBe("memory");
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("SINGLE-INSTANCE beta deployment"));
  });

  it("uses the selected memory store for challenge battle state", async () => {
    vi.stubEnv("BATTLE_STORE", "memory");
    const selected = getBattleStore();
    const provider: BattleAiProvider = {
      opponentJoke: vi.fn(async () => "Mock opponent joke"),
      judge: vi.fn(async () => ({
        creativity: 5,
        savagery: 5,
        originality: 5,
        userScore: 5,
        aiScore: 5,
        roundWinner: "tie" as const,
        commentary: "Mock judgement.",
      })),
    };
    const service = new BattleSessionService(selected, provider);
    const identity = { sessionId: "session", sessionKey: "hashed-session", networkKey: "hashed-network", isNewSession: false };
    const result = await service.start(identity, { actionId: randomUUID(), challenged: true });
    if (result.kind !== "started") throw new Error("Expected challenge battle to start");
    expect(await selected.getBattle(result.battleId)).toMatchObject({ challenged: true, sessionKey: identity.sessionKey });
  });
});

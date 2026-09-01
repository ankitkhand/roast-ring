import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { BattleAiProvider } from "@/lib/ai/provider";
import type { Judgement } from "@/lib/types";
import { BATTLE_LIMITS } from "./config";
import { BattleSecurityError, battleErrorResponse } from "./errors";
import { MemoryBattleStore } from "./memory-store";
import { BattleSessionService } from "./service";
import { BattleStoreUnavailableError, type BattleStore } from "./store";
import type { AbuseIdentity, BattleActionInput } from "./types";

const judgement: Judgement = {
  creativity: 6,
  savagery: 6,
  originality: 6,
  userScore: 6,
  aiScore: 5,
  roundWinner: "user",
  commentary: "A clean hit. The scoreboard felt that one.",
};

function identity(session = "session-a", network = "network-a"): AbuseIdentity {
  return { sessionId: session, sessionKey: `hashed-${session}`, networkKey: `hashed-${network}`, isNewSession: false };
}

function provider(overrides: Partial<BattleAiProvider> = {}) {
  return {
    opponentJoke: vi.fn(async (round: number) => `Opponent joke ${round}`),
    judge: vi.fn(async () => judgement),
    ...overrides,
  } satisfies BattleAiProvider;
}

function harness() {
  let now = 1_000;
  const store = new MemoryBattleStore(() => now);
  const ai = provider();
  const service = new BattleSessionService(store, ai, { now: () => now });
  return { store, ai, service, advance: (milliseconds: number) => { now += milliseconds; } };
}

async function start(service: BattleSessionService, owner = identity(), challenged = false, actionId = randomUUID()) {
  const result = await service.start(owner, { actionId, challenged });
  if (result.kind !== "started") throw new Error("Expected battle to start");
  return result.battleId;
}

function action(battleId: string, roundNumber: number, type: BattleActionInput["action"], actionId = randomUUID()): BattleActionInput {
  return { battleId, roundNumber, action: type, actionId, ...(type === "judge" ? { userJoke: `User joke ${roundNumber}` } : {}) };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

async function completeRound(service: BattleSessionService, battleId: string, roundNumber: number, owner = identity()) {
  await service.act(owner, action(battleId, roundNumber, "opponent"));
  await service.act(owner, action(battleId, roundNumber, "judge"));
}

describe("server-authoritative battle sessions", () => {
  it("1. creates server state when a battle starts", async () => {
    const { service, store } = harness();
    const battleId = await start(service);
    expect(await store.getBattle(battleId)).toMatchObject({ battleId, currentRound: 1, expectedAction: "opponent", status: "active" });
  });

  it("2. associates a battle with its anonymous session", async () => {
    const { service, store } = harness();
    const owner = identity("owner");
    const battleId = await start(service, owner);
    expect((await store.getBattle(battleId))?.sessionKey).toBe(owner.sessionKey);
  });

  it("3. rejects an unknown battle before an AI call", async () => {
    const { service, ai } = harness();
    await expectCode(service.act(identity(), action(randomUUID(), 1, "opponent")), "battle_not_found");
    expect(ai.opponentJoke).not.toHaveBeenCalled();
  });

  it("4. rejects a battle owned by another session", async () => {
    const { service, ai } = harness();
    const battleId = await start(service, identity("owner"));
    await expectCode(service.act(identity("attacker"), action(battleId, 1, "opponent")), "battle_forbidden");
    expect(ai.opponentJoke).not.toHaveBeenCalled();
  });

  it("5. rejects an expired battle with the friendly expiry code", async () => {
    const { service, advance, ai } = harness();
    const battleId = await start(service);
    advance(BATTLE_LIMITS.battleTtlSeconds * 1_000 + 1);
    await expectCode(service.act(identity(), action(battleId, 1, "opponent")), "battle_expired");
    expect(ai.opponentJoke).not.toHaveBeenCalled();
  });

  it("6. prevents a completed battle from continuing", async () => {
    const { service, ai } = harness();
    const battleId = await start(service);
    for (let round = 1; round <= 3; round += 1) await completeRound(service, battleId, round);
    await expectCode(service.act(identity(), action(battleId, 3, "judge")), "battle_completed");
    expect(ai.judge).toHaveBeenCalledTimes(3);
  });

  it("7. accepts round one as the first opponent action", async () => {
    const { service, ai } = harness();
    const battleId = await start(service);
    const result = await service.act(identity(), action(battleId, 1, "opponent"));
    expect(result.response).toMatchObject({ action: "opponent", roundNumber: 1 });
    expect(ai.opponentJoke).toHaveBeenCalledTimes(1);
  });

  it("8. rejects round two before round one completes", async () => {
    const { service, ai } = harness();
    const battleId = await start(service);
    await expectCode(service.act(identity(), action(battleId, 2, "opponent")), "invalid_round");
    expect(ai.opponentJoke).not.toHaveBeenCalled();
  });

  it("9. rejects round three before round two completes", async () => {
    const { service, ai } = harness();
    const battleId = await start(service);
    await completeRound(service, battleId, 1);
    await expectCode(service.act(identity(), action(battleId, 3, "opponent")), "invalid_round");
    expect(ai.opponentJoke).toHaveBeenCalledTimes(1);
  });

  it("10. makes round four impossible", async () => {
    const { service, ai } = harness();
    const battleId = await start(service);
    await expectCode(service.act(identity(), action(battleId, 4, "opponent")), "invalid_round");
    expect(ai.opponentJoke).not.toHaveBeenCalled();
  });

  it("11. completes after exactly three rounds and six bounded AI calls", async () => {
    const { service, store, ai } = harness();
    const battleId = await start(service);
    for (let round = 1; round <= 3; round += 1) await completeRound(service, battleId, round);
    expect(await store.getBattle(battleId)).toMatchObject({ status: "completed", expectedAction: null, calls: { opponent: 3, judge: 3 } });
    expect(ai.opponentJoke).toHaveBeenCalledTimes(3);
    expect(ai.judge).toHaveBeenCalledTimes(3);
  });

  it("12. invokes AI once for a duplicate action ID", async () => {
    const { service, ai } = harness();
    const battleId = await start(service);
    const request = action(battleId, 1, "opponent");
    await service.act(identity(), request);
    await service.act(identity(), request);
    expect(ai.opponentJoke).toHaveBeenCalledTimes(1);
  });

  it("13. returns the exact completed response for a duplicate", async () => {
    const { service } = harness();
    const battleId = await start(service);
    const request = action(battleId, 1, "opponent");
    const first = await service.act(identity(), request);
    const second = await service.act(identity(), request);
    expect(second).toEqual({ response: first.response, duplicate: true });
  });

  it("14. treats a network-style start retry as one battle and one rate-limit charge", async () => {
    const { service } = harness();
    const actionId = randomUUID();
    const first = await service.start(identity(), { actionId, challenged: false });
    const second = await service.start(identity(), { actionId, challenged: false });
    expect(second).toMatchObject({ battleId: first.kind === "started" ? first.battleId : "", duplicate: true });
    await start(service);
    await start(service);
  });

  it("15. allows only one paid call for simultaneous same-round actions", async () => {
    let release!: (joke: string) => void;
    const pending = new Promise<string>((resolve) => { release = resolve; });
    const ai = provider({ opponentJoke: vi.fn(() => pending) });
    const store = new MemoryBattleStore();
    const service = new BattleSessionService(store, ai);
    const battleId = await start(service);
    const first = service.act(identity(), action(battleId, 1, "opponent", randomUUID()));
    await vi.waitFor(() => expect(ai.opponentJoke).toHaveBeenCalledTimes(1));
    await expectCode(service.act(identity(), action(battleId, 1, "opponent", randomUUID())), "action_in_progress");
    release("Only paid joke");
    await first;
    expect(ai.opponentJoke).toHaveBeenCalledTimes(1);
  });

  it("16. lets an expired lock be replaced without an old owner releasing the new lock", async () => {
    let now = 0;
    const store = new MemoryBattleStore(() => now);
    expect(await store.acquireBattleLock("battle", "old", 100)).toBe(true);
    now = 101;
    expect(await store.acquireBattleLock("battle", "new", 100)).toBe(true);
    await store.releaseBattleLock("battle", "old");
    expect(await store.acquireBattleLock("battle", "third", 100)).toBe(false);
  });

  it("17. releases the distributed lock after success and failure", async () => {
    const success = harness();
    const successId = await start(success.service);
    await success.service.act(identity(), action(successId, 1, "opponent"));
    expect(await success.store.acquireBattleLock(successId, "after-success", 100)).toBe(true);

    const failedAi = provider({ opponentJoke: vi.fn(async () => { throw new Error("provider unavailable"); }) });
    const failedStore = new MemoryBattleStore();
    const failedService = new BattleSessionService(failedStore, failedAi);
    const failedId = await start(failedService);
    await expect(failedService.act(identity(), action(failedId, 1, "opponent"))).rejects.toThrow("provider unavailable");
    expect(await failedStore.acquireBattleLock(failedId, "after-failure", 100)).toBe(true);
  });

  it("18. allows the first valid battle starts", async () => {
    const { service } = harness();
    await expect(start(service)).resolves.toMatch(/[0-9a-f-]{36}/);
    await expect(start(service)).resolves.toMatch(/[0-9a-f-]{36}/);
    await expect(start(service)).resolves.toMatch(/[0-9a-f-]{36}/);
  });

  it("19. enforces the per-session short window", async () => {
    const { service } = harness();
    for (let index = 0; index < BATTLE_LIMITS.sessionShortWindow.max; index += 1) await start(service);
    await expect(service.start(identity(), { actionId: randomUUID(), challenged: false })).rejects.toMatchObject({ code: "rate_limited", reason: "session_short_window" });
  });

  it("20. enforces the per-session daily ceiling across short windows", async () => {
    const { service, advance } = harness();
    for (let index = 0; index < BATTLE_LIMITS.sessionDaily.max; index += 1) {
      await start(service);
      if ((index + 1) % BATTLE_LIMITS.sessionShortWindow.max === 0) advance((BATTLE_LIMITS.sessionShortWindow.windowSeconds + 1) * 1_000);
    }
    await expect(service.start(identity(), { actionId: randomUUID(), challenged: false })).rejects.toMatchObject({ code: "rate_limited", reason: "session_daily" });
  });

  it("21. enforces the shared network short window", async () => {
    const { service } = harness();
    for (let index = 0; index < BATTLE_LIMITS.ipShortWindow.max; index += 1) await start(service, identity(`session-${index}`, "shared-network"));
    await expect(service.start(identity("extra", "shared-network"), { actionId: randomUUID(), challenged: false })).rejects.toMatchObject({ code: "rate_limited", reason: "ip_short_window" });
  });

  it("22. permits separate sessions under one network below its larger ceiling", async () => {
    const { service } = harness();
    for (let index = 0; index < 3; index += 1) await start(service, identity("one", "shared"));
    for (let index = 0; index < 3; index += 1) await start(service, identity("two", "shared"));
  });

  it("23. keeps separate networks independent", async () => {
    const { service } = harness();
    for (let index = 0; index < BATTLE_LIMITS.ipShortWindow.max; index += 1) await start(service, identity(`a-${index}`, "network-a"));
    await expect(start(service, identity("b", "network-b"))).resolves.toMatch(/[0-9a-f-]{36}/);
  });

  it("24. includes Retry-After on a rate-limit response", async () => {
    const response = battleErrorResponse(new BattleSecurityError("rate_limited", 429, "THE MOUTH NEEDS A MINUTE.", undefined, "session_short_window", 42));
    expect(response.headers.get("Retry-After")).toBe("42");
    await expect(response.json()).resolves.toMatchObject({ code: "rate_limited", retryAfterSeconds: 42 });
  });

  it("25. advances a timed-out round exactly once", async () => {
    const { service, store, advance } = harness();
    const battleId = await start(service);
    await service.act(identity(), action(battleId, 1, "opponent"));
    advance(45_000);
    await service.act(identity(), action(battleId, 1, "timeout"));
    expect(await store.getBattle(battleId)).toMatchObject({ currentRound: 2, expectedAction: "opponent" });
  });

  it("26. makes duplicate timeout actions idempotent", async () => {
    const { service, advance } = harness();
    const battleId = await start(service);
    await service.act(identity(), action(battleId, 1, "opponent"));
    advance(45_000);
    const request = action(battleId, 1, "timeout");
    const first = await service.act(identity(), request);
    const second = await service.act(identity(), request);
    expect(second).toEqual({ response: first.response, duplicate: true });
  });

  it("27. performs no judge call for a timeout", async () => {
    const { service, ai, advance } = harness();
    const battleId = await start(service);
    await service.act(identity(), action(battleId, 1, "opponent"));
    advance(45_000);
    await service.act(identity(), action(battleId, 1, "timeout"));
    expect(ai.judge).not.toHaveBeenCalled();
  });

  it("28. creates challenge battles in the same secure session engine", async () => {
    const { service, store } = harness();
    const battleId = await start(service, identity(), true);
    expect(await store.getBattle(battleId)).toMatchObject({ challenged: true, sessionKey: identity().sessionKey });
  });

  it("29. does not let challenges bypass the normal start limit", async () => {
    const { service } = harness();
    for (let index = 0; index < BATTLE_LIMITS.sessionShortWindow.max; index += 1) await start(service);
    await expect(service.start(identity(), { actionId: randomUUID(), challenged: true })).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("30. fails closed before paid AI work when shared storage is unavailable", async () => {
    const unavailable: BattleStore = {
      createBattle: async () => { throw new BattleStoreUnavailableError(); },
      getBattle: async () => { throw new BattleStoreUnavailableError(); },
      setBattle: async () => { throw new BattleStoreUnavailableError(); },
      acquireBattleLock: async () => { throw new BattleStoreUnavailableError(); },
      releaseBattleLock: async () => { throw new BattleStoreUnavailableError(); },
    };
    const ai = provider();
    const service = new BattleSessionService(unavailable, ai);
    await expect(service.start(identity(), { actionId: randomUUID(), challenged: false })).rejects.toMatchObject({ code: "service_unavailable" });
    expect(ai.opponentJoke).not.toHaveBeenCalled();
    expect(ai.judge).not.toHaveBeenCalled();
  });
});

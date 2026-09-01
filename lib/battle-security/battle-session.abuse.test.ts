import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { BattleAiProvider } from "@/lib/ai/provider";
import type { Judgement } from "@/lib/types";
import { BATTLE_LIMITS } from "./config";
import { MemoryBattleStore } from "./memory-store";
import { BattleSessionService } from "./service";
import type { AbuseIdentity } from "./types";

const owner: AbuseIdentity = {
  sessionId: "abuse-test-session",
  sessionKey: "hashed-abuse-test-session",
  networkKey: "hashed-abuse-test-network",
  isNewSession: false,
};

const score: Judgement = {
  creativity: 5,
  savagery: 5,
  originality: 5,
  userScore: 5,
  aiScore: 5,
  roundWinner: "tie",
  commentary: "Mock score only; no paid API was contacted.",
};

function mockProvider(overrides: Partial<BattleAiProvider> = {}) {
  return {
    opponentJoke: vi.fn(async () => "Mock opponent joke"),
    judge: vi.fn(async () => score),
    ...overrides,
  } satisfies BattleAiProvider;
}

async function startedBattle(service: BattleSessionService) {
  const result = await service.start(owner, { actionId: randomUUID(), challenged: false });
  if (result.kind !== "started") throw new Error("Expected abuse-test battle to start");
  return result.battleId;
}

describe("development-only abuse simulation", () => {
  it("blocks 17 of 20 rapid starts at the configured session boundary", async () => {
    const service = new BattleSessionService(new MemoryBattleStore(), mockProvider());
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => service.start(owner, { actionId: randomUUID(), challenged: false })));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(BATTLE_LIMITS.sessionShortWindow.max);
    expect(results.filter((result) => result.status === "rejected" && result.reason?.code === "rate_limited")).toHaveLength(20 - BATTLE_LIMITS.sessionShortWindow.max);
  });

  it("bounds ten simultaneous round submissions to one mock AI call", async () => {
    let release!: (value: Judgement) => void;
    const pending = new Promise<Judgement>((resolve) => { release = resolve; });
    const ai = mockProvider({ judge: vi.fn(() => pending) });
    const service = new BattleSessionService(new MemoryBattleStore(), ai);
    const battleId = await startedBattle(service);
    await service.act(owner, { action: "opponent", actionId: randomUUID(), battleId, roundNumber: 1 });
    const submissions = Array.from({ length: 10 }, () => service.act(owner, {
      action: "judge",
      actionId: randomUUID(),
      battleId,
      roundNumber: 1,
      userJoke: "One legitimate mock comeback",
    }).then(
      (value) => ({ status: "fulfilled" as const, value }),
      (reason: { code?: string }) => ({ status: "rejected" as const, reason }),
    ));
    await vi.waitFor(() => expect(ai.judge).toHaveBeenCalledTimes(1));
    release(score);
    const results = await Promise.all(submissions);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(ai.judge).toHaveBeenCalledTimes(1);
  });

  it("replays duplicate action IDs without another mock AI call", async () => {
    const ai = mockProvider();
    const service = new BattleSessionService(new MemoryBattleStore(), ai);
    const battleId = await startedBattle(service);
    const request = { action: "opponent" as const, actionId: randomUUID(), battleId, roundNumber: 1 };
    const first = await service.act(owner, request);
    const replay = await service.act(owner, request);
    expect(replay).toEqual({ response: first.response, duplicate: true });
    expect(ai.opponentJoke).toHaveBeenCalledTimes(1);
  });

  it("blocks invalid sequence floods without any mock AI call", async () => {
    const ai = mockProvider();
    const service = new BattleSessionService(new MemoryBattleStore(), ai);
    const battleId = await startedBattle(service);
    const invalid = await Promise.allSettled(Array.from({ length: 10 }, () => service.act(owner, {
      action: "opponent",
      actionId: randomUUID(),
      battleId,
      roundNumber: 3,
    })));
    expect(invalid.every((result) => result.status === "rejected" && ["invalid_round", "action_in_progress"].includes(result.reason?.code))).toBe(true);
    expect(ai.opponentJoke).not.toHaveBeenCalled();
    expect(ai.judge).not.toHaveBeenCalled();
  });
});

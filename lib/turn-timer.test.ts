import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createTimeoutRound,
  formatTurnTime,
  secondsRemaining,
  timerAnnouncement,
  timerStage,
  timerSupportingCopy,
  TURN_DURATION_SECONDS,
  turnDurationForBattle,
  TurnClock,
} from "./turn-timer";

afterEach(() => vi.unstubAllGlobals());

describe("deadline turn clock", () => {
  it("starts a human turn at 45 seconds", () => {
    const clock = new TurnClock();
    clock.start(1_000);
    expect(clock.remaining(1_000)).toBe(45);
    expect(formatTurnTime(clock.remaining(1_000))).toBe("00:45");
  });

  it("uses wall-clock deadlines after a background delay", () => {
    const clock = new TurnClock();
    clock.start(5_000);
    expect(clock.remaining(15_000)).toBe(35);
    expect(secondsRemaining(50_000, 42_400)).toBe(8);
  });

  it("stops timeout resolution after a successful submission", () => {
    const clock = new TurnClock();
    clock.start(0);
    expect(clock.claimSubmission(20_000)).toBe("submitted");
    expect(clock.status()).toBe("submitted");
    expect(clock.claimTimeout(60_000)).toBe(false);
    expect(clock.claimSubmission(25_000)).toBe("closed");
  });

  it("resets to 45 seconds for the next round", () => {
    const clock = new TurnClock();
    clock.start(0);
    clock.claimSubmission(10_000);
    clock.start(100_000);
    expect(clock.status()).toBe("open");
    expect(clock.remaining(100_000)).toBe(TURN_DURATION_SECONDS);
  });

  it("expires at zero", () => {
    const clock = new TurnClock();
    clock.start(0);
    expect(clock.remaining(44_999)).toBe(1);
    expect(clock.remaining(45_000)).toBe(0);
    expect(clock.claimTimeout(45_000)).toBe(true);
    expect(clock.status()).toBe("timed-out");
  });

  it("resolves the exact deadline race only as a timeout", () => {
    const clock = new TurnClock();
    clock.start(0);
    expect(clock.claimSubmission(45_000)).toBe("timed-out");
    expect(clock.claimTimeout(45_000)).toBe(false);
    expect(clock.claimSubmission(45_000)).toBe("closed");
  });

  it("uses the same fixed timer in normal and challenge battles", () => {
    expect(turnDurationForBattle(false)).toBe(45);
    expect(turnDurationForBattle(true)).toBe(45);
  });
});

describe("timer presentation", () => {
  it("maps the three urgency milestones without announcing every second", () => {
    expect(timerStage(45)).toBe("normal");
    expect(timerSupportingCopy(45)).toBe("");
    expect(timerStage(30)).toBe("warning");
    expect(timerSupportingCopy(30)).toContain("ticking");
    expect(timerAnnouncement(29)).toBe(timerAnnouncement(30));
    expect(timerStage(15)).toBe("pressure");
    expect(timerSupportingCopy(15)).toContain("Don’t choke");
    expect(timerStage(5)).toBe("final");
    expect(timerAnnouncement(4)).toBe(timerAnnouncement(5));
    expect(timerStage(0)).toBe("expired");
  });
});

describe("timeout round", () => {
  it("forfeits the round with zero points and a valid AI win", () => {
    const round = createTimeoutRound("Yo mama so late, she showed up to tomorrow with an apology.", 1);
    expect(round.timedOut).toBe(true);
    expect(round.userJoke).toBe("");
    expect(round.judgement).toMatchObject({
      creativity: 0,
      savagery: 0,
      originality: 0,
      userScore: 0,
      roundWinner: "ai",
    });
    expect(round.judgement.aiScore).toBeGreaterThan(0);
  });

  it("does not call the OpenAI judge or submit unfinished text", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const unfinishedText = "Yo mama was about to";
    const round = createTimeoutRound("Yo mama so loud, her whisper came with a noise complaint.", 2);
    expect(unfinishedText).not.toBe("");
    expect(round.userJoke).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps timeout placeholders out of later judging history", () => {
    const rounds = [
      createTimeoutRound("Yo mama so loud, her whisper came with a noise complaint.", 1),
      { ...createTimeoutRound("Yo mama so late, she showed up to tomorrow with an apology.", 2), timedOut: false, userJoke: "Yo mama so late, the calendar sent a search party." },
    ];
    const previousUserJokes = rounds.filter((round) => !round.timedOut).map((round) => round.userJoke);
    expect(previousUserJokes).toEqual(["Yo mama so late, the calendar sent a search party."]);
  });
});

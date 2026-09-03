import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendGAEvent } from "@next/third-parties/google";
import { ga4EventFor, track } from "./analytics";

vi.mock("@next/third-parties/google", () => ({ sendGAEvent: vi.fn() }));

describe("GA4 analytics adapter", () => {
  beforeEach(() => {
    vi.stubGlobal("CustomEvent", class TestCustomEvent {
      constructor(public type: string, public init: { detail: unknown }) {}
    });
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("preserves internal events and stays silent when GA4 is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");

    track("battle_started", { challenged: false });

    expect(window.dispatchEvent).toHaveBeenCalledOnce();
    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("sends mapped events through the existing helper when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "configured-in-test");

    track("battle_completed", { winner: "user", userScore: 24.7, challenged: true });

    expect(sendGAEvent).toHaveBeenCalledWith("event", "battle_complete", {
      winner: "user",
      rounds_completed: 3,
      final_score: 24.7,
      challenge_mode: true,
    });
  });

  it("maps the requested product events without renaming internal semantics", () => {
    expect(ga4EventFor("battle_started", { challenged: false })).toEqual({
      name: "battle_start",
      parameters: { challenge_mode: false },
    });
    expect(ga4EventFor("round_completed", { round: 2, winner: "ai" })).toEqual({
      name: "round_complete",
      parameters: { winner: "ai", rounds_completed: 2 },
    });
    expect(ga4EventFor("replay_started")).toEqual({ name: "battle_replay", parameters: {} });
    expect(ga4EventFor("result_shared", { method: "native" })).toEqual({
      name: "share_result",
      parameters: { method: "native" },
    });
    expect(ga4EventFor("share_link_copied", { type: "result" })).toEqual({
      name: "share_result",
      parameters: { method: "copy" },
    });
    expect(ga4EventFor("challenge_created", { score: 18.4 })).toEqual({
      name: "challenge_created",
      parameters: { final_score: 18.4 },
    });
    expect(ga4EventFor("content_battle_cta_clicked", { page: "yo-mama-jokes", location: "hero" })).toEqual({
      name: "content_cta_click",
      parameters: { page: "yo-mama-jokes", cta_location: "hero" },
    });
  });

  it("drops arbitrary and user-generated properties before GA4", () => {
    const mapped = ga4EventFor("battle_completed", {
      winner: "user",
      userScore: 20.2,
      userJoke: "private roast text",
      aiJoke: "generated roast text",
      battleId: "private-id",
      sessionSecret: "private-secret",
    });

    expect(mapped).toEqual({
      name: "battle_complete",
      parameters: { winner: "user", rounds_completed: 3, final_score: 20.2 },
    });
    expect(JSON.stringify(mapped)).not.toContain("roast text");
    expect(JSON.stringify(mapped)).not.toContain("private-id");
    expect(JSON.stringify(mapped)).not.toContain("private-secret");
  });

  it("does not emit a custom page_view that could duplicate GA4 measurement", () => {
    expect(ga4EventFor("homepage_view")).toBeNull();
    expect(ga4EventFor("content_page_view", { page: "yo-mama-jokes" })).toBeNull();
  });
});

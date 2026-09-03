import { sendGAEvent } from "@next/third-parties/google";

export type AnalyticsEvent =
  | "homepage_view"
  | "battle_started"
  | "round_completed"
  | "round_timed_out"
  | "voice_input_started"
  | "voice_input_completed"
  | "voice_input_cancelled"
  | "voice_input_unavailable"
  | "voice_permission_denied"
  | "battle_completed"
  | "battle_abandoned"
  | "result_shared"
  | "share_link_copied"
  | "challenge_created"
  | "challenge_opened"
  | "challenge_accepted"
  | "replay_started"
  | "content_page_view"
  | "content_battle_cta_clicked"
  | "joke_copied";

type Properties = Record<string, string | number | boolean | undefined>;

export type Ga4Event = {
  name:
    | "battle_start"
    | "round_complete"
    | "battle_complete"
    | "battle_replay"
    | "share_result"
    | "challenge_created"
    | "content_cta_click";
  parameters: Record<string, string | number | boolean>;
};

function winner(value: Properties[string]) {
  return value === "user" || value === "ai" || value === "tie" ? value : undefined;
}

function finiteNumber(value: Properties[string]) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeLabel(value: Properties[string]) {
  return typeof value === "string" && /^[a-z0-9/_-]{1,80}$/i.test(value) ? value : undefined;
}

export function ga4EventFor(event: AnalyticsEvent, properties: Properties = {}): Ga4Event | null {
  switch (event) {
    case "battle_started":
      return {
        name: "battle_start",
        parameters: typeof properties.challenged === "boolean" ? { challenge_mode: properties.challenged } : {},
      };
    case "round_completed": {
      const roundWinner = winner(properties.winner);
      const roundsCompleted = finiteNumber(properties.round);
      return {
        name: "round_complete",
        parameters: {
          ...(roundWinner ? { winner: roundWinner } : {}),
          ...(roundsCompleted !== undefined ? { rounds_completed: roundsCompleted } : {}),
          ...(typeof properties.timedOut === "boolean" ? { timed_out: properties.timedOut } : {}),
        },
      };
    }
    case "battle_completed": {
      const battleWinner = winner(properties.winner);
      const finalScore = finiteNumber(properties.userScore);
      return {
        name: "battle_complete",
        parameters: {
          ...(battleWinner ? { winner: battleWinner } : {}),
          rounds_completed: 3,
          ...(finalScore !== undefined ? { final_score: finalScore } : {}),
          ...(typeof properties.challenged === "boolean" ? { challenge_mode: properties.challenged } : {}),
        },
      };
    }
    case "replay_started":
      return { name: "battle_replay", parameters: {} };
    case "result_shared":
      return { name: "share_result", parameters: properties.method === "native" ? { method: "native" } : {} };
    case "share_link_copied":
      return properties.type === "result" ? { name: "share_result", parameters: { method: "copy" } } : null;
    case "challenge_created": {
      const finalScore = finiteNumber(properties.score);
      return {
        name: "challenge_created",
        parameters: finalScore !== undefined ? { final_score: finalScore } : {},
      };
    }
    case "content_battle_cta_clicked": {
      const page = safeLabel(properties.page);
      const location = safeLabel(properties.location);
      return {
        name: "content_cta_click",
        parameters: {
          ...(page ? { page } : {}),
          ...(location ? { cta_location: location } : {}),
        },
      };
    }
    default:
      // GA4 handles page views automatically, including client-side history changes.
      return null;
  }
}

export function track(event: AnalyticsEvent, properties: Properties = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("roast-arena:analytics", { detail: { event, properties } }));
  if (process.env.NODE_ENV === "development") console.info("[analytics]", event, properties);

  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) return;
  const ga4Event = ga4EventFor(event, properties);
  if (!ga4Event) return;
  try {
    sendGAEvent("event", ga4Event.name, ga4Event.parameters);
  } catch {
    // Telemetry must never interrupt gameplay or navigation.
  }
}

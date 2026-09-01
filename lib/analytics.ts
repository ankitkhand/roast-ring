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

export function track(event: AnalyticsEvent, properties: Properties = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("roast-arena:analytics", { detail: { event, properties } }));
  if (process.env.NODE_ENV === "development") console.info("[analytics]", event, properties);
}

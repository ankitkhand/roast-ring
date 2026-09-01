type SecurityEvent =
  | "rate_limit_hit"
  | "invalid_transition"
  | "duplicate_action"
  | "concurrency_collision"
  | "expired_battle"
  | "maximum_calls_reached"
  | "store_unavailable";

export function securityLog(event: SecurityEvent, details: Record<string, string | number | boolean | undefined> = {}) {
  console.warn(JSON.stringify({ scope: "battle_security", event, ...details }));
}

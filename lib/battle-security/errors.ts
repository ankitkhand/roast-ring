import { NextResponse } from "next/server";

export type BattleErrorCode =
  | "rate_limited"
  | "battle_expired"
  | "battle_not_found"
  | "battle_forbidden"
  | "invalid_round"
  | "battle_completed"
  | "action_in_progress"
  | "maximum_calls_reached"
  | "service_unavailable";

export class BattleSecurityError extends Error {
  constructor(
    readonly code: BattleErrorCode,
    readonly status: number,
    message: string,
    readonly supportingMessage?: string,
    readonly reason?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export function battleErrorResponse(error: BattleSecurityError) {
  const response = NextResponse.json({
    error: error.message,
    code: error.code,
    reason: error.reason,
    supportingMessage: error.supportingMessage,
    retryAfterSeconds: error.retryAfterSeconds,
  }, { status: error.status });
  if (error.retryAfterSeconds) response.headers.set("Retry-After", String(error.retryAfterSeconds));
  return response;
}

export function unavailableError() {
  return new BattleSecurityError(
    "service_unavailable",
    503,
    "THE ARENA IS HAVING A MOMENT.",
    "Try again in a minute.",
    "shared_store_unavailable",
    60,
  );
}

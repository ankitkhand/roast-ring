function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const BATTLE_LIMITS = {
  sessionShortWindow: {
    max: positiveInteger(process.env.BATTLE_SESSION_SHORT_MAX, 3),
    windowSeconds: positiveInteger(process.env.BATTLE_SESSION_SHORT_WINDOW_SECONDS, 600),
  },
  sessionDaily: {
    max: positiveInteger(process.env.BATTLE_SESSION_DAILY_MAX, 15),
    windowSeconds: 86_400,
  },
  ipShortWindow: {
    max: positiveInteger(process.env.BATTLE_IP_SHORT_MAX, 10),
    windowSeconds: positiveInteger(process.env.BATTLE_IP_SHORT_WINDOW_SECONDS, 600),
  },
  ipDaily: {
    max: positiveInteger(process.env.BATTLE_IP_DAILY_MAX, 100),
    windowSeconds: 86_400,
  },
  battleRounds: 3,
  battleTtlSeconds: positiveInteger(process.env.BATTLE_TTL_SECONDS, 45 * 60),
  expiredRecordGraceSeconds: 5 * 60,
  actionLockMs: positiveInteger(process.env.BATTLE_ACTION_LOCK_MS, 60_000),
  startIdempotencySeconds: 10 * 60,
} as const;

export type RateLimitReason =
  | "session_short_window"
  | "session_daily"
  | "ip_short_window"
  | "ip_daily";

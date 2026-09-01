"use client";

import { formatTurnTime, timerAnnouncement, timerStage, timerSupportingCopy } from "@/lib/turn-timer";

export function TurnTimer({ seconds }: { seconds: number }) {
  const stage = timerStage(seconds);
  const supportingCopy = timerSupportingCopy(seconds);

  return (
    <>
      <div className={`turn-timer timer-${stage}`} role="timer" aria-label={`${seconds} seconds remaining`}>
        <time dateTime={`PT${seconds}S`}>{formatTurnTime(seconds)}</time>
        <small>{supportingCopy || "Your clock is running"}</small>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{timerAnnouncement(seconds)}</span>
    </>
  );
}

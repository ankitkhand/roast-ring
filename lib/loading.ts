export const battleLoadingMessages = [
  "The Mouth is warming up...",
  "Checking the mic...",
  "Loading disrespect...",
  "Stretching the roast muscles...",
  "Summoning questionable family jokes...",
] as const;

export const opponentLoadingMessages = [
  "Writing something disrespectful...",
  "Digging for a cheap shot...",
  "Calibrating savagery...",
  "Consulting the roast gods...",
  "Finding a line your mum won’t like...",
  "Probably reaching for a cheap shot...",
] as const;

export const judgeLoadingMessages = [
  "Reviewing the damage...",
  "Checking for actual comedy...",
  "Scoring the chaos...",
  "The crowd is waiting...",
  "Measuring creativity, savagery, and audacity...",
  "Checking if that was comedy or a cry for help...",
  "The Mouth looks nervous. Maybe.",
  "Someone wake the scoreboard.",
] as const;

export const MINIMUM_LOADING_MS = 420;

export function loadingMessageAt(messages: readonly string[], index: number) {
  if (!messages.length) return "";
  return messages[((index % messages.length) + messages.length) % messages.length];
}

export function minimumDelayRemaining(startedAt: number, now: number, minimumMs = MINIMUM_LOADING_MS) {
  return Math.max(0, minimumMs - (now - startedAt));
}

export async function waitForMinimumDisplay(startedAt: number, minimumMs = MINIMUM_LOADING_MS) {
  const remaining = minimumDelayRemaining(startedAt, performance.now(), minimumMs);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

export class SingleFlight {
  private readonly active = new Map<string, Promise<unknown>>();

  run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const existing = this.active.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const request = task().finally(() => {
      if (this.active.get(key) === request) this.active.delete(key);
    });
    this.active.set(key, request);
    return request;
  }
}

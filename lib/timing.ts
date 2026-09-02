export function elapsedMilliseconds(startedAt: number, finishedAt = performance.now()) {
  return Math.max(0, Math.round(finishedAt - startedAt));
}

export function developmentTimer(label: string) {
  const startedAt = performance.now();
  return () => {
    const duration = elapsedMilliseconds(startedAt);
    if (process.env.NODE_ENV === "development") {
      console.info(`[Roast Clash timing] ${label}: ${duration}ms`);
    }
    return duration;
  };
}

export function logDevelopmentDuration(label: string, duration: number) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[Roast Clash timing] ${label}: ${Math.max(0, Math.round(duration))}ms`);
  }
}

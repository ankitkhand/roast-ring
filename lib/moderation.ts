const blockedPatterns = [
  /\b(?:home address|phone number|social security|doxx)\b/i,
  /\b(?:kill|shoot|stab|bomb)\s+(?:you|him|her|them)\b/i,
  /\b(?:child|kid|minor)\b.{0,24}\b(?:nude|sexual|sex)\b/i,
];

export function moderateUserJoke(joke: string) {
  const normalized = joke.trim();
  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return { safe: false as const, reason: "Keep it fictional and funny—no threats, doxxing, or sexual content involving minors." };
  }
  return { safe: true as const, value: normalized };
}

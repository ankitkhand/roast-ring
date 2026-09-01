import type { BattleResult, Challenge } from "./types";

function toBase64Url(value: string) {
  if (typeof window === "undefined") return Buffer.from(value, "utf8").toString("base64url");
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  if (typeof window === "undefined") return Buffer.from(value, "base64url").toString("utf8");
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeResult(result: BattleResult) {
  return toBase64Url(JSON.stringify(result));
}

export function decodeResult(slug: string): BattleResult | null {
  try {
    const value = JSON.parse(fromBase64Url(slug)) as BattleResult;
    if (value.version !== 1 || value.rounds?.length !== 3 || !value.id) return null;
    return value;
  } catch {
    return null;
  }
}

export function encodeChallenge(challenge: Challenge) {
  return toBase64Url(JSON.stringify(challenge));
}

export function decodeChallenge(token: string): Challenge | null {
  try {
    const value = JSON.parse(fromBase64Url(token)) as Challenge;
    if (value.version !== 1 || !value.sourceId || !Number.isFinite(value.scoreToBeat)) return null;
    return value;
  } catch {
    return null;
  }
}

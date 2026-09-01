import { createHmac, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { unavailableError } from "./errors";
import type { AbuseIdentity } from "./types";

export const ANONYMOUS_SESSION_COOKIE = "ra_session";
export const ANONYMOUS_SESSION_SECONDS = 86_400;

function secret() {
  const configured = process.env.RATE_LIMIT_HASH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "roast-arena-development-only-secret";
  throw unavailableError();
}

function hash(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function resolveClientNetwork(request: Pick<NextRequest, "headers">) {
  const configured = process.env.TRUSTED_IP_HEADER?.toLowerCase();
  const allowed = new Set(["x-vercel-forwarded-for", "cf-connecting-ip", "x-real-ip"]);
  const platformHeader = process.env.VERCEL
    ? "x-vercel-forwarded-for"
    : process.env.CF_PAGES || process.env.CF_WORKER
      ? "cf-connecting-ip"
      : undefined;
  const header = configured && allowed.has(configured) ? configured : platformHeader;
  if (!header) return process.env.NODE_ENV === "production" ? "unresolved-production-network" : "local-development";
  return request.headers.get(header)?.split(",")[0]?.trim() || "unresolved-network";
}

export function identifyRequest(request: NextRequest): AbuseIdentity {
  const existing = request.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value;
  const sessionId = existing || randomBytes(32).toString("base64url");
  return {
    sessionId,
    sessionKey: hash(`session:${sessionId}`),
    networkKey: hash(`network:${resolveClientNetwork(request)}`),
    isNewSession: !existing,
  };
}

export function applyAnonymousSessionCookie(response: NextResponse, identity: AbuseIdentity) {
  if (!identity.isNewSession) return response;
  response.cookies.set(ANONYMOUS_SESSION_COOKIE, identity.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ANONYMOUS_SESSION_SECONDS,
  });
  return response;
}

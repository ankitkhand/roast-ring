import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { ANONYMOUS_SESSION_COOKIE, applyAnonymousSessionCookie, identifyRequest, resolveClientNetwork } from "./identity";

afterEach(() => vi.unstubAllEnvs());

function request(headers?: HeadersInit) {
  return new NextRequest("https://roast.example/battle", { headers });
}

describe("anonymous abuse identity", () => {
  it("issues cryptographically random session values", () => {
    vi.stubEnv("RATE_LIMIT_HASH_SECRET", "test-only-hmac-secret");
    expect(identifyRequest(request()).sessionId).not.toBe(identifyRequest(request()).sessionId);
  });

  it("reuses the server-issued cookie without exposing it as the storage key", () => {
    vi.stubEnv("RATE_LIMIT_HASH_SECRET", "test-only-hmac-secret");
    const identified = identifyRequest(request({ Cookie: `${ANONYMOUS_SESSION_COOKIE}=anonymous-value` }));
    expect(identified).toMatchObject({ sessionId: "anonymous-value", isNewSession: false });
    expect(identified.sessionKey).not.toContain("anonymous-value");
  });

  it("does not blindly trust X-Forwarded-For", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TRUSTED_IP_HEADER", "");
    vi.stubEnv("VERCEL", "");
    expect(resolveClientNetwork(request({ "X-Forwarded-For": "203.0.113.8" }))).toBe("local-development");
  });

  it("uses an explicitly trusted, allow-listed proxy header", () => {
    vi.stubEnv("TRUSTED_IP_HEADER", "x-real-ip");
    expect(resolveClientNetwork(request({ "X-Real-IP": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("sets a first-party HttpOnly anonymous cookie", () => {
    vi.stubEnv("RATE_LIMIT_HASH_SECRET", "test-only-hmac-secret");
    vi.stubEnv("NODE_ENV", "production");
    const identified = identifyRequest(request());
    const response = applyAnonymousSessionCookie(NextResponse.json({ ok: true }), identified);
    const cookie = response.cookies.get(ANONYMOUS_SESSION_COOKIE);
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  });
});

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getBattleProvider } from "@/lib/ai";
import { battleErrorResponse, BattleSecurityError, unavailableError } from "@/lib/battle-security/errors";
import { applyAnonymousSessionCookie, identifyRequest } from "@/lib/battle-security/identity";
import { securityLog } from "@/lib/battle-security/logging";
import { BattleSessionService } from "@/lib/battle-security/service";
import { getBattleStore } from "@/lib/battle-security/store-factory";
import { moderateUserJoke } from "@/lib/moderation";
import { roundRequestSchema } from "@/lib/schema";
import { developmentTimer } from "@/lib/timing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let identity;
  try {
    identity = identifyRequest(request);
    const body = roundRequestSchema.parse(await request.json());
    let userJoke: string | undefined;
    if (body.action === "judge") {
      const moderated = moderateUserJoke(body.userJoke);
      if (!moderated.safe) return applyAnonymousSessionCookie(NextResponse.json({ error: moderated.reason, code: "invalid_request" }, { status: 400 }), identity);
      userJoke = moderated.value;
    }
    const provider = getBattleProvider();
    const service = new BattleSessionService(getBattleStore(), provider);
    const finishTiming = developmentTimer(body.action === "opponent" ? "opponent generation" : body.action === "judge" ? "round judging" : "round timeout");
    try {
      const result = await service.act(identity, { ...body, userJoke });
      return applyAnonymousSessionCookie(NextResponse.json({ ...result.response, duplicate: result.duplicate }), identity);
    } finally {
      finishTiming();
    }
  } catch (error) {
    let response: NextResponse;
    if (error instanceof BattleSecurityError) response = battleErrorResponse(error);
    else if (error instanceof ZodError) response = NextResponse.json({ error: "The battle card is missing something.", code: "invalid_request" }, { status: 400 });
    else {
      console.error("Battle round failed", error);
      securityLog("store_unavailable", { operation: "round_route" });
      response = battleErrorResponse(unavailableError());
    }
    return identity ? applyAnonymousSessionCookie(response, identity) : response;
  }
}

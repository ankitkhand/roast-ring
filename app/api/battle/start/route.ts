import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getBattleProvider } from "@/lib/ai";
import { battleErrorResponse, BattleSecurityError, unavailableError } from "@/lib/battle-security/errors";
import { applyAnonymousSessionCookie, identifyRequest } from "@/lib/battle-security/identity";
import { securityLog } from "@/lib/battle-security/logging";
import { BattleSessionService } from "@/lib/battle-security/service";
import { getBattleStore } from "@/lib/battle-security/store-factory";
import { startBattleRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let identity;
  try {
    identity = identifyRequest(request);
    const body = startBattleRequestSchema.parse(await request.json());
    const service = new BattleSessionService(getBattleStore(), getBattleProvider());
    const result = await service.start(identity, body);
    return applyAnonymousSessionCookie(NextResponse.json(result), identity);
  } catch (error) {
    const response = error instanceof BattleSecurityError
      ? battleErrorResponse(error)
      : error instanceof ZodError
        ? NextResponse.json({ error: "The battle card is missing something.", code: "invalid_request" }, { status: 400 })
        : battleErrorResponse(unavailableError());
    if (!(error instanceof BattleSecurityError) && !(error instanceof ZodError)) securityLog("store_unavailable", { operation: "start_route" });
    return identity ? applyAnonymousSessionCookie(response, identity) : response;
  }
}

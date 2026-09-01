import { LocalBattleProvider } from "./local-provider";
import { OpenAiBattleProvider } from "./openai-provider";
import type { BattleAiProvider } from "./provider";

export function getBattleProvider(): BattleAiProvider {
  const mode = process.env.AI_PROVIDER ?? "auto";
  if (mode === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
  if ((mode === "auto" || mode === "openai") && process.env.OPENAI_API_KEY) {
    return new OpenAiBattleProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL);
  }
  return new LocalBattleProvider();
}

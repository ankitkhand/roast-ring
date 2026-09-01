import type { JudgeContext, Judgement, OpponentContext } from "@/lib/types";

export interface BattleAiProvider {
  opponentJoke(roundNumber: number, battleSeed: string, context?: OpponentContext): Promise<string>;
  judge(aiJoke: string, userJoke: string, roundNumber: number, context?: JudgeContext): Promise<Judgement>;
}

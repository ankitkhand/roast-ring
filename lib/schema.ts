import { z } from "zod";

export const modelJudgementSchema = z.object({
  userScore: z.number().min(0).max(10),
  aiScore: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
  savagery: z.number().min(0).max(10),
  originality: z.number().min(0).max(10),
  roundWinner: z.enum(["user", "ai", "tie"]),
  commentary: z.string().min(1).max(160),
});

export const judgementSchema = modelJudgementSchema.superRefine((value, context) => {
  const expectedScore = Math.round((value.creativity * 0.4 + value.savagery * 0.3 + value.originality * 0.3) * 10) / 10;
  if (Math.abs(value.userScore - expectedScore) > 0.05) {
    context.addIssue({ code: "custom", path: ["userScore"], message: "User score must be the weighted category score" });
  }
  const expectedWinner = Math.abs(value.userScore - value.aiScore) <= 0.15 ? "tie" : value.userScore > value.aiScore ? "user" : "ai";
  if (value.roundWinner !== expectedWinner) {
    context.addIssue({ code: "custom", path: ["roundWinner"], message: "Round winner must match the scores" });
  }
});

export const roundRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("opponent"),
    actionId: z.string().uuid(),
    battleId: z.string().uuid(),
    roundNumber: z.number().int().min(1).max(3),
  }),
  z.object({
    action: z.literal("judge"),
    actionId: z.string().uuid(),
    battleId: z.string().uuid(),
    roundNumber: z.number().int().min(1).max(3),
    userJoke: z.string().trim().min(3).max(240),
  }),
  z.object({
    action: z.literal("timeout"),
    actionId: z.string().uuid(),
    battleId: z.string().uuid(),
    roundNumber: z.number().int().min(1).max(3),
  }),
]);

export const startBattleRequestSchema = z.object({
  actionId: z.string().uuid(),
  challenged: z.boolean().default(false),
});

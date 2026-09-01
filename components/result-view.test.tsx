import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultView } from "./result-view";
import type { BattleResult } from "@/lib/types";

const result: BattleResult = {
  version: 1,
  id: "open-rounds",
  completedAt: "2026-08-31T00:00:00.000Z",
  rounds: [1, 2, 3].map((roundNumber) => ({
    roundNumber,
    aiJoke: `The Mouth joke ${roundNumber}`,
    userJoke: `Human joke ${roundNumber}`,
    judgement: {
      creativity: 7,
      savagery: 7,
      originality: 7,
      userScore: 7,
      aiScore: 7.2,
      roundWinner: "ai" as const,
      commentary: `Judge commentary ${roundNumber}`,
    },
  })),
  userTotal: 21,
  aiTotal: 21.6,
  winner: "ai",
  bestLine: "The Mouth joke 1",
};

describe("result recap", () => {
  it("uses The Mouth framing for a losing verdict and score labels", () => {
    const markup = renderToStaticMarkup(<ResultView result={result} />);

    expect(markup).toContain("YOU LOST");
    expect(markup).toContain("The Mouth cooked you.");
    expect(markup).toContain("THE MOUTH");
    expect(markup).toContain("YOUR OPPONENT");
    expect(markup).toContain("MOUTH</small>");
    expect(markup).not.toContain("AI WON");
    expect(markup).not.toContain("AI OPPONENT");
  });

  it("renders all three native details sections open by default", () => {
    const markup = renderToStaticMarkup(<ResultView result={result} />);
    expect(markup.match(/<details[^>]* open=""/g)).toHaveLength(3);
    expect(markup.match(/<summary>/g)).toHaveLength(3);
    for (const round of result.rounds) {
      expect(markup).toContain(round.aiJoke);
      expect(markup).toContain(round.userJoke);
      expect(markup).toContain(round.judgement.commentary);
    }
  });
});

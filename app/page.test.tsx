import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("homepage positioning", () => {
  it("leads with The Mouth while retaining the quiet AI disclosure", () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain("Think you’re funny? Prove it.");
    expect(markup).toContain("BATTLE NOW");
    expect(markup).toContain("THE MOUTH IS READY");
    expect(markup).toContain("THE MOUTH SWINGS");
    expect(markup).toContain("YOUR OPPONENT");
    expect(markup).toContain("The Mouth is an AI-powered comedy opponent. Battle scores are judged automatically.");
    expect(markup).not.toContain("BATTLE AI");
    expect(markup).not.toContain("AI IS READY");
  });
});

import type { Metadata } from "next";
import { BattleCta, ContentHero, ContentSection, ContentShell, JokeList, RelatedPages } from "@/components/content/content-primitives";
import { savageJokes } from "@/lib/content/yo-mama/jokes";
import { contentPages, metadataFor } from "@/lib/content/yo-mama/pages";

const page = contentPages["savage-yo-mama-jokes"];
export const metadata: Metadata = metadataFor(page.slug);

const sections = [
  ["clever", "Savage but Clever", "The line hits harder because the turn is precise."],
  ["one-liners", "Brutal One-Liners", "Fast, fictional and finished before the room can recover."],
  ["battle-ready", "Battle-Ready Roasts", "Written for a timer, an opponent and a scoreboard."],
  ["modern", "Modern Savage Jokes", "Sharper observations from work, games, profiles and subscriptions."],
  ["comebacks", "Comeback Material", "Useful when confidence arrives before the actual point."],
] as const;

export default function SavageYoMamaJokesPage() {
  return (
    <ContentShell page={page}>
      <ContentHero page={page} />
      <aside className="safety-boundary"><strong>SAVAGE, NOT HATEFUL</strong><p>The target is a fictional comedy premise—not a protected characteristic, threat or identifiable person. Punch comes from precision and absurdity.</p></aside>
      {sections.map(([id, title, intro], index) => (
        <div key={id}>
          <ContentSection id={id} title={title} intro={intro}>
            <JokeList jokes={savageJokes.slice(index * 6, index * 6 + 6)} page={page.slug} />
          </ContentSection>
          {index === 1 && <BattleCta page={page.slug} title="Sharp enough for a real round?" text="The Mouth is not going to clap politely." />}
        </div>
      ))}
      <RelatedPages current={page.slug} links={[
        ["ALL YO MAMA JOKES", "/yo-mama-jokes", "Return to the complete hub."],
        ["FUNNY YO MAMA JOKES", "/funny-yo-mama-jokes", "Looking for something lighter?"],
        ["YO MAMA ROASTS", "/yo-mama-roasts", "Learn to improvise a sharper line."],
      ]} />
      <BattleCta page={page.slug} location="end" title="Enough warm-up." text="Bring the punchline. The arena will handle the score." />
    </ContentShell>
  );
}

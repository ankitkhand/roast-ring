import type { Metadata } from "next";
import { BattleCta, ContentHero, ContentSection, ContentShell, JokeList, RelatedPages } from "@/components/content/content-primitives";
import { bestJokes } from "@/lib/content/yo-mama/jokes";
import { contentPages, metadataFor } from "@/lib/content/yo-mama/pages";

const page = contentPages["best-yo-mama-jokes"];
export const metadata: Metadata = metadataFor(page.slug);

const sections = [
  ["all-time-classics", "All-Time Classics", "Familiar premises with endings sharp enough to keep earning their place."],
  ["best-modern", "Best Modern Yo Mama Jokes", "Phones, work, streaming and group chats—used as settings, not substitutes for a joke."],
  ["best-one-liners", "Best One-Liners", "Ten compact lines with no extra luggage."],
  ["battle-ready", "Best Battle-Ready Roasts", "Material that sounds at home under a ticking clock."],
  ["arena-picks", "Roast Clash Picks", "Specific premises, clean turns and just enough oddness."],
  ["clever-finishes", "Best Clever Jokes", "The final word changes the whole picture."],
] as const;

export default function BestYoMamaJokesPage() {
  return (
    <ContentShell page={page}>
      <ContentHero page={page} />
      <aside className="editor-note"><strong>THE EDIT</strong><p>“Best” should mean something. This list stops at 60 and favours a clear premise, economy, surprise and a punchline that works aloud.</p></aside>
      {sections.map(([id, title, intro], index) => (
        <div key={id}>
          <ContentSection id={id} title={title} intro={intro}>
            <JokeList jokes={bestJokes.slice(index * 10, index * 10 + 10)} page={page.slug} ordered />
          </ContentSection>
          {index === 2 && <BattleCta page={page.slug} title="Hall of Fame material is easy to read." text="Writing one under pressure is harder. Battle The Mouth." />}
        </div>
      ))}
      <RelatedPages current={page.slug} links={[
        ["ALL YO MAMA JOKES", "/yo-mama-jokes", "Return to the complete hub."],
        ["FUNNY YO MAMA JOKES", "/funny-yo-mama-jokes", "Trade damage for pure silliness."],
        ["HOW TO WRITE A ROAST", "/yo-mama-roasts", "Build a Hall of Fame attempt."],
      ]} />
      <BattleCta page={page.slug} location="end" title="Think you have a number 61?" text="Bring your best line into a three-round battle." />
    </ContentShell>
  );
}

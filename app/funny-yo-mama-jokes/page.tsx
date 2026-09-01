import type { Metadata } from "next";
import { BattleCta, ContentHero, ContentSection, ContentShell, JokeList, RelatedPages } from "@/components/content/content-primitives";
import { funnyJokes } from "@/lib/content/yo-mama/jokes";
import { contentPages, metadataFor } from "@/lib/content/yo-mama/pages";

const page = contentPages["funny-yo-mama-jokes"];
export const metadata: Metadata = metadataFor(page.slug);

const sections = [
  ["ridiculous", "Ridiculous Yo Mama Jokes", "Logic left the room. The laugh stayed."],
  ["clever", "Clever and Playful", "Small twists that reward paying attention."],
  ["short", "Short Funny Jokes", "Five quick lines for people with fast thumbs."],
  ["modern", "Modern Laughs", "Everyday technology behaving very badly."],
  ["group-chat", "Group-Chat Worthy", "The kind of chaos that earns an immediate reaction."],
  ["so-bad", "So Bad They’re Good", "Groan first, admit it worked second."],
] as const;

export default function FunnyYoMamaJokesPage() {
  return (
    <ContentShell page={page}>
      <ContentHero page={page} />
      <p className="tone-note"><strong>THE RULE HERE:</strong> absurd beats cruel. If the image makes you laugh before you think about the insult, it belongs.</p>
      {sections.map(([id, title, intro], index) => (
        <div key={id}>
          <ContentSection id={id} title={title} intro={intro}>
            <JokeList jokes={funnyJokes.slice(index * 5, index * 5 + 5)} page={page.slug} />
          </ContentSection>
          {index === 2 && <BattleCta page={page.slug} title="Got the group chat laughing?" text="See whether the same line survives a scoreboard." />}
        </div>
      ))}
      <RelatedPages current={page.slug} links={[
        ["ALL YO MAMA JOKES", "/yo-mama-jokes", "Browse the full category hub."],
        ["SAVAGE YO MAMA JOKES", "/savage-yo-mama-jokes", "Want something with sharper elbows?"],
        ["YO MAMA BATTLE", "/yo-mama-battle", "Turn the laugh into a score."],
      ]} />
      <BattleCta page={page.slug} location="end" title="Funny is good. Funny under pressure is better." />
    </ContentShell>
  );
}

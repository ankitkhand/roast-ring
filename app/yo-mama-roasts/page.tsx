import type { Metadata } from "next";
import { BattleCta, ContentHero, ContentSection, ContentShell, JokeList, RelatedPages } from "@/components/content/content-primitives";
import { quickRoasts } from "@/lib/content/yo-mama/jokes";
import { contentPages, metadataFor } from "@/lib/content/yo-mama/pages";

const page = contentPages["yo-mama-roasts"];
export const metadata: Metadata = metadataFor(page.slug);

export default function YoMamaRoastsPage() {
  return (
    <ContentShell page={page}>
      <ContentHero page={page} />
      <ContentSection id="quick-roasts" title="Quick Yo Mama Roasts" intro="Twelve examples to show the rhythm before we take it apart.">
        <JokeList jokes={quickRoasts} page={page.slug} />
      </ContentSection>

      <ContentSection id="how-it-works" title="How a Yo Mama roast works" intro="The basic frame gives the audience a map. Your consequence supplies the surprise.">
        <div className="formula-card"><span>THE FRAME</span><code>Yo mama so [trait], [absurd consequence].</code><p>Choose one trait. Push it far beyond reality. Make the consequence specific enough to picture.</p></div>
      </ContentSection>

      <ContentSection id="weak-vs-strong" title="Weak roast vs stronger roast" intro="A label is not a punchline. Give the premise somewhere to go.">
        <div className="roast-rewrite">
          <article><span>WEAK</span><blockquote>“Yo mama is bad at cooking.”</blockquote><p>It states an opinion, but there is no setup, turn or image.</p></article>
          <article><span>STRONGER</span><blockquote>“Yo mama so bad at cooking, the smoke alarm leaves five-star reviews for surviving.”</blockquote><p>The same premise gains exaggeration, an unexpected character and a finish on the funniest idea.</p></article>
        </div>
      </ContentSection>

      <BattleCta page={page.slug} title="You know the structure." text="Now try building one with 45 seconds on the clock." />

      <ContentSection id="improvise" title="How to improvise a roast">
        <ol className="steps-list">
          <li><strong>Pick one trait.</strong><p>Slow, broke, forgetful, dramatic, messy or bad at one specific task.</p></li>
          <li><strong>Choose a setting.</strong><p>A kitchen, meeting, group chat, game, date or ordinary trip gives the joke something concrete.</p></li>
          <li><strong>Exaggerate absurdly.</strong><p>Ask what an object, company or bystander would do if the trait became impossible to ignore.</p></li>
          <li><strong>Cut the explanation.</strong><p>Keep the setup short and land on the consequence. The audience can do the final inch of work.</p></li>
        </ol>
      </ContentSection>

      <ContentSection id="structures" title="Common roast structures" intro="Use these as launch ramps, not fill-in-the-blank prisons.">
        <div className="structure-list">
          <article><code>Yo mama so slow...</code><p>Make time, transport or technology lose patience.</p></article>
          <article><code>Yo mama so broke...</code><p>Let a bank, wallet, coupon or free trial react.</p></article>
          <article><code>Yo mama so forgetful...</code><p>Create reminders that need reminders.</p></article>
          <article><code>Yo mama so dramatic...</code><p>Turn an ordinary task into a season finale.</p></article>
          <article><code>Yo mama so bad at...</code><p>Give the tools or ingredients their own response.</p></article>
          <article><code>Even [object]...</code><p>Personify something unexpected and let it deliver the verdict.</p></article>
        </div>
      </ContentSection>

      <ContentSection id="battle-tips" title="Roast battle tips">
        <div className="editorial-columns">
          <article><h3>Answer the room</h3><p>A relevant comeback feels improvised even when the structure is familiar.</p></article>
          <article><h3>Protect the ending</h3><p>Do not trail off after the punchline. Stop while the laugh still belongs to you.</p></article>
          <article><h3>Stay fictional</h3><p>Competition works without hate, threats or targeting a real person. Aim at the premise.</p></article>
        </div>
      </ContentSection>

      <RelatedPages current={page.slug} links={[
        ["ALL YO MAMA JOKES", "/yo-mama-jokes", "Explore themes and formats."],
        ["BEST YO MAMA JOKES", "/best-yo-mama-jokes", "Study sixty finished examples."],
        ["YO MAMA BATTLE", "/yo-mama-battle", "Put the method under pressure."],
      ]} />
      <BattleCta page={page.slug} location="end" title="BATTLE THE MOUTH" text="Three rounds. Your lines. No explanation after the punchline." />
    </ContentShell>
  );
}

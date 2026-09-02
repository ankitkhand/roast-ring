import type { Metadata } from "next";
import Link from "next/link";
import { ContentHero, ContentSection, ContentShell, RelatedPages } from "@/components/content/content-primitives";
import { TrackedContentLink } from "@/components/content/content-interactions";
import { contentPages, metadataFor } from "@/lib/content/yo-mama/pages";

const page = contentPages["yo-mama-battle"];
export const metadata: Metadata = metadataFor(page.slug);

export default function YoMamaBattlePage() {
  return (
    <ContentShell page={page}>
      <ContentHero page={page} directBattle><span className="free-note">NO LOGIN <b>•</b> THREE ROUNDS</span></ContentHero>

      <ContentSection id="how-it-works" title="How It Works">
        <ol className="battle-steps">
          <li><span>01</span><h3>The Mouth swings</h3><p>Your opponent opens each round with a fresh roast.</p></li>
          <li><span>02</span><h3>You fire back</h3><p>Type or speak your comeback before the 45-second clock expires.</p></li>
          <li><span>03</span><h3>The judge rules</h3><p>See the score, hear the verdict and move to the next round.</p></li>
        </ol>
      </ContentSection>

      <ContentSection id="scoring" title="How scoring works" intro="A loud line is not automatically a good line. Every response is judged across three useful dimensions.">
        <div className="score-pillars">
          <article><span>C</span><h3>Creativity</h3><p>Is the premise inventive, and does the payoff take an unexpected route?</p></article>
          <article><span>S</span><h3>Savagery</h3><p>How much competitive punch does the line deliver without relying on real harm?</p></article>
          <article><span>O</span><h3>Originality</h3><p>Does it feel fresh rather than copied, recycled or obvious?</p></article>
        </div>
      </ContentSection>

      <section className="example-battle" aria-labelledby="example-heading">
        <div><span>EXAMPLE EXCHANGE</span><h2 id="example-heading">One round. Two shots.</h2></div>
        <blockquote><b>THE MOUTH</b> “Yo mama so late, the after-party sent a search party.”</blockquote>
        <blockquote><b>YOU</b> “Yo mama so slow, her shortcut comes with an overnight stay.”</blockquote>
        <p>The sharper premise wins the round. The full battle runs for three.</p>
      </section>

      <ContentSection id="difference" title="Why Roast Clash is different">
        <div className="feature-list">
          <p><strong>Timed rounds</strong><span>No endless drafting. The clock keeps the comeback honest.</span></p>
          <p><strong>Score-based competition</strong><span>Every line gets more than a generic thumbs-up.</span></p>
          <p><strong>Optional voice input</strong><span>Deliver the roast when typing is too polite.</span></p>
          <p><strong>Challenge friends</strong><span>Share your score and give someone a number to beat.</span></p>
        </div>
      </ContentSection>

      <section className="final-battle-cta">
        <p>THINK YOU’RE FUNNY?</p><h2>PROVE IT.</h2>
        <TrackedContentLink href="/battle" page={page.slug} location="end" className="button button-primary button-xl">BATTLE NOW <span aria-hidden="true">↗</span></TrackedContentLink>
      </section>

      <RelatedPages current={page.slug} links={[
        ["ALL YO MAMA JOKES", "/yo-mama-jokes", "Warm up with the complete hub."],
        ["YO MAMA ROASTS", "/yo-mama-roasts", "Learn how to build a comeback."],
        ["SAVAGE YO MAMA JOKES", "/savage-yo-mama-jokes", "Study sharper battle material."],
      ]} />
      <p className="content-small-note">Want examples before you enter? <Link href="/best-yo-mama-jokes">Browse the Hall of Fame.</Link></p>
    </ContentShell>
  );
}

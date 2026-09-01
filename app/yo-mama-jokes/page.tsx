import type { Metadata } from "next";
import Link from "next/link";
import { BattleCta, ContentHero, ContentSection, ContentShell, JokeList, RelatedPages } from "@/components/content/content-primitives";
import { hubJokes } from "@/lib/content/yo-mama/jokes";
import { contentPages, metadataFor } from "@/lib/content/yo-mama/pages";

const page = contentPages["yo-mama-jokes"];
export const metadata: Metadata = metadataFor(page.slug);

const categoryJokes = hubJokes.slice(0, 13);

export default function YoMamaJokesPage() {
  return (
    <ContentShell page={page}>
      <ContentHero page={page}><Link className="text-link" href="#categories">BROWSE CATEGORIES ↓</Link></ContentHero>

      <nav className="category-nav" aria-label="Joke categories">
        <strong>JUMP TO A THEME</strong>
        <div>{categoryJokes.map((joke) => <Link key={joke.id} href={`#theme-${joke.category}`}>{joke.category}</Link>)}</div>
      </nav>

      <ContentSection id="collections" title="Pick your kind of funny" intro="These collections serve different moods. Choose the room you are actually trying to win.">
        <div className="intent-grid">
          <Link href="/best-yo-mama-jokes"><span>01</span><h3>THE BEST</h3><p>Sixty Hall of Fame picks, edited hard.</p></Link>
          <Link href="/funny-yo-mama-jokes"><span>02</span><h3>FUNNY</h3><p>Absurd, playful and group-chat ready.</p></Link>
          <Link href="/savage-yo-mama-jokes"><span>03</span><h3>SAVAGE</h3><p>Sharper lines built for competition.</p></Link>
          <Link href="/yo-mama-roasts"><span>04</span><h3>WRITE YOUR OWN</h3><p>Structures, examples and battle tips.</p></Link>
        </div>
      </ContentSection>

      <ContentSection id="categories" title="Yo Mama jokes by theme" intro="A broad starting set: old-school premises, everyday disasters and modern life. Each line gets in, turns, and gets out.">
        <ul className="theme-grid">
          {categoryJokes.map((joke) => <li id={`theme-${joke.category}`} key={joke.id}><span>{joke.category}</span><p>{joke.text}</p></li>)}
        </ul>
      </ContentSection>

      <BattleCta page={page.slug} title="Ready to stop reading and start roasting?" />

      <ContentSection id="one-liners" title="Short one-liners" intro="The cleanest battle lines do not ask the audience to wait around for the point.">
        <JokeList jokes={hubJokes.slice(13, 16)} page={page.slug} />
      </ContentSection>

      <ContentSection id="classic-modern" title="Classic vs modern Yo Mama jokes" intro="The engine stays the same. The reference point changes.">
        <div className="comparison-grid">
          <article><span>CLASSIC FORMAT</span><h3>One trait. Huge exaggeration.</h3><p>Classic lines use a familiar setup—slow, loud, lazy, forgetful—then push the consequence somewhere impossible.</p><JokeList jokes={hubJokes.slice(16, 19)} page={page.slug} /></article>
          <article><span>MODERN FORMAT</span><h3>Same rhythm. New surroundings.</h3><p>Modern jokes borrow from scrolling, cloud storage and smart devices, but the technology should support the punchline rather than replace it.</p><JokeList jokes={hubJokes.slice(19, 22)} page={page.slug} /></article>
        </div>
      </ContentSection>

      <ContentSection id="what-makes-good" title="What makes a good Yo Mama joke?" intro="A familiar opening is useful. A familiar ending is not.">
        <div className="editorial-columns">
          <article><h3>Make the picture immediate</h3><p>The audience should understand the premise before the punchline arrives. Pick one trait and give it a concrete setting.</p></article>
          <article><h3>Escalate past reality</h3><p>The fun lives in the impossible consequence: an alarm clock applying for work, a calendar keeping a waiting list, or an app asking for help.</p></article>
          <article><h3>Finish on the turn</h3><p>Put the funniest word or image at the end. Explaining after the punchline is how a roast turns into a meeting.</p></article>
        </div>
      </ContentSection>

      <ContentSection title="Two more examples by theme">
        <JokeList jokes={hubJokes.slice(22)} page={page.slug} />
      </ContentSection>

      <RelatedPages current={page.slug} links={[
        ["BEST YO MAMA JOKES", "/best-yo-mama-jokes", "The strongest curated lines."],
        ["YO MAMA ROASTS", "/yo-mama-roasts", "Turn a premise into your own punchline."],
        ["YO MAMA BATTLE", "/yo-mama-battle", "Take a line into the arena."],
      ]} />
      <BattleCta page={page.slug} location="end" title="Think yours is better?" text="Three rounds will settle it." />
    </ContentShell>
  );
}

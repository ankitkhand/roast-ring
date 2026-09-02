import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { siteConfig, siteUrl } from "@/lib/config";
import type { ContentPageDefinition, YoMamaJoke } from "@/lib/content/yo-mama/types";
import { ContentPageAnalytics, JokeCopyButton, TrackedContentLink } from "./content-interactions";

const hubLinks = [
  ["JOKES", "/yo-mama-jokes"],
  ["BEST", "/best-yo-mama-jokes"],
  ["FUNNY", "/funny-yo-mama-jokes"],
  ["SAVAGE", "/savage-yo-mama-jokes"],
  ["ROASTS", "/yo-mama-roasts"],
  ["BATTLE", "/yo-mama-battle"],
] as const;

export function ContentShell({ page, children }: { page: ContentPageDefinition; children: ReactNode }) {
  return (
    <main id="main" className="content-shell">
      <ContentPageAnalytics slug={page.slug} />
      <header className="content-topbar">
        <Brand />
        <nav aria-label="Yo Mama content navigation">
          {hubLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </header>
      <Breadcrumbs page={page} />
      {children}
      <ContentFooter />
    </main>
  );
}

export function Breadcrumbs({ page }: { page: ContentPageDefinition }) {
  const isHub = page.slug === "yo-mama-jokes";
  const items = [
    { name: siteConfig.name, path: "/" },
    ...(isHub ? [] : [{ name: "Yo Mama Jokes", path: "/yo-mama-jokes" }]),
    { name: page.h1, path: `/${page.slug}` },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          {items.map((item, index) => (
            <li key={item.path}>
              {index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}

export function ContentHero({ page, children, directBattle = false }: { page: ContentPageDefinition; children?: ReactNode; directBattle?: boolean }) {
  return (
    <header className="content-hero">
      <p className="content-eyebrow">{page.eyebrow}</p>
      <h1>{page.h1}</h1>
      <p className="content-intro">{page.intro}</p>
      <div className="content-hero-actions">
        <TrackedContentLink
          href={directBattle ? "/battle" : "/yo-mama-battle"}
          page={page.slug}
          location="hero"
          className="button button-primary"
        >
          {directBattle ? "BATTLE NOW" : "ENTER THE ARENA"} <span aria-hidden="true">↗</span>
        </TrackedContentLink>
        {children}
      </div>
    </header>
  );
}

export function ContentSection({ id, title, intro, children, className = "" }: {
  id?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`content-section ${className}`.trim()}>
      <div className="content-section-heading">
        <h2>{title}</h2>
        {intro && <p>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

export function JokeList({ jokes, page, ordered = false }: { jokes: readonly YoMamaJoke[]; page: string; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className="joke-list">
      {jokes.map((joke) => (
        <li key={joke.id} className="joke-card-content">
          <p>{joke.text}</p>
          <div><span>{joke.category}</span><JokeCopyButton jokeId={joke.id} text={joke.text} page={page} /></div>
        </li>
      ))}
    </List>
  );
}

export function BattleCta({ page, location = "mid", title = "Think yours is better?", text = "Stop reading and start roasting. The Mouth is waiting." }: {
  page: string;
  location?: string;
  title?: string;
  text?: string;
}) {
  return (
    <aside className="content-battle-cta">
      <div><span>YOUR TURN</span><h2>{title}</h2><p>{text}</p></div>
      <TrackedContentLink href="/yo-mama-battle" page={page} location={location} className="button button-dark">BATTLE THE MOUTH <span aria-hidden="true">→</span></TrackedContentLink>
    </aside>
  );
}

export function RelatedPages({ current, links }: { current: string; links: readonly [label: string, href: string, text: string][] }) {
  return (
    <section className="related-pages" aria-labelledby={`${current}-related`}>
      <h2 id={`${current}-related`}>KEEP ROASTING</h2>
      <div>
        {links.map(([label, href, text]) => <Link key={href} href={href}><strong>{label}</strong><span>{text}</span><i aria-hidden="true">→</i></Link>)}
      </div>
    </section>
  );
}

export function ContentFooter() {
  return (
    <footer className="content-footer">
      <Brand compact />
      <nav aria-label="Content footer navigation">
        <Link href="/yo-mama-jokes">JOKES</Link>
        <Link href="/yo-mama-roasts">ROASTS</Link>
        <Link href="/yo-mama-battle">BATTLE</Link>
      </nav>
      <span>© {new Date().getFullYear()} {siteConfig.name.toUpperCase()}</span>
    </footer>
  );
}

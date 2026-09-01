import type { Metadata } from "next";
import type { ContentPageDefinition, ContentSlug } from "./types";

export const contentPages: Record<ContentSlug, ContentPageDefinition> = {
  "yo-mama-jokes": {
    slug: "yo-mama-jokes",
    title: "Yo Mama Jokes: Funny, Savage & Classic Roasts | Roast Arena",
    h1: "Yo Mama Jokes",
    description: "Browse funny, savage, classic and modern Yo Mama jokes, learn why the best punchlines land, then test your own roast against The Mouth.",
    eyebrow: "THE COMPLETE ROAST PLAYBOOK",
    intro: "A useful collection for every kind of roast: quick classics, modern twists, sharp one-liners and examples organised by theme.",
    intent: "Comprehensive evergreen hub",
  },
  "best-yo-mama-jokes": {
    slug: "best-yo-mama-jokes",
    title: "Best Yo Mama Jokes: Roast Arena Hall of Fame",
    h1: "The Best Yo Mama Jokes",
    description: "A tightly curated Hall of Fame featuring 60 of Roast Arena’s strongest classic, modern, clever and battle-ready Yo Mama jokes.",
    eyebrow: "ROAST ARENA HALL OF FAME",
    intro: "No giant filler dump. These are the lines with a clean setup, a sharp turn and a punchline worth stealing the room for.",
    intent: "Strongest curated collection",
  },
  "funny-yo-mama-jokes": {
    slug: "funny-yo-mama-jokes",
    title: "Funny Yo Mama Jokes That Actually Land | Roast Arena",
    h1: "Funny Yo Mama Jokes",
    description: "Thirty playful Yo Mama jokes built around absurdity, wordplay, group-chat chaos and modern everyday life—not maximum insult damage.",
    eyebrow: "LAUGH FIRST. ROAST SECOND.",
    intro: "Light, ridiculous and easy to share. This collection aims for the laugh before the damage report.",
    intent: "Laugh-first playful material",
  },
  "savage-yo-mama-jokes": {
    slug: "savage-yo-mama-jokes",
    title: "Savage Yo Mama Jokes for a Proper Roast | Roast Arena",
    h1: "Savage Yo Mama Jokes",
    description: "Thirty sharper, battle-ready Yo Mama jokes with competitive punch, clever exaggeration and none of the hateful or genuinely abusive stuff.",
    eyebrow: "SHARP LINES. CLEAN TARGETS.",
    intro: "Built for a roast battle: tighter setups, harder turns and enough bite to wake up a scoreboard—without crossing into real abuse.",
    intent: "Sharper competitive roast material",
  },
  "yo-mama-roasts": {
    slug: "yo-mama-roasts",
    title: "Yo Mama Roasts: Lines, Comebacks & How to Win a Roast Battle",
    h1: "Yo Mama Roasts",
    description: "Learn the setup, exaggeration and punchline behind a strong Yo Mama roast, with quick examples, practical structures and battle tips.",
    eyebrow: "BUILD A BETTER COMEBACK",
    intro: "A practical guide to writing your own line: choose one premise, exaggerate it past reality and finish on the funniest possible consequence.",
    intent: "Roast writing and improvisation guide",
  },
  "yo-mama-battle": {
    slug: "yo-mama-battle",
    title: "Yo Mama Battle: Enter Roast Arena and Beat The Mouth",
    h1: "Yo Mama Battle",
    description: "Enter a three-round Yo Mama battle against The Mouth. You have 45 seconds to answer before creativity, savagery and originality are scored.",
    eyebrow: "45 SECONDS. THREE ROUNDS. ONE BIG MOUTH.",
    intro: "Trade roasts with The Mouth and get every comeback scored for creativity, savagery and originality.",
    intent: "Interactive game and product landing page",
  },
};

export const contentSlugs = Object.keys(contentPages) as ContentSlug[];

export function metadataFor(slug: ContentSlug): Metadata {
  const page = contentPages[slug];
  const path = `/${slug}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: {
      title: page.title,
      description: page.description,
      url: path,
      type: "website",
      siteName: "Roast Arena",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
    robots: { index: true, follow: true },
  };
}

export const contentIntentMap = contentSlugs.map((slug) => ({ slug, intent: contentPages[slug].intent }));

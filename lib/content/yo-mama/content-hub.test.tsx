import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import YoMamaJokesPage, { metadata as hubMetadata } from "@/app/yo-mama-jokes/page";
import BestYoMamaJokesPage, { metadata as bestMetadata } from "@/app/best-yo-mama-jokes/page";
import FunnyYoMamaJokesPage, { metadata as funnyMetadata } from "@/app/funny-yo-mama-jokes/page";
import SavageYoMamaJokesPage, { metadata as savageMetadata } from "@/app/savage-yo-mama-jokes/page";
import YoMamaRoastsPage, { metadata as roastsMetadata } from "@/app/yo-mama-roasts/page";
import YoMamaBattlePage, { metadata as battleMetadata } from "@/app/yo-mama-battle/page";
import { allEditorialJokes, bestJokes, funnyJokes, hubJokes, quickRoasts, savageJokes, specialistCollections } from "./jokes";
import { contentPages, contentSlugs } from "./pages";

const routes = [
  ["yo-mama-jokes", YoMamaJokesPage, hubMetadata],
  ["best-yo-mama-jokes", BestYoMamaJokesPage, bestMetadata],
  ["funny-yo-mama-jokes", FunnyYoMamaJokesPage, funnyMetadata],
  ["savage-yo-mama-jokes", SavageYoMamaJokesPage, savageMetadata],
  ["yo-mama-roasts", YoMamaRoastsPage, roastsMetadata],
  ["yo-mama-battle", YoMamaBattlePage, battleMetadata],
] as const;

function titleOf(metadata: typeof hubMetadata) {
  return typeof metadata.title === "object" && metadata.title && "absolute" in metadata.title ? metadata.title.absolute : metadata.title;
}

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

describe("Yo Mama content hub", () => {
  it("renders all six routes with one unique H1 each", () => {
    const headings = routes.map(([slug, Page]) => {
      const markup = renderToStaticMarkup(<Page />);
      const matches = [...markup.matchAll(/<h1[^>]*>(.*?)<\/h1>/g)];
      expect(matches, slug).toHaveLength(1);
      expect(markup, slug).toContain(contentPages[slug].h1);
      return matches[0][1].replace(/<[^>]+>/g, "");
    });
    expect(new Set(headings).size).toBe(routes.length);
  });

  it("uses unique metadata titles, descriptions and self-canonicals", () => {
    const descriptions: string[] = [];
    const titles = routes.map(([slug, , metadata]) => {
      expect(metadata.description, slug).toBe(contentPages[slug].description);
      expect(metadata.alternates?.canonical, slug).toBe(`/${slug}`);
      expect(metadata.openGraph?.url, slug).toBe(`/${slug}`);
      descriptions.push(String(metadata.description));
      return titleOf(metadata);
    });
    expect(new Set(titles).size).toBe(routes.length);
    expect(new Set(descriptions).size).toBe(routes.length);
  });

  it("includes every clean content URL in the sitemap exactly once", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const slug of contentSlugs) expect(urls.filter((url) => url.endsWith(`/${slug}`)), slug).toHaveLength(1);
  });

  it("links the pillar to every specialist page", () => {
    const markup = renderToStaticMarkup(<YoMamaJokesPage />);
    for (const slug of contentSlugs.filter((slug) => slug !== "yo-mama-jokes")) expect(markup).toContain(`href="/${slug}"`);
  });

  it("links every specialist page back to the pillar", () => {
    for (const [slug, Page] of routes.filter(([slug]) => slug !== "yo-mama-jokes")) {
      expect(renderToStaticMarkup(<Page />), slug).toContain("href=\"/yo-mama-jokes\"");
    }
  });

  it("gives every page a valid battle CTA", () => {
    for (const [slug, Page] of routes) {
      const markup = renderToStaticMarkup(<Page />);
      expect(markup.includes("href=\"/yo-mama-battle\"") || markup.includes("href=\"/battle\""), slug).toBe(true);
    }
  });

  it("keeps every editorial collection non-empty and at its intended depth", () => {
    expect(hubJokes.length).toBeGreaterThanOrEqual(20);
    expect(bestJokes).toHaveLength(60);
    expect(funnyJokes).toHaveLength(30);
    expect(savageJokes).toHaveLength(30);
    expect(quickRoasts).toHaveLength(12);
  });

  it("uses globally unique joke IDs and no duplicate text within a collection", () => {
    expect(new Set(allEditorialJokes.map((joke) => joke.id)).size).toBe(allEditorialJokes.length);
    for (const collection of [hubJokes, bestJokes, funnyJokes, savageJokes, quickRoasts]) {
      expect(new Set(collection.map((joke) => normalise(joke.text))).size).toBe(collection.length);
    }
  });

  it("keeps exact specialist overlap below ten percent", () => {
    const entries = Object.entries(specialistCollections);
    for (let left = 0; left < entries.length; left += 1) {
      for (let right = left + 1; right < entries.length; right += 1) {
        const leftTexts = new Set(entries[left][1].map((joke) => normalise(joke.text)));
        const overlap = entries[right][1].filter((joke) => leftTexts.has(normalise(joke.text))).length;
        const rate = overlap / Math.min(entries[left][1].length, entries[right][1].length);
        expect(rate, `${entries[left][0]} vs ${entries[right][0]}`).toBeLessThan(0.1);
      }
    }
  });

  it("renders semantic breadcrumbs and BreadcrumbList data", () => {
    const markup = renderToStaticMarkup(<FunnyYoMamaJokesPage />);
    expect(markup).toContain("aria-label=\"Breadcrumb\"");
    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("BreadcrumbList");
  });
});

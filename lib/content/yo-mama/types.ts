export type JokeTone = "funny" | "savage" | "classic" | "modern" | "clever";

export type YoMamaJoke = {
  id: string;
  text: string;
  category: string;
  tags: string[];
  tone: JokeTone;
  featured?: boolean;
};

export type ContentSlug =
  | "yo-mama-jokes"
  | "best-yo-mama-jokes"
  | "funny-yo-mama-jokes"
  | "savage-yo-mama-jokes"
  | "yo-mama-roasts"
  | "yo-mama-battle";

export type ContentPageDefinition = {
  slug: ContentSlug;
  title: string;
  h1: string;
  description: string;
  eyebrow: string;
  intro: string;
  intent: string;
};

export const siteConfig = {
  name: "Roast Clash",
  shortName: "RC",
  gameName: "Yo Mama Battle",
  description: "Battle The Mouth in three rapid-fire rounds of AI-powered Yo Mama jokes.",
  opponent: {
    id: "the-mouth",
    name: "THE MOUTH",
    tagline: "All bark. Even more bite.",
    avatar: "M",
  },
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

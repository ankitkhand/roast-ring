import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { contentSlugs } from "@/lib/content/yo-mama/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...contentSlugs.map((slug) => ({
      url: `${siteUrl}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: slug === "yo-mama-jokes" ? 0.9 : slug === "yo-mama-battle" ? 0.85 : 0.8,
    })),
  ];
}

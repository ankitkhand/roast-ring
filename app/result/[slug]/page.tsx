import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result-view";
import { decodeResult } from "@/lib/codec";
import { siteConfig } from "@/lib/config";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = decodeResult(slug);
  if (!result) return { title: "Battle not found", robots: { index: false } };
  const title = result.winner === "user" ? `Human wins ${result.userTotal}–${result.aiTotal}` : result.winner === "ai" ? `The Mouth wins ${result.aiTotal}–${result.userTotal}` : `A ${result.userTotal}–${result.aiTotal} dead heat`;
  const description = `Three rounds. One savage verdict. Can you beat ${result.userTotal}?`;
  return {
    title,
    description,
    alternates: { canonical: `/result/${slug}` },
    openGraph: { title: `${title} | ${siteConfig.gameName}`, description, url: `/result/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ResultPage({ params }: Props) {
  const { slug } = await params;
  const result = decodeResult(slug);
  if (!result) notFound();
  return <ResultView result={result} />;
}

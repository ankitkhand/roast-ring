import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChallengeView } from "@/components/challenge-view";
import { decodeChallenge } from "@/lib/codec";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const challenge = decodeChallenge((await params).token);
  if (!challenge) return { title: "Challenge not found", robots: { index: false } };
  return {
    title: `${challenge.challenger} challenged you`,
    description: `Beat ${challenge.scoreToBeat.toFixed(1)} in a three-round comedy battle against The Mouth. No login needed.`,
    robots: { index: false, follow: true },
  };
}

export default async function ChallengePage({ params }: Props) {
  const { token } = await params;
  const challenge = decodeChallenge(token);
  if (!challenge) notFound();
  return <ChallengeView challenge={challenge} token={token} />;
}

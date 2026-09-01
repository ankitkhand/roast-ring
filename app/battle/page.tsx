import type { Metadata } from "next";
import { Suspense } from "react";
import { BattleGame } from "@/components/battle-game";
import { EnteringArena } from "@/components/theatrical-loading";

export const metadata: Metadata = { title: "Battle The Mouth", robots: { index: false, follow: true } };

export default function BattlePage() {
  return <Suspense fallback={<EnteringArena />}><BattleGame /></Suspense>;
}

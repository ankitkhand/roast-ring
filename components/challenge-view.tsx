"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Brand } from "./brand";
import { track } from "@/lib/analytics";
import type { Challenge } from "@/lib/types";

export function ChallengeView({ challenge, token }: { challenge: Challenge; token: string }) {
  useEffect(() => track("challenge_opened", { sourceId: challenge.sourceId }), [challenge.sourceId]);
  return (
    <main id="main" className="challenge-shell">
      <nav className="topbar"><Brand /><span className="online-pill"><i /> CHALLENGE LIVE</span></nav>
      <section className="challenge-card">
        <div className="challenge-bolt">⚡</div>
        <p>YOU’VE BEEN CALLED OUT</p>
        <h1>{challenge.challenger}<br /><span>THINKS YOU CAN’T WIN.</span></h1>
        <div className="score-to-beat"><small>SCORE TO BEAT</small><strong>{challenge.scoreToBeat.toFixed(1)}</strong><span>3 ROUNDS · VS THE MOUTH</span></div>
        <Link className="button button-primary button-xl button-full" href={`/battle?challenge=${token}`} onClick={() => track("challenge_accepted", { sourceId: challenge.sourceId })}>ACCEPT CHALLENGE <span>↗</span></Link>
        <small>NO LOGIN. NO EXCUSES.</small>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Brand } from "./brand";
import { battleLoadingMessages, judgeLoadingMessages, loadingMessageAt, opponentLoadingMessages } from "@/lib/loading";

function useRotatingMessage(messages: readonly string[]) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => value + 1), 1_800);
    return () => window.clearInterval(timer);
  }, [messages]);
  return loadingMessageAt(messages, index);
}

export function EnteringArena() {
  const message = useRotatingMessage(battleLoadingMessages);
  return (
    <section className="arena-entry-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="entry-topbar"><Brand /><span>3 ROUNDS · NO MERCY</span></div>
      <div className="entry-burst" aria-hidden="true">OOOH!</div>
      <div className="entry-loading-content">
        <div className="entry-versus" aria-hidden="true"><span>M</span><b>VS</b><span>YOU</span></div>
        <p className="loading-kicker">LIGHTS ON · MIC HOT</p>
        <h1>ENTERING<br /><span>THE ARENA</span></h1>
        <div className="loading-track" aria-hidden="true"><i /></div>
        <p className="rotating-loading-copy">{message}</p>
        <div className="loading-tags" aria-hidden="true"><span>WAIT FOR IT</span><span>NO TURNING BACK</span></div>
      </div>
    </section>
  );
}

export function OpponentLoading() {
  const message = useRotatingMessage(opponentLoadingMessages);
  return (
    <div className="opponent-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="cooking-avatar" aria-hidden="true">M<i /></div>
      <div>
        <strong>THE MOUTH IS COOKING</strong>
        <p>{message}</p>
      </div>
      <div className="cooking-track" aria-hidden="true"><i /></div>
      <div className="cooking-tags" aria-hidden="true"><span>COOKING</span><span>WAIT FOR IT</span></div>
    </div>
  );
}

export function JudgeLoading() {
  const message = useRotatingMessage(judgeLoadingMessages);
  return (
    <section className="score-reveal judge-loading" role="status" aria-live="polite" aria-atomic="true">
      <div className="verdict-stamp">THE JUDGE IS DECIDING</div>
      <div className="judge-gavel" aria-hidden="true">★</div>
      <h2>HOLD THAT THOUGHT.</h2>
      <div className="category-scores indeterminate-scores" aria-label="Creativity, savagery, and originality are being judged">
        {["Creativity", "Savagery", "Originality"].map((category, index) => (
          <div key={category}>
            <span>{category}</span>
            <i aria-hidden="true"><b style={{ animationDelay: `${index * 160}ms` }} /></i>
            <strong aria-hidden="true">•••</strong>
          </div>
        ))}
      </div>
      <blockquote>“{message}” <cite>— THE JUDGE</cite></blockquote>
      <p className="judge-wait-note">THE SCOREBOARD WILL SPEAK FOR ITSELF</p>
    </section>
  );
}

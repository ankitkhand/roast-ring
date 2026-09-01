"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Brand } from "./brand";
import { track } from "@/lib/analytics";
import { encodeChallenge } from "@/lib/codec";
import type { BattleResult } from "@/lib/types";

async function copy(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Some embedded browsers expose the API but deny access. Fall through.
    }
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  return copied;
}

export function ResultView({ result }: { result: BattleResult }) {
  const [copied, setCopied] = useState<"result" | "challenge" | null>(null);
  const [manualLink, setManualLink] = useState("");
  const [nickname, setNickname] = useState("");
  const challengeToken = useMemo(() => encodeChallenge({ version: 1, sourceId: result.id, challenger: nickname.trim() || "A challenger", scoreToBeat: result.userTotal }), [nickname, result.id, result.userTotal]);
  const userWon = result.winner === "user";
  const title = result.winner === "tie" ? "IT’S A DRAW" : userWon ? "YOU WON" : "YOU LOST";
  const challengeOutcome = result.challengeTarget === undefined ? null : result.userTotal > result.challengeTarget;

  async function shareResult() {
    const url = window.location.href;
    const shareData = { title: "My Roast Arena result", text: `I scored ${result.userTotal.toFixed(1)} against The Mouth. Think you can beat me?`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); track("result_shared", { method: "native" }); return; } catch { /* user cancelled */ }
    }
    if (await copy(url)) { setCopied("result"); track("share_link_copied", { type: "result" }); }
    else setManualLink(url);
  }

  async function createChallenge() {
    const url = `${window.location.origin}/challenge/${challengeToken}`;
    const data = { title: "You’ve been challenged", text: `I scored ${result.userTotal.toFixed(1)}. Think you can beat me?`, url };
    track("challenge_created", { score: result.userTotal });
    if (navigator.share) {
      try { await navigator.share(data); return; } catch { /* user cancelled */ }
    }
    if (await copy(url)) { setCopied("challenge"); track("share_link_copied", { type: "challenge" }); }
    else setManualLink(url);
  }

  return (
    <main id="main" className={`result-shell ${userWon ? "result-win" : ""}`}>
      <header className="result-topbar"><Brand /><span>BATTLE #{result.id.toUpperCase()}</span></header>
      <section className="result-hero">
        <div className="confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <p className="result-eyebrow">FINAL VERDICT</p>
        <h1>{title}<span>.</span></h1>
        <p>{result.winner === "tie" ? "Nobody blinked. Nobody backed down." : userWon ? "Humanity lives to roast another day." : "The Mouth cooked you."}</p>
        {challengeOutcome !== null && <div className={`challenge-outcome ${challengeOutcome ? "beat" : "missed"}`}>{challengeOutcome ? "⚡ CHALLENGE BEATEN" : "CHALLENGE MISSED"} · Target {result.challengeTarget?.toFixed(1)}</div>}
        <div className="final-score">
          <div><small>YOU</small><strong>{result.userTotal.toFixed(1)}</strong><span>{userWon ? "CHAMPION" : "BRAVE HUMAN"}</span></div>
          <b>—</b>
          <div><small>THE MOUTH</small><strong>{result.aiTotal.toFixed(1)}</strong><span>YOUR OPPONENT</span></div>
        </div>
      </section>

      <section className="result-content">
        <div className="best-line-card">
          <span>★ LINE OF THE NIGHT</span>
          <blockquote>“{result.bestLine}”</blockquote>
        </div>

        <section className="round-recap" aria-labelledby="recap-heading">
          <div className="section-heading"><h2 id="recap-heading">ROUND BY ROUND</h2><span>THE RECEIPTS</span></div>
          {result.rounds.map((round) => (
            <details key={round.roundNumber} className="recap-row" open>
              <summary>
                <span>ROUND {round.roundNumber}</span>
                <div><b>{round.judgement.userScore.toFixed(1)}</b><small>YOU</small></div>
                <i>VS</i>
                <div><b>{round.judgement.aiScore.toFixed(1)}</b><small>MOUTH</small></div>
                <strong>{round.judgement.roundWinner === "user" ? "W" : round.judgement.roundWinner === "ai" ? "L" : "D"}</strong>
              </summary>
              <div className="recap-lines"><p><b>THE MOUTH</b> “{round.aiJoke}”</p><p><b>YOU</b> {round.timedOut ? <em>TIMEOUT — NO COMEBACK SUBMITTED</em> : <>“{round.userJoke}”</>}</p><small>{round.judgement.commentary}</small></div>
            </details>
          ))}
        </section>

        <section className="viral-card">
          <div><span>THINK YOUR FRIENDS CAN DO BETTER?</span><h2>CALL THEM OUT.</h2><p>Create a no-login challenge link with your <b>{result.userTotal.toFixed(1)}</b> score baked in.</p></div>
          <label>YOUR NAME <input value={nickname} maxLength={30} onChange={(event) => setNickname(event.target.value)} placeholder="Optional nickname" /></label>
          <button className="button button-dark button-full" onClick={createChallenge}>⚡ {copied === "challenge" ? "CHALLENGE LINK COPIED" : "CHALLENGE A FRIEND"}</button>
          {manualLink && <label className="manual-link">COPY THIS LINK <input value={manualLink} readOnly onFocus={(event) => event.currentTarget.select()} aria-label="Share link" /></label>}
        </section>

        <div className="result-actions">
          <button className="button button-primary" onClick={shareResult}>{copied === "result" ? "LINK COPIED!" : "SHARE RESULT"} <span>↗</span></button>
          <Link className="button button-secondary" href="/battle" onClick={() => track("replay_started")}>PLAY AGAIN <span>↻</span></Link>
        </div>
        <p className="result-note">This result is stored in its share link—no account or private profile required.</p>
      </section>
    </main>
  );
}

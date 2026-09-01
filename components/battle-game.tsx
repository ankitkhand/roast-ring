"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "./brand";
import { EnteringArena, JudgeLoading, OpponentLoading } from "./theatrical-loading";
import { TurnTimer } from "./turn-timer";
import { VoiceInputControl } from "./voice-input-control";
import { track } from "@/lib/analytics";
import { decodeChallenge, encodeResult } from "@/lib/codec";
import { siteConfig } from "@/lib/config";
import { MINIMUM_LOADING_MS, SingleFlight, waitForMinimumDisplay } from "@/lib/loading";
import { bestLine, totals } from "@/lib/score";
import { logDevelopmentDuration } from "@/lib/timing";
import { createTimeoutRound, TURN_DURATION_SECONDS, turnDurationForBattle, TurnClock } from "@/lib/turn-timer";
import { useVoiceInput } from "@/lib/use-voice-input";
import type { BattleResult, BattleRound, Judgement } from "@/lib/types";

type Phase = "loading" | "your-turn" | "judging" | "scored" | "error";
type RetryMode = "start" | "restart" | "opponent" | "timeout";

type BattleApiResponse = {
  battleId?: string;
  joke?: string;
  judgement?: Judgement;
  error?: string;
  supportingMessage?: string;
  code?: string;
  retryAfterSeconds?: number;
};

class BattleApiError extends Error {
  constructor(message: string, readonly code?: string, readonly retryAfterSeconds?: number) {
    super(message);
  }
}

async function postBattle(path: string, body: object) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await response.json()) as BattleApiResponse;
  if (!response.ok) {
    const message = [data.error, data.supportingMessage].filter(Boolean).join(" ") || "The arena went quiet. Try again.";
    throw new BattleApiError(message, data.code, data.retryAfterSeconds);
  }
  return data;
}

export function BattleGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeToken = searchParams.get("challenge");
  const challenge = useMemo(() => challengeToken ? decodeChallenge(challengeToken) : null, [challengeToken]);
  const turnDuration = turnDurationForBattle(Boolean(challenge));
  const [battleId, setBattleId] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [aiJoke, setAiJoke] = useState("");
  const [userJoke, setUserJoke] = useState("");
  const [judgement, setJudgement] = useState<Judgement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [retryMode, setRetryMode] = useState<RetryMode>("start");
  const [entryComplete, setEntryComplete] = useState(false);
  const [turnSeconds, setTurnSeconds] = useState(TURN_DURATION_SECONDS);
  const [opponentRequests] = useState(() => new SingleFlight());
  const [startRequests] = useState(() => new SingleFlight());
  const [timeoutRequests] = useState(() => new SingleFlight());
  const [turnClock] = useState(() => new TurnClock());
  const battleIdRef = useRef("");
  const startActionIdRef = useRef(crypto.randomUUID());
  const actionIds = useRef(new Map<string, string>());
  const completed = useRef(false);
  const roundRef = useRef(roundNumber);
  const acceptVoiceTranscript = useCallback((transcript: string) => setUserJoke(transcript.slice(0, 240)), []);
  const voice = useVoiceInput({ active: phase === "your-turn", roundNumber, onTranscript: acceptVoiceTranscript });
  const cancelVoice = voice.cancel;

  const actionIdFor = useCallback((key: string) => {
    const existing = actionIds.current.get(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    actionIds.current.set(key, created);
    return created;
  }, []);

  useEffect(() => { roundRef.current = roundNumber; }, [roundNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntryComplete(true), MINIMUM_LOADING_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    track("battle_started", { challenged: Boolean(challenge) });
  }, [challenge]);

  useEffect(() => () => {
    if (!completed.current) track("battle_abandoned", { round: roundRef.current });
  }, []);

  const finishTimedOutRound = useCallback(async () => {
    const activeBattleId = battleIdRef.current;
    if (!activeBattleId || !aiJoke) return;
    cancelVoice("timeout");
    setPhase("judging");
    setError("");
    try {
      const actionId = actionIdFor(`timeout:${roundNumber}`);
      const data = await timeoutRequests.run(`${activeBattleId}:${actionId}`, () => postBattle("/api/battle/round", {
        action: "timeout",
        actionId,
        battleId: activeBattleId,
        roundNumber,
      }));
      if (!data.judgement) throw new Error("The clock lost the scorecard.");
      const finishedRound = { ...createTimeoutRound(aiJoke, roundNumber), judgement: data.judgement };
      setRounds((current) => [...current, finishedRound]);
      setJudgement(data.judgement);
      setTurnSeconds(0);
      setPhase("scored");
      track("round_timed_out", { round: roundNumber });
      track("round_completed", { round: roundNumber, winner: "ai", timedOut: true });
    } catch (caught) {
      setRetryMode("timeout");
      setError(caught instanceof Error ? caught.message : "The clock needs another look.");
      setPhase("error");
    }
  }, [actionIdFor, aiJoke, cancelVoice, roundNumber, timeoutRequests]);

  useEffect(() => {
    if (phase !== "your-turn") return;
    const updateClock = () => {
      const remaining = turnClock.remaining();
      setTurnSeconds(remaining);
      if (remaining === 0 && turnClock.claimTimeout()) void finishTimedOutRound();
    };
    updateClock();
    const interval = window.setInterval(updateClock, 1_000);
    document.addEventListener("visibilitychange", updateClock);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateClock);
    };
  }, [finishTimedOutRound, phase, turnClock]);

  const ensureBattle = useCallback(async () => {
    if (battleIdRef.current) return battleIdRef.current;
    const actionId = startActionIdRef.current;
    const data = await startRequests.run(actionId, () => postBattle("/api/battle/start", { actionId, challenged: Boolean(challenge) }));
    if (!data.battleId) throw new Error("The arena forgot the battle card.");
    battleIdRef.current = data.battleId;
    setBattleId(data.battleId);
    return data.battleId;
  }, [challenge, startRequests]);

  const loadOpponent = useCallback(async () => {
    const startedAt = performance.now();
    try {
      const activeBattleId = await ensureBattle();
      const actionId = actionIdFor(`opponent:${roundNumber}`);
      const data = await opponentRequests.run(`${activeBattleId}:${actionId}`, () => postBattle("/api/battle/round", {
        action: "opponent",
        actionId,
        battleId: activeBattleId,
        roundNumber,
      }));
      if (!data.joke) throw new Error("The opponent forgot the punchline.");
      await waitForMinimumDisplay(startedAt, roundNumber === 1 ? MINIMUM_LOADING_MS * 2 : MINIMUM_LOADING_MS);
      turnClock.start(Date.now(), turnDuration);
      setTurnSeconds(turnDuration);
      setAiJoke(data.joke); setPhase("your-turn");
      window.requestAnimationFrame(() => {
        logDevelopmentDuration("opponent request to joke rendered", performance.now() - startedAt);
        if (roundNumber === 1) {
          try {
            const clickedAt = Number(window.sessionStorage.getItem("roast-arena:battle-clicked-at"));
            if (Number.isFinite(clickedAt) && clickedAt > 0) logDevelopmentDuration("battle click to first joke rendered", Date.now() - clickedAt);
            window.sessionStorage.removeItem("roast-arena:battle-clicked-at");
          } catch {
            // Storage is optional and never affects the battle flow.
          }
        }
      });
    } catch (caught) {
      setRetryMode(battleIdRef.current ? "opponent" : "start");
      setError(caught instanceof Error ? caught.message : "The opponent missed their cue."); setPhase("error");
    }
  }, [actionIdFor, ensureBattle, opponentRequests, roundNumber, turnClock, turnDuration]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOpponent(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOpponent]);

  function retryAction() {
    setError("");
    if (retryMode === "timeout") {
      void finishTimedOutRound();
      return;
    }
    if (retryMode === "restart") {
      window.location.reload();
      return;
    }
    setPhase("loading"); setAiJoke(""); setJudgement(null);
    void loadOpponent();
  }

  async function submitJoke(event: FormEvent) {
    event.preventDefault();
    if (userJoke.trim().length < 3 || phase !== "your-turn") return;
    const submissionClaim = turnClock.claimSubmission();
    if (submissionClaim === "timed-out") {
      finishTimedOutRound();
      return;
    }
    if (submissionClaim !== "submitted") return;
    cancelVoice("submit");
    const startedAt = performance.now();
    setPhase("judging"); setError("");
    try {
      const activeBattleId = battleIdRef.current;
      if (!activeBattleId) throw new Error("The battle card went missing.");
      const actionId = actionIdFor(`judge:${roundNumber}`);
      const data = await postBattle("/api/battle/round", {
        action: "judge",
        actionId,
        battleId: activeBattleId,
        roundNumber,
        userJoke: userJoke.trim(),
      });
      if (!data.judgement) throw new Error("The judge lost the scorecard.");
      await waitForMinimumDisplay(startedAt);
      const finishedRound = { roundNumber, aiJoke, userJoke: userJoke.trim(), judgement: data.judgement };
      setRounds((current) => [...current, finishedRound]);
      setJudgement(data.judgement); setPhase("scored");
      window.requestAnimationFrame(() => logDevelopmentDuration("judge request to score rendered", performance.now() - startedAt));
      track("round_completed", { round: roundNumber, winner: data.judgement.roundWinner });
    } catch (caught) {
      const fatal = caught instanceof BattleApiError && ["battle_expired", "battle_not_found", "battle_forbidden", "battle_completed", "service_unavailable"].includes(caught.code ?? "");
      if (fatal) {
        setRetryMode("restart");
        setError(caught.message);
        setPhase("error");
      } else {
        turnClock.start(Date.now(), turnDuration);
        setTurnSeconds(turnDuration);
        setError(caught instanceof Error ? caught.message : "The judge needs another look."); setPhase("your-turn");
      }
    }
  }

  function continueBattle() {
    if (!judgement) return;
    if (roundNumber < 3) {
      setPhase("loading"); setAiJoke(""); setError("");
      setRoundNumber((value) => value + 1); setUserJoke(""); setJudgement(null);
      return;
    }
    const summary = totals(rounds);
    const result: BattleResult = {
      version: 1,
      id: battleId.slice(0, 8),
      completedAt: new Date().toISOString(),
      rounds,
      ...summary,
      bestLine: bestLine(rounds),
      challengeTarget: challenge?.scoreToBeat,
    };
    completed.current = true;
    track("battle_completed", { winner: result.winner, userScore: result.userTotal, challenged: Boolean(challenge) });
    router.push(`/result/${encodeResult(result)}`);
  }

  const running = totals(rounds);
  const currentTimedOut = rounds.at(-1)?.roundNumber === roundNumber && rounds.at(-1)?.timedOut;
  if (!entryComplete) return <EnteringArena />;

  return (
    <main id="main" className="battle-shell">
      <header className="battle-topbar">
        <Brand />
        <div className="round-pips" aria-label={`Round ${roundNumber} of 3`}>
          {[1, 2, 3].map((number) => <i key={number} className={number <= roundNumber ? "active" : ""} />)}
        </div>
        <Link className="exit-link" href="/" aria-label="Exit battle">EXIT ×</Link>
      </header>

      <section className="battle-scorebar" aria-label="Current score">
        <div><span>YOU</span><b>{running.userTotal.toFixed(1)}</b></div>
        <p>ROUND <strong>{roundNumber}</strong> <span>/ 3</span></p>
        <div><b>{running.aiTotal.toFixed(1)}</b><span>THE MOUTH</span></div>
      </section>

      {challenge && <div className="challenge-target">⚡ {challenge.challenger} scored <b>{challenge.scoreToBeat.toFixed(1)}</b>. That’s the number to beat.</div>}

      <section className="arena">
        <div className="arena-lights" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="opponent-block">
          <div className="opponent-avatar"><span>M</span><i /></div>
          <div><small>YOUR OPPONENT</small><h1>{siteConfig.opponent.name}</h1><p>{siteConfig.opponent.tagline}</p></div>
        </div>

        <div className={`joke-card ${phase === "loading" ? "is-loading" : ""}`}>
          <div className="card-label">THE MOUTH SAYS</div>
          {phase === "loading" ? (
            <OpponentLoading />
          ) : (
            <blockquote>“{aiJoke}”</blockquote>
          )}
          <div className="reaction-row" aria-hidden="true"><span>OOOH!</span><span>🔥</span><span>HA!</span></div>
        </div>

        {phase === "judging" && <JudgeLoading />}

        {phase !== "scored" && phase !== "loading" && phase !== "judging" && (
          <form className="response-panel" onSubmit={submitJoke}>
            <div className="turn-heading"><span /><b>YOUR TURN</b>{phase === "your-turn" && <TurnTimer seconds={turnSeconds} />}<span /></div>
            <label htmlFor="joke">Drop your best comeback</label>
            <div className="joke-input-wrap">
              <textarea id="joke" value={userJoke} onChange={(event) => setUserJoke(event.target.value.slice(0, 240))} disabled={phase !== "your-turn"} placeholder="Yo mama so..." rows={3} autoFocus />
              <span>{userJoke.length}/240</span>
            </div>
            <VoiceInputControl supported={voice.supported} status={voice.status} error={voice.error} onStart={voice.start} onStop={voice.stop} />
            {error && <p className="form-error" role="alert">{error}</p>}
            {phase === "error" ? (
              <button className="button button-secondary button-full" type="button" onClick={retryAction}>{retryMode === "timeout" ? "RETRY SCORECARD" : "TRY AGAIN"}</button>
            ) : (
              <button className="button button-primary button-full" type="submit" disabled={phase !== "your-turn" || userJoke.trim().length < 3}>
                FIRE BACK <span aria-hidden="true">↗</span>
              </button>
            )}
            <p className="input-tip">KEEP IT FICTIONAL. KEEP IT FUNNY.</p>
          </form>
        )}

        {phase === "scored" && judgement && (
          <section className={`score-reveal ${currentTimedOut ? "timeout-reveal" : ""}`} aria-live="polite">
            <div className="verdict-stamp">{currentTimedOut ? "THE MOUTH TAKES THE ROUND" : judgement.roundWinner === "user" ? "YOU TOOK THE ROUND" : judgement.roundWinner === "tie" ? "DEAD EVEN" : "THE MOUTH TAKES IT"}</div>
            {currentTimedOut && <h2 className="timeout-title">TIME’S UP <span aria-hidden="true">💀</span></h2>}
            <div className="round-score-duel">
              <div><small>YOU</small><strong>{judgement.userScore.toFixed(1)}</strong></div><span>VS</span><div><small>MOUTH</small><strong>{judgement.aiScore.toFixed(1)}</strong></div>
            </div>
            <div className="category-scores">
              {(["creativity", "savagery", "originality"] as const).map((category) => (
                <div key={category}><span>{category}</span><i><b style={{ width: `${judgement[category] * 10}%` }} /></i><strong>{judgement[category].toFixed(1)}</strong></div>
              ))}
            </div>
            <blockquote>“{judgement.commentary}” <cite>— THE JUDGE</cite></blockquote>
            <button className="button button-primary button-full" onClick={continueBattle}>{roundNumber === 3 ? "SEE FINAL VERDICT" : `BRING ON ROUND ${roundNumber + 1}`} <span>→</span></button>
          </section>
        )}
      </section>
    </main>
  );
}

# Roast Arena

A mobile-first, three-round AI comedy battle MVP. Players trade Yo Mama jokes with **The Mouth**, receive structured judging, share a stable result, and challenge a friend without creating an account.

## Run locally

Requirements: Node.js 20.9+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). An API key is optional: the safe local battle engine makes the entire flow usable for development and demos.

To use live OpenAI generation and judging, set:

```bash
OPENAI_API_KEY=your_key
AI_PROVIDER=openai
```

Use `AI_PROVIDER=auto` (the default) to select OpenAI when a key exists and the local engine otherwise.

### Shared battle security

Active battles are server-authoritative and stored behind a vendor-neutral `BattleStore` interface. Storage selection is explicit and never inferred from whether Redis credentials happen to exist:

```bash
BATTLE_STORE=memory # or redis
RATE_LIMIT_HASH_SECRET=a-long-random-secret
```

`RATE_LIMIT_HASH_SECRET` is required in production in both modes because identifier hashing protects anonymous-session and network data independently of the storage backend. The active-battle TTL is 45 minutes.

Battle starts use atomic fixed windows: 3 per anonymous session and 10 per network per 10 minutes, plus daily ceilings of 15 per session and 100 per network. A cryptographically random, HttpOnly, first-party cookie supplies the 24-hour anonymous session signal. Network keys are a secondary signal and are HMAC-hashed before storage.

On Vercel, the app reads `x-vercel-forwarded-for`; on Cloudflare, it reads `cf-connecting-ip`. For another trusted reverse proxy, explicitly set `TRUSTED_IP_HEADER` to a header the proxy overwrites (`x-vercel-forwarded-for`, `cf-connecting-ip`, or `x-real-ip`). The app does not trust arbitrary `X-Forwarded-For`. Local development uses a stable placeholder.

## Beta storage mode

Roast Arena supports two implementations of the same battle-security contract. Switching stores does not change gameplay, sequencing, limits, idempotency, locks, timeouts, or challenge handling.

### Memory: temporary single-instance beta

```bash
BATTLE_STORE=memory
RATE_LIMIT_HASH_SECRET=a-long-random-secret
```

Memory mode is suitable for local development and an intentionally small public beta only when **one persistent Node.js process handles every request**. It provides the full security engine, but its state is process-local.

Do **not** use memory mode with:

- multiple application replicas;
- autoscaling above one instance;
- multi-region application instances;
- serverless execution where requests may reach unrelated processes.

A process restart clears active battles, rate-limit counters, idempotency responses, and active locks. Users in an interrupted battle receive the existing “This battle went cold. Start a new one.” recovery message. Production logs a prominent single-instance warning when memory mode initializes; normal website users never see it.

### Redis: distributed mode

Use Redis before horizontal, multi-region, or serverless scaling:

```bash
BATTLE_STORE=redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RATE_LIMIT_HASH_SECRET=a-long-random-secret
```

Redis mode preserves battle state, limits, short-lived idempotency results, and locks across application instances. Missing Redis credentials or an unknown `BATTLE_STORE` value fails closed; the application never silently falls back to memory.

The later migration is configuration-only: provision Redis, add its two REST credentials, change `BATTLE_STORE=memory` to `BATTLE_STORE=redis`, and redeploy. No gameplay rewrite is required.

### Manual real-AI calibration

This utility is never run by tests or CI. Start the app with the real provider, then run the predefined calibration set in a second terminal:

```bash
BATTLE_STORE=memory AI_PROVIDER=openai OPENAI_API_KEY=your_key pnpm dev
pnpm calibrate:ai
```

Set `CALIBRATION_URL` if the development server is not running at `http://127.0.0.1:3000`. The command prints the overall score, category scores, and commentary for nonsense through strong attempts, repetition, AI copying, and prompt injection.
Set `CALIBRATION_CASE=NONSENSE` (or another exact case label) to run only one case while iterating.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:abuse
pnpm build
```

`pnpm test:abuse` is a development-only mock simulation for 20 rapid starts, 10 concurrent submissions, duplicate action IDs, and invalid sequences. It never selects the OpenAI provider or reads `OPENAI_API_KEY`.

## Architecture

- **Next.js App Router + TypeScript:** server-rendered share metadata and server-only AI calls without a separate backend.
- **AI provider boundary:** `lib/ai` supports the OpenAI Responses API and a deterministic local provider. Both return the same validated judgement shape.
- **Moderation:** input checks and AI safety instructions are modular and server-side.
- **Active battle storage:** a small `BattleStore` boundary explicitly selects memory for a single-instance beta or Upstash Redis REST for distributed deployment. Both stores back the same sequence, TTL, action-result, call-ceiling, rate-limit, and lock engine.
- **Share storage:** completed result and challenge data remains versioned, public-safe, and encoded into stable URLs. This intentionally avoids a result database while ensuring links work in another browser/session.
- **Analytics:** vendor-neutral browser events cover the acquisition, completion, sharing, challenge, and replay funnel.
- **Branding:** working name, game format, opponent, metadata, and social handle live in `lib/config.ts`.

For a later launch pass, database-backed short result IDs can provide shorter links, revocation, and aggregate metrics. CAPTCHA/Turnstile, an AI-cost circuit breaker, and a curated Mouth joke pool are intentionally deferred.

## MVP scope

Included: landing page, typed battle loop, three judged rounds, results, round recap, Web Share/copy fallback, challenge links, challenge comparison, SEO foundations, accessibility, reduced motion, responsive design, analytics hooks, and graceful AI errors.

Deferred: accounts, live/human multiplayer, voice recording, global leaderboards, subscriptions, share-video rendering, and multiple opponent personalities.

import { MemoryBattleStore } from "./memory-store";
import { RedisBattleStore } from "./redis-store";
import type { BattleStore } from "./store";

export type BattleStoreBackend = "memory" | "redis";

export class BattleStoreConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BattleStoreConfigurationError";
  }
}

let store: BattleStore | undefined;
let memoryWarningLogged = false;

function configuredBackend(): BattleStoreBackend {
  const configured = process.env.BATTLE_STORE?.trim().toLowerCase();
  if (configured === "memory" || configured === "redis") return configured;
  if (!configured) {
    throw new BattleStoreConfigurationError("BATTLE_STORE must be set to 'memory' or 'redis'.");
  }
  throw new BattleStoreConfigurationError("Unsupported BATTLE_STORE value. Expected 'memory' or 'redis'.");
}

function requireProductionHashSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.RATE_LIMIT_HASH_SECRET) {
    throw new BattleStoreConfigurationError("RATE_LIMIT_HASH_SECRET is required in production for every battle-store backend.");
  }
}

function redisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new BattleStoreConfigurationError(
      "BATTLE_STORE=redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  return { url, token };
}

function warnForProductionMemoryMode() {
  if (process.env.NODE_ENV !== "production" || memoryWarningLogged) return;
  memoryWarningLogged = true;
  console.warn(`[Roast Clash security]
Memory battle store enabled.

This mode provides process-local:
- battle sessions
- rate limiting
- idempotency
- concurrency protection

It is suitable only for a SINGLE-INSTANCE beta deployment.
Do not horizontally scale this deployment.
Use BATTLE_STORE=redis before multi-instance/serverless scaling.`);
}

export function validateBattleStoreConfiguration(options: { warnMemoryMode?: boolean } = {}) {
  const backend = configuredBackend();
  requireProductionHashSecret();
  if (backend === "memory") {
    if (options.warnMemoryMode) warnForProductionMemoryMode();
  } else redisCredentials();
  return backend;
}

export function getBattleStore() {
  if (store) return store;
  const backend = validateBattleStoreConfiguration();
  if (backend === "memory") store = new MemoryBattleStore();
  else {
    const { url, token } = redisCredentials();
    store = new RedisBattleStore(url, token);
  }
  return store;
}

export function setBattleStoreForTests(value: BattleStore | undefined) {
  if (process.env.NODE_ENV === "production") throw new Error("Test battle stores are disabled in production");
  store = value;
}

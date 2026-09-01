import type { BattleSessionState, StartStoreResult } from "./types";

export interface BattleStore {
  createBattle(input: {
    state: BattleSessionState;
    startActionId: string;
    networkKey: string;
  }): Promise<StartStoreResult>;
  getBattle(battleId: string): Promise<BattleSessionState | null>;
  setBattle(state: BattleSessionState): Promise<void>;
  acquireBattleLock(battleId: string, token: string, ttlMs: number): Promise<boolean>;
  releaseBattleLock(battleId: string, token: string): Promise<void>;
}

export class BattleStoreUnavailableError extends Error {}

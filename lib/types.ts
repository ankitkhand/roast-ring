export type Winner = "user" | "ai" | "tie";

export type ScoreBreakdown = {
  creativity: number;
  savagery: number;
  originality: number;
};

export type Judgement = ScoreBreakdown & {
  userScore: number;
  aiScore: number;
  roundWinner: Winner;
  commentary: string;
};

export type JudgeContext = {
  previousUserJokes: string[];
};

export type OpponentContext = {
  previousAiJokes: string[];
};

export type BattleRound = {
  roundNumber: number;
  aiJoke: string;
  userJoke: string;
  judgement: Judgement;
  timedOut?: boolean;
};

export type BattleResult = {
  version: 1;
  id: string;
  completedAt: string;
  rounds: BattleRound[];
  userTotal: number;
  aiTotal: number;
  winner: Winner;
  bestLine: string;
  challengeTarget?: number;
};

export type Challenge = {
  version: 1;
  sourceId: string;
  challenger: string;
  scoreToBeat: number;
};

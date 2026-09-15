export type BattleStatus = 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';

export type BattlePlayer = {
  socketId: string;
  nickname: string;
  ready: boolean;
  gameOver: boolean;
  score: number;
  maxLevel: number;
  joinedAt: number;
};

export type BattleRoom = {
  roomId: string;
  status: BattleStatus;
  players: BattlePlayer[];
  createdAt: number;
  countdownStartedAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
};

export type BattlePlayerState = {
  nickname: string;
  ready: boolean;
  score: number;
  maxLevel: number;
  gameOver: boolean;
};

export type BattleRoomState = {
  roomId: string;
  status: BattleStatus;
  self: BattlePlayerState | null;
  opponent: BattlePlayerState | null;
};

export type BattleActionResponse =
  | {
      ok: true;
      room: BattleRoomState;
    }
  | {
      ok: false;
      error: string;
    };

export type BattleCountdownPayload = {
  value: 3 | 2 | 1 | 'START';
};

export type BattleStartPayload = {
  roomId: string;
  startedAt: number;
};

export type BattleMergePayload = {
  roomId?: unknown;
  level?: unknown;
};

export type BattleAttackPayload = {
  level: number;
};

export type BattleStatePayload = {
  roomId?: unknown;
  score?: unknown;
  maxLevel?: unknown;
  gameOver?: unknown;
};

export type BattleGameOverPayload = {
  roomId?: unknown;
  score?: unknown;
};

export type BattleResultPayload = {
  roomId: string;
  outcome: 'WIN' | 'LOSE';
  winnerNickname: string;
  selfScore: number;
  opponentScore: number;
};

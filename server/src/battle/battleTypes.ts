export type BattleStatus = 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';

export type BattlePlayer = {
  socketId: string;
  nickname: string;
  ready: boolean;
  rematchReady: boolean;
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
  paused: boolean;
};

export type BattlePlayerState = {
  nickname: string;
  ready: boolean;
  rematchReady: boolean;
  score: number;
  maxLevel: number;
  gameOver: boolean;
};

export type BattleRoomState = {
  roomId: string;
  status: BattleStatus;
  paused: boolean;
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

export type BattleLeavePayload = {
  roomId?: unknown;
  score?: unknown;
};

export type BattlePauseRequestPayload = {
  roomId?: unknown;
};

export type BattlePausePayload = {
  roomId: string;
  paused: boolean;
  nickname: string;
};

export type BattleResultPayload = {
  roomId: string;
  outcome: 'WIN' | 'LOSE';
  winnerNickname: string;
  selfScore: number;
  opponentScore: number;
};

export type BattlePlayerDisconnectedPayload = {
  roomId: string;
  nickname: string;
  message: string;
};

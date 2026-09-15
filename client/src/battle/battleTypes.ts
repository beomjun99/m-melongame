export type BattleStatus = 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';

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
  roomId: string;
  level: number;
};

export type BattleAttackPayload = {
  level: number;
};

export type BattleAttackEvent = BattleAttackPayload & {
  id: number;
};

export type BattleStatePayload = {
  score: number;
  maxLevel: number;
  gameOver: boolean;
};

export type BattleResultPayload = {
  roomId: string;
  outcome: 'WIN' | 'LOSE';
  winnerNickname: string;
  selfScore: number;
  opponentScore: number;
};

export type BattlePausePayload = {
  roomId: string;
  paused: boolean;
  nickname: string;
};

export type BattlePauseEvent = BattlePausePayload & {
  id: number;
};

export type BattlePlayerDisconnectedPayload = {
  roomId: string;
  nickname: string;
  message: string;
};

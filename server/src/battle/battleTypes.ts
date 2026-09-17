import type { BattleStatus } from '@m-melongame/shared';

export type {
  BattleAck,
  BattleActionResponse,
  BattleAttackPayload,
  BattleCountdownPayload,
  BattleGameOverPayload,
  BattleLeavePayload,
  BattleMergePayload,
  BattlePausePayload,
  BattlePauseRequestPayload,
  BattlePlayerDisconnectedPayload,
  BattlePlayerState,
  BattleResultPayload,
  BattleRoomState,
  BattleStartPayload,
  BattleStatePayload,
  BattleStateUpdate,
  BattleStatus,
  RoomCreatePayload,
  RoomJoinPayload
} from '@m-melongame/shared';

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

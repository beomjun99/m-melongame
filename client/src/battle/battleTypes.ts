import type { BattleAttackPayload, BattlePausePayload } from '@m-melongame/shared';

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

export type BattleAttackEvent = BattleAttackPayload & {
  id: number;
};

export type BattlePauseEvent = BattlePausePayload & {
  id: number;
};

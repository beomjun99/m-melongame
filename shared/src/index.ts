export const SOCKET_EVENTS = {
  ROOM_CREATE: 'battle:room:create',
  ROOM_JOIN: 'battle:room:join',
  ROOM_UPDATE: 'battle:room:update',
  READY: 'battle:ready',
  COUNTDOWN: 'battle:countdown',
  START: 'battle:start',
  MERGE: 'battle:merge',
  ATTACK: 'battle:attack',
  STATE: 'battle:state',
  GAME_OVER: 'battle:gameOver',
  RESULT: 'battle:result',
  PAUSE: 'battle:pause',
  RESUME: 'battle:resume',
  LEAVE: 'battle:leave',
  REMATCH: 'battle:rematch',
  PLAYER_DISCONNECTED: 'battle:playerDisconnected'
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
export type BattleStatus = 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';

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

export type BattleAck = {
  ok: boolean;
  error?: string;
};

export type RoomCreatePayload = {
  nickname: string;
};

export type RoomJoinPayload = {
  roomId: string;
  nickname: string;
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

export type BattleStateUpdate = {
  score: number;
  maxLevel: number;
  gameOver: boolean;
};

export type BattleStatePayload = BattleStateUpdate & {
  roomId: string;
};

export type BattleGameOverPayload = {
  roomId: string;
  score: number;
};

export type BattleLeavePayload = BattleGameOverPayload;

export type BattlePauseRequestPayload = {
  roomId: string;
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

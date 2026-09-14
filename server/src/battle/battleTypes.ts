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

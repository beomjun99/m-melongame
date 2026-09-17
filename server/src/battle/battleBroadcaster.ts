import type { Namespace } from 'socket.io';
import { SOCKET_EVENTS } from './battleEvents.js';
import { toBattleRoomState } from './battleRoomManager.js';
import type { BattleActionResponse, BattleResultPayload, BattleRoom } from './battleTypes.js';

export function emitRoomUpdate(namespace: Namespace, room: BattleRoom) {
  for (const player of room.players) {
    namespace.to(player.socketId).emit(SOCKET_EVENTS.ROOM_UPDATE, toBattleRoomState(room, player.socketId));
  }
}

export function toActionResponse(room: BattleRoom, socketId: string): BattleActionResponse {
  return {
    ok: true,
    room: toBattleRoomState(room, socketId)
  };
}

export function emitBattleResult(namespace: Namespace, room: BattleRoom, winnerSocketId: string) {
  for (const player of room.players) {
    const opponent = room.players.find((roomPlayer) => roomPlayer.socketId !== player.socketId);
    const winner = room.players.find((roomPlayer) => roomPlayer.socketId === winnerSocketId);

    if (!opponent || !winner) {
      continue;
    }

    const payload: BattleResultPayload = {
      roomId: room.roomId,
      outcome: player.socketId === winnerSocketId ? 'WIN' : 'LOSE',
      winnerNickname: winner.nickname,
      selfScore: player.score,
      opponentScore: opponent.score
    };

    namespace.to(player.socketId).emit(SOCKET_EVENTS.RESULT, payload);
  }
}

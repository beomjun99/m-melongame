import type { Server as HttpServer } from 'node:http';
import type { Namespace } from 'socket.io';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { SOCKET_EVENTS } from './battleEvents.js';
import {
  canStartCountdown,
  createBattleRoom,
  getRoomForSocket,
  joinBattleRoom,
  markCountdownStarted,
  markRoomPlaying,
  removePlayerFromBattleRoom,
  setPlayerReady,
  toBattleRoomState
} from './battleRoomManager.js';
import type { BattleActionResponse, BattleCountdownPayload, BattleRoom, BattleStartPayload } from './battleTypes.js';

type RoomCreatePayload = {
  nickname?: unknown;
};

type RoomJoinPayload = {
  roomId?: unknown;
  nickname?: unknown;
};

const COUNTDOWN_STEPS: BattleCountdownPayload['value'][] = [3, 2, 1, 'START'];
const countdownTimeouts = new Map<string, NodeJS.Timeout[]>();

function emitRoomUpdate(namespace: Namespace, room: BattleRoom) {
  for (const player of room.players) {
    namespace.to(player.socketId).emit(SOCKET_EVENTS.ROOM_UPDATE, toBattleRoomState(room, player.socketId));
  }
}

function toActionResponse(room: BattleRoom, socketId: string): BattleActionResponse {
  return {
    ok: true,
    room: toBattleRoomState(room, socketId)
  };
}

function clearCountdown(roomId: string) {
  const timers = countdownTimeouts.get(roomId);

  if (!timers) {
    return;
  }

  for (const timer of timers) {
    clearTimeout(timer);
  }

  countdownTimeouts.delete(roomId);
}

function startCountdown(namespace: Namespace, room: BattleRoom) {
  if (!canStartCountdown(room)) {
    return;
  }

  markCountdownStarted(room);

  const timers = COUNTDOWN_STEPS.map((value, index) => setTimeout(() => {
    const payload: BattleCountdownPayload = { value };

    namespace.to(room.roomId).emit(SOCKET_EVENTS.COUNTDOWN, payload);

    if (value !== 'START') {
      return;
    }

    const playingRoom = markRoomPlaying(room.roomId);
    clearCountdown(room.roomId);

    if (!playingRoom) {
      return;
    }

    const startPayload: BattleStartPayload = {
      roomId: playingRoom.roomId,
      startedAt: Date.now()
    };

    namespace.to(playingRoom.roomId).emit(SOCKET_EVENTS.START, startPayload);
    emitRoomUpdate(namespace, playingRoom);
  }, index * 1000));

  countdownTimeouts.set(room.roomId, timers);
}

export function initializeBattleSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin
    }
  });

  const battleNamespace = io.of('/battle');

  battleNamespace.on('connection', (socket) => {
    console.log(`Battle socket connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.ROOM_CREATE, async (payload: RoomCreatePayload, callback?: (response: BattleActionResponse) => void) => {
      const result = createBattleRoom(socket.id, payload?.nickname);

      if (!result.room) {
        callback?.({ ok: false, error: result.error ?? '방을 만들 수 없습니다.' });
        return;
      }

      await socket.join(result.room.roomId);
      callback?.(toActionResponse(result.room, socket.id));
      emitRoomUpdate(battleNamespace, result.room);
    });

    socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload: RoomJoinPayload, callback?: (response: BattleActionResponse) => void) => {
      const result = joinBattleRoom(socket.id, payload?.roomId, payload?.nickname);

      if (!result.room) {
        callback?.({ ok: false, error: result.error ?? '방에 참가할 수 없습니다.' });
        return;
      }

      await socket.join(result.room.roomId);
      callback?.(toActionResponse(result.room, socket.id));
      emitRoomUpdate(battleNamespace, result.room);
    });

    socket.on(SOCKET_EVENTS.READY, (callback?: (response: BattleActionResponse) => void) => {
      const result = setPlayerReady(socket.id);

      if (!result.room) {
        callback?.({ ok: false, error: result.error ?? '준비 상태를 변경할 수 없습니다.' });
        return;
      }

      callback?.(toActionResponse(result.room, socket.id));
      emitRoomUpdate(battleNamespace, result.room);
      startCountdown(battleNamespace, result.room);
    });

    socket.on('disconnect', (reason) => {
      const previousRoom = getRoomForSocket(socket.id);
      const updatedRoom = removePlayerFromBattleRoom(socket.id);

      if (previousRoom) {
        clearCountdown(previousRoom.roomId);
        void socket.leave(previousRoom.roomId);
      }

      if (updatedRoom) {
        emitRoomUpdate(battleNamespace, updatedRoom);
      }

      console.log(`Battle socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

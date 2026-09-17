import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { getAttackLevel } from './attackConfig.js';
import { emitBattleResult, emitRoomUpdate, toActionResponse } from './battleBroadcaster.js';
import { clearBattleCountdown, startBattleCountdown } from './battleCountdown.js';
import { SOCKET_EVENTS } from './battleEvents.js';
import { saveBattleResult } from './battleResultService.js';
import { checkMergeRateLimit, clearMergeRateLimit } from './rateLimit.js';
import {
  createBattleRoom,
  finishBattleByDisconnect,
  finishBattleByGameOver,
  getRoomForSocket,
  joinBattleRoom,
  removePlayerFromBattleRoom,
  setBattlePaused,
  setPlayerReady,
  setPlayerRematchReady,
  updatePlayerBattleState
} from './battleRoomManager.js';
import type {
  BattleActionResponse,
  BattleAttackPayload,
  BattleGameOverPayload,
  BattleLeavePayload,
  BattleMergePayload,
  BattlePausePayload,
  BattlePauseRequestPayload,
  BattlePlayerDisconnectedPayload,
  BattleStatePayload,
  RoomCreatePayload,
  RoomJoinPayload
} from './battleTypes.js';

function normalizeMergeLevel(value: unknown) {
  const level = Number(value);

  if (!Number.isInteger(level) || level < 2 || level > 11) {
    return null;
  }

  return level;
}

function normalizeStateScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 999_999_999) {
    return null;
  }

  return Math.floor(score);
}

function normalizeStateMaxLevel(value: unknown) {
  const maxLevel = Number(value);

  if (!Number.isInteger(maxLevel) || maxLevel < 1 || maxLevel > 11) {
    return null;
  }

  return maxLevel;
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
      startBattleCountdown(battleNamespace, result.room);
    });

    socket.on(SOCKET_EVENTS.MERGE, (payload: BattleMergePayload, callback?: (response: { ok: boolean; error?: string }) => void) => {
      const room = getRoomForSocket(socket.id);

      if (!room || room.roomId !== payload?.roomId) {
        callback?.({ ok: false, error: '참가 중인 방의 merge 이벤트만 보낼 수 있습니다.' });
        return;
      }

      if (room.status !== 'PLAYING') {
        callback?.({ ok: false, error: '게임이 진행 중일 때만 merge 이벤트를 보낼 수 있습니다.' });
        return;
      }

      if (room.paused) {
        callback?.({ ok: false, error: '일시 정지 중에는 merge 이벤트를 보낼 수 없습니다.' });
        return;
      }

      const mergedLevel = normalizeMergeLevel(payload.level);

      if (!mergedLevel) {
        callback?.({ ok: false, error: 'merge level은 2~11 사이여야 합니다.' });
        return;
      }

      if (!checkMergeRateLimit(socket.id)) {
        callback?.({ ok: false, error: 'merge 이벤트가 너무 빠르게 발생했습니다.' });
        return;
      }

      const attackLevel = getAttackLevel(mergedLevel);

      if (attackLevel) {
        const attackPayload: BattleAttackPayload = {
          level: attackLevel
        };

        socket.to(room.roomId).emit(SOCKET_EVENTS.ATTACK, attackPayload);
      }

      callback?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.STATE, (payload: BattleStatePayload, callback?: (response: { ok: boolean; error?: string }) => void) => {
      const room = getRoomForSocket(socket.id);

      if (!room || room.roomId !== payload?.roomId) {
        callback?.({ ok: false, error: '참가 중인 방의 state 이벤트만 보낼 수 있습니다.' });
        return;
      }

      const score = normalizeStateScore(payload.score);
      const maxLevel = normalizeStateMaxLevel(payload.maxLevel);

      if (score === null || maxLevel === null || typeof payload.gameOver !== 'boolean') {
        callback?.({ ok: false, error: '잘못된 battle state 값입니다.' });
        return;
      }

      const result = updatePlayerBattleState(socket.id, score, maxLevel, payload.gameOver);

      if (!result.room) {
        callback?.({ ok: false, error: result.error ?? 'battle state를 갱신할 수 없습니다.' });
        return;
      }

      emitRoomUpdate(battleNamespace, result.room);
      callback?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.PAUSE, (payload: BattlePauseRequestPayload, callback?: (response: { ok: boolean; error?: string }) => void) => {
      const room = getRoomForSocket(socket.id);

      if (!room || room.roomId !== payload?.roomId) {
        callback?.({ ok: false, error: '참가 중인 방의 pause 이벤트만 보낼 수 있습니다.' });
        return;
      }

      const result = setBattlePaused(socket.id, true);

      if (!result.room || !result.player) {
        callback?.({ ok: false, error: result.error ?? '일시 정지할 수 없습니다.' });
        return;
      }

      const pausePayload: BattlePausePayload = {
        roomId: result.room.roomId,
        paused: true,
        nickname: result.player.nickname
      };

      battleNamespace.to(result.room.roomId).emit(SOCKET_EVENTS.PAUSE, pausePayload);
      emitRoomUpdate(battleNamespace, result.room);
      callback?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.RESUME, (payload: BattlePauseRequestPayload, callback?: (response: { ok: boolean; error?: string }) => void) => {
      const room = getRoomForSocket(socket.id);

      if (!room || room.roomId !== payload?.roomId) {
        callback?.({ ok: false, error: '참가 중인 방의 resume 이벤트만 보낼 수 있습니다.' });
        return;
      }

      const result = setBattlePaused(socket.id, false);

      if (!result.room || !result.player) {
        callback?.({ ok: false, error: result.error ?? '게임을 재개할 수 없습니다.' });
        return;
      }

      const resumePayload: BattlePausePayload = {
        roomId: result.room.roomId,
        paused: false,
        nickname: result.player.nickname
      };

      battleNamespace.to(result.room.roomId).emit(SOCKET_EVENTS.RESUME, resumePayload);
      emitRoomUpdate(battleNamespace, result.room);
      callback?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.GAME_OVER, async (payload: BattleGameOverPayload, callback?: (response: { ok: boolean; error?: string }) => void) => {
      const room = getRoomForSocket(socket.id);

      if (!room || room.roomId !== payload?.roomId) {
        callback?.({ ok: false, error: '참가 중인 방의 gameOver 이벤트만 보낼 수 있습니다.' });
        return;
      }

      const score = normalizeStateScore(payload.score);

      if (score === null) {
        callback?.({ ok: false, error: '잘못된 score 값입니다.' });
        return;
      }

      const result = finishBattleByGameOver(socket.id, score);

      if (!result.room || !result.winner) {
        callback?.({ ok: false, error: result.error ?? 'Battle 결과를 확정할 수 없습니다.' });
        return;
      }

      try {
        await saveBattleResult(result.room, result.winner);
      } catch (error) {
        console.error('Failed to save battle result.', error);
      }

      emitRoomUpdate(battleNamespace, result.room);
      emitBattleResult(battleNamespace, result.room, result.winner.socketId);
      callback?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.LEAVE, async (payload: BattleLeavePayload, callback?: (response: { ok: boolean; error?: string }) => void) => {
      const room = getRoomForSocket(socket.id);

      if (!room || room.roomId !== payload?.roomId) {
        callback?.({ ok: false, error: '참가 중인 방의 leave 이벤트만 보낼 수 있습니다.' });
        return;
      }

      const score = normalizeStateScore(payload.score);

      if (score === null) {
        callback?.({ ok: false, error: '잘못된 score 값입니다.' });
        return;
      }

      if (room.status !== 'PLAYING') {
        const opponent = room.players.find((player) => player.socketId !== socket.id) ?? null;
        const leavingPlayer = room.players.find((player) => player.socketId === socket.id) ?? null;
        const updatedRoom = removePlayerFromBattleRoom(socket.id);

        if (opponent && leavingPlayer) {
          const disconnectedPayload: BattlePlayerDisconnectedPayload = {
            roomId: room.roomId,
            nickname: leavingPlayer.nickname,
            message: '상대방이 로비로 이동했습니다.'
          };

          battleNamespace.to(opponent.socketId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, disconnectedPayload);
        }

        if (updatedRoom) {
          emitRoomUpdate(battleNamespace, updatedRoom);
        }

        callback?.({ ok: true });
        return;
      }

      const result = finishBattleByGameOver(socket.id, score);

      if (!result.room || !result.winner || !result.loser) {
        callback?.({ ok: false, error: result.error ?? 'Battle 이탈 결과를 확정할 수 없습니다.' });
        return;
      }

      try {
        await saveBattleResult(result.room, result.winner);
      } catch (error) {
        console.error('Failed to save battle result after leave.', error);
      }

      const disconnectedPayload: BattlePlayerDisconnectedPayload = {
        roomId: result.room.roomId,
        nickname: result.loser.nickname,
        message: '상대방이 게임을 이탈했습니다.'
      };

      battleNamespace.to(result.winner.socketId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, disconnectedPayload);
      emitRoomUpdate(battleNamespace, result.room);
      emitBattleResult(battleNamespace, result.room, result.winner.socketId);
      callback?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.REMATCH, (callback?: (response: BattleActionResponse) => void) => {
      const result = setPlayerRematchReady(socket.id);

      if (!result.room) {
        callback?.({ ok: false, error: result.error ?? '재경기를 신청할 수 없습니다.' });
        return;
      }

      callback?.(toActionResponse(result.room, socket.id));
      emitRoomUpdate(battleNamespace, result.room);
      startBattleCountdown(battleNamespace, result.room);
    });

    socket.on('disconnect', async (reason) => {
      const previousRoom = getRoomForSocket(socket.id);

      clearMergeRateLimit(socket.id);

      if (previousRoom?.status === 'PLAYING') {
        clearBattleCountdown(previousRoom.roomId);

        const result = finishBattleByDisconnect(socket.id);

        if (result.room && result.winner && result.loser) {
          try {
            await saveBattleResult(result.room, result.winner);
          } catch (error) {
            console.error('Failed to save battle result after disconnect.', error);
          }

          const disconnectedPayload: BattlePlayerDisconnectedPayload = {
            roomId: result.room.roomId,
            nickname: result.loser.nickname,
            message: '상대방 연결이 종료되었습니다.'
          };

          battleNamespace.to(result.winner.socketId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, disconnectedPayload);
          emitRoomUpdate(battleNamespace, result.room);
          emitBattleResult(battleNamespace, result.room, result.winner.socketId);
        }

        void socket.leave(previousRoom.roomId);
        console.log(`Battle socket disconnected: ${socket.id} (${reason})`);
        return;
      }

      if (previousRoom?.status === 'FINISHED') {
        const opponent = previousRoom.players.find((player) => player.socketId !== socket.id) ?? null;
        const disconnectedPlayer = previousRoom.players.find((player) => player.socketId === socket.id) ?? null;

        if (opponent && disconnectedPlayer) {
          const disconnectedPayload: BattlePlayerDisconnectedPayload = {
            roomId: previousRoom.roomId,
            nickname: disconnectedPlayer.nickname,
            message: '상대방 연결이 종료되었습니다.'
          };

          battleNamespace.to(opponent.socketId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, disconnectedPayload);
        }
      }

      const updatedRoom = removePlayerFromBattleRoom(socket.id);

      if (previousRoom) {
        clearBattleCountdown(previousRoom.roomId);
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

import type { Namespace } from 'socket.io';
import { SOCKET_EVENTS } from './battleEvents.js';
import { emitRoomUpdate } from './battleBroadcaster.js';
import { canStartCountdown, markCountdownStarted, markRoomPlaying } from './battleRoomManager.js';
import type { BattleCountdownPayload, BattleRoom, BattleStartPayload } from './battleTypes.js';

const COUNTDOWN_STEPS: BattleCountdownPayload['value'][] = [3, 2, 1, 'START'];
const countdownTimeouts = new Map<string, NodeJS.Timeout[]>();

export function clearBattleCountdown(roomId: string) {
  const timers = countdownTimeouts.get(roomId);

  if (!timers) {
    return;
  }

  for (const timer of timers) {
    clearTimeout(timer);
  }

  countdownTimeouts.delete(roomId);
}

export function startBattleCountdown(namespace: Namespace, room: BattleRoom) {
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
    clearBattleCountdown(room.roomId);

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

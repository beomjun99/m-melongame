import { useEffect, useMemo, useState } from 'react';
import { SOCKET_EVENTS } from './battleEvents';
import type {
  BattleActionResponse,
  BattleAttackEvent,
  BattleAttackPayload,
  BattleCountdownPayload,
  BattleResultPayload,
  BattleRoomState,
  BattleStatePayload,
  BattleStartPayload
} from './battleTypes';
import { createBattleSocket, getBattleSocketUrl } from './socket';

export type BattleConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

type UseBattleOptions = {
  enabled?: boolean;
};

export function useBattle({ enabled = true }: UseBattleOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<BattleConnectionStatus>(enabled ? 'CONNECTING' : 'DISCONNECTED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRoomActionPending, setIsRoomActionPending] = useState(false);
  const [room, setRoom] = useState<BattleRoomState | null>(null);
  const [countdown, setCountdown] = useState<BattleCountdownPayload['value'] | null>(null);
  const [startSignal, setStartSignal] = useState<BattleStartPayload | null>(null);
  const [lastAttack, setLastAttack] = useState<BattleAttackEvent | null>(null);
  const [result, setResult] = useState<BattleResultPayload | null>(null);
  const socket = useMemo(() => createBattleSocket(), []);

  useEffect(() => {
    if (!enabled) {
      socket.disconnect();
      setConnectionStatus('DISCONNECTED');
      setErrorMessage(null);
      setCountdown(null);
      setRoom(null);
      setStartSignal(null);
      setLastAttack(null);
      setResult(null);
      return;
    }

    setConnectionStatus(socket.connected ? 'CONNECTED' : 'CONNECTING');

    function handleConnect() {
      setConnectionStatus('CONNECTED');
    }

    function handleDisconnect() {
      setConnectionStatus('DISCONNECTED');
      setCountdown(null);
    }

    function handleConnectError() {
      setConnectionStatus('DISCONNECTED');
    }

    function handleRoomUpdate(nextRoom: BattleRoomState) {
      setRoom(nextRoom);
    }

    function handleCountdown(payload: BattleCountdownPayload) {
      setCountdown(payload.value);
    }

    function handleStart(payload: BattleStartPayload) {
      setStartSignal(payload);
      setCountdown(null);
      setResult(null);
    }

    function handleAttack(payload: BattleAttackPayload) {
      setLastAttack((currentAttack) => ({
        ...payload,
        id: (currentAttack?.id ?? 0) + 1
      }));
    }

    function handleResult(payload: BattleResultPayload) {
      setResult(payload);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
    socket.on(SOCKET_EVENTS.COUNTDOWN, handleCountdown);
    socket.on(SOCKET_EVENTS.START, handleStart);
    socket.on(SOCKET_EVENTS.ATTACK, handleAttack);
    socket.on(SOCKET_EVENTS.RESULT, handleResult);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
      socket.off(SOCKET_EVENTS.COUNTDOWN, handleCountdown);
      socket.off(SOCKET_EVENTS.START, handleStart);
      socket.off(SOCKET_EVENTS.ATTACK, handleAttack);
      socket.off(SOCKET_EVENTS.RESULT, handleResult);
      socket.disconnect();
    };
  }, [enabled, socket]);

  const requestRoomAction = useMemo(
    () => async (eventName: typeof SOCKET_EVENTS.ROOM_CREATE | typeof SOCKET_EVENTS.ROOM_JOIN, payload: Record<string, string>) => {
      setIsRoomActionPending(true);
      setErrorMessage(null);
      setCountdown(null);

      if (!enabled || !socket.connected) {
        setErrorMessage('배틀 서버에 연결되어 있지 않습니다.');
        setIsRoomActionPending(false);
        return false;
      }

      try {
        const response = await socket.timeout(5000).emitWithAck(eventName, payload) as BattleActionResponse;

        if (!response.ok) {
          setErrorMessage(response.error);
          return false;
        }

        setRoom(response.room);
        return true;
      } catch {
        setErrorMessage('배틀 서버 응답이 없습니다. API 서버 상태를 확인해주세요.');
        return false;
      } finally {
        setIsRoomActionPending(false);
      }
    },
    [enabled, socket]
  );

  const markReady = useMemo(
    () => async () => {
      setIsRoomActionPending(true);
      setErrorMessage(null);

      if (!enabled || !socket.connected) {
        setErrorMessage('배틀 서버에 연결되어 있지 않습니다.');
        setIsRoomActionPending(false);
        return false;
      }

      try {
        const response = await socket.timeout(5000).emitWithAck(SOCKET_EVENTS.READY) as BattleActionResponse;

        if (!response.ok) {
          setErrorMessage(response.error);
          return false;
        }

        setRoom(response.room);
        return true;
      } catch {
        setErrorMessage('배틀 서버 응답이 없습니다. API 서버 상태를 확인해주세요.');
        return false;
      } finally {
        setIsRoomActionPending(false);
      }
    },
    [enabled, socket]
  );

  const sendMerge = useMemo(
    () => async (level: number) => {
      if (!enabled || !socket.connected || room?.status !== 'PLAYING' || !room.roomId) {
        return false;
      }

      try {
        const response = await socket.timeout(3000).emitWithAck(SOCKET_EVENTS.MERGE, {
          roomId: room.roomId,
          level
        }) as { ok: boolean };

        return response.ok;
      } catch {
        return false;
      }
    },
    [enabled, room, socket]
  );

  const sendState = useMemo(
    () => async (state: BattleStatePayload) => {
      if (!enabled || !socket.connected || !room?.roomId || (room.status !== 'PLAYING' && room.status !== 'FINISHED')) {
        return false;
      }

      try {
        const response = await socket.timeout(3000).emitWithAck(SOCKET_EVENTS.STATE, {
          roomId: room.roomId,
          ...state
        }) as { ok: boolean };

        return response.ok;
      } catch {
        return false;
      }
    },
    [enabled, room, socket]
  );

  const sendGameOver = useMemo(
    () => async (score: number) => {
      if (!enabled || !socket.connected || !room?.roomId || room.status !== 'PLAYING') {
        return false;
      }

      try {
        const response = await socket.timeout(5000).emitWithAck(SOCKET_EVENTS.GAME_OVER, {
          roomId: room.roomId,
          score
        }) as { ok: boolean };

        return response.ok;
      } catch {
        return false;
      }
    },
    [enabled, room, socket]
  );

  return useMemo(
    () => ({
      connectionStatus,
      countdown,
      createRoom: (nickname: string) => requestRoomAction(SOCKET_EVENTS.ROOM_CREATE, { nickname }),
      errorMessage,
      isRoomActionPending,
      joinRoom: (roomId: string, nickname: string) => requestRoomAction(SOCKET_EVENTS.ROOM_JOIN, { roomId, nickname }),
      lastAttack,
      markReady,
      result,
      room,
      sendGameOver,
      sendMerge,
      sendState,
      socket,
      socketUrl: getBattleSocketUrl(),
      startSignal
    }),
    [
      connectionStatus,
      countdown,
      errorMessage,
      isRoomActionPending,
      lastAttack,
      markReady,
      requestRoomAction,
      result,
      room,
      sendGameOver,
      sendMerge,
      sendState,
      socket,
      startSignal
    ]
  );
}

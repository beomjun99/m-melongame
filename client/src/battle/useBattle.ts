import { useEffect, useMemo, useState } from 'react';
import { SOCKET_EVENTS } from './battleEvents';
import type { BattleActionResponse, BattleRoomState } from './battleTypes';
import { createBattleSocket, getBattleSocketUrl } from './socket';

export type BattleConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export function useBattle() {
  const [connectionStatus, setConnectionStatus] = useState<BattleConnectionStatus>('CONNECTING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRoomActionPending, setIsRoomActionPending] = useState(false);
  const [room, setRoom] = useState<BattleRoomState | null>(null);
  const socket = useMemo(() => createBattleSocket(), []);

  useEffect(() => {
    function handleConnect() {
      setConnectionStatus('CONNECTED');
    }

    function handleDisconnect() {
      setConnectionStatus('DISCONNECTED');
    }

    function handleConnectError() {
      setConnectionStatus('DISCONNECTED');
    }

    function handleRoomUpdate(nextRoom: BattleRoomState) {
      setRoom(nextRoom);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SOCKET_EVENTS.ROOM_UPDATE, handleRoomUpdate);
      socket.disconnect();
    };
  }, [socket]);

  const requestRoomAction = useMemo(
    () => async (eventName: typeof SOCKET_EVENTS.ROOM_CREATE | typeof SOCKET_EVENTS.ROOM_JOIN, payload: Record<string, string>) => {
      setIsRoomActionPending(true);
      setErrorMessage(null);

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
    [socket]
  );

  return useMemo(
    () => ({
      connectionStatus,
      createRoom: (nickname: string) => requestRoomAction(SOCKET_EVENTS.ROOM_CREATE, { nickname }),
      errorMessage,
      isRoomActionPending,
      joinRoom: (roomId: string, nickname: string) => requestRoomAction(SOCKET_EVENTS.ROOM_JOIN, { roomId, nickname }),
      room,
      socket,
      socketUrl: getBattleSocketUrl()
    }),
    [connectionStatus, errorMessage, isRoomActionPending, requestRoomAction, room, socket]
  );
}

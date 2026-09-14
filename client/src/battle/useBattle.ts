import { useEffect, useMemo, useState } from 'react';
import type { BattleRoomState } from './battleTypes';
import { createBattleSocket, getBattleSocketUrl } from './socket';

export type BattleConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export function useBattle() {
  const [connectionStatus, setConnectionStatus] = useState<BattleConnectionStatus>('CONNECTING');
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

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [socket]);

  return useMemo(
    () => ({
      connectionStatus,
      socket,
      socketUrl: getBattleSocketUrl(),
      room: null as BattleRoomState | null
    }),
    [connectionStatus, socket]
  );
}

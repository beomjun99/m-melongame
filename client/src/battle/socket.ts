import { io } from 'socket.io-client';

export function getBattleSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? '';
}

export function createBattleSocket() {
  return io(`${getBattleSocketUrl()}/battle`, {
    autoConnect: false,
    transports: ['websocket']
  });
}

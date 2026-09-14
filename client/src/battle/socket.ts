import { io } from 'socket.io-client';

export function getBattleSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
}

export function createBattleSocket() {
  return io(`${getBattleSocketUrl()}/battle`, {
    autoConnect: false,
    transports: ['websocket']
  });
}

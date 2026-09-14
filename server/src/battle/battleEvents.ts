export const SOCKET_EVENTS = {
  ROOM_CREATE: 'battle:room:create',
  ROOM_JOIN: 'battle:room:join',
  ROOM_UPDATE: 'battle:room:update',
  READY: 'battle:ready',
  COUNTDOWN: 'battle:countdown',
  START: 'battle:start',
  MERGE: 'battle:merge',
  ATTACK: 'battle:attack',
  STATE: 'battle:state',
  GAME_OVER: 'battle:gameOver',
  RESULT: 'battle:result',
  REMATCH: 'battle:rematch',
  PLAYER_DISCONNECTED: 'battle:playerDisconnected'
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

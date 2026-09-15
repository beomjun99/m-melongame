import type { BattlePlayer, BattleRoom, BattleRoomState } from './battleTypes.js';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const MAX_PLAYERS_PER_ROOM = 2;
const rooms = new Map<string, BattleRoom>();
const roomIdBySocketId = new Map<string, string>();

function normalizeNickname(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const nickname = value.trim();

  if (nickname.length < 1 || nickname.length > 20) {
    return null;
  }

  return nickname;
}

function generateRoomId() {
  let roomId = '';

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    roomId += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }

  return roomId;
}

function createUniqueRoomId() {
  let roomId = generateRoomId();

  while (rooms.has(roomId)) {
    roomId = generateRoomId();
  }

  return roomId;
}

function createPlayer(socketId: string, nickname: string): BattlePlayer {
  return {
    socketId,
    nickname,
    ready: false,
    gameOver: false,
    score: 0,
    maxLevel: 1,
    joinedAt: Date.now()
  };
}

function toPlayerState(player: BattlePlayer) {
  return {
    nickname: player.nickname,
    ready: player.ready,
    score: player.score,
    maxLevel: player.maxLevel,
    gameOver: player.gameOver
  };
}

export function toBattleRoomState(room: BattleRoom, socketId: string): BattleRoomState {
  const self = room.players.find((player) => player.socketId === socketId) ?? null;
  const opponent = room.players.find((player) => player.socketId !== socketId) ?? null;

  return {
    roomId: room.roomId,
    status: room.status,
    self: self ? toPlayerState(self) : null,
    opponent: opponent ? toPlayerState(opponent) : null
  };
}

export function getRoomForSocket(socketId: string) {
  const roomId = roomIdBySocketId.get(socketId);

  return roomId ? rooms.get(roomId) ?? null : null;
}

export function createBattleRoom(socketId: string, nicknameValue: unknown) {
  const nickname = normalizeNickname(nicknameValue);

  if (!nickname) {
    return { room: null, error: '닉네임은 1~20자로 입력해주세요.' };
  }

  if (roomIdBySocketId.has(socketId)) {
    return { room: null, error: '이미 참가 중인 방이 있습니다.' };
  }

  const roomId = createUniqueRoomId();
  const room: BattleRoom = {
    roomId,
    status: 'WAITING',
    players: [createPlayer(socketId, nickname)],
    createdAt: Date.now(),
    countdownStartedAt: null,
    startedAt: null,
    finishedAt: null
  };

  rooms.set(roomId, room);
  roomIdBySocketId.set(socketId, roomId);

  return { room, error: null };
}

export function joinBattleRoom(socketId: string, roomIdValue: unknown, nicknameValue: unknown) {
  const nickname = normalizeNickname(nicknameValue);

  if (!nickname) {
    return { room: null, error: '닉네임은 1~20자로 입력해주세요.' };
  }

  if (roomIdBySocketId.has(socketId)) {
    return { room: null, error: '이미 참가 중인 방이 있습니다.' };
  }

  if (typeof roomIdValue !== 'string') {
    return { room: null, error: '방 코드를 입력해주세요.' };
  }

  const roomId = roomIdValue.trim().toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return { room: null, error: '존재하지 않는 방입니다.' };
  }

  if (room.status === 'FINISHED' || room.status === 'PLAYING') {
    return { room: null, error: '이미 진행 중이거나 종료된 방입니다.' };
  }

  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    return { room: null, error: '이미 가득 찬 방입니다.' };
  }

  room.players.push(createPlayer(socketId, nickname));
  room.status = room.players.length === MAX_PLAYERS_PER_ROOM ? 'READY' : 'WAITING';
  roomIdBySocketId.set(socketId, room.roomId);

  return { room, error: null };
}

export function removePlayerFromBattleRoom(socketId: string) {
  const roomId = roomIdBySocketId.get(socketId);

  if (!roomId) {
    return null;
  }

  const room = rooms.get(roomId);
  roomIdBySocketId.delete(socketId);

  if (!room) {
    return null;
  }

  room.players = room.players.filter((player) => player.socketId !== socketId);

  if (room.players.length === 0) {
    rooms.delete(room.roomId);
    return null;
  }

  if (room.status === 'READY') {
    room.status = 'WAITING';
    room.countdownStartedAt = null;
  }

  return room;
}

export function setPlayerReady(socketId: string) {
  const room = getRoomForSocket(socketId);

  if (!room) {
    return { room: null, error: '참가 중인 방이 없습니다.' };
  }

  if (room.status !== 'READY') {
    return { room: null, error: '두 플레이어가 모두 입장해야 준비할 수 있습니다.' };
  }

  const player = room.players.find((roomPlayer) => roomPlayer.socketId === socketId);

  if (!player) {
    return { room: null, error: '방의 플레이어를 찾을 수 없습니다.' };
  }

  player.ready = true;

  return { room, error: null };
}

export function canStartCountdown(room: BattleRoom) {
  return room.status === 'READY'
    && room.players.length === MAX_PLAYERS_PER_ROOM
    && room.players.every((player) => player.ready)
    && room.countdownStartedAt === null;
}

export function markCountdownStarted(room: BattleRoom) {
  room.countdownStartedAt = Date.now();
}

export function markRoomPlaying(roomId: string) {
  const room = rooms.get(roomId);

  if (!room || room.status !== 'READY' || room.players.length !== MAX_PLAYERS_PER_ROOM) {
    return null;
  }

  if (!room.players.every((player) => player.ready)) {
    return null;
  }

  room.status = 'PLAYING';
  room.startedAt = Date.now();

  return room;
}

export function updatePlayerBattleState(socketId: string, score: number, maxLevel: number, gameOver: boolean) {
  const room = getRoomForSocket(socketId);

  if (!room) {
    return { room: null, error: '참가 중인 방이 없습니다.' };
  }

  if (room.status !== 'PLAYING' && room.status !== 'FINISHED') {
    return { room: null, error: '게임 상태를 갱신할 수 없는 방 상태입니다.' };
  }

  const player = room.players.find((roomPlayer) => roomPlayer.socketId === socketId);

  if (!player) {
    return { room: null, error: '방의 플레이어를 찾을 수 없습니다.' };
  }

  player.score = score;
  player.maxLevel = maxLevel;
  player.gameOver = gameOver;

  return { room, error: null };
}

export function finishBattleByGameOver(socketId: string, score: number) {
  const room = getRoomForSocket(socketId);

  if (!room) {
    return { room: null, loser: null, winner: null, error: '참가 중인 방이 없습니다.' };
  }

  if (room.status !== 'PLAYING') {
    return { room: null, loser: null, winner: null, error: '게임이 진행 중일 때만 종료할 수 있습니다.' };
  }

  if (room.players.length !== MAX_PLAYERS_PER_ROOM) {
    return { room: null, loser: null, winner: null, error: '두 플레이어가 모두 있어야 결과를 확정할 수 있습니다.' };
  }

  const loser = room.players.find((player) => player.socketId === socketId) ?? null;
  const winner = room.players.find((player) => player.socketId !== socketId) ?? null;

  if (!loser || !winner) {
    return { room: null, loser: null, winner: null, error: '승패를 결정할 플레이어를 찾을 수 없습니다.' };
  }

  loser.score = score;
  loser.gameOver = true;
  room.status = 'FINISHED';
  room.finishedAt = Date.now();

  return { room, loser, winner, error: null };
}

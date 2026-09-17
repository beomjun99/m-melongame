import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Composite, Engine, Events } from 'matter-js';
import pg from 'pg';
import { io, type Socket } from 'socket.io-client';
import { config as loadEnv } from 'dotenv';
import { registerMergeCollisionHandler } from '../client/src/game/collision.ts';
import { OBJECT_LEVELS } from '../client/src/game/config.ts';
import { createObjectBody } from '../client/src/game/spawn.ts';
import type { MergeResult } from '../client/src/game/types.ts';
import { DEFAULT_THEME } from '../client/src/theme/config.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(projectRoot, 'server', '.env') });

const apiUrl = process.env.PHASE24_API_URL ?? 'http://localhost:4000';
const socketUrl = process.env.PHASE24_SOCKET_URL ?? `${apiUrl}/battle`;
const token = randomUUID().slice(0, 8);
const singleNickname = `p24-single-${token}`;
const playerOneNickname = `p24-a-${token}`;
const playerTwoNickname = `p24-b-${token}`;
const themeName = `p24-theme-${token}`;
const createdRoomIds = new Set<string>();
let createdThemeId: string | null = null;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
});

const sockets: Socket[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logPassed(label: string) {
  console.log(`PASS ${label}`);
}

async function request(pathname: string, options?: RequestInit) {
  return fetch(`${apiUrl}${pathname}`, options);
}

async function readJson<T>(response: Response) {
  const body = await response.json() as T;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

function waitForEvent<T>(socket: Socket, eventName: string, timeoutMs = 6000) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);
    const handler = (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    };

    socket.once(eventName, handler);
  });
}

async function expectNoEvent(socket: Socket, eventName: string, timeoutMs = 350) {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      resolve();
    }, timeoutMs);
    const handler = (payload: unknown) => {
      clearTimeout(timer);
      reject(new Error(`Unexpected ${eventName}: ${JSON.stringify(payload)}`));
    };

    socket.once(eventName, handler);
  });
}

function emitWithAck<T>(socket: Socket, eventName: string, payload?: unknown, timeoutMs = 6000) {
  if (payload === undefined) {
    return socket.timeout(timeoutMs).emitWithAck(eventName) as Promise<T>;
  }

  return socket.timeout(timeoutMs).emitWithAck(eventName, payload) as Promise<T>;
}

async function connectBattleSocket() {
  const socket = io(socketUrl, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  sockets.push(socket);

  if (socket.connected) {
    return socket;
  }

  await Promise.race([
    waitForEvent(socket, 'connect'),
    waitForEvent<Error>(socket, 'connect_error').then((error) => Promise.reject(error))
  ]);
  return socket;
}

function getLevel(level: number) {
  const config = OBJECT_LEVELS.find((candidate) => candidate.level === level);
  assert(config, `Missing level ${level} config`);
  return config;
}

function testGameEngine() {
  const radiusBefore = getLevel(1).radius;
  const normalEngine = Engine.create();
  const normalResults: MergeResult[] = [];
  const cleanupNormal = registerMergeCollisionHandler({
    engine: normalEngine,
    theme: DEFAULT_THEME,
    onMerge: (result) => normalResults.push(result)
  });
  const normalA = createObjectBody(getLevel(1), 100, 100, undefined, 'NORMAL');
  const normalB = createObjectBody(getLevel(1), 100, 100, undefined, 'NORMAL');
  Composite.add(normalEngine.world, [normalA, normalB]);
  Events.trigger(normalEngine, 'collisionStart', { pairs: [{ bodyA: normalA, bodyB: normalB }] });

  assert(normalA.circleRadius === radiusBefore, 'Theme rendering changed the collision radius.');
  assert(normalResults[0]?.level === 2, 'Normal merge did not create the next level.');
  assert(normalResults[0]?.attackEligible === true, 'Normal merge should be attack eligible.');
  cleanupNormal();
  Engine.clear(normalEngine);

  const attackEngine = Engine.create();
  const attackResults: MergeResult[] = [];
  const cleanupAttack = registerMergeCollisionHandler({
    engine: attackEngine,
    theme: DEFAULT_THEME,
    onMerge: (result) => attackResults.push(result)
  });
  const attackA = createObjectBody(getLevel(1), 100, 100, undefined, 'ATTACK');
  const attackB = createObjectBody(getLevel(1), 100, 100, undefined, 'NORMAL');
  Composite.add(attackEngine.world, [attackA, attackB]);
  Events.trigger(attackEngine, 'collisionStart', { pairs: [{ bodyA: attackA, bodyB: attackB }] });

  assert(attackResults[0]?.level === 2, 'Attack fruit did not participate in a normal merge.');
  assert(attackResults[0]?.attackEligible === false, 'Attack fruit merge can create ping-pong attacks.');
  cleanupAttack();
  Engine.clear(attackEngine);
  logPassed('Matter.js merge, collision radius, and attack ping-pong guard');
}

async function testRestAndTheme() {
  const health = await readJson<{ ok: boolean }>(await request('/api/health'));
  assert(health.ok, 'API health check failed.');
  const databaseHealth = await readJson<{ ok: boolean; database: { connected: boolean } }>(
    await request('/api/health/db')
  );
  assert(databaseHealth.ok && databaseHealth.database.connected, 'Database health check failed.');
  logPassed('API and PostgreSQL health');

  const resultResponse = await request('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: singleNickname, score: 999_999_999, maxLevel: 11, level11Count: 1 })
  });
  await readJson(resultResponse);
  const rankings = await readJson<{ rankings: Array<{ nickname: string; score: number }> }>(
    await request('/api/rankings')
  );
  assert(rankings.rankings.some((entry) => entry.nickname === singleNickname && entry.score === 999_999_999),
    'Saved single-player result was not returned by rankings.');
  logPassed('Single-player result save and ranking refresh');

  const createResponse = await request('/api/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: themeName })
  });
  const created = await readJson<{ theme: { id: string } }>(createResponse);
  createdThemeId = created.theme.id;

  const duplicateResponse = await request('/api/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: themeName.toUpperCase() })
  });
  assert(duplicateResponse.status === 409, 'Duplicate theme name was not rejected.');

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4ioAAAAASUVORK5CYII=',
    'base64'
  );
  let latestTheme: { fruits: Array<{ level: number; imageUrl: string }> } | null = null;

  for (let level = 1; level <= 11; level += 1) {
    const form = new FormData();
    form.append('image', new Blob([png], { type: 'image/png' }), `level-${level}.png`);
    const uploadResponse = await request(`/api/themes/${createdThemeId}/images/${level}`, {
      method: 'POST',
      body: form
    });
    const uploaded = await readJson<{ theme: typeof latestTheme }>(uploadResponse);
    latestTheme = uploaded.theme;
  }

  assert(latestTheme?.fruits.length === 11, 'Theme did not retain all 11 uploaded levels.');
  const uploadedLevelOne = latestTheme.fruits.find((fruit) => fruit.level === 1);
  assert(uploadedLevelOne, 'Uploaded Level 1 skin is missing.');
  const imageResponse = await request(uploadedLevelOne.imageUrl);
  assert(imageResponse.ok && imageResponse.headers.get('content-type')?.includes('image/png'),
    'Uploaded theme image is not publicly readable.');

  const themes = await readJson<{ themes: Array<{ id: string; name: string; fruits: unknown[] }> }>(
    await request('/api/themes')
  );
  const loadedTheme = themes.themes.find((theme) => theme.id === createdThemeId);
  assert(loadedTheme?.name === themeName && loadedTheme.fruits.length === 11,
    'Saved theme lineup could not be loaded.');
  logPassed('Theme name uniqueness, 11 image uploads, public images, and reload');

  const deleteResponse = await request(`/api/themes/${createdThemeId}`, { method: 'DELETE' });
  assert(deleteResponse.status === 204, 'Theme deletion failed.');
  createdThemeId = null;
  const themesAfterDelete = await readJson<{ themes: Array<{ name: string }> }>(await request('/api/themes'));
  assert(!themesAfterDelete.themes.some((theme) => theme.name === themeName), 'Deleted theme is still listed.');
  logPassed('Theme deletion');
}

async function testBattle() {
  const [playerOne, playerTwo, thirdPlayer] = await Promise.all([
    connectBattleSocket(),
    connectBattleSocket(),
    connectBattleSocket()
  ]);
  const created = await emitWithAck<{ ok: boolean; room?: { roomId: string }; error?: string }>(
    playerOne,
    'battle:room:create',
    { nickname: playerOneNickname }
  );
  assert(created.ok && created.room, `Room creation failed: ${created.error ?? 'unknown error'}`);
  const roomId = created.room.roomId;
  createdRoomIds.add(roomId);

  const joined = await emitWithAck<{ ok: boolean; error?: string }>(
    playerTwo,
    'battle:room:join',
    { roomId, nickname: playerTwoNickname }
  );
  assert(joined.ok, `Second player could not join: ${joined.error ?? 'unknown error'}`);
  const thirdJoin = await emitWithAck<{ ok: boolean; error?: string }>(
    thirdPlayer,
    'battle:room:join',
    { roomId, nickname: `p24-c-${token}` }
  );
  assert(!thirdJoin.ok, 'A third player joined a full room.');
  thirdPlayer.disconnect();
  logPassed('Room create, second-player join, and third-player rejection');

  const firstStartOne = waitForEvent<{ startedAt: number }>(playerOne, 'battle:start');
  const firstStartTwo = waitForEvent<{ startedAt: number }>(playerTwo, 'battle:start');
  const readyOne = await emitWithAck<{ ok: boolean; error?: string }>(playerOne, 'battle:ready');
  const readyTwo = await emitWithAck<{ ok: boolean; error?: string }>(playerTwo, 'battle:ready');
  assert(readyOne.ok && readyTwo.ok, 'Players could not become ready.');
  const [startedOne, startedTwo] = await Promise.all([firstStartOne, firstStartTwo]);
  assert(startedOne.startedAt === startedTwo.startedAt, 'Players received different start timestamps.');
  logPassed('Ready, countdown, and synchronized start');

  for (const level of [2, 3, 4, 5]) {
    const attack = waitForEvent<{ level: number }>(playerTwo, 'battle:attack');
    const mergeAck = await emitWithAck<{ ok: boolean; error?: string }>(
      playerOne,
      'battle:merge',
      { roomId, level }
    );
    assert(mergeAck.ok, `Merge level ${level} was rejected: ${mergeAck.error ?? 'unknown error'}`);
    assert((await attack).level === level, `Merge level ${level} produced the wrong attack level.`);
  }
  const noHighLevelAttack = expectNoEvent(playerTwo, 'battle:attack');
  const highLevelMerge = await emitWithAck<{ ok: boolean; error?: string }>(
    playerOne,
    'battle:merge',
    { roomId, level: 6 }
  );
  assert(highLevelMerge.ok, 'A valid level 6 merge was rejected.');
  await noHighLevelAttack;
  logPassed('Attack levels 2-5 and level 6+ attack suppression');

  const pauseOne = waitForEvent<{ paused: boolean }>(playerOne, 'battle:pause');
  const pauseTwo = waitForEvent<{ paused: boolean }>(playerTwo, 'battle:pause');
  const pauseAck = await emitWithAck<{ ok: boolean; error?: string }>(
    playerOne,
    'battle:pause',
    { roomId }
  );
  assert(pauseAck.ok && (await pauseOne).paused && (await pauseTwo).paused, 'Shared pause failed.');
  const pausedMerge = await emitWithAck<{ ok: boolean; error?: string }>(
    playerTwo,
    'battle:merge',
    { roomId, level: 2 }
  );
  assert(!pausedMerge.ok, 'Merge was accepted while the room was paused.');

  const resumeOne = waitForEvent<{ paused: boolean }>(playerOne, 'battle:resume');
  const resumeTwo = waitForEvent<{ paused: boolean }>(playerTwo, 'battle:resume');
  const resumeAck = await emitWithAck<{ ok: boolean; error?: string }>(
    playerTwo,
    'battle:resume',
    { roomId }
  );
  assert(resumeAck.ok && !(await resumeOne).paused && !(await resumeTwo).paused, 'Shared resume failed.');
  logPassed('Shared pause/resume and paused-event rejection');

  const stateOne = await emitWithAck<{ ok: boolean }>(playerOne, 'battle:state', {
    roomId,
    score: 1250,
    maxLevel: 5,
    gameOver: false
  });
  const stateTwo = await emitWithAck<{ ok: boolean }>(playerTwo, 'battle:state', {
    roomId,
    score: 980,
    maxLevel: 4,
    gameOver: false
  });
  assert(stateOne.ok && stateTwo.ok, 'Battle state update failed.');

  const resultOne = waitForEvent<{ outcome: string; selfScore: number; opponentScore: number }>(playerOne, 'battle:result');
  const resultTwo = waitForEvent<{ outcome: string; selfScore: number; opponentScore: number }>(playerTwo, 'battle:result');
  const gameOverAck = await emitWithAck<{ ok: boolean; error?: string }>(
    playerTwo,
    'battle:gameOver',
    { roomId, score: 980 }
  );
  assert(gameOverAck.ok, `Game over was rejected: ${gameOverAck.error ?? 'unknown error'}`);
  const [winnerResult, loserResult] = await Promise.all([resultOne, resultTwo]);
  assert(winnerResult.outcome === 'WIN' && loserResult.outcome === 'LOSE', 'Win/lose result was incorrect.');
  assert(winnerResult.selfScore === 1250 && winnerResult.opponentScore === 980, 'Battle scores were incorrect.');

  const savedBattle = await pool.query<{ count: string }>(
    'select count(*)::text as count from battle_results where room_id = $1',
    [roomId]
  );
  assert(Number(savedBattle.rows[0]?.count) === 1, 'Battle result was not saved to PostgreSQL.');
  logPassed('Opponent state, win/lose, scores, and battle result persistence');

  const rematchOne = await emitWithAck<{ ok: boolean; room?: { status: string; self: { rematchReady: boolean } } }>(
    playerOne,
    'battle:rematch'
  );
  assert(rematchOne.ok && rematchOne.room?.status === 'FINISHED' && rematchOne.room.self.rematchReady,
    'First rematch request was not held in waiting state.');
  const secondStartOne = waitForEvent<{ startedAt: number }>(playerOne, 'battle:start');
  const secondStartTwo = waitForEvent<{ startedAt: number }>(playerTwo, 'battle:start');
  const rematchTwo = await emitWithAck<{ ok: boolean; error?: string }>(playerTwo, 'battle:rematch');
  assert(rematchTwo.ok, `Second rematch request failed: ${rematchTwo.error ?? 'unknown error'}`);
  const [rematchStartOne, rematchStartTwo] = await Promise.all([secondStartOne, secondStartTwo]);
  assert(rematchStartOne.startedAt === rematchStartTwo.startedAt, 'Rematch was not synchronized.');
  logPassed('Two-player rematch');

  const disconnectResult = waitForEvent<{ outcome: string }>(playerOne, 'battle:result');
  const disconnectNotice = waitForEvent<{ message: string }>(playerOne, 'battle:playerDisconnected');
  playerTwo.disconnect();
  const [disconnectWinner, notice] = await Promise.all([disconnectResult, disconnectNotice]);
  assert(disconnectWinner.outcome === 'WIN', 'Remaining player did not win after disconnect.');
  assert(notice.message.includes('연결이 종료'), 'Disconnect reason was not delivered.');
  logPassed('Disconnect loss and remaining-player win');
}

async function cleanup() {
  for (const socket of sockets) {
    socket.disconnect();
  }

  if (createdThemeId) {
    try {
      await request(`/api/themes/${createdThemeId}`, { method: 'DELETE' });
    } catch {
      // Database cleanup below still removes the temporary row.
    }
  }

  await pool.query('delete from battle_results where room_id = any($1::varchar[])', [Array.from(createdRoomIds)]);
  await pool.query('delete from themes where name = $1', [themeName]);
  await pool.query('delete from users where nickname = $1', [singleNickname]);
  await pool.end();
}

async function main() {
  try {
    testGameEngine();
    await testRestAndTheme();
    await testBattle();
    console.log('PASS Phase 24 integration smoke test');
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error('FAIL Phase 24 integration smoke test');
  console.error(error);
  process.exitCode = 1;
});

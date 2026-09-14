import type {
  BoardConfig,
  DropConfig,
  GameOverConfig,
  ObjectLevelConfig,
  PhysicsConfig
} from './types';

export const BOARD_CONFIG: BoardConfig = {
  width: 420,
  height: 576,
  wallThickness: 40,
  backgroundColor: '#f8fafc',
  wallColor: '#334155',
  gameOverLineY: 96
};

export const PHYSICS_CONFIG: PhysicsConfig = {
  gravityY: 1,
  restitution: 0.28,
  friction: 0.08,
  frictionAir: 0.002,
  density: 0.001
};

export const DROP_CONFIG: DropConfig = {
  spawnY: 64,
  previewY: 40,
  cooldownMs: 450,
  minSpawnLevel: 1,
  maxSpawnLevel: 5
};

export const GAME_OVER_CONFIG: GameOverConfig = {
  speedThreshold: 0.35,
  angularSpeedThreshold: 0.08,
  sustainedMs: 1800,
  spawnGraceMs: 1200
};

export const OBJECT_LEVELS: ObjectLevelConfig[] = [
  { level: 1, radius: 15, score: 1 },
  { level: 2, radius: 22, score: 2 },
  { level: 3, radius: 29, score: 4 },
  { level: 4, radius: 36, score: 8 },
  { level: 5, radius: 43, score: 16 },
  { level: 6, radius: 51, score: 32 },
  { level: 7, radius: 59, score: 64 },
  { level: 8, radius: 68, score: 128 },
  { level: 9, radius: 78, score: 256 },
  { level: 10, radius: 89, score: 512 },
  { level: 11, radius: 101, score: 1024 }
];

export type ObjectLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type GameMode = 'SINGLE' | 'BATTLE';

export type ObjectLevelConfig = {
  level: ObjectLevel;
  radius: number;
  score: number;
};

export type MergeResult = {
  level: ObjectLevel;
  score: number;
  x: number;
  y: number;
};

export type PhysicsConfig = {
  gravityY: number;
  restitution: number;
  friction: number;
  frictionAir: number;
  density: number;
};

export type BoardConfig = {
  width: number;
  height: number;
  wallThickness: number;
  backgroundColor: string;
  wallColor: string;
  gameOverLineY: number;
};

export type GameOverConfig = {
  speedThreshold: number;
  angularSpeedThreshold: number;
  sustainedMs: number;
  spawnGraceMs: number;
};

export type DropConfig = {
  spawnY: number;
  previewY: number;
  cooldownMs: number;
  minSpawnLevel: ObjectLevel;
  maxSpawnLevel: ObjectLevel;
};

export type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

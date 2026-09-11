import { Composite, Engine, Events, type Body } from 'matter-js';
import { BOARD_CONFIG, GAME_OVER_CONFIG, OBJECT_LEVELS } from './config';

type GameOverCleanup = () => void;

type GameOverWatcherOptions = {
  engine: Engine;
  onGameOver: () => void;
};

function getBodyRadius(body: Body) {
  const level = body.plugin?.level;

  if (typeof level !== 'number') {
    return 0;
  }

  return OBJECT_LEVELS.find((config) => config.level === level)?.radius ?? 0;
}

function getBodyCreatedAt(body: Body) {
  const createdAt = body.plugin?.createdAt;

  return typeof createdAt === 'number' ? createdAt : 0;
}

function isSettledAboveGameOverLine(body: Body, now: number) {
  if (body.isStatic || !body.plugin?.level) {
    return false;
  }

  const radius = getBodyRadius(body);
  const top = body.position.y - radius;
  const age = now - getBodyCreatedAt(body);

  return (
    top <= BOARD_CONFIG.gameOverLineY &&
    age >= GAME_OVER_CONFIG.spawnGraceMs &&
    body.speed <= GAME_OVER_CONFIG.speedThreshold &&
    Math.abs(body.angularSpeed) <= GAME_OVER_CONFIG.angularSpeedThreshold
  );
}

export function registerGameOverWatcher({ engine, onGameOver }: GameOverWatcherOptions): GameOverCleanup {
  let dangerStartedAt: number | null = null;
  let isGameOver = false;

  const handleAfterUpdate = () => {
    if (isGameOver) {
      return;
    }

    const now = performance.now();
    const bodies = Composite.allBodies(engine.world);
    const hasDangerBody = bodies.some((body) => isSettledAboveGameOverLine(body, now));

    if (!hasDangerBody) {
      dangerStartedAt = null;
      return;
    }

    dangerStartedAt ??= now;

    if (now - dangerStartedAt >= GAME_OVER_CONFIG.sustainedMs) {
      isGameOver = true;
      onGameOver();
    }
  };

  Events.on(engine, 'afterUpdate', handleAfterUpdate);

  return () => {
    Events.off(engine, 'afterUpdate', handleAfterUpdate);
    dangerStartedAt = null;
  };
}

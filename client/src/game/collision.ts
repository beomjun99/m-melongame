import { Composite, Engine, Events, type Body, type IEventCollision } from 'matter-js';
import { OBJECT_LEVELS } from './config';
import { createObjectBody } from './spawn';
import type { MergeResult, ObjectLevel, ObjectLevelConfig } from './types';
import { getFruitSkin } from '../theme/config';
import type { GameTheme } from '../theme/types';

type CollisionCleanup = () => void;

type MergeHandlerOptions = {
  engine: Engine;
  theme: GameTheme;
  onMerge?: (result: MergeResult) => void;
};

function getBodyLevel(body: Body): ObjectLevel | null {
  const level = body.plugin?.level;

  if (typeof level !== 'number') {
    return null;
  }

  if (level < 1 || level > 11) {
    return null;
  }

  return level as ObjectLevel;
}

function getObjectConfig(level: ObjectLevel): ObjectLevelConfig {
  const config = OBJECT_LEVELS.find((objectConfig) => objectConfig.level === level);

  if (!config) {
    throw new Error(`Missing object config for level ${level}`);
  }

  return config;
}

export function registerMergeCollisionHandler({ engine, theme, onMerge }: MergeHandlerOptions): CollisionCleanup {
  const mergingBodyIds = new Set<number>();

  const handleCollisionStart = (event: IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      if (bodyA.isStatic || bodyB.isStatic) {
        continue;
      }

      if (mergingBodyIds.has(bodyA.id) || mergingBodyIds.has(bodyB.id)) {
        continue;
      }

      const levelA = getBodyLevel(bodyA);
      const levelB = getBodyLevel(bodyB);

      if (!levelA || levelA !== levelB) {
        continue;
      }

      mergingBodyIds.add(bodyA.id);
      mergingBodyIds.add(bodyB.id);

      const currentConfig = getObjectConfig(levelA);
      const x = (bodyA.position.x + bodyB.position.x) / 2;
      const y = (bodyA.position.y + bodyB.position.y) / 2;

      Composite.remove(engine.world, [bodyA, bodyB]);

      if (levelA < 11) {
        const nextConfig = getObjectConfig((levelA + 1) as ObjectLevel);
        const mergedBody = createObjectBody(nextConfig, x, y, getFruitSkin(theme, nextConfig.level));

        Composite.add(engine.world, mergedBody);
        onMerge?.({
          level: nextConfig.level,
          score: currentConfig.score,
          x,
          y
        });
        continue;
      }

      onMerge?.({
        level: currentConfig.level,
        score: currentConfig.score,
        x,
        y
      });
    }
  };

  Events.on(engine, 'collisionStart', handleCollisionStart);

  return () => {
    Events.off(engine, 'collisionStart', handleCollisionStart);
    mergingBodyIds.clear();
  };
}

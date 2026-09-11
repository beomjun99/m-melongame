import { Bodies } from 'matter-js';
import { DROP_CONFIG, OBJECT_LEVELS, PHYSICS_CONFIG } from './config';
import type { ObjectLevelConfig } from './types';

export function clampDropX(x: number, radius: number, boardWidth: number) {
  return Math.min(Math.max(x, radius), boardWidth - radius);
}

export function createObjectBody(config: ObjectLevelConfig, x: number, y: number) {
  const body = Bodies.circle(x, y, config.radius, {
    label: `level-${config.level}`,
    restitution: PHYSICS_CONFIG.restitution,
    friction: PHYSICS_CONFIG.friction,
    frictionAir: PHYSICS_CONFIG.frictionAir,
    density: PHYSICS_CONFIG.density,
    render: {
      fillStyle: config.color,
      strokeStyle: '#1f2937',
      lineWidth: 2
    }
  });

  body.plugin = {
    ...body.plugin,
    createdAt: performance.now(),
    level: config.level
  };

  return body;
}

export function getRandomSpawnObject() {
  const spawnableObjects = OBJECT_LEVELS.filter(
    (config) =>
      config.level >= DROP_CONFIG.minSpawnLevel && config.level <= DROP_CONFIG.maxSpawnLevel
  );
  const randomIndex = Math.floor(Math.random() * spawnableObjects.length);

  return spawnableObjects[randomIndex];
}

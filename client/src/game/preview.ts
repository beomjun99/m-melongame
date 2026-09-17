import type { Body } from 'matter-js';

// Swept circle against each existing circle: estimate first contact, not bounce/resting position.
export function predictLandingY(x: number, radius: number, spawnY: number, floorY: number, bodies: readonly Body[]) {
  let landingY = Math.max(spawnY, floorY - radius);
  for (const body of bodies) {
    if (body.isStatic || !body.circleRadius || !body.plugin?.level) continue;
    const combinedRadius = radius + body.circleRadius;
    const dx = x - body.position.x;
    if (Math.abs(dx) > combinedRadius) continue;
    const halfChord = Math.sqrt(Math.max(0, combinedRadius ** 2 - dx ** 2));
    // A circle entirely above the spawn position cannot obstruct downward travel.
    if (body.position.y + halfChord < spawnY) continue;
    landingY = Math.min(landingY, Math.max(spawnY, body.position.y - halfChord));
  }
  return landingY;
}

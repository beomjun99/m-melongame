import assert from 'node:assert/strict';
import { Bodies, Composite, Engine } from 'matter-js';
import { predictLandingY } from '../client/src/game/preview.ts';

const fruit = (x: number, y: number, r: number) => {
  const body = Bodies.circle(x, y, r);
  body.plugin = { level: 2 };
  return body;
};
const engine = Engine.create();
const lower = fruit(210, 530, 30);
const upper = fruit(210, 400, 40);
Composite.add(engine.world, [lower, upper, Bodies.rectangle(210, 596, 420, 40, { isStatic: true })]);
assert.equal(predictLandingY(210, 20, 64, 576, []), 556);
assert.equal(predictLandingY(210, 20, 64, 576, [lower]), 480);
assert.equal(predictLandingY(210, 20, 64, 576, [lower, upper]), 340);
assert.equal(predictLandingY(20, 20, 64, 576, [lower, upper]), 556);
assert.equal(predictLandingY(240, 20, 64, 576, [lower]), 490);
assert.equal(predictLandingY(210, 20, 64, 576, [fruit(210, 70, 30)]), 64);
assert.equal(predictLandingY(210, 20, 64, 576, [fruit(210, -30, 20)]), 556);
const before = Composite.allBodies(engine.world);
const positions = before.map((body) => ({ ...body.position }));
assert.equal(predictLandingY(210, 20, 64, 576, before), 340);
assert.deepEqual(Composite.allBodies(engine.world), before);
assert.deepEqual(before.map((body) => body.position), positions);
Engine.clear(engine);
console.log('PASS: floor, stacked circles, offset contact, overlap, no physics mutation');

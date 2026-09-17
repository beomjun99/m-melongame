import assert from 'node:assert/strict';
import { moveDropX, type MoveDirection } from '../client/src/controls/movement.ts';
import { BOARD_CONFIG, OBJECT_LEVELS } from '../client/src/game/config.ts';
import { CONTROL_CONFIG } from '../client/src/controls/config.ts';

for (const { radius } of OBJECT_LEVELS) {
  const left = radius;
  const right = BOARD_CONFIG.width - radius;
  const move = (x: number, direction: MoveDirection, wrapMovementEnabled = true) => moveDropX({
    x, direction, radius, boardWidth: BOARD_CONFIG.width, step: CONTROL_CONFIG.moveStep, wrapMovementEnabled
  });
  assert.equal(move(left + 1, 'LEFT'), left, 'Reach the wall before wrapping');
  assert.equal(move(left, 'LEFT'), right);
  assert.equal(move(right - 1, 'RIGHT'), right);
  assert.equal(move(right, 'RIGHT'), left);
  assert.equal(move(left, 'RIGHT'), left + CONTROL_CONFIG.moveStep);
  assert.equal(move(right, 'LEFT'), right - CONTROL_CONFIG.moveStep);
  assert.equal(move(left, 'LEFT', false), left);
  assert.equal(move(right, 'RIGHT', false), right);
  for (const direction of ['LEFT', 'RIGHT'] as const) {
    let x = BOARD_CONFIG.width / 2;
    for (let i = 0; i < 500; i++) {
      x = move(x, direction);
      assert.ok(x >= left && x <= right, 'Repeated/held movement stays within radius bounds');
    }
  }
}
console.log('PASS: both wrap directions, reach-wall-first, disabled wrap, all 11 radii, repeated movement');

import assert from 'node:assert/strict';
import { startHoldRepeat } from '../client/src/controls/holdRepeat.ts';
import { CONTROL_CONFIG } from '../client/src/controls/config.ts';
import { moveDropX, type MoveDirection } from '../client/src/controls/movement.ts';

// Deterministic clock exercising the same repeat scheduler as the pointer hook.
let now = 0;
const jobs = new Set<{ at: number; callback: () => void }>();
const schedule = (callback: () => void, delay: number) => {
  const job = { at: now + delay, callback };
  jobs.add(job);
  return () => { jobs.delete(job); };
};
function advance(ms: number) {
  const end = now + ms;
  while (true) {
    const job = [...jobs].filter((item) => item.at <= end).sort((a, b) => a.at - b.at)[0];
    if (!job) break;
    now = job.at;
    jobs.delete(job);
    job.callback();
  }
  now = end;
}

let x = 210;
let stop = startHoldRepeat(() => { x -= CONTROL_CONFIG.moveStep; }, schedule);
assert.equal(x, 204, 'Press should move exactly 6 units immediately');
advance(199);
assert.equal(x, 204, 'Short press should not repeat');
stop();
advance(1000);
assert.equal(x, 204, 'Release must cancel delayed movement');
assert.equal(jobs.size, 0);

stop = startHoldRepeat(() => { x -= CONTROL_CONFIG.moveStep; }, schedule);
advance(200 + 30 * 4);
assert.equal(x, 168, 'Hold should repeat after 200ms and every 30ms');
stop();
advance(1000);
assert.equal(x, 168, 'Release must cancel active repetition');
assert.equal(jobs.size, 0);

stop = startHoldRepeat(() => { x += CONTROL_CONFIG.moveStep; }, schedule);
advance(200);
assert.equal(x, 180, 'A new hold must use its new direction');
stop();
stop();
assert.equal(jobs.size, 0, 'Repeated cancellation must be safe');
for (const direction of ['LEFT', 'RIGHT'] as const) {
  const radius = 22;
  const right = 420 - radius;
  const edge = direction === 'LEFT' ? radius : right;
  const opposite = direction === 'LEFT' ? right : radius;
  x = direction === 'LEFT' ? radius + 18 : right - 18;
  const moveToEdge = (dir: MoveDirection) => {
    x = moveDropX({ x, direction: dir, radius, boardWidth: 420, step: 6, wrapMovementEnabled: true });
    return x > radius && x < right;
  };
  stop = startHoldRepeat(() => moveToEdge(direction), schedule);
  advance(2000);
  assert.equal(x, edge, 'Holding must stop at the first edge, without wrapping');
  assert.equal(jobs.size, 0, 'No repeat timer should remain at the edge');
  stop();
  stop = startHoldRepeat(() => moveToEdge(direction), schedule);
  assert.equal(x, opposite, 'Release and press again must wrap');
  advance(2000);
  assert.equal(x, opposite, 'The new hold must also stop at the opposite edge');
  stop();
}
console.log('PASS: tap, hold timing/cancellation, both edge stops, release-and-press wrap');

import { clampDropX } from '../game/spawn';

export type MoveDirection = 'LEFT' | 'RIGHT';

type MoveOptions = {
  x: number;
  direction: MoveDirection;
  radius: number;
  boardWidth: number;
  step: number;
  wrapMovementEnabled: boolean;
};

export function moveDropX({ x, direction, radius, boardWidth, step, wrapMovementEnabled }: MoveOptions) {
  const left = radius;
  const right = boardWidth - radius;
  const current = clampDropX(x, radius, boardWidth);
  if (wrapMovementEnabled) {
    if (direction === 'LEFT' && current === left) return right;
    if (direction === 'RIGHT' && current === right) return left;
  }
  // First reach the wall; only a subsequent input may wrap.
  return clampDropX(current + (direction === 'LEFT' ? -step : step), radius, boardWidth);
}

import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react';
import { startHoldRepeat } from './holdRepeat';
import type { MoveDirection } from './movement';

export function useHoldMove(disabled: boolean, onMove: (direction: MoveDirection) => boolean) {
  const cancelRepeat = useRef<(() => void) | null>(null);
  const activePointer = useRef<number | null>(null);
  const move = useRef(onMove);
  const blocked = useRef(disabled);

  const stop = useCallback(() => {
    cancelRepeat.current?.();
    cancelRepeat.current = null;
    activePointer.current = null;
  }, []);

  useLayoutEffect(() => {
    move.current = onMove;
    blocked.current = disabled;
    if (disabled) stop();
  }, [disabled, onMove, stop]);

  useEffect(() => {
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      stop();
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', stop);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [stop]);

  const start = (event: PointerEvent<HTMLButtonElement>, direction: MoveDirection) => {
    if (blocked.current || !event.isPrimary || event.button !== 0 || activePointer.current !== null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = event.pointerId;
    cancelRepeat.current = startHoldRepeat(() => {
      if (blocked.current || activePointer.current === null) return false;
      return move.current(direction);
    });
  };

  return { start, stop };
}

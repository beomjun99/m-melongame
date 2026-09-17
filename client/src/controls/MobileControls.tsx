import { useHoldMove } from './useHoldMove';

import type { MoveDirection } from './movement';

type MobileControlsProps = {
  disabled: boolean;
  dropDisabled: boolean;
  onMove: (direction: MoveDirection) => boolean;
  onDrop: () => void;
};

export function MobileControls({ disabled, dropDisabled, onMove, onDrop }: MobileControlsProps) {
  const hold = useHoldMove(disabled, onMove);
  return (
    <div className="mobile-controls" role="group" aria-label="모바일 조작">
      <div className="mobile-move-buttons" role="group" aria-label="낙하 위치 조절">
        {(['LEFT', 'RIGHT'] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            aria-label={direction === 'LEFT' ? '왼쪽으로 이동' : '오른쪽으로 이동'}
            disabled={disabled}
            onPointerDown={(event) => hold.start(event, direction)}
            onPointerUp={hold.stop}
            onPointerCancel={hold.stop}
            onLostPointerCapture={hold.stop}
            onContextMenu={(event) => event.preventDefault()}
            onClick={(event) => {
              // Pointer activation already moved on pointerdown; retain keyboard/AT clicks.
              if (event.detail === 0 && !disabled) onMove(direction);
            }}
          >
            <span aria-hidden="true">{direction === 'LEFT' ? '◀' : '▶'}</span>
          </button>
        ))}
      </div>
      <button type="button" className="mobile-drop-button" disabled={disabled || dropDisabled} onClick={onDrop}>
        DROP
      </button>
      <p>꾹 누르면 끝에서 멈춥니다. 떼고 다시 누르면 반대편으로 이동합니다.</p>
    </div>
  );
}

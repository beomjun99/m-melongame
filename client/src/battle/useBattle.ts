import { useMemo } from 'react';
import type { BattleRoomState } from './battleTypes';
import { getBattleSocketUrl } from './socket';

export function useBattle() {
  return useMemo(
    () => ({
      socketUrl: getBattleSocketUrl(),
      room: null as BattleRoomState | null
    }),
    []
  );
}

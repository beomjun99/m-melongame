import { useState } from 'react';
import { CONTROL_CONFIG } from '../controls/config';

export type MobileControlLayout = 'ARROWS_LEFT' | 'ARROWS_RIGHT';
export type ControlSettings = {
  controlLayout: MobileControlLayout;
  wrapMovementEnabled: boolean;
};

export function useControlSettings() {
  const [settings, setSettings] = useState<ControlSettings>({
    controlLayout: 'ARROWS_LEFT',
    wrapMovementEnabled: CONTROL_CONFIG.wrapMovementEnabled
  });
  const updateSettings = (patch: Partial<ControlSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };
  return { settings, updateSettings };
}

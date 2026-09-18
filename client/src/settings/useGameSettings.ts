import { useCallback, useEffect, useState } from 'react';
import { loadGameSettings, normalizeSettings, saveGameSettings } from './settingsService';
import type { GameSettings } from './types';

export function useGameSettings() {
  const [settings, setSettings] = useState(loadGameSettings);
  useEffect(() => { saveGameSettings(settings); }, [settings]);
  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((current) => normalizeSettings({ ...current, ...patch }));
  }, []);
  return { settings, updateSettings };
}

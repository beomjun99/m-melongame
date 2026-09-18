import { CONTROL_CONFIG } from '../controls/config';
import type { GameSettings } from './types';

export const SETTINGS_STORAGE_KEY = 'm-melongame:game-settings';
export const DEFAULT_GAME_SETTINGS: Readonly<GameSettings> = {
  controlLayout: 'ARROWS_LEFT',
  wrapMovementEnabled: CONTROL_CONFIG.wrapMovementEnabled,
  bgmVolume: 0.8,
  sfxVolume: 0.8
};

type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;
type StorageProvider = () => SettingsStorage;
const browserStorage: StorageProvider = () => window.localStorage;

function volume(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value)) : fallback;
}

export function normalizeSettings(value: unknown): GameSettings {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    controlLayout: data.controlLayout === 'ARROWS_LEFT' || data.controlLayout === 'ARROWS_RIGHT'
      ? data.controlLayout : DEFAULT_GAME_SETTINGS.controlLayout,
    wrapMovementEnabled: typeof data.wrapMovementEnabled === 'boolean'
      ? data.wrapMovementEnabled : DEFAULT_GAME_SETTINGS.wrapMovementEnabled,
    bgmVolume: volume(data.bgmVolume, DEFAULT_GAME_SETTINGS.bgmVolume),
    sfxVolume: volume(data.sfxVolume, DEFAULT_GAME_SETTINGS.sfxVolume)
  };
}

export function loadGameSettings(getStorage: StorageProvider = browserStorage): GameSettings {
  try {
    const raw = getStorage().getItem(SETTINGS_STORAGE_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (saved && typeof saved === 'object' && 'version' in saved && saved.version === 1 && 'settings' in saved) {
      return normalizeSettings(saved.settings);
    }
  } catch {
    // Corrupt data, disabled storage, or unavailable browser: keep playing with defaults.
  }
  return { ...DEFAULT_GAME_SETTINGS };
}

export function saveGameSettings(settings: GameSettings, getStorage: StorageProvider = browserStorage): boolean {
  try {
    getStorage().setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 1, settings: normalizeSettings(settings) }));
    return true;
  } catch {
    // The hook still retains settings in memory if persistence is blocked/full.
    return false;
  }
}

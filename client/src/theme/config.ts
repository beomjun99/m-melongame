import type { ObjectLevel } from '../game/types';
import type { FruitSkin, GameTheme } from './types';

export const THEME_CONFIG = {
  maxImageSizeBytes: 2 * 1024 * 1024,
  acceptedImageMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
} as const;

export const DEFAULT_FRUIT_SKINS: FruitSkin[] = [
  { level: 1, color: '#f97316' },
  { level: 2, color: '#22c55e' },
  { level: 3, color: '#06b6d4' },
  { level: 4, color: '#3b82f6' },
  { level: 5, color: '#8b5cf6' },
  { level: 6, color: '#ec4899' },
  { level: 7, color: '#ef4444' },
  { level: 8, color: '#eab308' },
  { level: 9, color: '#14b8a6' },
  { level: 10, color: '#6366f1' },
  { level: 11, color: '#111827' }
];

export const DEFAULT_THEME: GameTheme = {
  id: 'default',
  name: 'Default',
  fruits: DEFAULT_FRUIT_SKINS
};

export function getFruitSkin(theme: GameTheme, level: ObjectLevel) {
  return theme.fruits.find((skin) => skin.level === level) ?? getDefaultFruitSkin(level);
}

export function getDefaultFruitSkin(level: ObjectLevel) {
  const skin = DEFAULT_FRUIT_SKINS.find((fruitSkin) => fruitSkin.level === level);

  if (!skin) {
    throw new Error(`Missing default fruit skin for level ${level}`);
  }

  return skin;
}

export function mergeThemeWithDefault(theme: GameTheme): GameTheme {
  return {
    ...theme,
    fruits: DEFAULT_FRUIT_SKINS.map((defaultSkin) => ({
      ...defaultSkin,
      ...theme.fruits.find((skin) => skin.level === defaultSkin.level)
    }))
  };
}

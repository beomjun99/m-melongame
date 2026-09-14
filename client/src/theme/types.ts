import type { ObjectLevel } from '../game/types';

export type FruitSkin = {
  level: ObjectLevel;
  color: string;
  imageUrl?: string;
};

export type GameTheme = {
  id: string;
  name: string;
  fruits: FruitSkin[];
};

export type MobileControlLayout = 'ARROWS_LEFT' | 'ARROWS_RIGHT';
export type ControlSettings = {
  controlLayout: MobileControlLayout;
  wrapMovementEnabled: boolean;
};

export type GameSettings = ControlSettings & {
  bgmVolume: number;
  sfxVolume: number;
};

import { CONTROL_CONFIG } from './config';

type Schedule = (callback: () => void, delay: number) => () => void;

const scheduleTimeout: Schedule = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

export function startHoldRepeat(move: () => void, schedule: Schedule = scheduleTimeout) {
  let active = true;
  let cancel: () => void;
  const repeat = () => {
    if (!active) return;
    move();
    cancel = schedule(repeat, CONTROL_CONFIG.repeatIntervalMs);
  };
  move();
  cancel = schedule(repeat, CONTROL_CONFIG.holdDelayMs);
  return () => {
    active = false;
    cancel();
  };
}

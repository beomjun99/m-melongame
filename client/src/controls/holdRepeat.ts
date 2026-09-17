import { CONTROL_CONFIG } from './config';

type Schedule = (callback: () => void, delay: number) => () => void;

const scheduleTimeout: Schedule = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

// Returning false means this hold has reached its boundary and must await a new press.
export function startHoldRepeat(move: () => boolean | void, schedule: Schedule = scheduleTimeout) {
  let active = true;
  let cancel = () => {};
  const step = () => {
    if (move() === false) active = false;
  };
  const repeat = () => {
    if (!active) return;
    step();
    if (active) cancel = schedule(repeat, CONTROL_CONFIG.repeatIntervalMs);
  };
  step();
  if (active) cancel = schedule(repeat, CONTROL_CONFIG.holdDelayMs);
  return () => {
    active = false;
    cancel();
  };
}

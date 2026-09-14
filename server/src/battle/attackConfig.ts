const MIN_ATTACK_LEVEL = 2;
const MAX_ATTACK_LEVEL = 5;

export function getAttackLevel(mergedLevel: number) {
  if (!Number.isInteger(mergedLevel) || mergedLevel < MIN_ATTACK_LEVEL || mergedLevel > MAX_ATTACK_LEVEL) {
    return null;
  }

  return mergedLevel;
}

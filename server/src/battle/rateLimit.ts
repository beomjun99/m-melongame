const MERGE_RATE_LIMIT_WINDOW_MS = 3000;
const MERGE_RATE_LIMIT_MAX_EVENTS = 12;

const mergeEventTimestampsBySocketId = new Map<string, number[]>();

export function checkMergeRateLimit(socketId: string, now = Date.now()) {
  const windowStartedAt = now - MERGE_RATE_LIMIT_WINDOW_MS;
  const recentTimestamps = (mergeEventTimestampsBySocketId.get(socketId) ?? [])
    .filter((timestamp) => timestamp > windowStartedAt);

  if (recentTimestamps.length >= MERGE_RATE_LIMIT_MAX_EVENTS) {
    mergeEventTimestampsBySocketId.set(socketId, recentTimestamps);
    return false;
  }

  recentTimestamps.push(now);
  mergeEventTimestampsBySocketId.set(socketId, recentTimestamps);
  return true;
}

export function clearMergeRateLimit(socketId: string) {
  mergeEventTimestampsBySocketId.delete(socketId);
}

import type { ObjectLevel } from '../game/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export type RankingEntry = {
  rank: number;
  nickname: string;
  score: number;
  maxLevel: ObjectLevel;
  level11Count: number;
  playedAt: string;
};

export type GameResultEntry = Omit<RankingEntry, 'rank'> & {
  id: string;
};

export type SaveResultInput = {
  nickname: string;
  score: number;
  maxLevel: ObjectLevel;
  level11Count: number;
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function saveGameResult(input: SaveResultInput) {
  return requestJson<{ result: GameResultEntry }>('/api/results', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function getRankings() {
  return requestJson<{ rankings: RankingEntry[] }>('/api/rankings');
}

export async function getUserResults(nickname: string) {
  return requestJson<{ results: GameResultEntry[] }>(
    `/api/users/${encodeURIComponent(nickname)}/results`
  );
}

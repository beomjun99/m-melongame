import type { ObjectLevel } from '../game/types';
import type { GameTheme } from '../theme/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function resolveAssetUrl(imageUrl: string | undefined) {
  if (!imageUrl?.startsWith('/')) {
    return imageUrl;
  }

  return new URL(imageUrl, API_BASE_URL || window.location.origin).toString();
}

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
  const isFormData = options?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: isFormData
      ? options?.headers
      : {
          'Content-Type': 'application/json',
          ...options?.headers
        },
    ...options
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;

    try {
      const errorBody = await response.json() as { error?: unknown };

      if (typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // Keep the HTTP status fallback when the response is not JSON.
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

function normalizeTheme(theme: GameTheme): GameTheme {
  return {
    ...theme,
    fruits: theme.fruits.map((skin) => ({
      ...skin,
      imageUrl: resolveAssetUrl(skin.imageUrl)
    }))
  };
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

export async function getDefaultTheme() {
  const response = await requestJson<{ theme: GameTheme }>('/api/themes/default');

  return {
    theme: normalizeTheme(response.theme)
  };
}

export async function getThemes() {
  const response = await requestJson<{ themes: GameTheme[] }>('/api/themes');

  return {
    themes: response.themes.map(normalizeTheme)
  };
}

export async function createTheme(name: string) {
  const response = await requestJson<{ theme: GameTheme }>('/api/themes', {
    method: 'POST',
    body: JSON.stringify({ name })
  });

  return {
    theme: normalizeTheme(response.theme)
  };
}

export async function deleteTheme(themeId: string) {
  const response = await fetch(`${API_BASE_URL}/api/themes/${encodeURIComponent(themeId)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;

    try {
      const errorBody = await response.json() as { error?: unknown };

      if (typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // Keep the HTTP status fallback when the response is not JSON.
    }

    throw new Error(errorMessage);
  }
}

export async function uploadThemeImage(themeId: string, level: ObjectLevel, file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await requestJson<{ theme: GameTheme }>(`/api/themes/${encodeURIComponent(themeId)}/images/${level}`, {
    method: 'POST',
    body: formData
  });

  return {
    theme: normalizeTheme(response.theme)
  };
}

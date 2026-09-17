import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ObjectLevel } from '../game/types';
import {
  createTheme,
  deleteTheme as deleteThemeRequest,
  getDefaultTheme,
  getThemes,
  uploadThemeImage
} from '../services/api';
import { DEFAULT_THEME, mergeThemeWithDefault } from './config';
import type { GameTheme } from './types';
import { preloadThemeImages } from './imageCache';

const SELECTED_THEME_STORAGE_KEY = 'm-melongame:selected-theme-id';

export function useThemeManager() {
  const [theme, setTheme] = useState<GameTheme>(DEFAULT_THEME);
  const [savedThemes, setSavedThemes] = useState<GameTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applyTheme = useCallback((nextTheme: GameTheme) => {
    const mergedTheme = mergeThemeWithDefault(nextTheme);

    setTheme(mergedTheme);
    setSelectedThemeId(mergedTheme.id);
    window.localStorage.setItem(SELECTED_THEME_STORAGE_KEY, mergedTheme.id);
  }, []);

  const refreshThemes = useCallback(async () => {
    const response = await getThemes();
    const themes = response.themes.map(mergeThemeWithDefault);

    setSavedThemes(themes);
    return themes;
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialTheme() {
      try {
        const themes = await refreshThemes();
        const storedThemeId = window.localStorage.getItem(SELECTED_THEME_STORAGE_KEY);
        const storedTheme = storedThemeId ? themes.find((savedTheme) => savedTheme.id === storedThemeId) : null;
        const latestCompleteTheme = themes.find((savedTheme) => savedTheme.fruits.every((skin) => Boolean(skin.imageUrl)));
        const themeToApply = storedTheme ?? latestCompleteTheme;

        if (isActive && themeToApply) {
          await preloadThemeImages(themeToApply.fruits.flatMap((skin) => skin.imageUrl ? [skin.imageUrl] : []));
          if (!isActive) return;
          applyTheme(themeToApply);
          return;
        }

        const defaultThemeResponse = await getDefaultTheme();
        await preloadThemeImages(defaultThemeResponse.theme.fruits.flatMap((skin) => skin.imageUrl ? [skin.imageUrl] : []));

        if (isActive) {
          setTheme(mergeThemeWithDefault(defaultThemeResponse.theme));
          setSelectedThemeId(defaultThemeResponse.theme.id);
        }
      } catch {
        if (isActive) {
          setTheme(DEFAULT_THEME);
          setSelectedThemeId(DEFAULT_THEME.id);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadInitialTheme();

    return () => {
      isActive = false;
    };
  }, [applyTheme, refreshThemes]);

  const saveTheme = useCallback(async (name: string, filesByLevel: Map<number, File>) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const createdTheme = await createTheme(name);
      let nextTheme = createdTheme.theme;

      for (const [level, file] of filesByLevel) {
        const response = await uploadThemeImage(nextTheme.id, level as ObjectLevel, file);
        nextTheme = mergeThemeWithDefault(response.theme);
      }

      applyTheme(nextTheme);
      setSavedThemes((currentThemes) => [
        nextTheme,
        ...currentThemes.filter((savedTheme) => savedTheme.id !== nextTheme.id)
      ]);
      void refreshThemes();
      setMessage('스킨을 저장했습니다.');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setMessage(`스킨 저장에 실패했습니다. ${errorMessage}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [applyTheme, refreshThemes]);

  const loadTheme = useCallback((themeId: string) => {
    const nextTheme = savedThemes.find((savedTheme) => savedTheme.id === themeId);

    if (!nextTheme) {
      setMessage('선택한 라인업을 찾을 수 없습니다.');
      return;
    }

    applyTheme(nextTheme);
    setMessage(`${nextTheme.name} 라인업을 불러왔습니다.`);
  }, [applyTheme, savedThemes]);

  const removeTheme = useCallback(async (themeId: string) => {
    const themeToDelete = savedThemes.find((savedTheme) => savedTheme.id === themeId);

    if (!themeToDelete) {
      setMessage('삭제할 라인업을 찾을 수 없습니다.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await deleteThemeRequest(themeId);
      const nextThemes = await refreshThemes();
      const nextTheme = nextThemes.find((savedTheme) => savedTheme.id === selectedThemeId)
        ?? nextThemes.find((savedTheme) => savedTheme.fruits.every((skin) => Boolean(skin.imageUrl)))
        ?? null;

      if (themeId === selectedThemeId) {
        if (nextTheme) {
          applyTheme(nextTheme);
        } else {
          setTheme(DEFAULT_THEME);
          setSelectedThemeId(DEFAULT_THEME.id);
          window.localStorage.removeItem(SELECTED_THEME_STORAGE_KEY);
        }
      }

      setMessage(`${themeToDelete.name} 라인업을 삭제했습니다.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setMessage(`라인업 삭제에 실패했습니다. ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [applyTheme, refreshThemes, savedThemes, selectedThemeId]);

  return useMemo(() => ({
    clearMessage: () => setMessage(null),
    isSaving,
    isLoading,
    loadTheme,
    message,
    refreshThemes,
    removeTheme,
    saveTheme,
    savedThemes,
    selectedThemeId,
    theme
  }), [
    isSaving,
    isLoading,
    loadTheme,
    message,
    refreshThemes,
    removeTheme,
    saveTheme,
    savedThemes,
    selectedThemeId,
    theme
  ]);
}

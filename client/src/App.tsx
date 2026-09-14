import { useCallback, useEffect, useState } from 'react';
import { BattleLobby } from './components/BattleLobby';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { Ranking } from './components/Ranking';
import { RestartConfirmModal } from './components/RestartConfirmModal';
import { GameSidePanel, ScoreBoard } from './components/ScoreBoard';
import { StartScreen } from './components/StartScreen';
import { ThemeSettings } from './components/ThemeSettings';
import { BOARD_CONFIG } from './game/config';
import { getRandomSpawnObject } from './game/spawn';
import type { GameMode, GameState, MergeResult, ObjectLevel, ObjectLevelConfig } from './game/types';
import { createTheme, deleteTheme, getDefaultTheme, getRankings, getThemes, saveGameResult, uploadThemeImage, type RankingEntry } from './services/api';
import { DEFAULT_THEME, mergeThemeWithDefault } from './theme/config';
import type { GameTheme } from './theme/types';

const SELECTED_THEME_STORAGE_KEY = 'm-melongame:selected-theme-id';

export default function App() {
  const [currentObject, setCurrentObject] = useState(() => getRandomSpawnObject());
  const [upcomingObject, setUpcomingObject] = useState(() => getRandomSpawnObject());
  const [gameState, setGameState] = useState<GameState>('READY');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [gameId, setGameId] = useState(0);
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState<ObjectLevel>(currentObject.level);
  const [level11Count, setLevel11Count] = useState(0);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [showStartRankings, setShowStartRankings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);
  const [theme, setTheme] = useState<GameTheme>(DEFAULT_THEME);
  const [savedThemes, setSavedThemes] = useState<GameTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  const loadRankings = useCallback(async () => {
    setIsRankingLoading(true);
    setRankingError(null);

    try {
      const response = await getRankings();
      setRankings(response.rankings);
    } catch {
      setRankingError('Rankings are unavailable. Check the API server and database connection.');
    } finally {
      setIsRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  const applyTheme = useCallback((nextTheme: GameTheme) => {
    const mergedTheme = mergeThemeWithDefault(nextTheme);

    setTheme(mergedTheme);
    setSelectedThemeId(mergedTheme.id);
    window.localStorage.setItem(SELECTED_THEME_STORAGE_KEY, mergedTheme.id);
  }, []);

  const loadThemes = useCallback(async () => {
    const response = await getThemes();
    const themes = response.themes.map(mergeThemeWithDefault);

    setSavedThemes(themes);

    return themes;
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialTheme() {
      try {
        const themes = await loadThemes();
        const storedThemeId = window.localStorage.getItem(SELECTED_THEME_STORAGE_KEY);
        const storedTheme = storedThemeId ? themes.find((savedTheme) => savedTheme.id === storedThemeId) : null;
        const latestCompleteTheme = themes.find((savedTheme) => savedTheme.fruits.every((skin) => Boolean(skin.imageUrl)));
        const themeToApply = storedTheme ?? latestCompleteTheme;

        if (isActive && themeToApply) {
          applyTheme(themeToApply);
          return;
        }

        const defaultThemeResponse = await getDefaultTheme();

        if (isActive) {
          setTheme(mergeThemeWithDefault(defaultThemeResponse.theme));
          setSelectedThemeId(defaultThemeResponse.theme.id);
        }
      } catch {
        if (isActive) {
          setTheme(DEFAULT_THEME);
          setSelectedThemeId(DEFAULT_THEME.id);
        }
      }
    }

    void loadInitialTheme();

    return () => {
      isActive = false;
    };
  }, [applyTheme, loadThemes]);

  const handleMerge = useCallback((result: MergeResult) => {
    setScore((currentScore) => currentScore + result.score);
    setMaxLevel((currentMaxLevel) => Math.max(currentMaxLevel, result.level) as ObjectLevel);

    if (result.level === 11) {
      setLevel11Count((currentCount) => currentCount + 1);
    }
  }, []);

  const handleObjectDropped = useCallback((object: ObjectLevelConfig) => {
    setMaxLevel((currentMaxLevel) => Math.max(currentMaxLevel, object.level) as ObjectLevel);
    setCurrentObject(upcomingObject);
    setUpcomingObject(getRandomSpawnObject());
  }, [upcomingObject]);

  const handleGameOver = useCallback(() => {
    setGameState('GAME_OVER');
  }, []);

  const handlePause = useCallback(() => {
    setGameState('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const resetGame = useCallback(() => {
    const freshCurrentObject = getRandomSpawnObject();

    setCurrentObject(freshCurrentObject);
    setUpcomingObject(getRandomSpawnObject());
    setGameId((currentGameId) => currentGameId + 1);
    setScore(0);
    setMaxLevel(freshCurrentObject.level);
    setLevel11Count(0);
    setSaveMessage(null);
  }, []);

  const handleStartSingleGame = useCallback(() => {
    setSelectedMode('SINGLE');
    resetGame();
    setGameState('PLAYING');
  }, [resetGame]);

  const handleSelectBattleMode = useCallback(() => {
    setSelectedMode('BATTLE');
    setGameState('READY');
  }, []);

  const handleOpenThemeSettings = useCallback(() => {
    setIsThemeSettingsOpen(true);
    setThemeMessage(null);
    void loadThemes();
    setGameState('READY');
  }, [loadThemes]);

  const handleRestart = useCallback(() => {
    resetGame();
    setGameState('PLAYING');
    setIsRestartConfirmOpen(false);
  }, [resetGame]);

  const handleRequestRestart = useCallback(() => {
    setIsRestartConfirmOpen(true);
  }, []);

  const handleGoToTitle = useCallback(() => {
    resetGame();
    setSelectedMode(null);
    setIsThemeSettingsOpen(false);
    setGameState('READY');
  }, [resetGame]);

  const handleSaveTheme = useCallback(
    async (name: string, filesByLevel: Map<number, File>) => {
      setIsSavingTheme(true);
      setThemeMessage(null);

      try {
        const createdTheme = await createTheme(name);
        let nextTheme = createdTheme.theme;

        for (const [level, file] of filesByLevel) {
          const response = await uploadThemeImage(nextTheme.id, level as ObjectLevel, file);
          nextTheme = mergeThemeWithDefault(response.theme);
        }

        setTheme(nextTheme);
        setSelectedThemeId(nextTheme.id);
        window.localStorage.setItem(SELECTED_THEME_STORAGE_KEY, nextTheme.id);
        setSavedThemes((currentThemes) => [
          nextTheme,
          ...currentThemes.filter((savedTheme) => savedTheme.id !== nextTheme.id)
        ]);
        void loadThemes();
        setThemeMessage('스킨을 저장했습니다.');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        setThemeMessage(`스킨 저장에 실패했습니다. ${message}`);
        return false;
      } finally {
        setIsSavingTheme(false);
      }
    },
    [loadThemes]
  );

  const handleLoadTheme = useCallback((themeId: string) => {
    const nextTheme = savedThemes.find((savedTheme) => savedTheme.id === themeId);

    if (!nextTheme) {
      setThemeMessage('선택한 라인업을 찾을 수 없습니다.');
      return;
    }

    applyTheme(nextTheme);
    setThemeMessage(`${nextTheme.name} 라인업을 불러왔습니다.`);
  }, [applyTheme, savedThemes]);

  const handleDeleteTheme = useCallback(async (themeId: string) => {
    const themeToDelete = savedThemes.find((savedTheme) => savedTheme.id === themeId);

    if (!themeToDelete) {
      setThemeMessage('삭제할 라인업을 찾을 수 없습니다.');
      return;
    }

    setIsSavingTheme(true);
    setThemeMessage(null);

    try {
      await deleteTheme(themeId);
      const nextThemes = await loadThemes();
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

      setThemeMessage(`${themeToDelete.name} 라인업을 삭제했습니다.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setThemeMessage(`라인업 삭제에 실패했습니다. ${message}`);
    } finally {
      setIsSavingTheme(false);
    }
  }, [applyTheme, loadThemes, savedThemes, selectedThemeId]);

  const handleSaveResult = useCallback(
    async (nickname: string) => {
      const trimmedNickname = nickname.trim();

      if (!trimmedNickname) {
        setSaveMessage('Enter a nickname first.');
        return;
      }

      setIsSavingResult(true);
      setSaveMessage(null);

      try {
        await saveGameResult({
          nickname: trimmedNickname,
          score,
          maxLevel,
          level11Count
        });
        setSaveMessage('Score saved.');
        await loadRankings();
      } catch {
        setSaveMessage('Could not save score. Check the API server and database connection.');
      } finally {
        setIsSavingResult(false);
      }
    },
    [level11Count, loadRankings, maxLevel, score]
  );

  return (
    <main className="app-shell">
      {gameState === 'READY' && isThemeSettingsOpen ? (
        <ThemeSettings
          theme={theme}
          savedThemes={savedThemes}
          selectedThemeId={selectedThemeId}
          isSaving={isSavingTheme}
          message={themeMessage}
          onBack={handleGoToTitle}
          onDeleteTheme={handleDeleteTheme}
          onLoadTheme={handleLoadTheme}
          onSave={handleSaveTheme}
        />
      ) : gameState === 'READY' && selectedMode !== 'BATTLE' ? (
        <StartScreen
          rankings={rankings}
          isRankingLoading={isRankingLoading}
          rankingError={rankingError}
          showRankings={showStartRankings}
          onRefreshRankings={loadRankings}
          onStartSingleGame={handleStartSingleGame}
          onSelectBattleMode={handleSelectBattleMode}
          onOpenThemeSettings={handleOpenThemeSettings}
          onToggleRankings={() => setShowStartRankings((currentValue) => !currentValue)}
        />
      ) : gameState === 'READY' && selectedMode === 'BATTLE' ? (
        <BattleLobby onBackToTitle={handleGoToTitle} />
      ) : (
        <>
          <div className="game-play-layout">
            <div className="game-main-column">
              <ScoreBoard
                highScore={rankings[0]?.score ?? 0}
                score={score}
              />

              <GameBoard
                key={gameId}
                width={BOARD_CONFIG.width}
                height={BOARD_CONFIG.height}
                gameState={gameState}
                currentObject={currentObject}
                theme={theme}
                onGameOver={handleGameOver}
                onMerge={handleMerge}
                onObjectDropped={handleObjectDropped}
              />
            </div>

            <GameSidePanel
              upcomingObject={upcomingObject}
              theme={theme}
              onPause={handlePause}
              onRequestRestart={handleRequestRestart}
            />
          </div>

          <Ranking
            rankings={rankings}
            isLoading={isRankingLoading}
            error={rankingError}
            onRefresh={loadRankings}
          />
        </>
      )}

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={score}
          maxLevel={maxLevel}
          level11Count={level11Count}
          isSaving={isSavingResult}
          saveMessage={saveMessage}
          onRestart={handleRestart}
          onSaveResult={handleSaveResult}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          volume={volume}
          onChangeVolume={setVolume}
          onResume={handleResume}
          onRestart={handleRequestRestart}
          onGoToTitle={handleGoToTitle}
        />
      )}

      {isRestartConfirmOpen && (
        <RestartConfirmModal
          onCancel={() => setIsRestartConfirmOpen(false)}
          onConfirm={handleRestart}
        />
      )}
    </main>
  );
}

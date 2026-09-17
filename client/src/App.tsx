import { useCallback, useEffect, useRef, useState } from 'react';
import { BattleLobby } from './components/BattleLobby';
import type { BattleStartPayload } from './battle/battleTypes';
import { useBattle } from './battle/useBattle';
import { BattleResultModal } from './components/BattleResultModal';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { Ranking } from './components/Ranking';
import { RestartConfirmModal } from './components/RestartConfirmModal';
import { BattleStatusPanel, GameSidePanel, ScoreBoard } from './components/ScoreBoard';
import { StartScreen } from './components/StartScreen';
import { ThemeSettings } from './components/ThemeSettings';
import { BOARD_CONFIG, OBJECT_LEVELS } from './game/config';
import { getRandomSpawnObject } from './game/spawn';
import type { GameMode, GameState, MergeResult, ObjectLevel, ObjectLevelConfig } from './game/types';
import { getRankings, saveGameResult, type RankingEntry } from './services/api';
import { useThemeManager } from './theme/useThemeManager';
import { useAppBack } from './navigation/useAppBack';

function getObjectConfig(level: number) {
  return OBJECT_LEVELS.find((objectConfig) => objectConfig.level === level) ?? null;
}

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
  const lastSentBattleStateRef = useRef<string | null>(null);
  const handledBattleStartRef = useRef<number | null>(null);
  const battle = useBattle({ enabled: selectedMode === 'BATTLE' });
  const themes = useThemeManager();

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

  const handleMerge = useCallback((result: MergeResult) => {
    setScore((currentScore) => currentScore + result.score);
    setMaxLevel((currentMaxLevel) => Math.max(currentMaxLevel, result.level) as ObjectLevel);

    if (result.level === 11) {
      setLevel11Count((currentCount) => currentCount + 1);
    }

    if (selectedMode === 'BATTLE' && result.attackEligible) {
      void battle.sendMerge(result.level);
    }
  }, [battle, selectedMode]);

  const attackFruit = battle.lastAttack
    ? {
        id: battle.lastAttack.id,
        object: getObjectConfig(battle.lastAttack.level)
      }
    : null;
  const validAttackFruit = attackFruit?.object
    ? {
        id: attackFruit.id,
        object: attackFruit.object
      }
    : null;

  const handleObjectDropped = useCallback((object: ObjectLevelConfig) => {
    setMaxLevel((currentMaxLevel) => Math.max(currentMaxLevel, object.level) as ObjectLevel);
    setCurrentObject(upcomingObject);
    setUpcomingObject(getRandomSpawnObject());
  }, [upcomingObject]);

  useEffect(() => {
    if (selectedMode !== 'BATTLE' || !battle.room?.roomId || (battle.room.status !== 'PLAYING' && battle.room.status !== 'FINISHED')) {
      return;
    }

    const isGameOver = gameState === 'GAME_OVER';
    const battleStateKey = `${battle.room.roomId}:${score}:${maxLevel}:${isGameOver}`;

    if (lastSentBattleStateRef.current === battleStateKey) {
      return;
    }

    lastSentBattleStateRef.current = battleStateKey;
    void battle.sendState({
      score,
      maxLevel,
      gameOver: isGameOver
    });
  }, [battle, gameState, maxLevel, score, selectedMode]);

  useEffect(() => {
    if (selectedMode === 'BATTLE' && battle.result) {
      setGameState('GAME_OVER');
    }
  }, [battle.result, selectedMode]);

  useEffect(() => {
    if (selectedMode === 'BATTLE' && battle.pauseSignal) {
      setGameState('PAUSED');
    }
  }, [battle.pauseSignal, selectedMode]);

  useEffect(() => {
    if (selectedMode === 'BATTLE' && battle.resumeSignal && !battle.result) {
      setGameState('PLAYING');
    }
  }, [battle.result, battle.resumeSignal, selectedMode]);

  const handleGameOver = useCallback(() => {
    if (selectedMode === 'BATTLE') {
      void battle.sendGameOver(score);
    }

    setGameState('GAME_OVER');
  }, [battle, score, selectedMode]);

  const handlePause = useCallback(() => {
    if (selectedMode === 'BATTLE') {
      void battle.sendPause();
      return;
    }

    setGameState('PAUSED');
  }, [battle, selectedMode]);

  const handleResume = useCallback(() => {
    if (selectedMode === 'BATTLE') {
      void battle.sendResume();
      return;
    }

    setGameState('PLAYING');
  }, [battle, selectedMode]);

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

  const handleBattleStart = useCallback((_payload: BattleStartPayload) => {
    resetGame();
    setSelectedMode('BATTLE');
    setGameState('PLAYING');
  }, [resetGame]);

  useEffect(() => {
    if (selectedMode !== 'BATTLE' || !battle.startSignal) {
      return;
    }

    if (handledBattleStartRef.current === battle.startSignal.startedAt) {
      return;
    }

    handledBattleStartRef.current = battle.startSignal.startedAt;
    handleBattleStart(battle.startSignal);
  }, [battle.startSignal, handleBattleStart, selectedMode]);

  const handleOpenThemeSettings = useCallback(() => {
    setIsThemeSettingsOpen(true);
    themes.clearMessage();
    void themes.refreshThemes();
    setGameState('READY');
  }, [themes]);

  const handleRestart = useCallback(() => {
    resetGame();
    setGameState('PLAYING');
    setIsRestartConfirmOpen(false);
  }, [resetGame]);

  const handleRequestRestart = useCallback(() => {
    setIsRestartConfirmOpen(true);
  }, []);

  const handleGoToTitle = useCallback(async () => {
    if (selectedMode === 'BATTLE' && battle.room?.roomId) {
      await battle.leaveRoom(score);
    }

    resetGame();
    setSelectedMode(null);
    setIsThemeSettingsOpen(false);
    setShowStartRankings(false);
    setIsRestartConfirmOpen(false);
    setGameState('READY');
  }, [battle, resetGame, score, selectedMode]);

  const handleRequestBattleRematch = useCallback(() => {
    void battle.requestRematch();
  }, [battle]);

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

  useAppBack(gameState !== 'READY' || isThemeSettingsOpen || selectedMode === 'BATTLE' || showStartRankings, () => {
    if (isRestartConfirmOpen) {
      setIsRestartConfirmOpen(false);
      if (gameState === 'PLAYING') handlePause();
      return true;
    }
    if (gameState === 'PLAYING') {
      handlePause();
      return true;
    }
    if (gameState === 'PAUSED') return true;
    void handleGoToTitle();
    return false;
  });

  if (themes.isLoading) {
    return <main className="app-shell"><p role="status">스킨을 준비하고 있습니다…</p></main>;
  }

  return (
    <main className="app-shell">
      {gameState === 'READY' && isThemeSettingsOpen ? (
        <ThemeSettings
          theme={themes.theme}
          savedThemes={themes.savedThemes}
          selectedThemeId={themes.selectedThemeId}
          isSaving={themes.isSaving}
          message={themes.message}
          onBack={handleGoToTitle}
          onDeleteTheme={themes.removeTheme}
          onLoadTheme={themes.loadTheme}
          onSave={themes.saveTheme}
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
        <BattleLobby
          battle={battle}
          onBackToTitle={handleGoToTitle}
        />
      ) : (
        <>
          <div className="game-play-layout">
            <div className="game-main-column">
              {selectedMode === 'BATTLE' ? (
                <BattleStatusPanel
                  room={battle.room}
                  score={score}
                  maxLevel={maxLevel}
                  isGameOver={gameState === 'GAME_OVER'}
                />
              ) : null}

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
                attackFruit={selectedMode === 'BATTLE' ? validAttackFruit : null}
                theme={themes.theme}
                onGameOver={handleGameOver}
                onMerge={handleMerge}
                onObjectDropped={handleObjectDropped}
              />
            </div>

            <GameSidePanel
              upcomingObject={upcomingObject}
              theme={themes.theme}
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

      {gameState === 'GAME_OVER' && selectedMode === 'BATTLE' && battle.result && (
        <BattleResultModal
          result={battle.result}
          countdown={battle.countdown}
          isRematchPending={Boolean(battle.room?.self?.rematchReady)}
          notice={battle.disconnectNotice?.message ?? null}
          opponentRematchReady={Boolean(battle.room?.opponent?.rematchReady)}
          onGoToLobby={handleGoToTitle}
          onRematch={handleRequestBattleRematch}
        />
      )}

      {gameState === 'GAME_OVER' && selectedMode !== 'BATTLE' && (
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

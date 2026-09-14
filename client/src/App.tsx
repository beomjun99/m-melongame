import { useCallback, useEffect, useState } from 'react';
import { BattleLobby } from './components/BattleLobby';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { Ranking } from './components/Ranking';
import { RestartConfirmModal } from './components/RestartConfirmModal';
import { ScoreBoard } from './components/ScoreBoard';
import { StartScreen } from './components/StartScreen';
import { BOARD_CONFIG } from './game/config';
import { getRandomSpawnObject } from './game/spawn';
import type { GameMode, GameState, MergeResult, ObjectLevel, ObjectLevelConfig } from './game/types';
import { getRankings, saveGameResult, type RankingEntry } from './services/api';

export default function App() {
  const [currentObject, setCurrentObject] = useState(() => getRandomSpawnObject());
  const [upcomingObject, setUpcomingObject] = useState(() => getRandomSpawnObject());
  const [gameState, setGameState] = useState<GameState>('READY');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
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
    setGameState('READY');
  }, [resetGame]);

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
      {gameState === 'READY' && selectedMode !== 'BATTLE' ? (
        <StartScreen
          rankings={rankings}
          isRankingLoading={isRankingLoading}
          rankingError={rankingError}
          showRankings={showStartRankings}
          onRefreshRankings={loadRankings}
          onStartSingleGame={handleStartSingleGame}
          onSelectBattleMode={handleSelectBattleMode}
          onToggleRankings={() => setShowStartRankings((currentValue) => !currentValue)}
        />
      ) : gameState === 'READY' && selectedMode === 'BATTLE' ? (
        <BattleLobby onBackToTitle={handleGoToTitle} />
      ) : (
        <>
          <ScoreBoard
            score={score}
            upcomingObject={upcomingObject}
            maxLevel={maxLevel}
            onPause={handlePause}
            onRequestRestart={handleRequestRestart}
          />

          <GameBoard
            key={gameId}
            width={BOARD_CONFIG.width}
            height={BOARD_CONFIG.height}
            gameState={gameState}
            currentObject={currentObject}
            onGameOver={handleGameOver}
            onMerge={handleMerge}
            onObjectDropped={handleObjectDropped}
          />

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

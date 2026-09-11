import { useCallback, useEffect, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { Ranking } from './components/Ranking';
import { ScoreBoard } from './components/ScoreBoard';
import { BOARD_CONFIG } from './game/config';
import { getRandomSpawnObject } from './game/spawn';
import type { GameState, MergeResult, ObjectLevel, ObjectLevelConfig } from './game/types';
import { getRankings, saveGameResult, type RankingEntry } from './services/api';

export default function App() {
  const [currentObject, setCurrentObject] = useState(() => getRandomSpawnObject());
  const [upcomingObject, setUpcomingObject] = useState(() => getRandomSpawnObject());
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [gameId, setGameId] = useState(0);
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState<ObjectLevel>(currentObject.level);
  const [level11Count, setLevel11Count] = useState(0);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingResult, setIsSavingResult] = useState(false);

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

  const handleRestart = useCallback(() => {
    const freshCurrentObject = getRandomSpawnObject();

    setCurrentObject(freshCurrentObject);
    setUpcomingObject(getRandomSpawnObject());
    setGameState('PLAYING');
    setGameId((currentGameId) => currentGameId + 1);
    setScore(0);
    setMaxLevel(freshCurrentObject.level);
    setLevel11Count(0);
    setSaveMessage(null);
  }, []);

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
      <ScoreBoard score={score} upcomingObject={upcomingObject} maxLevel={maxLevel} />

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
    </main>
  );
}

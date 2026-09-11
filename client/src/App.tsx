import { useCallback, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { ScoreBoard } from './components/ScoreBoard';
import { BOARD_CONFIG } from './game/config';
import { getRandomSpawnObject } from './game/spawn';
import type { GameState, MergeResult, ObjectLevel, ObjectLevelConfig } from './game/types';

export default function App() {
  const [currentObject, setCurrentObject] = useState(() => getRandomSpawnObject());
  const [upcomingObject, setUpcomingObject] = useState(() => getRandomSpawnObject());
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [gameId, setGameId] = useState(0);
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState<ObjectLevel>(currentObject.level);
  const [level11Count, setLevel11Count] = useState(0);

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
  }, []);

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

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={score}
          maxLevel={maxLevel}
          level11Count={level11Count}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}

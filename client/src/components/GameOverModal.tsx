import type { ObjectLevel } from '../game/types';

type GameOverModalProps = {
  score: number;
  maxLevel: ObjectLevel;
  level11Count: number;
  onRestart: () => void;
};

export function GameOverModal({ score, maxLevel, level11Count, onRestart }: GameOverModalProps) {
  return (
    <div className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="game-over-modal">
        <h2 id="game-over-title">Game Over</h2>
        <dl className="result-list">
          <div>
            <dt>Final Score</dt>
            <dd>{score.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Max Level</dt>
            <dd>{maxLevel}</dd>
          </div>
          <div>
            <dt>Level 11 Count</dt>
            <dd>{level11Count}</dd>
          </div>
        </dl>
        <button className="restart-button" type="button" onClick={onRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}

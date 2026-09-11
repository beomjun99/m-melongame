import { useState } from 'react';
import type { ObjectLevel } from '../game/types';

type GameOverModalProps = {
  score: number;
  maxLevel: ObjectLevel;
  level11Count: number;
  isSaving: boolean;
  saveMessage: string | null;
  onRestart: () => void;
  onSaveResult: (nickname: string) => void;
};

export function GameOverModal({
  score,
  maxLevel,
  level11Count,
  isSaving,
  saveMessage,
  onRestart,
  onSaveResult
}: GameOverModalProps) {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveResult(nickname);
  };

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
        <form className="save-result-form" onSubmit={handleSubmit}>
          <label htmlFor="nickname">Nickname</label>
          <div className="save-result-row">
            <input
              id="nickname"
              maxLength={40}
              name="nickname"
              onChange={(event) => setNickname(event.target.value)}
              placeholder="player1"
              type="text"
              value={nickname}
            />
            <button type="submit" disabled={isSaving || nickname.trim().length === 0}>
              Save
            </button>
          </div>
          {saveMessage && <p className="status-message">{saveMessage}</p>}
        </form>
        <button className="restart-button" type="button" onClick={onRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}

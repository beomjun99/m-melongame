import type { ObjectLevelConfig } from '../game/types';
import { getFruitSkin } from '../theme/config';
import type { GameTheme } from '../theme/types';

type ScoreBoardProps = {
  highScore: number;
  score: number;
};

type GameSidePanelProps = {
  upcomingObject: ObjectLevelConfig;
  theme: GameTheme;
  onPause: () => void;
  onRequestRestart: () => void;
};

export function ScoreBoard({
  highScore,
  score
}: ScoreBoardProps) {
  return (
    <section className="score-header" aria-label="Game status">
      <div className="score-card">
        <span className="score-card-label">최고 점수</span>
        <strong>{highScore.toLocaleString()}</strong>
      </div>
      <div className="score-card">
        <span className="score-card-label">현재 점수</span>
        <strong>{score.toLocaleString()}</strong>
      </div>
    </section>
  );
}

export function GameSidePanel({
  upcomingObject,
  theme,
  onPause,
  onRequestRestart
}: GameSidePanelProps) {
  const upcomingSkin = getFruitSkin(theme, upcomingObject.level);

  return (
    <aside className="game-side-panel" aria-label="Next object and controls">
      <div className="side-icon-controls" aria-label="Game controls">
        <button type="button" onClick={onPause} aria-label="일시 정지" title="일시 정지">
          ||
        </button>
        <button type="button" onClick={onRequestRestart} aria-label="게임 다시 시작" title="게임 다시 시작">
          ↻
        </button>
      </div>

      <div className="side-next-panel" aria-label={`Next object level ${upcomingObject.level}`}>
        <span>Next</span>
        <strong
          className="side-next-circle"
          style={{
            backgroundColor: upcomingSkin.color,
            backgroundImage: upcomingSkin.imageUrl ? `url(${upcomingSkin.imageUrl})` : undefined
          }}
        >
          {upcomingObject.level}
        </strong>
      </div>
    </aside>
  );
}

import type { ObjectLevel, ObjectLevelConfig } from '../game/types';

type ScoreBoardProps = {
  score: number;
  upcomingObject: ObjectLevelConfig;
  maxLevel: ObjectLevel;
  onPause: () => void;
  onRequestRestart: () => void;
};

export function ScoreBoard({
  score,
  upcomingObject,
  maxLevel,
  onPause,
  onRequestRestart
}: ScoreBoardProps) {
  return (
    <section className="top-bar" aria-label="Game status">
      <div>
        <span className="label">Score</span>
        <strong>{score.toLocaleString()}</strong>
      </div>
      <div>
        <span className="label">Next</span>
        <div className="next-object-preview" aria-label={`Next object level ${upcomingObject.level}`}>
          <span
            className="next-object-circle"
            style={{
              backgroundColor: upcomingObject.color
            }}
          >
            {upcomingObject.level}
          </span>
          <strong>Level {upcomingObject.level}</strong>
        </div>
      </div>
      <div className="max-level-panel">
        <div>
          <span className="label">Max Level</span>
          <strong>{maxLevel}</strong>
        </div>
        <div className="inline-icon-controls" aria-label="Game controls">
          <button type="button" onClick={onPause} aria-label="일시 정지" title="일시 정지">
            ||
          </button>
          <button type="button" onClick={onRequestRestart} aria-label="게임 다시 시작" title="게임 다시 시작">
            R
          </button>
        </div>
      </div>
    </section>
  );
}

import type { ObjectLevel, ObjectLevelConfig } from '../game/types';

type ScoreBoardProps = {
  score: number;
  upcomingObject: ObjectLevelConfig;
  maxLevel: ObjectLevel;
};

export function ScoreBoard({ score, upcomingObject, maxLevel }: ScoreBoardProps) {
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
      <div>
        <span className="label">Max Level</span>
        <strong>{maxLevel}</strong>
      </div>
    </section>
  );
}

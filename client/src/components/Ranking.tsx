import type { RankingEntry } from '../services/api';

type RankingProps = {
  rankings: RankingEntry[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function Ranking({ rankings, isLoading, error, onRefresh }: RankingProps) {
  return (
    <section className="ranking-panel" aria-label="Rankings">
      <div className="ranking-header">
        <h2>Rankings</h2>
        <button type="button" onClick={onRefresh} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {error && <p className="status-message">{error}</p>}

      <table className="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nickname</th>
            <th>Score</th>
            <th>Max</th>
            <th>L11</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry) => (
            <tr key={`${entry.rank}-${entry.nickname}-${entry.playedAt}`}>
              <td>{entry.rank}</td>
              <td>{entry.nickname}</td>
              <td>{entry.score.toLocaleString()}</td>
              <td>{entry.maxLevel}</td>
              <td>{entry.level11Count}</td>
            </tr>
          ))}
          {!isLoading && rankings.length === 0 && (
            <tr>
              <td colSpan={5}>No rankings yet.</td>
            </tr>
          )}
          {isLoading && (
            <tr>
              <td colSpan={5}>Loading...</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

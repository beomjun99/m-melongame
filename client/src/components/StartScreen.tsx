import { Ranking } from './Ranking';
import type { RankingEntry } from '../services/api';

type StartScreenProps = {
  rankings: RankingEntry[];
  isRankingLoading: boolean;
  rankingError: string | null;
  showRankings: boolean;
  onRefreshRankings: () => void;
  onStartSingleGame: () => void;
  onSelectBattleMode: () => void;
  onToggleRankings: () => void;
};

export function StartScreen({
  rankings,
  isRankingLoading,
  rankingError,
  showRankings,
  onRefreshRankings,
  onStartSingleGame,
  onSelectBattleMode,
  onToggleRankings
}: StartScreenProps) {
  return (
    <section className="start-screen" aria-label="Start screen">
      <div className="title-panel">
        <h1>New 수박게임</h1>
        <div className="how-to-play">
          <h2>게임 방법</h2>
          <p>마우스로 위치를 정하고 클릭해서 오브젝트를 떨어뜨립니다.</p>
          <p>같은 Level끼리 충돌하면 다음 Level로 합쳐지고 점수를 얻습니다.</p>
          <p>오브젝트가 상단 라인 위로 쌓여 잠시 유지되면 게임이 종료됩니다.</p>
        </div>
      </div>

      <nav className="start-menu" aria-label="Main menu">
        <button className="menu-banner primary" type="button" onClick={onStartSingleGame}>
          싱글 플레이
        </button>
        <button className="menu-banner" type="button" onClick={onSelectBattleMode}>
          배틀 모드
        </button>
        <button className="menu-banner" type="button" onClick={onToggleRankings}>
          점수 순위
        </button>
        <button className="menu-banner disabled" type="button" disabled>
          스킨변경
        </button>
        <button className="menu-banner disabled" type="button" disabled>
          상점
        </button>
      </nav>

      {showRankings && (
        <Ranking
          rankings={rankings}
          isLoading={isRankingLoading}
          error={rankingError}
          onRefresh={onRefreshRankings}
        />
      )}
    </section>
  );
}

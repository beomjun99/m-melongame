import type { BattleResultPayload } from '../battle/battleTypes';

type BattleResultModalProps = {
  result: BattleResultPayload;
  notice?: string | null;
  onGoToLobby: () => void;
};

export function BattleResultModal({ result, notice, onGoToLobby }: BattleResultModalProps) {
  return (
    <div className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="battle-result-title">
      <div className="game-over-modal">
        <h2 id="battle-result-title">BATTLE RESULT</h2>
        {notice ? <p className="battle-result-notice">{notice}</p> : null}
        <p className={`battle-result-outcome ${result.outcome.toLowerCase()}`}>{result.outcome}</p>
        <dl className="result-list">
          <div>
            <dt>내 점수</dt>
            <dd>{result.selfScore.toLocaleString()}</dd>
          </div>
          <div>
            <dt>상대 점수</dt>
            <dd>{result.opponentScore.toLocaleString()}</dd>
          </div>
          <div>
            <dt>승자</dt>
            <dd>{result.winnerNickname}</dd>
          </div>
        </dl>
        <button className="restart-button" type="button" onClick={onGoToLobby}>
          로비로
        </button>
      </div>
    </div>
  );
}

import type { BattleResultPayload } from '../battle/battleTypes';

type BattleResultModalProps = {
  result: BattleResultPayload;
  notice?: string | null;
  countdown?: 3 | 2 | 1 | 'START' | null;
  isRematchPending?: boolean;
  opponentRematchReady?: boolean;
  onGoToLobby: () => void;
  onRematch: () => void;
};

export function BattleResultModal({
  result,
  notice,
  countdown,
  isRematchPending = false,
  opponentRematchReady = false,
  onGoToLobby,
  onRematch
}: BattleResultModalProps) {
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
        {isRematchPending ? (
          <p className="battle-result-notice">
            {countdown ? `재경기 시작: ${countdown}` : opponentRematchReady ? '상대도 다시하기를 선택했습니다.' : '상대의 다시하기 선택을 기다리는 중입니다.'}
          </p>
        ) : opponentRematchReady ? (
          <p className="battle-result-notice">상대가 다시하기를 선택했습니다.</p>
        ) : null}
        <button className="restart-button" type="button" disabled={isRematchPending} onClick={onRematch}>
          {isRematchPending ? '재경기 대기 중' : '다시하기'}
        </button>
        <button className="restart-button" type="button" onClick={onGoToLobby}>
          로비로
        </button>
      </div>
    </div>
  );
}

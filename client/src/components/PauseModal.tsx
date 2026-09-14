type PauseModalProps = {
  volume: number;
  onChangeVolume: (volume: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onGoToTitle: () => void;
};

export function PauseModal({
  volume,
  onChangeVolume,
  onResume,
  onRestart,
  onGoToTitle
}: PauseModalProps) {
  return (
    <div className="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="pause-modal">
        <h2 id="pause-title">일시 정지</h2>

        <label className="volume-control" htmlFor="volume">
          <span>볼륨 조절</span>
          <input
            id="volume"
            max="100"
            min="0"
            onChange={(event) => onChangeVolume(Number(event.target.value))}
            type="range"
            value={volume}
          />
          <strong>{volume}</strong>
        </label>

        <section className="pause-help" aria-label="Game description">
          <h3>게임 설명</h3>
          <p>마우스로 위치를 정하고 클릭해서 오브젝트를 떨어뜨립니다.</p>
          <p>같은 Level 오브젝트가 만나면 다음 Level로 합쳐지고 점수를 얻습니다.</p>
          <p>상단 라인 위로 오브젝트가 쌓여 유지되면 게임이 종료됩니다.</p>
        </section>

        <div className="pause-actions">
          <button type="button" onClick={onResume}>
            게임으로 돌아가기
          </button>
          <button type="button" onClick={onRestart}>
            게임 다시 시작
          </button>
          <button type="button" onClick={onGoToTitle}>
            타이틀 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}

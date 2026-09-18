import type { ControlSettings } from '../settings/useControlSettings';

type PauseModalProps = {
  controlSettings: ControlSettings;
  onChangeControlSettings: (patch: Partial<ControlSettings>) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onGoToTitle: () => void;
};

export function PauseModal({
  controlSettings,
  onChangeControlSettings,
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

        <fieldset className="control-settings">
          <legend>컨트롤 설정</legend>
          <label>
            <input type="checkbox" checked={controlSettings.controlLayout === 'ARROWS_LEFT'}
              onChange={(event) => onChangeControlSettings({ controlLayout: event.target.checked ? 'ARROWS_LEFT' : 'ARROWS_RIGHT' })} />
            <span>좌우반전</span>
          </label>
          <p>{controlSettings.controlLayout === 'ARROWS_LEFT'
            ? '왼쪽: ◀ ▶ · 오른쪽: DROP'
            : '왼쪽: DROP · 오른쪽: ◀ ▶'}</p>
          <label>
            <input type="checkbox" checked={controlSettings.wrapMovementEnabled}
              onChange={(event) => onChangeControlSettings({ wrapMovementEnabled: event.target.checked })} />
            <span>화면 끝에서 반대편으로 이동</span>
          </label>
        </fieldset>

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
          <p>모바일에서는 좌우 버튼으로 이동하고 DROP으로 떨어뜨립니다.</p>
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

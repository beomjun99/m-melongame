import { useBattle } from '../battle/useBattle';

type BattleLobbyProps = {
  onBackToTitle: () => void;
};

export function BattleLobby({ onBackToTitle }: BattleLobbyProps) {
  const { connectionStatus, socketUrl } = useBattle();
  const connectionLabel = {
    CONNECTING: '연결 중',
    CONNECTED: '연결됨',
    DISCONNECTED: '연결 끊김'
  }[connectionStatus];

  return (
    <section className="battle-lobby" aria-label="Battle mode">
      <div className="title-panel">
        <h1>배틀 모드</h1>
        <div className="battle-status-panel">
          <span className="label">Socket endpoint</span>
          <strong>{socketUrl}</strong>
          <span className={`socket-status ${connectionStatus.toLowerCase()}`}>{connectionLabel}</span>
        </div>
      </div>

      <nav className="start-menu" aria-label="Battle menu">
        <button className="menu-banner disabled" type="button" disabled>
          방 만들기
        </button>
        <button className="menu-banner disabled" type="button" disabled>
          방 코드로 참가
        </button>
        <button className="menu-banner" type="button" onClick={onBackToTitle}>
          타이틀로
        </button>
      </nav>
    </section>
  );
}

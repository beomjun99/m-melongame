import { useState } from 'react';
import type { useBattle } from '../battle/useBattle';

type BattleLobbyProps = {
  battle: ReturnType<typeof useBattle>;
  onBackToTitle: () => void;
};

export function BattleLobby({ battle, onBackToTitle }: BattleLobbyProps) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const {
    connectionStatus,
    countdown,
    createRoom,
    errorMessage,
    isRoomActionPending,
    joinRoom,
    markReady,
    room,
    socketUrl
  } = battle;
  const connectionLabel = {
    CONNECTING: '연결 중',
    CONNECTED: '연결됨',
    DISCONNECTED: '연결 끊김'
  }[connectionStatus];
  const canSubmit = connectionStatus === 'CONNECTED' && !isRoomActionPending && nickname.trim().length > 0;
  const canReady = room?.status === 'READY' && !room.self?.ready && !isRoomActionPending;

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

      <div className="battle-room-panel">
        <label>
          <span>닉네임</span>
          <input
            type="text"
            maxLength={20}
            value={nickname}
            placeholder="플레이어 이름"
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>

        <button
          className="menu-banner"
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            void createRoom(nickname);
          }}
        >
          방 만들기
        </button>

        <label>
          <span>방 코드</span>
          <input
            type="text"
            maxLength={6}
            value={roomCode}
            placeholder="AB12CD"
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
          />
        </label>

        <button
          className="menu-banner"
          type="button"
          disabled={!canSubmit || roomCode.trim().length === 0}
          onClick={() => {
            void joinRoom(roomCode, nickname);
          }}
        >
          방 코드로 참가
        </button>

        {errorMessage ? <p className="status-message warning">{errorMessage}</p> : null}

        {room ? (
          <div className="battle-room-summary">
            <span className="label">Room Code</span>
            <strong>{room.roomId}</strong>
            <span>상태: {room.status}</span>
            <span>나: {room.self?.nickname ?? '-'} {room.self?.ready ? '(Ready)' : ''}</span>
            <span>상대: {room.opponent?.nickname ?? '대기 중'} {room.opponent?.ready ? '(Ready)' : ''}</span>
            {countdown ? <span className="battle-countdown">{countdown}</span> : null}
          </div>
        ) : null}

        {room ? (
          <button
            className="menu-banner primary"
            type="button"
            disabled={!canReady}
            onClick={() => {
              void markReady();
            }}
          >
            {room.self?.ready ? '준비 완료' : 'Ready'}
          </button>
        ) : null}
      </div>

      <nav className="start-menu" aria-label="Battle menu">
        <button className="menu-banner" type="button" onClick={onBackToTitle}>
          타이틀로
        </button>
      </nav>
    </section>
  );
}

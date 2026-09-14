type RestartConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function RestartConfirmModal({ onCancel, onConfirm }: RestartConfirmModalProps) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="restart-confirm-title">
      <div className="confirm-modal">
        <h2 id="restart-confirm-title">게임을 다시 시작할까요?</h2>
        <p>현재 진행 중인 게임은 저장되지 않고 처음부터 다시 시작됩니다.</p>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel}>
            취소
          </button>
          <button className="danger" type="button" onClick={onConfirm}>
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}

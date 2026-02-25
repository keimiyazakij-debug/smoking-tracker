type Props = {
  message: string;
  onExport: () => void;
  onImport: () => void | Promise<void>;
  onReset: () => void;
};

export function DataManagementCard({ message, onExport, onImport, onReset }: Props) {
  return (
    <section className="settings-card">
      <h3 className="settings-section-title">データ管理</h3>
      <div className="settings-data-actions">
        <button id="exportDataBtn" type="button" className="settings-secondary-btn" onClick={onExport}>
          データをエクスポート
        </button>
        <button id="importDataBtn" type="button" className="settings-secondary-btn" onClick={onImport}>
          データをインポート
        </button>
      </div>
      <button className="settings-danger-btn" onClick={onReset}>
        全データをリセット
      </button>
      {message ? <p className="settings-note">{message}</p> : null}
    </section>
  );
}

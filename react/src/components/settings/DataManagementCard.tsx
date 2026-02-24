import type { ChangeEvent, RefObject } from 'react';

type Props = {
  fileRef: RefObject<HTMLInputElement | null>;
  message: string;
  onExport: () => void;
  onImportClick: () => void;
  onImportChange: (e: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onReset: () => void;
};

export function DataManagementCard({ fileRef, message, onExport, onImportClick, onImportChange, onReset }: Props) {
  return (
    <section className="settings-card">
      <h3 className="settings-section-title">データ管理</h3>
      <div className="settings-data-actions">
        <button id="exportDataBtn" type="button" className="settings-secondary-btn" onClick={onExport}>
          データをエクスポート
        </button>
        <button id="importDataBtn" type="button" className="settings-secondary-btn" onClick={onImportClick}>
          データをインポート
        </button>
        <input ref={fileRef} id="importDataFile" type="file" accept="application/json,.json" hidden onChange={onImportChange} />
      </div>
      <button className="settings-danger-btn" onClick={onReset}>
        全データをリセット
      </button>
      {message ? <p className="settings-note">{message}</p> : null}
    </section>
  );
}

import { useEffect, useState } from 'react';

export function Header() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    if (!isHelpOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsHelpOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHelpOpen]);

  return (
    <>
      <header>
        <div className="title-bar">
          <div className="title-bar-inner">
            <h1 className="header-brand">
              <img src={`${import.meta.env.BASE_URL}smoking_gap_banner.png`} alt="SmokingGap" className="header-banner-img" />
              <button
                id="openHelpBtn"
                type="button"
                className="help-hit-area"
                aria-label="操作ガイドを開く"
                onClick={() => setIsHelpOpen(true)}
              />
            </h1>
          </div>
        </div>
      </header>

      <div
        id="helpModal"
        className={`help-modal ${isHelpOpen ? 'visible' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpTitle"
        onClick={() => setIsHelpOpen(false)}
      >
        <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="help-modal-header">
            <h2 id="helpTitle" className="help-modal-title">操作ガイド</h2>
            <button id="closeHelpBtn" className="help-close-btn" type="button" aria-label="閉じる" onClick={() => setIsHelpOpen(false)}>
              ×
            </button>
          </div>
          <div className="help-modal-body">
            <section className="help-section">
              <h3>このアプリについて</h3>
              <p>喫煙の間隔を可視化し、無理なく間隔改善を続けるための記録アプリです。</p>
            </section>

            <section className="help-section">
              <h3>最初に設定すること</h3>
              <p>まず「設定」画面で、目標本数・通常の就寝時刻・通常の起床時刻を設定してください。</p>
              <p>喫煙間隔の計算では、設定した睡眠時間（就寝〜起床）はカウントされません。</p>
            </section>

            <section className="help-section">
              <h3>記録のしかた</h3>
              <p>「吸った」で現在時刻を記録し、「UNDO」で直前の記録を取り消せます。</p>
              <p>カレンダーの「この日の記録を見る」から、1日の記録を確認・編集できます。</p>
            </section>

            <section className="help-section">
              <h3>画面の見方</h3>
              <p>タイムラインは時間帯別の本数、統計は期間ごとの推移を表示します。</p>
              <p>設定から目標本数や睡眠時間、バックアップ操作が可能です。</p>
            </section>

            <footer className="help-footer">
              <div className="help-footer-item">Version 0.0.1</div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}

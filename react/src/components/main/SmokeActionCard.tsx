type Props = {
  todayCount: number;
  target: number;
  smokeHelp: string;
  showYesterdaySuccessBtn: boolean;
  onAdd: () => void;
  onUndo: () => void;
  onMarkYesterdaySuccess: () => void;
};

export function SmokeActionCard({
  todayCount,
  target: _target,
  smokeHelp,
  showYesterdaySuccessBtn,
  onAdd,
  onUndo,
  onMarkYesterdaySuccess,
}: Props) {
  return (
    <section className="smoke-action card">
      <button className="large-btn" id="smokeBtn" onClick={onAdd}>
        吸った
      </button>
      <div id="smokeHelp" className="smoke-help">{smokeHelp}</div>
      <div className="undo-row">
        <div id="undoSmokeWrap" className="undo-center" style={{ display: todayCount > 0 ? 'block' : 'none' }}>
          <button id="undoSmokeBtn" className="text-link" onClick={onUndo}>直前の記録を戻す</button>
        </div>
      </div>
      <div className="undo-row">
        <div id="yesterdaySuccessWrap" className="undo-center" style={{ display: showYesterdaySuccessBtn ? 'block' : 'none' }}>
          <button id="yesterdaySuccessBtn" className="text-link" onClick={onMarkYesterdaySuccess}>
            昨日は禁煙成功
          </button>
        </div>
      </div>
    </section>
  );
}

// 喫煙ボタン押下時の処理
function addSmoke(time = new Date()) {
  const logs = loadLogs();
  const dayKey = getDateKey();

  if (!logs[dayKey]) {
    logs[dayKey] = [];
  }

  logs[dayKey].push(time.toISOString());

  saveLogs(logs);
  afterLogChanged();
  updateMainDisplay();
}

function saveEdit() {
  const oldDate = currentTimelineDate;
  const dateInput = document.getElementById("editDate");
  if (!dateInput) {
    console.error("editDate not found");
    return;
  }

  const date = dateInput.value;
  if (!date) {
    alert("日付を選択してください");
    return;
  }

  const logs = loadLogs();

  // editTimes（["10:30","14:10"] など）を保存用ISOに変換
  const newTimes = editTimes
    .slice()
    .sort()
    .filter(t => t) // 空文字対策
    .map(t => {
      return new Date(`${date}T${t}:00`).toISOString();
    });

  // 古い日付と新しい日付が違えば古い日付を削除
  if(oldDate !== date) delete logs[oldDate];    

  // 完全上書き
  logs[date] = newTimes;
  saveLogs(logs);

  // 画面更新
  closeEdit();
  closeTimeline();
  afterLogChanged();
  showMessage("修正しました");
}
(function () {

const MEMOS_KEY = "memos";
const LEGACY_DAILY_DATA_KEY = "dailyData";

function loadDailyData() {
  try {
    const rawText = localStorage.getItem(MEMOS_KEY);
    if (rawText === null) return migrateLegacyDailyData();
    const raw = JSON.parse(rawText);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return migrateLegacyDailyData();
    return raw;
  } catch {
    return migrateLegacyDailyData();
  }
}

function saveDailyData(data) {
  const safe = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  localStorage.setItem(MEMOS_KEY, JSON.stringify(safe));
}

function migrateLegacyDailyData() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_DAILY_DATA_KEY) || "{}");
    if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) {
      return {};
    }
    const memos = {};
    Object.keys(legacy).forEach((dateKey) => {
      const memo = typeof legacy[dateKey]?.memo === "string" ? legacy[dateKey].memo : "";
      if (memo.trim().length > 0) {
        memos[dateKey] = memo;
      }
    });
    saveDailyData(memos);
    return memos;
  } catch {
    return {};
  }
}

// 旧API互換: 呼び出し側の破壊的変更を避けるため残す（memo専用構造では実質noop）
function syncCountsFromLogs() {
  return loadDailyData();
}

function getDailyInfo(dateKey) {
  if (!dateKey) return { count: 0, memo: "" };
  const memos = loadDailyData();
  const logs = window.logModel.getLogs();
  return {
    count: Array.isArray(logs?.[dateKey]) ? logs[dateKey].length : 0,
    memo: typeof memos[dateKey] === "string" ? memos[dateKey] : ""
  };
}

function upsertMemo(dateKey, memo) {
  if (!dateKey) return null;
  const data = loadDailyData();
  const normalizedMemo = typeof memo === "string" ? memo : "";
  const hasMemo = normalizedMemo.trim().length > 0;

  if (!hasMemo) {
    delete data[dateKey];
  } else {
    data[dateKey] = normalizedMemo;
  }

  saveDailyData(data);
  return getDailyInfo(dateKey);
}

window.dailyDataModel = {
  loadDailyData,
  saveDailyData,
  syncCountsFromLogs,
  getDailyInfo,
  upsertMemo
};

})();

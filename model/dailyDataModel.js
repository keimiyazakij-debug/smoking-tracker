(function () {

const DAILY_DATA_KEY = "dailyData";

function loadDailyData() {
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_DATA_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    return raw;
  } catch {
    return {};
  }
}

function saveDailyData(data) {
  localStorage.setItem(DAILY_DATA_KEY, JSON.stringify(data || {}));
}

function syncCountsFromLogs(logs = window.common.loadLogs()) {
  const data = loadDailyData();
  const allKeys = new Set([
    ...Object.keys(data),
    ...Object.keys(logs || {})
  ]);

  allKeys.forEach((dateKey) => {
    const times = Array.isArray(logs?.[dateKey]) ? logs[dateKey] : [];
    const current = data[dateKey] && typeof data[dateKey] === "object"
      ? data[dateKey]
      : {};
    const memo = typeof current.memo === "string" ? current.memo : "";
    const hasMemo = memo.trim().length > 0;
    const count = times.length;

    if (count === 0 && !hasMemo) {
      delete data[dateKey];
      return;
    }

    data[dateKey] = { count };
    if (hasMemo) {
      data[dateKey].memo = memo;
    }
  });

  saveDailyData(data);
  return data;
}

function getDailyInfo(dateKey) {
  if (!dateKey) return { count: 0, memo: "" };
  const data = loadDailyData();
  const entry = data[dateKey] || {};
  return {
    count: Number.isInteger(entry.count) ? entry.count : 0,
    memo: typeof entry.memo === "string" ? entry.memo : ""
  };
}

function upsertMemo(dateKey, memo) {
  if (!dateKey) return null;
  const logs = window.common.loadLogs();
  const data = loadDailyData();
  const count = Array.isArray(logs[dateKey]) ? logs[dateKey].length : 0;
  const normalizedMemo = typeof memo === "string" ? memo : "";
  const hasMemo = normalizedMemo.trim().length > 0;

  if (!hasMemo && count === 0) {
    delete data[dateKey];
  } else {
    data[dateKey] = { count };
    if (hasMemo) {
      data[dateKey].memo = normalizedMemo;
    }
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

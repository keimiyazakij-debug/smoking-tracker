#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

function runScript(relativePath, context) {
  const scriptPath = path.join(ROOT, relativePath);
  const code = fs.readFileSync(scriptPath, "utf8");
  vm.runInContext(code, context, { filename: relativePath });
}

function createBaseContext() {
  const localStorage = createLocalStorage();
  const window = {
    localStorage,
    Event: function Event(type) {
      this.type = type;
    },
    dispatchEvent() {},
    setTimeout,
    clearTimeout
  };
  const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    localStorage,
    Event: window.Event,
    window
  });
  context.window = window;
  window.window = window;
  return { context, window, localStorage };
}

function testDailyDataModel() {
  const { context, window, localStorage } = createBaseContext();
  window.common = {
    loadLogs: () => ({
      "2026-02-10": ["2026-02-10T10:00:00.000Z"],
      "2026-02-12": ["2026-02-12T08:00:00.000Z", "2026-02-12T09:00:00.000Z"]
    })
  };

  localStorage.setItem(
    "dailyData",
    JSON.stringify({
      "2026-02-10": { count: 9, memo: "振り返り" },
      "2026-02-11": { count: 3 }
    })
  );

  runScript("model/dailyDataModel.js", context);
  const synced = window.dailyDataModel.syncCountsFromLogs(window.common.loadLogs());

  assert.equal(synced["2026-02-10"].count, 1);
  assert.equal(synced["2026-02-10"].memo, "振り返り");
  assert.equal(synced["2026-02-12"].count, 2);
  assert.equal("2026-02-11" in synced, false);

  window.dailyDataModel.upsertMemo("2026-02-12", "   ");
  let stored = window.dailyDataModel.loadDailyData();
  assert.equal(stored["2026-02-12"].count, 2);
  assert.equal("memo" in stored["2026-02-12"], false);

  window.common.loadLogs = () => ({});
  window.dailyDataModel.upsertMemo("2026-02-12", " ");
  stored = window.dailyDataModel.loadDailyData();
  assert.equal("2026-02-12" in stored, false);
}

function testCalendarModelMemoMerge() {
  const { context, window } = createBaseContext();
  window.common = {
    parseDateKey(dateKey) {
      const [y, m, d] = dateKey.split("-").map(Number);
      return new Date(y, m - 1, d);
    },
    getDateKey(date = new Date()) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },
    loadLogs: () => ({})
  };
  window.settingModel = {
    loadSettings: () => ({ dailyTarget: 10 })
  };
  window.appState = { todayKey: "2026-02-03" };

  runScript("model/calendarModel.js", context);

  const data = window.calendarModel.buildCalendarData(
    [{ date: "2026-02-01", count: 2 }],
    "2026-02-03",
    { "2026-02-02": { count: 0, memo: "メモあり" } }
  );

  assert.equal(data["2026-02-01"].count, 2);
  assert.equal(data["2026-02-02"].count, 0);
  assert.equal(data["2026-02-02"].memo, "メモあり");
  assert.equal(data["2026-02-03"].count, 0);
}

function createTimelineContext() {
  const { context, window } = createBaseContext();
  const elements = {
    timelineTitle: { textContent: "" },
    timelineSummary: { textContent: "" },
    nextTimelineDay: { style: { visibility: "" } }
  };
  const historyCalls = [];

  context.document = {
    getElementById(id) {
      return elements[id] || null;
    }
  };
  window.document = context.document;
  window.history = {
    pushState(...args) {
      historyCalls.push({ type: "pushState", args });
    },
    replaceState(...args) {
      historyCalls.push({ type: "replaceState", args });
    }
  };
  window.location = { pathname: "/" };
  window.showTab = () => {};
  window.messageController = { enqueue: () => {} };
  window.common = {
    isDateLocked: () => false,
    loadLogs: () => ({
      "2026-02-10": ["2026-02-10T10:20:00.000Z"],
      "2026-02-09": ["2026-02-09T08:00:00.000Z"],
      "2026-02-11": []
    }),
    getDateKey(date = new Date()) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },
    parseDateKey(dateKey) {
      const [y, m, d] = dateKey.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
  };
  window.timelineView = {
    setDateKey() {},
    setSelectedSummary() {},
    render() {},
    renderLocked() {}
  };
  return { context, window, historyCalls };
}

function testTimelineQueryRouting() {
  const { context, window, historyCalls } = createTimelineContext();
  runScript("controller/timelineController.js", context);

  window.timelineController.openTimeline("2026-02-10", { updateHistory: true });
  const push = historyCalls.find((c) => c.type === "pushState");
  assert.ok(push, "pushState should be called on openTimeline");
  assert.equal(push.args[2], "/timeline?date=2026-02-10");

  window.timelineController.goPrevDay();
  const replace = historyCalls.find((c) => c.type === "replaceState");
  assert.ok(replace, "replaceState should be called on day navigation");
  assert.equal(replace.args[2], "/timeline?date=2026-02-09");
}

function main() {
  testDailyDataModel();
  testCalendarModelMemoMerge();
  testTimelineQueryRouting();
  console.log("All tests passed.");
}

main();

window.statsModel = {
  // 日別：dateKey ベース
  aggregateDailyByDateKeys(dateKeys) {
    const logs = window.common.loadLogs();
    return dateKeys.map(key => ({
      x: key,
      y: (logs[key] || []).length
    }));
  },

  // 時間帯別：対象期間(dateKeys)のログを hour 集計し、1日あたり平均を返す
  aggregateHourlyByDateKeys(dateKeys) {
    const logs = window.common.loadLogs();

    // 分母：Controller で未来日除外済み
    const days = Math.max(1, dateKeys.length);

    // 0–23 時のバケツ
    const hours = Array.from({ length: 24 }, (_, h) => ({ x: h, y: 0 }));

    // dateKeys に含まれるログだけを hour 集計
    for (const key of dateKeys) {
      (logs[key] || []).forEach(iso => {
        const h = new Date(iso).getHours();
        hours[h].y++;
      });
    }

    // 1日あたり平均（小数1桁）
    for (const o of hours) {
      o.y = Math.round((o.y / days) * 10) / 10;
    }

    return hours;
  }
};

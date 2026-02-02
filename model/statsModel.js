window.statsModel = {
  aggregate({ from, to, unit }) {
    const logsByDate = logModel.getLogs(); // ← 修正点
    const result = {};

    Object.values(logsByDate).forEach(times => {
      if (!Array.isArray(times)) return;

      times.forEach(t => {
        const d = new Date(t);
        if (d < from || d > to) return;

        let key;
        if (unit === 'day') {
          key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        } else {
          key = d.getHours(); // 0–23
        }

        result[key] = (result[key] || 0) + 1;
      });
    });

    return Object.keys(result)
      .sort((a, b) => (unit === 'hour' ? a - b : a.localeCompare(b)))
      .map(k => ({ x: k, y: result[k] }));
  }
};

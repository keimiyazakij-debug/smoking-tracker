/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');

  window.statsView = { render: jest.fn() };
  window.getIsPremium = jest.fn(() => true);
  window.logModel = {
    getLogs: jest.fn(() => {
      try {
        return JSON.parse(localStorage.getItem('dailyLogs') || '{}');
      } catch {
        return {};
      }
    })
  };

  loadBrowserScript('../app/controller/statsController.js');
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.common.isDateLocked = () => false;
  window.statsController._initialized = false;
  window.statsController.state = {
    rangeType: 'week',
    graphType: 'primary',
    baseDate: new Date('2024-01-03T00:00:00')
  };
});

describe('statsController graph switch', () => {
  test('week: primary(日別)とhourly(時間帯合計)を切替できる', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2024-01-01': ['2024-01-01T10:00:00'],
      '2024-01-03': []
    }));

    window.statsController.render();
    let state = window.statsView.render.mock.calls[0][0];
    expect(state.chart.title).toBe('日別本数');

    window.statsController.changeGraph('hourly');
    state = window.statsView.render.mock.calls[1][0];
    expect(state.chart.title).toBe('時間帯別本数（合計）');
    expect(state.chart.values[10]).toBe(1);
    expect(state.showWeekdayButton).toBe(false);
  });

  test('month: weekday切替が可能', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2023-12-10': ['2023-12-10T08:00:00'],
      '2024-01-01': ['2024-01-01T10:00:00', '2024-01-01T11:00:00'],
      '2024-01-02': []
    }));

    window.statsController.state = {
      rangeType: 'month',
      graphType: 'primary',
      baseDate: new Date('2024-01-15T00:00:00')
    };

    window.statsController.changeGraph('weekday');
    const state = window.statsView.render.mock.calls[0][0];
    expect(state.chart.title).toBe('曜日別平均本数');
    expect(state.showWeekdayButton).toBe(true);
    expect(state.summary.showPrev).toBe(true);
  });

  test('month: hourly は時間帯別平均本数を表示する', () => {
    localStorage.setItem('dailyLogs', JSON.stringify({
      '2024-01-01': ['2024-01-01T10:00:00', '2024-01-01T10:30:00'],
      '2024-01-02': [],
    }));

    window.statsController.state = {
      rangeType: 'month',
      graphType: 'hourly',
      baseDate: new Date('2024-01-15T00:00:00')
    };

    window.statsController.render();
    const state = window.statsView.render.mock.calls[0][0];
    expect(state.chart.title).toBe('時間帯別平均本数');
    expect(state.chart.values[10]).toBe(1);
  });

  test('all: 前期間比較なし + primaryは月別(スクロール)', () => {
    const currentMonth = window.common.getDateKey(new Date()).slice(0, 7);
    const prevMonth = (() => {
      const [y, m] = currentMonth.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    localStorage.setItem('dailyLogs', JSON.stringify({
      [`${prevMonth}-01`]: [`${prevMonth}-01T10:00:00`],
      [`${currentMonth}-01`]: [`${currentMonth}-01T10:00:00`, `${currentMonth}-01T12:00:00`]
    }));

    window.statsController.state = {
      rangeType: 'all',
      graphType: 'primary',
      baseDate: new Date('2024-02-10T00:00:00')
    };

    window.statsController.render();

    const state = window.statsView.render.mock.calls[0][0];
    expect(state.showNavigation).toBe(false);
    expect(state.summary.showPrev).toBe(false);
    expect(state.chart.title).toBe('月別本数');
    expect(state.chart.scrollable).toBe(false);
    expect(state.chart.labels.length).toBe(12);
    expect(state.chart.labels[state.chart.labels.length - 1]).toBe(currentMonth);
    expect(state.chart.values[state.chart.labels.length - 1]).toBe(2);
  });

  test('all: 月数が多い場合は横スクロール表示になる', () => {
    const currentMonth = window.common.getDateKey(new Date()).slice(0, 7);
    const curDate = new Date(`${currentMonth}-01T00:00:00`);
    const logs = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(curDate);
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      logs[`${month}-01`] = [`${month}-01T10:00:00`];
    }
    localStorage.setItem('dailyLogs', JSON.stringify(logs));

    window.statsController.state = {
      rangeType: 'all',
      graphType: 'primary',
      baseDate: new Date('2024-12-01T00:00:00')
    };
    window.statsController.render();

    const state = window.statsView.render.mock.calls[0][0];
    expect(state.chart.labels.length).toBe(14);
    expect(state.chart.scrollable).toBe(true);
  });
});

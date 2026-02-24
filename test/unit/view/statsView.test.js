/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}));

  document.body.innerHTML = `
    <div id="stats-title"></div>
    <div id="stats-label"></div>
    <div id="stats-total-highlight"></div>
    <button id="stats-prev"></button>
    <button id="stats-next"></button>
    <button id="range-week"></button>
    <button id="range-month"></button>
    <button id="range-all"></button>
    <button id="graph-daily"></button>
    <button id="graph-hourly"></button>
    <button id="graph-weekday"></button>
    <div id="stats-current-total"></div>
    <div id="stats-current-avg"></div>
    <div id="stats-prev-total"></div>
    <div id="stats-prev-avg"></div>
    <div id="statsFreeNotice"></div>

    <section id="stats-chart-1-section"><h3 id="stats-chart-1-title"></h3><div id="stats-chart-1-wrap" class="stats-chart-wrap"><canvas id="stats-chart-1"></canvas></div></section>
    <section id="stats-chart-2-section"><h3 id="stats-chart-2-title"></h3><div id="stats-chart-2-wrap" class="stats-chart-wrap"><canvas id="stats-chart-2"></canvas></div></section>
    <section id="stats-chart-3-section"><h3 id="stats-chart-3-title"></h3><div id="stats-chart-3-wrap" class="stats-chart-wrap"><canvas id="stats-chart-3"></canvas></div></section>
  `;

  window.Chart = jest.fn((ctx, config) => ({
    data: config.data,
    options: config.options,
    update: jest.fn()
  }));

  loadBrowserScript('../app/view/statsView.js');
});

beforeEach(() => {
  jest.clearAllMocks();
  window.statsView.charts = {};
});

describe('statsView.render', () => {
  test('種別ボタン状態を反映し、チャートは1枚のみ表示', () => {
    window.statsView.render({
      rangeType: 'month',
      graphType: 'hourly',
      graphLabels: { primary: '日別', hourly: '時間帯別', weekday: '曜日別' },
      showWeekdayButton: true,
      title: '期間統計',
      label: '2024-01-01 – 2024-01-31',
      showNavigation: true,
      freeNotice: '',
      summary: {
        total: 10,
        showPrev: true,
        diff: -2,
        percent: '-16.7',
        max: 4,
        maxDate: '2024-01-03',
        min: 0,
        minDate: '2024-01-02'
      },
      chart: { title: '時間帯別本数（合計）', labels: ['10時'], values: [1], yMax: 5, scrollable: false }
    });

    expect(document.getElementById('graph-hourly').classList.contains('is-active')).toBe(true);
    expect(document.getElementById('graph-weekday').disabled).toBe(false);
    expect(document.getElementById('stats-chart-1-section').style.display).toBe('block');
    expect(document.getElementById('stats-chart-2-section').style.display).toBe('none');
    expect(document.getElementById('stats-chart-3-section').style.display).toBe('none');
    expect(window.Chart).toHaveBeenCalledTimes(1);
  });

  test('weekでは曜日別ボタンを無効化する', () => {
    window.statsView.render({
      rangeType: 'week',
      graphType: 'primary',
      graphLabels: { primary: '日別', hourly: '時間帯別', weekday: '曜日別' },
      showWeekdayButton: false,
      title: '期間統計',
      label: 'x',
      showNavigation: true,
      summary: { total: 1, showPrev: true, diff: 0, percent: '0.0', max: 1, maxDate: 'x', min: 1, minDate: 'x' },
      chart: { title: '日別本数', labels: ['01-01'], values: [1], yMax: 5, scrollable: false }
    });

    expect(document.getElementById('graph-weekday').disabled).toBe(true);
  });

  test('bindで種別ボタンがchangeGraphを呼ぶ', () => {
    const controller = {
      movePrev: jest.fn(),
      moveNext: jest.fn(),
      changeRange: jest.fn(),
      changeGraph: jest.fn()
    };

    window.statsView.bind(controller);

    document.getElementById('graph-weekday').disabled = false;
    document.getElementById('graph-daily').click();
    document.getElementById('graph-hourly').click();
    document.getElementById('graph-weekday').click();

    expect(controller.changeGraph).toHaveBeenCalledWith('primary');
    expect(controller.changeGraph).toHaveBeenCalledWith('hourly');
    expect(controller.changeGraph).toHaveBeenCalledWith('weekday');
  });
});

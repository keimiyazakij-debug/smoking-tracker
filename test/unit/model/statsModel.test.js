/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { loadBrowserScript } from '../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/statsModel.js');
});

beforeEach(() => {
  // 固定ログ
  window.logModel = {
    getLogs: jest.fn(() => ({
      '2026-02-01': [
        '2026-02-01T15:00:00.000Z',
        '2026-02-01T15:30:00.000Z'
      ],
      '2026-02-02': [
        '2026-02-02T15:10:00.000Z'
      ],
      '2026-02-03': [] // 明示的に空
    }))
  };
});

describe('statsModel.aggregateDailyByDateKeys', () => {
  test('dateKeys 分の件数が返る', () => {
    const dateKeys = ['2026-02-01', '2026-02-02', '2026-02-03'];

    const result = window.statsModel.aggregateDailyByDateKeys(dateKeys);

    expect(result).toEqual([
      { x: '2026-02-01', y: 2 },
      { x: '2026-02-02', y: 1 },
      { x: '2026-02-03', y: 0 }
    ]);
  });

  test('ログが存在しない日も 0 件で返る', () => {
    const dateKeys = ['2026-02-04'];

    const result = window.statsModel.aggregateDailyByDateKeys(dateKeys);

    expect(result).toEqual([
      { x: '2026-02-04', y: 0 }
    ]);
  });
});

describe('statsModel.aggregateHourlyByDateKeys', () => {
  test('時間帯別平均が正しく計算される', () => {
    const dateKeys = ['2026-02-01', '2026-02-02', '2026-02-03'];

    const result = window.statsModel.aggregateHourlyByDateKeys(dateKeys);

    // 15時台：3本 / 3日 = 1.0
    const hour = new Date('2026-02-01T15:00:00.000Z').getHours();
    const h = result.find(r => r.x === hour);
    expect(h.y).toBe(1.0);

    // 他の時間帯は 0
    const h10 = result.find(r => r.x === 10);
    expect(h10.y).toBe(0);
  });

  test('dateKeys が 1 日でも平均が計算される', () => {
    const dateKeys = ['2026-02-01'];

    const result = window.statsModel.aggregateHourlyByDateKeys(dateKeys);

    // 15時台：2本 / 1日 = 2.0
    const hour = new Date('2026-02-01T15:00:00.000Z').getHours();
    const h = result.find(r => r.x === hour);
    expect(h.y).toBe(2.0);
  });

  test('dateKeys が空でも落ちない', () => {
    const result = window.statsModel.aggregateHourlyByDateKeys([]);

    // 24時間分返る
    expect(result).toHaveLength(24);
    result.forEach(r => {
      expect(r.y).toBe(0);
    });
  });
});

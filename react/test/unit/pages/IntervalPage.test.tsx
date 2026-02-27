import { beforeEach, describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../helpers/renderApp';

describe('IntervalPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('間隔タブでグラフと期間切替が表示される', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/interval' });

    expect(document.getElementById('interval-chart')).not.toBeNull();
    expect(document.body.textContent || '').toContain('喫煙間隔の推移');
    expect(document.body.textContent || '').toContain('直近7日の最長間隔');
    expect(document.getElementById('interval-range-recent7')).not.toBeNull();
    expect(document.getElementById('interval-range-week')).not.toBeNull();
    expect(document.getElementById('interval-range-month')).not.toBeNull();
    expect(document.getElementById('interval-range-all')).not.toBeNull();
    expect(document.body.textContent || '').toContain('最少間隔');
    expect(document.body.textContent || '').toContain('平均間隔');
    expect(document.getElementById('interval-prev')).toBeNull();
    expect(document.getElementById('interval-next')).toBeNull();

    await user.click(document.getElementById('interval-range-month') as HTMLButtonElement);
    expect((document.getElementById('interval-range-month') as HTMLButtonElement).classList.contains('is-active')).toBe(true);
    expect(document.getElementById('interval-prev')).not.toBeNull();
    expect(document.getElementById('interval-next')).toBeNull();
    expect(document.getElementById('interval-period-label')?.textContent || '').toMatch(/^\d{4}\/\d{2}$/);

    await user.click(document.getElementById('interval-prev') as HTMLButtonElement);
    expect(document.getElementById('interval-next')).not.toBeNull();

    await user.click(document.getElementById('interval-range-all') as HTMLButtonElement);
    expect(document.getElementById('interval-prev')).toBeNull();
    expect(document.getElementById('interval-next')).toBeNull();
  });

  test('平均間隔は小数点以下を丸めて表示する', () => {
    const user = userEvent.setup();
    renderApp({
      path: '/interval',
      persisted: {
        logs: {
          '2026-02-23': ['2026-02-23T01:25:00.000'],
          '2026-02-24': ['2026-02-24T01:26:00.000'],
        },
      },
    });

    return user.click(document.getElementById('interval-range-all') as HTMLButtonElement).then(() => {
      const avg = document.querySelectorAll('.interval-summary-metric-value')[1]?.textContent ?? '';
      expect(avg).toMatch(/^\d+:\d{2}$/);
      expect(avg.includes('.')).toBe(false);
    });
  });

  test('無料版で60日より前のデータがある場合は軽い案内を表示する', () => {
    renderApp({
      path: '/interval',
      persisted: {
        logs: {
          '2025-10-01': ['2025-10-01T10:00:00.000Z'],
          '2026-02-24': ['2026-02-24T10:00:00.000Z'],
        },
      },
    });

    expect(document.body.textContent || '').toContain('60日以前はPremiumで閲覧できます');
  });
});

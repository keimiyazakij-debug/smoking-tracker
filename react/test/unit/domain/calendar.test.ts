import { describe, expect, test } from 'vitest';
import { buildCalendarCells } from '../../../src/domain/calendar';

describe('domain/calendar', () => {
  test('月グリッドが7列で構成される', () => {
    const cells = buildCalendarCells(2026, 0, '2026-01-05', {
      '2026-01-01': ['a'],
      '2026-01-02': [],
    });
    expect(cells.length % 7).toBe(0);
  });

  test('状態と本数が反映される', () => {
    const cells = buildCalendarCells(2026, 0, '2026-01-05', {
      '2026-01-01': ['a'],
      '2026-01-02': [],
    });

    const d1 = cells.find((c) => c.dateKey === '2026-01-01');
    const d2 = cells.find((c) => c.dateKey === '2026-01-02');
    expect(d1?.status).toBe('smoke');
    expect(d1?.count).toBe(1);
    expect(d2?.status).toBe('success');
    expect(d2?.count).toBe(0);
  });
});

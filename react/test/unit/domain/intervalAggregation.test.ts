import { describe, expect, test } from 'vitest';
import { buildIntervalStoryState } from '../../../src/domain/interval';

describe('domain/interval aggregation', () => {
  test('週次の最少/平均は未記録日を0分として含めない', () => {
    const state = buildIntervalStoryState(
      'week',
      {
        '2026-02-23': ['2026-02-23T10:00:00.000Z'],
      },
      {
        dailyTarget: 10,
        calendarEvaluation: 'target',
        sleepStart: null,
        sleepEnd: null,
      },
      true,
      new Date('2026-02-24T12:00:00.000Z'),
      new Date('2026-02-24T12:00:00.000Z'),
    );

    expect(state.recent7MinText).not.toBe('0:00');
    expect(state.recent7AvgText).not.toBe('0:00');
  });
});

/**
 * @jest-environment jsdom
 */
import { loadBrowserScript } from '../../../helpers/loadBrowserScript.js';

beforeAll(() => {
  loadBrowserScript('../app/common/common.js');
  loadBrowserScript('../app/model/logModel.js');
});

describe('logModel.addSmoke', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('指定日のログに ISO 文字列が追加される', () => {
    const d = new Date('2026-01-02T10:00:00+09:00');

    logModel.addSmoke(d);

    const logs = logModel.getLogs();
    expect(logs['2026-01-02']).toHaveLength(1);
    expect(logs['2026-01-02'][0])
      .toBe(d.toISOString());
  });

  test('同日に複数回追加できる', () => {
    logModel.addSmoke(new Date('2026-01-02T09:00:00+09:00'));
    logModel.addSmoke(new Date('2026-01-02T10:00:00+09:00'));

    const logs = logModel.getLogs();
    expect(logs['2026-01-02']).toHaveLength(2);
  });

});

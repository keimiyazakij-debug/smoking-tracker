/**
 * @jest-environment jsdom
 */
import fs from 'fs';
import path from 'path';

describe('index.html structure regression', () => {
  function loadIndexDocument() {
    const htmlPath = path.resolve(process.cwd(), '../app/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  test('下部タブ nav は tab 配下ではなく body 直下にある', () => {
    const doc = loadIndexDocument();
    const nav = doc.querySelector('nav');

    expect(nav).not.toBeNull();
    expect(nav.parentElement).toBe(doc.body);
    expect(doc.querySelectorAll('.tab nav').length).toBe(0);
  });

  test('stats タブに controls/chart カードが存在し、nav を内包しない', () => {
    const doc = loadIndexDocument();
    const statsTab = doc.getElementById('stats');

    expect(statsTab).not.toBeNull();
    expect(statsTab.querySelector('.stats-controls-card')).not.toBeNull();
    expect(statsTab.querySelector('.stats-chart-card')).not.toBeNull();
    expect(statsTab.querySelector('nav')).toBeNull();
  });
});


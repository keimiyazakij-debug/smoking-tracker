// helpers/loadBrowserScript.js
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { createInstrumenter } from 'istanbul-lib-instrument';

const instrumenter = createInstrumenter();

export function loadBrowserScript(relativePath, inject = {}) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  // Jest の coverage 集計対象にするため VM 実行コードを計測用に変換
  const instrumentedCode = instrumenter.instrumentSync(code, fullPath);
  const sharedCoverage = globalThis.__coverage__ || {};
  globalThis.__coverage__ = sharedCoverage;

  // jsdom の window を vm に明示的に渡す
  const context = vm.createContext({
    window,
    document: window.document,
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
    URLSearchParams: window.URLSearchParams,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    __coverage__: sharedCoverage,
    ...inject, // ★ ここ
  });

  // globalThis も window に合わせる（安全）
  context.globalThis = context.window;
  context.window.__coverage__ = sharedCoverage;

  vm.runInContext(instrumentedCode, context);
}

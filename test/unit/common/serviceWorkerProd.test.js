/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { jest } from '@jest/globals';

describe('service-worker.prod fetch behavior', () => {
  let handlers;
  let cacheStore;
  let cacheApi;

  function loadServiceWorker() {
    const scriptPath = path.resolve(process.cwd(), '../app/service-worker.prod.js');
    const code = fs.readFileSync(scriptPath, 'utf8');
    vm.runInNewContext(code, {
      self: global.self,
      caches: global.caches,
      fetch: global.fetch,
      console
    }, { filename: scriptPath });
  }

  beforeEach(() => {
    handlers = {};
    cacheStore = {
      add: jest.fn(() => Promise.resolve()),
      put: jest.fn(() => Promise.resolve())
    };
    cacheApi = {
      open: jest.fn(() => Promise.resolve(cacheStore)),
      match: jest.fn(() => Promise.resolve(undefined)),
      keys: jest.fn(() => Promise.resolve([])),
      delete: jest.fn(() => Promise.resolve(true))
    };

    global.self = {
      addEventListener: jest.fn((name, fn) => {
        handlers[name] = fn;
      }),
      skipWaiting: jest.fn(),
      clients: { claim: jest.fn() }
    };
    global.caches = cacheApi;
    global.fetch = jest.fn();

    loadServiceWorker();
  });

  afterEach(() => {
    delete global.self;
    delete global.caches;
    delete global.fetch;
  });

  test('only-if-cached かつ same-origin 以外の request は無視する', () => {
    const event = {
      request: { cache: 'only-if-cached', mode: 'no-cors' },
      respondWith: jest.fn()
    };

    handlers.fetch(event);

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('navigate は network-first で成功時に index を更新する', async () => {
    const networkResponse = {
      clone: jest.fn(() => ({ cloned: true }))
    };
    global.fetch.mockResolvedValue(networkResponse);

    const event = {
      request: { mode: 'navigate', cache: 'default' },
      respondWith: jest.fn()
    };

    handlers.fetch(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    const response = await event.respondWith.mock.calls[0][0];

    expect(response).toBe(networkResponse);
    expect(global.fetch).toHaveBeenCalledWith(event.request);
    expect(cacheApi.open).toHaveBeenCalled();
    expect(cacheStore.put).toHaveBeenCalledWith('./index.html', { cloned: true });
    expect(cacheApi.match).not.toHaveBeenCalled();
  });

  test('navigate で network 失敗時は cache の index を返す', async () => {
    global.fetch.mockRejectedValue(new Error('offline'));
    const cached = { cached: true };
    cacheApi.match.mockResolvedValue(cached);

    const event = {
      request: { mode: 'navigate', cache: 'default' },
      respondWith: jest.fn()
    };

    handlers.fetch(event);

    const response = await event.respondWith.mock.calls[0][0];
    expect(response).toBe(cached);
    expect(cacheApi.match).toHaveBeenCalledWith('./index.html');
  });

  test('install: CACHE_FILES を順に cache.add し skipWaiting する', async () => {
    const event = {
      waitUntil: jest.fn()
    };

    handlers.install(event);
    expect(event.waitUntil).toHaveBeenCalledTimes(1);

    await event.waitUntil.mock.calls[0][0];

    expect(cacheApi.open).toHaveBeenCalledTimes(1);
    expect(cacheStore.add).toHaveBeenCalled();
    const addedPaths = cacheStore.add.mock.calls.map(([p]) => p);
    expect(addedPaths).toContain('./smoking_gap_banner.png');
    expect(addedPaths).toContain('./backimage.JPG');
    expect(global.self.skipWaiting).toHaveBeenCalledTimes(1);
  });
});

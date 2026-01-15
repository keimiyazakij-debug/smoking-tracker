/*
const CACHE_NAME = "smoking-log-v0.0.4";
self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
*/

const CACHE_NAME = "smoking-log-v0.0.6";
const CACHE_FILES = [
  "./",
  "./index.html",
  "./style.css",

  "./config.js",
  "./common.js",

  "./app.js",
  "./mainView.js",
  "./logAction.js",

  "./badgeEngine.js",
  "./badgeView.js",
  "./cheerEngine.js",

  "./manifest.json"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of CACHE_FILES) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn("Cache failed:", url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

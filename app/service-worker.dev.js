// 開発用：一切キャッシュしない
self.addEventListener("install", () => {
  console.log("[SW dev] install");
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("[SW dev] activate");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  // ★ 必ずネットワーク優先
  event.respondWith(fetch(event.request));
});
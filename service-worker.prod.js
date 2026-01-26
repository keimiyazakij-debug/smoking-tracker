const CACHE_NAME = "smoking-log-v1.1.1";
""
const CACHE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",

  // ===== 定数・共通 =====
  "./common/constant.js",
  "./common/common.js",

  // ===== Model =====
  "./model/logModel.js",
  "./model/settingModel.js",
  "./model/editModel.js",
  "./model/dailyTaskModel.js",
  "./model/badgeModel.js",
  "./model/calendarModel.js",
  "./model/cheerModel.js",

  // ===== View =====
  "./view/mainView.js",
  "./view/calendarView.js",
  "./view/timelineView.js",
  "./view/editView.js",
  "./view/dailyTaskView.js",
  "./view/badgeView.js",
  "./view/settingView.js",
  "./view/messageView.js",

  // ===== Controller =====
  "./controller/messageController.js",
  "./controller/mainController.js",
  "./controller/calendarController.js",
  "./controller/timelineController.js",
  "./controller/editController.js",
  "./controller/dailyTaskController.js",
  "./controller/badgeController.js",
  "./controller/settingController.js",
  "./controller/appController.js"
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
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});

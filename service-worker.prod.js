const CACHE_NAME = "smoking-log-v1.3.2";
const APP_SHELL_PATH = "./index.html";
const CACHE_FILES = [
  "./",
  "./index.html",
  "./css/common.css",
  "./css/main.css",
  "./css/calendar.css",
  "./css/timeline.css",
  "./css/edit.css",
  "./css/badges.css",
  "./css/daily-task.css",
  "./css/stats.css",
  "./css/settings.css",
  "./css/premium.css",
  "./help.css",
  "./helpModal.js",
  "./smoking_gap_banner.png",
  "./backimage.JPG",
  "./manifest.json",

  // ===== 定数・共通 =====
  "./common/constant.js",
  "./common/common.js",

  // ===== Model =====
  "./model/logModel.js",
  "./model/dailyDataModel.js",
  "./model/settingModel.js",
  "./model/editModel.js",
  "./model/dailyTaskModel.js",
  "./model/badgeModel.js",
  "./model/calendarModel.js",
  "./model/statsModel.js",

  // ===== View =====
  "./view/mainView.js",
  "./view/calendarView.js",
  "./view/timelineView.js",
  "./view/editView.js",
  "./view/dailyTaskView.js",
  "./view/badgeView.js",
  "./view/settingView.js",
  "./view/messageView.js",
  "./view/statsView.js",
  "./view/premiumView.js",

  // ===== Controller =====
  "./controller/messageController.js",
  "./controller/mainController.js",
  "./controller/calendarController.js",
  "./controller/timelineController.js",
  "./controller/editController.js",
  "./controller/dailyTaskController.js",
  "./controller/badgeController.js",
  "./controller/settingController.js",
  "./controller/statsController.js",
  "./controller/premiumController.js",
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
  const request = event.request;

  // Chrome の仕様: cross-origin な only-if-cached リクエストには respondWith しない
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(APP_SHELL_PATH, copy));
          return response;
        })
        .catch(() => caches.match(APP_SHELL_PATH))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(res => res || fetch(request))
  );
});

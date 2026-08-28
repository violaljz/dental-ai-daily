/* 口腔×AI 文献库 Service Worker —— 网络优先 + 离线回退 */
/* 策略：文献库每日更新，优先拿最新内容，离线时才回退到缓存 */
const CACHE = "dental-ai-daily-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./library.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // network-first：先请求网络拿最新内容，成功则更新缓存；失败（离线）回退缓存
  e.respondWith(
    fetch(e.request).then((resp) => {
      if (resp && resp.status === 200 && e.request.url.startsWith(self.location.origin)) {
        const clone = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});

const CACHE_NAME = "tuition-master-v2.0.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",        // ✅ FIXED: No css/ folder
  "./app.js",            // ✅ FIXED: No js/ folder
  "./manifest.json",
  "./app-config.json",
  "./assets/icon.svg",
  "./data/bd-holidays.json",
  "./data/bd-locations.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.hostname.includes("supabase.co")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: "Offline" }), { headers: { "Content-Type": "application/json" } })));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match("./index.html"));
      return cached || networkFetch;
    })
  );
});

/**
 * ThreadBuddy service worker — offline / standalone PWA support.
 *
 * Strategy: cache-first with background refresh (stale-while-revalidate) for same-origin GET
 * requests. Because the built asset filenames are content-hashed, we cache at runtime rather than
 * from a fixed precache list, so the app keeps working offline after the first visit and updates
 * itself whenever a newer asset is fetched online.
 */

const CACHE = "threadbuddy-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Warm the cache with the app shell entry point.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"]).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      // Serve cache immediately if present; otherwise wait for the network.
      return cached || (await network) || cache.match("./index.html");
    }),
  );
});

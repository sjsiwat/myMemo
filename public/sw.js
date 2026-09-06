/* ============================================================
   Service worker — runtime caching (no hardcoded asset list).
   Vite emits hashed filenames under /assets/ per build, so this
   worker caches opportunistically at runtime instead of precaching:
     - navigations: network-first, cached as a fallback for offline
     - /assets + images/icons: cache-first (immutable, hashed)
     - everything else (incl. Supabase/API calls): network passthrough
   ============================================================ */
const CACHE_NAME = "memo-plus-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isBypassed(url) {
  return (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("line.me")
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/mascot/") ||
    /\.(png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (isBypassed(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Navigations and everything else: network-first, cache as a fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});

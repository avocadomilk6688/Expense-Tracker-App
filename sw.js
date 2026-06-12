// ═══════════════════════════════════════════════════════════════════
//  SERVICE WORKER — Expense Tracker PWA
//  Strategy:
//    - Static assets (app shell): Cache-First
//    - External CDN / Firebase / API requests: Network-First
//  Cache versioning ensures stale assets are cleaned up on update.
// ═══════════════════════════════════════════════════════════════════

const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `expense-tracker-shell-${CACHE_VERSION}`;

// Application shell — all files required to render the UI offline
const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  "/scripts/app.js",
  "/scripts/authController.js",
  "/scripts/categoryEngine.js",
  "/scripts/chartEngine.js",
  "/scripts/currencyService.js",
  "/scripts/filterEngine.js",
  "/scripts/firebaseStore.js",
  "/scripts/localStorage.js",
  "/scripts/recurringEngine.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// External origins that should always go network-first
const NETWORK_FIRST_ORIGINS = [
  "www.gstatic.com",       // Firebase SDKs
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "api.frankfurter.app",   // Live FX rates
  "cdn.jsdelivr.net",      // Chart.js CDN (may update)
];

// ─── INSTALL — Cache the app shell ──────────────────────────────────
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing cache: ${CACHE_NAME}`);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell assets");
      // Use individual requests with error catching so one failure
      // does not abort the entire install
      return Promise.allSettled(
        APP_SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Failed to cache: ${url}`, err.message);
          })
        )
      );
    }).then(() => {
      // Force this SW to become active immediately without waiting for
      // all tabs to close (safe because we version the cache name)
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE — Clean old caches ────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating: ${CACHE_NAME}`);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("expense-tracker-") && name !== CACHE_NAME)
          .map((oldCache) => {
            console.log(`[SW] Deleting old cache: ${oldCache}`);
            return caches.delete(oldCache);
          })
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// ─── FETCH — Routing strategy ────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Network-First: External services (Firebase, FX API, Chart CDN)
  if (NETWORK_FIRST_ORIGINS.some((origin) => url.hostname.includes(origin))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-First: Local app shell assets
  event.respondWith(cacheFirst(request));
});

// ─── STRATEGY: Cache-First ──────────────────────────────────────────
// Serve from cache; fall back to network and update cache entry.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    // Only cache successful responses for same-origin assets
    if (networkResponse.ok && new URL(request.url).origin === self.location.origin) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    console.warn("[SW] Cache-first fetch failed, serving offline fallback:", err.message);
    // Serve the cached index.html as the offline fallback for navigation requests
    if (request.mode === "navigate") {
      const fallback = await cache.match("/index.html");
      if (fallback) return fallback;
    }
    // Return a generic offline response for other failed requests
    return new Response(
      JSON.stringify({ error: "You are offline. Please reconnect." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── STRATEGY: Network-First ────────────────────────────────────────
// Always try the network; fall back to cache on failure.
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (err) {
    console.warn("[SW] Network-first fetch failed, trying cache:", err.message);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    // Nothing cached — return a clear error
    return new Response(
      JSON.stringify({ error: "Network request failed and no cache available." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

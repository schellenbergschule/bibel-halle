const CACHE_NAME = "bibel-halle-v117";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./bible-hall-theme.css?v=081",
  "./assets/logo_bibel-halle.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (
    requestUrl.hostname.includes("firebase") ||
    requestUrl.hostname.includes("googleapis") ||
    requestUrl.hostname.includes("gstatic")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put("./index.html", responseCopy);
          });

          return response;
        })
        .catch(() =>
          caches.match("./index.html").then(
            response => response || caches.match("./")
          )
        )
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseCopy);
        });

        return response;
      });
    })
  );
});

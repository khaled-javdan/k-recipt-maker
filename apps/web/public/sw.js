// Service worker.
//
// This app is signed-in-only and every page is rendered per user, so the rule
// that shapes everything here is: cache build output, never cache a response
// that could carry someone's data. Concretely that means only /_next/static
// (content-hashed, identical for everyone) and the icons are stored. HTML,
// server actions and anything under /_next/image go straight to the network.
//
// The offline page is the one exception: it is a static page with no user data
// on it, precached so a navigation with no network has something to show.

const VERSION = "v1"
const STATIC_CACHE = `static-${VERSION}`
const SHELL_CACHE = `shell-${VERSION}`
const OFFLINE_URL = "/offline"

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // `reload` so a stale HTTP-cached copy is not what gets precached.
      cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })))
    )
  )
  // Deliberately no skipWaiting(): the new worker waits until the user accepts
  // the update toast, so a running session is never swapped out mid-edit.
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

// The update toast asks the waiting worker to take over.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting()
})

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")
  )
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const hit = await cache.match(request)
  if (hit) return hit

  const response = await fetch(request)
  // Only store a clean same-origin hit; an error page cached under a hashed
  // asset URL would survive until the next version bump.
  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener("fetch", (event) => {
  const { request } = event

  // Server actions are POSTs and must never be replayed from a cache.
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const cache = await caches.open(SHELL_CACHE)
          const offline = await cache.match(OFFLINE_URL)
          return offline ?? Response.error()
        }
      })()
    )
    return
  }

  if (isCacheableAsset(url)) {
    event.respondWith(cacheFirst(request))
  }

  // Everything else — RSC payloads, /_next/image, the manifest — is left to
  // the network so a signed-out or switched user never sees a stale response.
})

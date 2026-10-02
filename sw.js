/* MePocket service worker
   - offline: the app's own files are saved on the phone, so it opens without internet
   - online: always fetches the newest files first (GitHub/Vercel updates show up right away),
     and keeps the saved copy fresh for the next offline open
   - Google Fonts are kept after the first load so the Thai font still works offline */
const CACHE = 'mepocket-v1';
const FONT_CACHE = 'mepocket-fonts-v1';
const CORE = [
  './',
  './app.js',
  './styles.css',
  './concept.css',
  './theme.css',
  './manifest.webmanifest',
  './assets/qrcode.min.js',
  './assets/mepocket.svg',
  './assets/mepocket-192.png',
  './assets/mepocket-512.png',
  './assets/apple-touch-icon.png',
  './assets/scb.svg',
  './assets/scb.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    // one missing file must not stop the whole install
    Promise.all(CORE.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE && key !== FONT_CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // fonts: use the saved copy first, they never change
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONT_CACHE).then(cache => cache.match(req).then(hit =>
      hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
    )));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // app files: newest from the network, saved copy when offline
  event.respondWith(fetch(req).then(res => {
    if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => {
    if (hit) return hit;
    if (req.mode === 'navigate') return caches.match('./');
    return Response.error();
  })));
});

/* ---------- notifications (unchanged) ---------- */
self.addEventListener('message', event => {
  if (event.data?.type !== 'POCKET_NOTIFICATION') return;
  const { title, body } = event.data;
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: './assets/mepocket-192.png',
    badge: './assets/mepocket-192.png',
    tag: `pocket-${Date.now()}`,
    renotify: false
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    if (clients[0]) return clients[0].focus();
    return self.clients.openWindow('./');
  }));
});

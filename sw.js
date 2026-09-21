self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
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

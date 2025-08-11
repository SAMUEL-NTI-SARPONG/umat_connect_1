
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options } = event.data.payload;
        const now = Date.now();
        const delay = options.timestamp - now;

        if (delay > 0) {
            setTimeout(() => {
                self.registration.showNotification(title, options);
            }, delay);
        }
    } else if (event.data && event.data.type === 'CLEAR_NOTIFICATIONS') {
        self.registration.getNotifications().then(notifications => {
            notifications.forEach(notification => notification.close());
        });
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            const matchingClient = windowClients.find(wc => wc.url.endsWith(urlToOpen));
            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// A map to keep track of scheduled notification timeouts
const scheduledNotifications = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'SCHEDULE_NOTIFICATION') {
    const { title, options } = payload;
    const delay = options.timestamp - Date.now();
    const notificationId = options.tag; // Use tag as a unique ID

    if (delay > 0) {
      // If a notification with the same ID is already scheduled, cancel it first.
      if (scheduledNotifications.has(notificationId)) {
        clearTimeout(scheduledNotifications.get(notificationId));
        scheduledNotifications.delete(notificationId);
      }

      const timeoutId = setTimeout(() => {
        self.registration.showNotification(title, options);
        scheduledNotifications.delete(notificationId); // Clean up after showing
      }, delay);

      scheduledNotifications.set(notificationId, timeoutId);
    }
  } else if (type === 'CLEAR_NOTIFICATIONS') {
    // Clear all scheduled timeouts
    for (const timeoutId of scheduledNotifications.values()) {
      clearTimeout(timeoutId);
    }
    scheduledNotifications.clear();

    // Close all visible notifications
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => notification.close());
    });
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  const alarmId = event.notification.tag;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientsArr => {
      const hadWindowToFocus = clientsArr.some(windowClient => 
        windowClient.url === urlToOpen ? (windowClient.focus(), true) : false
      );

      if (!hadWindowToFocus) {
        self.clients.openWindow(`${urlToOpen}?alarm_id=${alarmId}`).then(client => client && client.focus());
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
    const notificationId = event.notification.tag;
    if (scheduledNotifications.has(notificationId)) {
        clearTimeout(scheduledNotifications.get(notificationId));
        scheduledNotifications.delete(notificationId);
    }
});

// Basic fetch handler to make the service worker installable.
self.addEventListener('fetch', (event) => {
  // This service worker is for notifications only,
  // so we don't need to intercept fetch requests.
  return;
});

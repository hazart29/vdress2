// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    self.skipWaiting() // Activate immediately
  );
});

// Activate service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    self.clients.claim() // Claim control immediately
  );
});

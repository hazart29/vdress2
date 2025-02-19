const CACHE_NAME = 'media-cache-v1';
const PRECACHE_MEDIA = [
  '/avatar/model.png', // Paths are relative to the public directory
  '/background/gacha/gacha1.svg',
  '/background/shop/3d-fantasy-scene.svg',
  '/backsound/backsound.mp3',
  '/banner/avatar/limitedA.png',
  '/banner/avatar/limitedB.png',
  '/banner/avatar/standardA.png',
  '/banner/avatar/standardB.png',
  '/icons/outfit/A/PoliceA.png',
  '/icons/outfit/A/SeifukuA.png',
  '/icons/outfit/A/ShirtA.png',
  '/icons/outfit/B/MaidB.png',
  '/icons/outfit/B/MikoB.png',
  '/icons/outfit/B/PoliceB.png',
  '/icons/outfit/B/SeifukuB.png',
  '/icons/outfit/B/ShirtB.png',
  '/icons/outfit/C/MaidC.png',
  '/icons/outfit/C/MikoC.png',
  '/icons/outfit/C/PoliceC.png',
  '/icons/outfit/C/SeifukuC.png',
  '/icons/outfit/C/ShirtC.png',
  // ... other media files
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_MEDIA);
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
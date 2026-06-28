self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('reader-store').then((cache) => {
      return cache.addAll([
        '/SpiritualCaress/',
        '/SpiritualCaress/index.html',
        '/SpiritualCaress/style.css',
        '/SpiritualCaress/script.js',
        '/SpiritualCaress/WIcon.png'
      ]);
    })
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});

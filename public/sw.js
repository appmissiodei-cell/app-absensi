// Service worker minimal untuk PWA.
// SENGAJA tidak menyimpan (cache) halaman atau data: aplikasi ini memuat data pribadi
// anggota dan harus selalu mengambil data terbaru dari server. Yang disimpan hanya
// halaman "offline" statis, ditampilkan bila perangkat tidak punya koneksi.
const CACHE = 'absensi-md-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL, '/icons/icon-192.png'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
});

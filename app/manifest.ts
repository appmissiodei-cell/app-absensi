import type { MetadataRoute } from 'next';

// Disajikan otomatis di /manifest.webmanifest dan di-link oleh Next.js.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Absensi Komunitas MD',
    short_name: 'Absensi MD',
    description: 'Absensi Cell Group & Worship Night Komunitas MD',
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F7F4',
    theme_color: '#0E7C66',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

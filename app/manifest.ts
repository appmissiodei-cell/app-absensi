import type { MetadataRoute } from 'next';

// Disajikan otomatis di /manifest.webmanifest dan di-link oleh Next.js.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Absensi Komunitas Missio Dei',
    short_name: 'Absensi MD',
    description: 'Absensi Cell Group & Worship Night Komunitas Missio Dei',
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EFF4FB',
    theme_color: '#094B7F',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

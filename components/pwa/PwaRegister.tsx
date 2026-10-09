'use client';

import { useEffect } from 'react';

// Mendaftarkan service worker (hanya di production) supaya aplikasi bisa di-install.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* gagal daftar tidak mengganggu aplikasi */
    });
  }, []);
  return null;
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/pwa/PwaRegister';

export const metadata: Metadata = {
  title: 'Absensi Komunitas Missio Dei',
  description: 'Sistem absensi komunitas — Cell Group & Worship Night',
  applicationName: 'Absensi MD',
  appleWebApp: { capable: true, title: 'Absensi MD', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#094B7F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

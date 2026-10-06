import type { Config } from 'tailwindcss';

// Breakpoints default Tailwind sudah pas dengan kebutuhan spec:
//   < 1024px  -> bottom nav (mobile/tablet)
//   >= 1024px (lg:) -> sidebar kiri persisten (desktop)
// Warna disamakan dengan CSS variables di mockup (absensi-app.html)
// supaya migrasi tampilan tidak perlu redesain palet dari nol.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F6F7F4',
        card: '#ffffff',
        border: '#E4E7E1',
        text: '#22271F',
        muted: '#6C736A',
        muted2: '#8B928A',
        accent: '#0E7C66',
        'accent-light': '#E9F5F1',
        dark: '#14231F',
        amber: '#B45309',
        'amber-light': '#FFF4E5',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

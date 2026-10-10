import type { Config } from 'tailwindcss';

// Breakpoints default Tailwind sudah pas dengan kebutuhan spec:
//   < 1024px  -> bottom nav (mobile/tablet)
//   >= 1024px (lg:) -> sidebar kiri persisten (desktop)
// Palet biru Komunitas Missio Dei (logo #094B7F), disamakan dengan mockup absensi-app.html.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#EFF4FB',
        card: '#ffffff',
        border: '#E0E8F4',
        text: '#14233A',
        muted: '#62718A',
        muted2: '#8A97AC',
        accent: '#1D5FC4',
        'accent-light': '#E6EFFC',
        dark: '#094B7F',
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

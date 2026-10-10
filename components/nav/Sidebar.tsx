'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, UsersRound, CalendarRange, Settings } from 'lucide-react';

type Props = { isSuperadmin: boolean };

const ITEMS = [
  { href: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/kegiatan', label: 'Kegiatan', icon: CalendarDays },
  { href: '/anggota', label: 'Anggota', icon: Users },
  { href: '/cell-group', label: 'Cell Group', icon: UsersRound },
  { href: '/kalender', label: 'Kalender', icon: CalendarRange },
];

// Sidebar kiri persisten, dipakai di >= 1024px (lg:) sebagai pengganti
// bottom nav mobile. Lihat app/(app)/layout.tsx.
export function Sidebar({ isSuperadmin }: Props) {
  const pathname = usePathname();

  const items = isSuperadmin
    ? [...ITEMS, { href: '/pengaturan/users', label: 'Pengaturan User', icon: Settings }]
    : ITEMS;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-r border-border bg-card min-h-screen sticky top-0">
      <div className="px-5 py-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-blue.png" alt="Missio Dei" className="w-12 h-auto flex-shrink-0" />
        <p className="text-[15px] font-extrabold text-dark leading-tight">Absensi<br />Missio Dei</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? 'bg-accent-light text-accent' : 'text-muted hover:bg-accent-light/60'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

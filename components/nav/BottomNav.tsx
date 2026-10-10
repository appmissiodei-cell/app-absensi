'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, UsersRound, CalendarRange } from 'lucide-react';

// 5 tab bottom nav untuk < 1024px; di >= 1024px digantikan Sidebar (lihat app/(app)/layout.tsx).
// Bentuk melayang (jarak dari tepi layar + area tap besar) supaya mudah ditekan di HP.
const ITEMS = [
  { href: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/kegiatan', label: 'Kegiatan', icon: CalendarDays },
  { href: '/anggota', label: 'Anggota', icon: Users },
  { href: '/cell-group', label: 'Cell Group', icon: UsersRound },
  { href: '/kalender', label: 'Kalender', icon: CalendarRange },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed left-3 right-3 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] mx-auto max-w-[456px] z-20 flex gap-0.5 bg-card border border-border rounded-3xl p-2 shadow-[0_14px_34px_rgba(16,60,130,.18)]">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 min-h-[54px] flex flex-col items-center justify-center gap-1 rounded-[18px] px-0.5 py-2 ${active ? 'bg-accent-light' : ''}`}
          >
            <Icon size={20} className={active ? 'text-accent' : 'text-muted2'} />
            <span className={`text-[10.5px] ${active ? 'font-bold text-accent' : 'font-semibold text-muted2'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

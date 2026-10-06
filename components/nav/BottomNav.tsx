'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, UsersRound, CalendarRange } from 'lucide-react';

// Pola 5 tab bottom nav, dipertahankan sama dengan mockup untuk < 1024px.
// Di >= 1024px digantikan oleh Sidebar — lihat app/(app)/layout.tsx.
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
    <nav className="lg:hidden fixed left-0 right-0 bottom-0 z-20 flex bg-card border-t border-border pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 pt-1"
          >
            <Icon size={20} className={active ? 'text-accent' : 'text-muted2'} />
            <span className={`text-[10.5px] font-semibold ${active ? 'text-accent' : 'text-muted2'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

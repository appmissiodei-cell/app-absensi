// components/ui/SortTh.tsx
//
// Header kolom tabel yang bisa diklik untuk sort asc/desc — port dari
// thSort() di mockup. Di sini cukup berupa <Link> yang mengubah query
// param ?sort=&dir=, jadi tidak perlu Client Component / JS sama sekali
// (server re-render dengan data yang sudah diurutkan ulang).
import Link from 'next/link';

type Props = {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDir: 'asc' | 'desc';
  /** searchParams halaman saat ini, supaya filter lain (q, jenis, dst) tetap terbawa. */
  searchParams: Record<string, string | undefined>;
};

export function SortTh({ label, sortKey, currentSort, currentDir, searchParams }: Props) {
  const isActive = currentSort === sortKey;
  // Klik kolom yang sama = balik arah. Klik kolom lain = mulai dari asc.
  const nextDir: 'asc' | 'desc' = isActive && currentDir === 'asc' ? 'desc' : 'asc';

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined && k !== 'sort' && k !== 'dir') params.set(k, v);
  }
  params.set('sort', sortKey);
  params.set('dir', nextDir);

  const arrow = isActive ? (currentDir === 'asc' ? '\u2191' : '\u2193') : '\u21c5';

  return (
    <th className="text-left text-[11px] font-bold uppercase tracking-wide text-muted border-b border-border px-1.5 py-2">
      <Link href={`?${params.toString()}`} className="inline-flex items-center gap-1 whitespace-nowrap select-none hover:text-text">
        {label}
        <span className={isActive ? 'text-accent' : 'text-muted2'} style={{ fontSize: 10 }}>
          {arrow}
        </span>
      </Link>
    </th>
  );
}

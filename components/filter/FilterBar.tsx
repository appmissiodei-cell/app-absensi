'use client';

// components/filter/FilterBar.tsx
//
// Port dari filterBarHtml() di mockup: 1 pola visual yang sama di semua
// halaman list — search box, lalu baris dropdown, lalu custom date range
// kalau rangeKey-nya 'custom'. Client Component karena perlu update URL
// query params saat user mengetik/memilih (server re-render dengan data
// yang sudah difilter/di-sort ulang).
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type SelectOption = { value: string; label: string };
export type SelectField = { name: string; value: string; options: SelectOption[] };

type CustomRange = {
  rangeParamName: string;
  rangeValue: string; // value yang berarti "custom" untuk field range ini
  startName: string;
  endName: string;
  startValue: string;
  endValue: string;
};

type Props = {
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  selects?: SelectField[];
  customRange?: CustomRange;
};

export function FilterBar({
  searchName = 'q',
  searchValue = '',
  searchPlaceholder,
  selects = [],
  customRange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchValue);

  useEffect(() => {
    setText(searchValue);
  }, [searchValue]);

  function updateParams(entries: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(entries)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // Debounce search text supaya tidak navigasi di setiap ketikan huruf.
  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== (searchValue || '')) updateParams({ [searchName]: text });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const showCustom = customRange && customRange.startValue !== undefined && searchParams.get(customRange.rangeParamName) === customRange.rangeValue;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {searchPlaceholder !== undefined && (
        <input
          className="w-full rounded-lg border border-border bg-card text-text px-3 py-2.5 text-sm"
          placeholder={searchPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      {selects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selects.map((s) => (
            <select
              key={s.name}
              className="flex-1 min-w-[140px] rounded-lg border border-border bg-card text-text px-3 py-2.5 text-sm"
              value={s.value}
              onChange={(e) => updateParams({ [s.name]: e.target.value })}
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
      {showCustom && customRange && (
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 rounded-lg border border-border bg-card text-text px-3 py-2 text-sm"
            defaultValue={customRange.startValue}
            onChange={(e) => updateParams({ [customRange.startName]: e.target.value })}
          />
          <input
            type="date"
            className="flex-1 rounded-lg border border-border bg-card text-text px-3 py-2 text-sm"
            defaultValue={customRange.endValue}
            onChange={(e) => updateParams({ [customRange.endName]: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

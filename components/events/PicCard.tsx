'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WN_ROLE_DEFS } from '@/lib/constants';
import { fmtRupiah } from '@/lib/dates';

// Port dari picCardHtml() di mockup: kartu PIC Worship Night yang bisa dilipat.
export function PicCard({ pic, kolekte }: { pic: Record<string, string> | null; kolekte: number | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const p = pic || {};
  const total = WN_ROLE_DEFS.length;
  const filled = WN_ROLE_DEFS.filter((r) => (p[r.key] || '').trim()).length;
  const color = filled === total ? 'var(--accent)' : filled === 0 ? 'var(--red)' : 'var(--amber)';
  let lastGroup: string | null = null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mt-3.5">
      <button type="button" onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted uppercase">PIC Bertugas</span>
          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: color + '22', color }}>
            {filled}/{total} terisi
          </span>
        </span>
        <ChevronDown size={18} className="text-muted transition-transform" style={{ transform: `rotate(${collapsed ? 0 : 180}deg)` }} />
      </button>
      {!collapsed && (
        <div className="mt-2">
          {WN_ROLE_DEFS.map((r) => {
            const group = 'group' in r ? r.group : undefined;
            let header: React.ReactNode = null;
            if (group && group !== lastGroup) {
              header = <div className="text-[11px] font-bold text-muted uppercase mt-2.5 mb-1">{group}</div>;
              lastGroup = group;
            } else if (!group) lastGroup = null;
            const label = group ? r.label.split('— ')[1] : r.label;
            const val = (p[r.key] || '').trim();
            return (
              <div key={r.key}>
                {header}
                <div className="flex justify-between items-baseline py-1.5 border-b border-border">
                  <span className="text-[12.5px] text-muted flex-shrink-0 mr-2.5">{label}</span>
                  <span className="text-[13px] font-semibold text-right" style={{ color: val ? 'var(--text)' : 'var(--red)' }}>
                    {val || 'Belum diisi'}
                  </span>
                </div>
              </div>
            );
          })}
          {kolekte != null && (
            <div className="flex justify-between pt-2.5 mt-1">
              <span className="text-[12.5px] text-muted">Jumlah Kolekte</span>
              <span className="text-[13px] font-bold">Rp {fmtRupiah(kolekte)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

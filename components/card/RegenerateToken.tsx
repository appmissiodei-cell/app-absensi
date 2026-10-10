'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { regenerateQrToken } from '@/app/(app)/anggota/actions';

export function RegenerateToken({ memberId }: { memberId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('Ganti token? Link & QR kartu yang lama langsung tidak berlaku, anggota perlu dikirimi kartu baru.')) return;
        start(async () => {
          const r = await regenerateQrToken(memberId);
          if (r?.error) window.alert(r.error);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-card text-text px-2.5 py-1.5 text-[11.5px] font-semibold disabled:opacity-60"
    >
      <RefreshCw size={14} />{pending ? 'Mengganti…' : 'Ganti token'}
    </button>
  );
}

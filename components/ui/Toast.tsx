'use client';

// Toast sederhana — port dari App.showToast() di mockup.
// Dipicu lewat query param ?toast=Pesan (diisi oleh server action saat redirect).
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function Toast() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const msg = sp.get('toast');
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    setShown(msg);
    const params = new URLSearchParams(sp.toString());
    params.delete('toast');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    const t = setTimeout(() => setShown(null), 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg]);

  if (!shown) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 z-[60] bg-dark text-white text-[13px] font-semibold px-[18px] py-2.5 rounded-full shadow-xl whitespace-nowrap">
      {shown}
    </div>
  );
}

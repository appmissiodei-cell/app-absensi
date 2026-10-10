'use client';

import { useState } from 'react';
import { Copy, MessageCircle, Download, X } from 'lucide-react';
import { renderCardPng, cardShareText, type CardInfo } from '@/lib/card-image';
import { cardPath } from '@/lib/qr';

type Props = CardInfo & { compact?: boolean; extra?: React.ReactNode };

const chip = 'inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-card text-text px-2.5 py-1.5 text-[11.5px] font-semibold whitespace-nowrap disabled:opacity-60';

/** Tombol Salin link + Kirim gambar kartu. Dipakai di detail anggota, daftar kartu, dan halaman kartu publik. */
export function CardShare(info: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null);

  const link = () => `${window.location.origin}${cardPath(info.token)}`;
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(null), 2500); };

  async function copy() {
    try { await navigator.clipboard.writeText(link()); flash('Link kartu disalin'); }
    catch { window.prompt('Salin link kartu:', link()); }
  }

  async function sendImage() {
    setBusy(true);
    try {
      const blob = await renderCardPng(info);
      const file = new File([blob], `kartu-${info.namaBaptis}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try { await nav.share({ files: [file], text: cardShareText(info.namaBaptis, link()) }); return; }
        catch (e) { if ((e as Error).name === 'AbortError') return; }
      }
      // Cadangan: tampilkan gambar di layar (tekan lama -> Simpan/Bagikan) + tombol unduh & WhatsApp.
      setImg({ url: URL.createObjectURL(blob), blob });
    } catch { flash('Gagal membuat gambar kartu'); }
    finally { setBusy(false); }
  }

  function close() { if (img) URL.revokeObjectURL(img.url); setImg(null); }

  return (
    <>
      <div className="flex gap-1.5 flex-wrap items-center">
        {info.extra}
        <button type="button" className={chip} onClick={sendImage} disabled={busy}><MessageCircle size={14} />{busy ? 'Membuat…' : 'Kirim gambar'}</button>
        <button type="button" className={chip} onClick={copy}><Copy size={14} />Salin link</button>
        {msg && <span className="text-[11.5px] font-semibold text-accent">{msg}</span>}
      </div>

      {img && (
        <div className="fixed inset-0 z-[70] bg-[rgba(7,20,39,.7)] flex items-center justify-center p-4" onClick={close}>
          <div className="bg-card rounded-3xl p-4 max-w-sm w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-extrabold">Gambar kartu</div>
              <button type="button" onClick={close} aria-label="Tutup" className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center"><X size={16} /></button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="Kartu anggota" className="w-full rounded-2xl border border-border" />
            <p className="text-[11.5px] text-muted text-center mt-2">Tekan lama gambar lalu pilih Simpan atau Bagikan.</p>
            <div className="flex gap-2 mt-3">
              <a href={img.url} download={`kartu-${info.namaBaptis}.png`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent text-white font-bold text-sm py-2.5"><Download size={15} />Unduh</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(cardShareText(info.namaBaptis, link()))}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border font-bold text-sm py-2.5">WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

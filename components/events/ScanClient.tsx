'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Check, AlertTriangle, X, Keyboard } from 'lucide-react';
import { scanCheckIn, type ScanResult } from '@/app/(app)/kegiatan/actions';
import { avatarColor } from '@/lib/dates';

export type Person = { id: string; nama: string; initials: string; cg: string | null; hadir: boolean };
type Recent = { id: string; nama: string; cg: string | null; kind: 'ok' | 'dup'; at: string | null };
type Pending = { payload: string; nama: string; cg: string | null; reason: string };

export function ScanClient({ eventId, people }: { eventId: string; people: Person[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const lastRef = useRef<{ code: string; t: number }>({ code: '', t: 0 });

  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'dup' | 'bad'; text: string } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [hadirIds, setHadirIds] = useState<Set<string>>(() => new Set(people.filter((p) => p.hadir).map((p) => p.id)));

  const handleResult = useCallback((r: ScanResult, payload: string) => {
    if (r.status === 'ok' || r.status === 'dup') {
      const kind: 'ok' | 'dup' = r.status;
      setMsg({
        kind,
        text: kind === 'ok' ? `${r.nama} tercatat hadir${r.at ? ` pukul ${r.at}` : ''}` : `${r.nama} sudah tercatat${r.at ? ` pukul ${r.at}` : ' sebelumnya'}`,
      });
      setRecent((l) => [{ id: r.id, nama: r.nama, cg: r.cg, kind, at: r.at }, ...l.filter((x) => x.id !== r.id)].slice(0, 8));
      // Dicocokkan lewat id anggota (bukan nama), jadi dua orang bernama sama tidak tertukar.
      setHadirIds((s) => new Set(s).add(r.id));
    } else if (r.status === 'warn') {
      setPending({ payload, nama: r.nama, cg: r.cg, reason: r.reason });
    } else if ('message' in r) {
      setMsg({ kind: 'bad', text: r.message });
    }
  }, []);

  const submit = useCallback(async (payload: string, force = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try { handleResult(await scanCheckIn(eventId, payload, force), payload); }
    catch { setMsg({ kind: 'bad', text: 'Gagal terhubung ke server. Coba lagi.' }); }
    finally { busyRef.current = false; }
  }, [eventId, handleResult]);

  const stopCam = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  const startCam = useCallback(async () => {
    setCamErr(null);
    if (!navigator.mediaDevices?.getUserMedia) { setCamErr('Kamera tidak tersedia di browser ini (butuh HTTPS). Pakai input manual di bawah.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      setCamOn(true);
      const { default: jsQR } = await import('jsqr');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const tick = () => {
        if (!streamRef.current) return;
        if (v.readyState >= 2 && !busyRef.current && !pendingRef.current) {
          const w = v.videoWidth, h = v.videoHeight;
          if (w && h) {
            canvas.width = w; canvas.height = h;
            ctx.drawImage(v, 0, 0, w, h);
            const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
            const now = Date.now();
            if (code?.data && (code.data !== lastRef.current.code || now - lastRef.current.t > 3000)) {
              lastRef.current = { code: code.data, t: now };
              void submitRef.current(code.data);
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCamErr('Kamera tidak bisa dibuka. Izinkan akses kamera di browser, atau pakai input manual.');
      stopCam();
    }
  }, [stopCam]);

  // ref agar loop kamera selalu memakai versi terbaru tanpa restart
  const submitRef = useRef(submit);
  const pendingRef = useRef<Pending | null>(null);
  useEffect(() => { submitRef.current = submit; }, [submit]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => stopCam, [stopCam]);

  // Anggota yang dicatat paksa (mis. Tidak Aktif) tetap ikut dihitung walau tidak ada di daftar.
  const known = new Set(people.map((p) => p.id));
  const extra = [...hadirIds].filter((id) => !known.has(id)).length;
  const hadirCount = hadirIds.size;
  const total = people.length + extra;
  const belum = people.filter((p) => !hadirIds.has(p.id));

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-muted uppercase">Sudah hadir</div>
          <div className="text-2xl font-extrabold">{hadirCount} <span className="text-sm font-semibold text-muted">dari {total}</span></div>
        </div>
        <button type="button" onClick={camOn ? stopCam : startCam}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold ${camOn ? 'bg-bg border border-border' : 'bg-accent text-white'}`}>
          {camOn ? <><CameraOff size={16} />Matikan</> : <><Camera size={16} />Buka kamera</>}
        </button>
      </div>

      <div className={`relative rounded-2xl overflow-hidden bg-black aspect-square ${camOn ? '' : 'hidden'}`}>
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-[18%] border-2 border-white/80 rounded-2xl pointer-events-none" />
      </div>
      {camErr && <div className="text-[12.5px] text-red bg-card border border-border rounded-xl px-3 py-2.5">{camErr}</div>}

      {msg && (
        <div role="status" className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold ${msg.kind === 'ok' ? 'bg-accent-light text-accent' : msg.kind === 'dup' ? 'bg-bg border border-border text-text' : 'bg-red-50 text-red'}`}>
          {msg.kind === 'bad' ? <X size={16} /> : <Check size={16} />}{msg.text}
        </div>
      )}

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { void submit(manual.trim()); setManual(''); } }}>
        <div className="flex-1 relative">
          <Keyboard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2" />
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Tempel isi QR atau link kartu"
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm" />
        </div>
        <button type="submit" className="rounded-xl bg-accent text-white font-bold text-sm px-4">Catat</button>
      </form>

      {recent.length > 0 && (
        <div>
          <div className="text-xs font-bold text-muted uppercase mb-1.5">Baru discan</div>
          <div className="space-y-1.5">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3 py-2 text-[13px]">
                <Check size={15} className={r.kind === 'ok' ? 'text-accent' : 'text-muted2'} />
                <span className="flex-1 min-w-0 truncate font-semibold">{r.nama}</span>
                <span className="text-[11px] text-muted">{r.kind === 'dup' ? `sudah ada${r.at ? ` · ${r.at}` : ''}` : [r.at, r.cg].filter(Boolean).join(' · ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-bold text-muted uppercase mb-1.5">Belum hadir ({belum.length})</div>
        <div className="space-y-1.5">
          {belum.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3 py-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: avatarColor(p.id) }}>{p.initials}</span>
              <span className="flex-1 min-w-0 text-[13px] truncate">{p.nama}</span>
              <span className="text-[11px] text-muted">{p.cg}</span>
            </div>
          ))}
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-[70] bg-[rgba(7,20,39,.6)] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-5 max-w-sm w-full text-center">
            <div className="w-12 h-12 rounded-full bg-amber-light text-amber flex items-center justify-center mx-auto"><AlertTriangle size={22} /></div>
            <div className="text-base font-extrabold mt-3">{pending.nama}</div>
            <p className="text-sm text-muted mt-1">{pending.reason} Tetap catat hadir?</p>
            <div className="flex gap-2 mt-4">
              <button type="button" className="flex-1 rounded-xl border border-border font-bold text-sm py-2.5" onClick={() => setPending(null)}>Batal</button>
              <button type="button" className="flex-1 rounded-xl bg-accent text-white font-bold text-sm py-2.5"
                onClick={() => { const p = pending; setPending(null); void submit(p.payload, true); }}>Catat tetap</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

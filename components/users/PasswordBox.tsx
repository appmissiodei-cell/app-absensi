'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { PasswordResult } from '@/app/(app)/pengaturan/actions';

// Kartu "Kata Sandi" — port dari viewMyAccount()/viewUserDetail().
// Supabase tidak menyimpan password yang bisa dibaca, jadi password baru hanya tampil SEKALI setelah dibuat.
export function PasswordBox({
  resetAction,
  confirmTitle,
  initialPassword,
}: {
  resetAction: () => Promise<PasswordResult>;
  confirmTitle: string;
  initialPassword?: string;
}) {
  const [password, setPassword] = useState<string | null>(initialPassword ?? null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function copy() {
    if (!password) return;
    try { void navigator.clipboard.writeText(password); } catch { /* abaikan */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  function run() {
    startTransition(async () => {
      const r = await resetAction();
      if ('error' in r) setError(r.error);
      else { setPassword(r.password); setVisible(true); setError(null); }
      setConfirm(false);
    });
  }
  const btn = 'w-9 h-9 rounded-[10px] border border-border bg-bg flex items-center justify-center flex-shrink-0';

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      {password ? (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-[15px] font-bold tracking-wide break-all">{visible ? password : '••••••••••••'}</div>
            <button type="button" className={btn} onClick={() => setVisible((v) => !v)} aria-label="Tampilkan">{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            <button type="button" className={btn} onClick={copy} aria-label="Salin"><Copy size={16} /></button>
          </div>
          <p className="text-[11px] text-muted2 mt-2">{copied ? 'Password disalin ✓' : 'Catat password ini sekarang — tidak akan ditampilkan lagi setelah halaman ditutup.'}</p>
        </>
      ) : (
        <p className="text-[13px] text-muted">Password disimpan terenkripsi dan tidak bisa dilihat. Buat password baru kalau lupa.</p>
      )}
      {error && <p className="text-sm text-danger font-semibold mt-2">{error}</p>}
      <button type="button" onClick={() => setConfirm(true)} className="w-full mt-3 rounded-xl border border-border bg-bg font-bold py-2.5 text-sm">Buat Password Baru</button>
      {confirm && (
        <ConfirmDialog title={confirmTitle} body="Password lama tidak akan berlaku lagi setelah ini." confirmLabel="Ya, Buat Baru" busy={pending} onConfirm={run} onCancel={() => setConfirm(false)} />
      )}
    </div>
  );
}

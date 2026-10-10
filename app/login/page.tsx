'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Email atau password salah.');
      setLoading(false);
      return;
    }

    // TODO: cek profiles.active di sini; kalau false, sign out lagi dan
    // tampilkan pesan "Akun dinonaktifkan" (RLS akan menolak query data,
    // tapi pesan error langsung di sini lebih ramah untuk user).

    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border border-border rounded-3xl p-6"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-blue.png" alt="Missio Dei" className="w-28 h-auto mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-text mb-1 text-center">Absensi Komunitas Missio Dei</h1>
        <p className="text-sm text-muted mb-6 text-center">Masuk untuk mengelola absensi</p>

        <label className="block text-xs font-semibold text-muted mb-1.5">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm mb-4"
        />

        <label className="block text-xs font-semibold text-muted mb-1.5">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm mb-4"
        />

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-accent text-white font-bold py-3 text-sm shadow-[0_8px_18px_rgba(29,95,196,.28)] disabled:opacity-60"
        >
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}

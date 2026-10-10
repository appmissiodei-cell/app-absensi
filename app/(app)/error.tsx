'use client';

// Tampil kalau satu halaman gagal memuat data (mis. koneksi ke database putus),
// supaya pengguna melihat pesan jelas + tombol coba lagi, bukan layar putih.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto mt-10 bg-card border border-border rounded-3xl p-6 text-center">
      <h1 className="text-lg font-extrabold">Halaman gagal dimuat</h1>
      <p className="text-sm text-muted mt-1">Periksa koneksi internet, lalu coba lagi. Kalau terus berulang, hubungi pengelola aplikasi.</p>
      {error.digest && <p className="text-[11px] text-muted2 mt-2">Kode: {error.digest}</p>}
      <button type="button" onClick={reset} className="mt-4 rounded-xl bg-accent text-white font-bold text-sm px-5 py-2.5">Coba lagi</button>
    </div>
  );
}

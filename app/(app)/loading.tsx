// Tampil seketika saat pindah menu, selagi data halaman baru diambil dari server.
// Tanpa file ini layar terasa "macet" sampai semua data siap.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Memuat">
      <div className="hero rounded-3xl px-5 py-6 mb-4">
        <div className="h-5 w-40 rounded-lg bg-white/25" />
        <div className="h-3 w-56 rounded-lg bg-white/15 mt-3" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-20 rounded-2xl bg-card border border-border" />
        <div className="h-20 rounded-2xl bg-card border border-border" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-card border border-border" />
        ))}
      </div>
    </div>
  );
}

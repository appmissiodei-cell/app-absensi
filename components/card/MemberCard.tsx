// Tampilan kartu anggota (server component). QR dikirim sebagai string SVG.
type Props = { namaBaptis: string; namaLengkap: string; cgNama: string | null; qrSvgHtml: string; inactive?: boolean };

export function MemberCard({ namaBaptis, namaLengkap, cgNama, qrSvgHtml, inactive }: Props) {
  return (
    <div className="rounded-[24px] overflow-hidden shadow-[0_18px_40px_rgba(9,75,127,.3)]" style={{ background: 'linear-gradient(160deg,#1D5FC4 0%,#094B7F 70%)' }}>
      <div className="px-[22px] pt-[22px] pb-3.5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-[.2em] uppercase text-white/70">Kartu Anggota</div>
            <div className="text-sm font-semibold text-white/90 mt-0.5">Komunitas Missio Dei</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="Missio Dei" className="w-[104px] h-auto flex-shrink-0 -mt-1" />
        </div>
        <div className="text-2xl font-extrabold leading-tight mt-[18px]">{namaBaptis}</div>
        <div className="text-base font-semibold text-white/90">{namaLengkap}</div>
        <div className="text-xs text-white/70 mt-1">{cgNama ? `Cell Group ${cgNama}` : 'Belum masuk Cell Group'}</div>
        {inactive && <div className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15">Tidak Aktif</div>}
      </div>
      <div className="bg-white mx-3.5 mb-3.5 rounded-[18px] p-4 flex flex-col items-center">
        <div className="w-[260px] max-w-full aspect-square [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qrSvgHtml }} />
        <div className="text-xs text-muted text-center mt-2">Tunjukkan QR ini ke petugas saat absen</div>
      </div>
    </div>
  );
}

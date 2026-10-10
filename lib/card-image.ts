// lib/card-image.ts — membuat gambar kartu anggota (PNG) di browser. Hanya dipakai di client component.
import QRCode from 'qrcode';
import { qrPayload } from '@/lib/qr';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export type CardInfo = { token: string; namaBaptis: string; namaLengkap: string; cgNama: string | null };

export async function renderCardPng(info: CardInfo): Promise<Blob> {
  const W = 720, H = 1130;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#1D5FC4'); g.addColorStop(0.75, '#094B7F'); g.addColorStop(1, '#073A63');
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '700 26px sans-serif'; x.fillText('KARTU ANGGOTA', 50, 80);
  x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '600 32px sans-serif'; x.fillText('Komunitas Missio Dei', 50, 125);
  const logo = await loadImage('/logo-white.png');
  if (logo) { const lw = 190, lh = (lw * logo.naturalHeight) / logo.naturalWidth; x.drawImage(logo, W - 50 - lw, 40, lw, lh); }

  x.fillStyle = '#fff'; x.font = '800 54px sans-serif'; x.fillText(info.namaBaptis, 50, 245);
  x.font = '600 36px sans-serif'; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText(info.namaLengkap, 50, 295);
  x.font = '500 26px sans-serif'; x.fillStyle = 'rgba(255,255,255,.7)';
  x.fillText(info.cgNama ? `Cell Group ${info.cgNama}` : 'Belum masuk Cell Group', 50, 338);

  const px = 40, py = 370, pw = W - 80, ph = H - py - 40, r = 36;
  x.fillStyle = '#fff'; x.beginPath();
  x.moveTo(px + r, py); x.arcTo(px + pw, py, px + pw, py + ph, r); x.arcTo(px + pw, py + ph, px, py + ph, r);
  x.arcTo(px, py + ph, px, py, r); x.arcTo(px, py, px + pw, py, r); x.closePath(); x.fill();

  const qr = QRCode.create(qrPayload(info.token), { errorCorrectionLevel: 'M' });
  const n = qr.modules.size, size = pw - 80, cell = Math.floor(size / n), qs = cell * n;
  const ox = Math.round(px + (pw - qs) / 2), oy = py + 40;
  x.fillStyle = '#0A2540';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (qr.modules.get(i, j)) x.fillRect(ox + j * cell, oy + i * cell, cell, cell);

  x.fillStyle = '#62718A'; x.font = '500 24px sans-serif'; x.textAlign = 'center';
  x.fillText('Tunjukkan QR ini ke petugas saat absen', W / 2, oy + qs + 50);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat gambar'))), 'image/png'));
}

export function cardShareText(namaBaptis: string, link: string) {
  return `Halo ${namaBaptis}, ini kartu anggota digital Komunitas Missio Dei kamu. Simpan link ini di HP, lalu tunjukkan QR-nya ke petugas saat absen. Jangan dibagikan ke orang lain ya.\n${link}`;
}

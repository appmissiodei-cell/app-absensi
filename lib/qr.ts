// lib/qr.ts — helper kartu QR anggota.
// QR berisi "MD1:<token>"; tautan kartu publik = <origin>/kartu/<token>.
import QRCode from 'qrcode';

export const QR_PREFIX = 'MD1:';

export const qrPayload = (token: string) => `${QR_PREFIX}${token}`;
export const cardPath = (token: string) => `/kartu/${token}`;

/** Ambil token dari isi QR ("MD1:<token>") atau dari tautan kartu yang ditempel. Null jika bukan kartu kita. */
export function parseCardCode(raw: string): string | null {
  const text = raw.trim();
  if (text.startsWith(QR_PREFIX)) {
    const t = text.slice(QR_PREFIX.length);
    return /^[a-f0-9]{32,128}$/i.test(t) ? t.toLowerCase() : null;
  }
  const m = text.match(/\/kartu\/([a-f0-9]{32,128})(?:[/?#]|$)/i);
  return m ? m[1].toLowerCase() : null;
}

/** SVG QR (string) untuk dirender di server. */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0A2540', light: '#ffffff' } });
}

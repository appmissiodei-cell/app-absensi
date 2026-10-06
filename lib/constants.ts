// lib/constants.ts
// Di-port langsung dari absensi-app.html supaya nama & urutan tetap sama.

export const PELAYANAN_LIST = [
  'Ketua Komunitas',
  'Sekretaris',
  'Sekretaris 2',
  'Bendahara',
  'Bendahara 2',
  'Tim Organisasi',
  'Ketua Sel Pasutri',
  'Tim WN Umum',
  'Tim Pujian',
  'Tim AV',
  'Tim Doa',
  'Tim Panda',
  'Tim Tema',
  'Tim Pewarta',
  'Tim Young Professional',
  'Tim Kids',
  'Tim Youth',
  'Pengumuman',
] as const;

export const MAX_PELAYANAN_PER_MEMBER = 3;

export const JENIS_KEGIATAN_TYPES = [
  'Cell Group',
  'Worship Night',
  'Retreat',
  'Misa Bersama',
  'Lain-Lain',
] as const;

export type JenisKegiatan = (typeof JENIS_KEGIATAN_TYPES)[number];

// 12 role PIC Worship Night — key jsonb & label tampilan.
// `group` dipakai untuk mengelompokkan 3 role "Link Pujian" di UI.
export const WN_ROLE_DEFS = [
  { key: 'pd_mc', label: 'Tim PD + MC' },
  { key: 'guest_admin', label: 'Guest Admin' },
  { key: 'pujian_wl', label: 'Tim Pujian — WL', group: 'Tim Pujian — Link Pujian' },
  { key: 'pujian_singer', label: 'Tim Pujian — Singer', group: 'Tim Pujian — Link Pujian' },
  { key: 'pujian_pemusik', label: 'Tim Pujian — Pemusik', group: 'Tim Pujian — Link Pujian' },
  { key: 'avp', label: 'Tim AVP' },
  { key: 'medsos', label: 'Tim Medsos' },
  { key: 'doa', label: 'Tim Doa' },
  { key: 'snack', label: 'Snack' },
  { key: 'cg_usher', label: 'Pelayanan CG — Usher' },
  { key: 'cg_kids', label: 'Pelayanan CG — MD Kids' },
  { key: 'kesaksian', label: 'Kesaksian CG' },
] as const;

export type WnPic = Record<(typeof WN_ROLE_DEFS)[number]['key'], string>;

export function emptyPic(): WnPic {
  const pic = {} as WnPic;
  WN_ROLE_DEFS.forEach((r) => (pic[r.key] = ''));
  return pic;
}

// Rentang tanggal siap-pakai untuk filter (Minggu Ini / Bulan Ini / dst).
// Value 'custom' butuh start/end terpisah dari input date picker.
export const QUICK_RANGES = ['week', 'month', 'two', 'all', 'custom'] as const;
export type QuickRange = (typeof QUICK_RANGES)[number];

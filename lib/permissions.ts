// lib/permissions.ts
//
// Guard di level aplikasi — CERMIN dari RLS di supabase/migrations/0002_rls.sql,
// bukan pengganti. RLS di DB adalah sumber kebenaran yang sesungguhnya;
// helper ini cuma supaya UI tidak menampilkan aksi yang pasti akan
// ditolak server, dan supaya Server Action bisa gagal cepat dengan
// pesan yang jelas sebelum mencoba query.

export type Role = 'admin' | 'superadmin';

export type Profile = {
  id: string;
  nama: string;
  role: Role;
  active: boolean;
};

export function isSuperadmin(profile: Profile | null | undefined): boolean {
  return !!profile && profile.role === 'superadmin' && profile.active;
}

export function isActiveStaff(profile: Profile | null | undefined): boolean {
  return !!profile && profile.active && (profile.role === 'admin' || profile.role === 'superadmin');
}

/** admin & superadmin boleh; delete cuma superadmin (lihat RLS). */
export function canDelete(profile: Profile | null | undefined): boolean {
  return isSuperadmin(profile);
}

export function canWrite(profile: Profile | null | undefined): boolean {
  return isActiveStaff(profile);
}

/** Kelola user (pengaturan/users) — superadmin only. */
export function canManageUsers(profile: Profile | null | undefined): boolean {
  return isSuperadmin(profile);
}

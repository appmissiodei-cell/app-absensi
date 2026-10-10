// lib/users.ts — baca daftar user + email (email ada di Supabase Auth, bukan di tabel profiles)
import { createAdminClient } from '@/lib/supabase/admin';

export async function emailMap(): Promise<Map<string, string>> {
  const { data } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 });
  return new Map((data?.users || []).map((u) => [u.id, u.email || '']));
}
export async function emailOf(id: string): Promise<string> {
  const { data } = await createAdminClient().auth.admin.getUserById(id);
  return data?.user?.email || '';
}

export const ROLE_COLOR = { superadmin: '#7C3AED', admin: '#1D5FC4' } as const;
export const roleLabel = (r: string) => (r === 'superadmin' ? 'Superadmin' : 'Admin');

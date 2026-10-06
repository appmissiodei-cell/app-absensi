// lib/server-helpers.ts — dipakai Server Actions
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSuperadmin, isActiveStaff, type Profile } from '@/lib/permissions';

export type ActionResult = { error: string } | undefined;

/** Client Supabase tanpa tipe ketat (tipe DB masih placeholder) + profil pemanggil. */
export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user.id).maybeSingle();
    profile = (data as unknown as Profile | null) ?? null;
  }
  return {
    sb: supabase as unknown as SupabaseClient,
    user,
    profile,
    isStaff: isActiveStaff(profile),
    isSuper: isSuperadmin(profile),
  };
}

export const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '');
export const orNull = (v: string) => (v === '' ? null : v);
export const toastUrl = (path: string, msg: string) => `${path}${path.includes('?') ? '&' : '?'}toast=${encodeURIComponent(msg)}`;

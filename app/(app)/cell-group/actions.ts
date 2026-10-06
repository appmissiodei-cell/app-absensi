'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getContext, str, orNull, toastUrl, type ActionResult } from '@/lib/server-helpers';

/** Tambah (tanpa id) atau ubah (dengan id) cell group. */
export async function saveCellGroup(formData: FormData): Promise<ActionResult> {
  const { sb, user, isStaff } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isStaff) return { error: 'Akun Anda tidak punya izin menyimpan data.' };

  const id = str(formData.get('id'));
  const nama = str(formData.get('nama'));
  const koordinator = orNull(str(formData.get('koordinator_id')));
  if (!nama) return { error: 'Nama cell group wajib diisi.' };

  const { data: dup } = await sb.from('cell_groups').select('id').ilike('nama', nama).limit(1);
  if (dup && dup.length && dup[0].id !== id) return { error: 'Nama cell group sudah dipakai.' };

  const payload = { nama, koordinator_id: koordinator };
  if (id) {
    const { error } = await sb.from('cell_groups').update(payload).eq('id', id);
    if (error) return { error: `Gagal menyimpan: ${error.message}` };
    revalidatePath('/cell-group');
    redirect(toastUrl(`/cell-group/${id}`, 'Perubahan tersimpan'));
  }
  const { error } = await sb.from('cell_groups').insert(payload);
  if (error) return { error: `Gagal menyimpan: ${error.message}` };
  revalidatePath('/cell-group');
  redirect(toastUrl('/cell-group', 'Cell group tersimpan'));
}

/** Hapus cell group — khusus superadmin. Anggotanya jadi "Belum Masuk CG" (FK set null). */
export async function deleteCellGroup(id: string): Promise<ActionResult> {
  const { sb, user, isSuper } = await getContext();
  if (!user) return { error: 'Sesi habis, silakan login ulang.' };
  if (!isSuper) return { error: 'Hanya superadmin yang boleh menghapus cell group.' };
  const { error } = await sb.from('cell_groups').delete().eq('id', id);
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  revalidatePath('/cell-group');
  revalidatePath('/anggota');
  redirect(toastUrl('/cell-group', 'Cell group dihapus'));
}

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EventForm } from '@/components/events/EventForm';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { isDone } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type Row = { id: string; jenis: string; tanggal: string; jam: string; keterangan: string | null; kolekte: number | null; pic: Record<string, string> | null };

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: ev }, { data: profile }] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).maybeSingle<Row>(),
    supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle(),
  ]);
  if (!ev) notFound();

  return (
    <div>
      <PageHeader title="Edit Kegiatan" sub={ev.jenis} />
      <EventForm
        initial={{
          id: ev.id, jenis: ev.jenis, tanggal: ev.tanggal, jam: ev.jam.slice(0, 5), keterangan: ev.keterangan ?? '',
          kolekte: ev.kolekte != null ? String(ev.kolekte) : '', pic: ev.pic ?? {},
        }}
        cancelHref={`/kegiatan/${ev.id}`}
        isDone={isDone(ev.tanggal)}
        canDelete={isSuperadmin(profile as unknown as Profile | null)}
      />
    </div>
  );
}

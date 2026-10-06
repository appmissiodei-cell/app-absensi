import { PageHeader } from '@/components/ui/PageHeader';
import { EventForm } from '@/components/events/EventForm';
import { todayISO } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div>
      <PageHeader title="Tambah Kegiatan" />
      <EventForm
        initial={{ jenis: 'Cell Group', tanggal: todayISO(), jam: '18:30', keterangan: '', kolekte: '', pic: {} }}
        cancelHref="/kegiatan"
        isDone={false}
        canDelete={false}
      />
    </div>
  );
}

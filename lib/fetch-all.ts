// lib/fetch-all.ts
//
// Supabase/PostgREST membatasi satu respons maksimal 1000 baris (max_rows).
// Tabel `attendance` tumbuh ~ (jumlah anggota x jumlah kegiatan) sehingga cepat melewati
// 1000 baris; tanpa paging, data terpotong DIAM-DIAM dan persentase kehadiran jadi salah.
//
// Pemakaian (WAJIB urut berdasarkan kolom unik supaya halaman tidak tumpang tindih):
//   const rows = await fetchAllRows<Row>((from, to) =>
//     supabase.from('attendance').select('member_id, hadir').order('id').range(from, to));

type PageResult = { data: unknown[] | null; error: { message: string } | null };

export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<PageResult>,
  pageSize = 1000,
  parallel = 4
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; ; page += parallel) {
    // Ambil beberapa halaman sekaligus supaya tidak berurutan satu-satu (lebih cepat).
    const batch = await Promise.all(
      Array.from({ length: parallel }, (_, i) => build((page + i) * pageSize, (page + i + 1) * pageSize - 1))
    );
    for (const res of batch) {
      if (res.error) throw new Error(`Gagal membaca data: ${res.error.message}`);
      const rows = (res.data || []) as T[];
      all.push(...rows);
      if (rows.length < pageSize) return all;
    }
  }
}

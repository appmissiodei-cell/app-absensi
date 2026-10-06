// types/database.types.ts
//
// Placeholder ditulis tangan agar type-check jalan sebelum project
// Supabase di-link. Ganti dengan hasil generate asli setelah migration
// dijalankan:
//
//   npx supabase gen types typescript --project-id <ref> > types/database.types.ts

export type Database = {
  public: {
    Tables: {
      cell_groups: {
        Row: { id: string; nama: string; koordinator_id: string | null; created_at: string };
        Insert: { id?: string; nama: string; koordinator_id?: string | null };
        Update: Partial<{ nama: string; koordinator_id: string | null }>;
      };
      members: {
        Row: {
          id: string;
          nama_baptis: string;
          nama_lengkap: string;
          cell_group_id: string | null;
          pelayanan: string[];
          tanggal_lahir: string | null;
          wedding_anniversary: string | null;
          status: 'Aktif' | 'Tidak Aktif';
          nik: string | null;
          no_hp: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama_baptis: string;
          nama_lengkap: string;
          cell_group_id?: string | null;
          pelayanan?: string[];
          tanggal_lahir?: string | null;
          wedding_anniversary?: string | null;
          status?: 'Aktif' | 'Tidak Aktif';
          nik?: string | null;
          no_hp?: string | null;
          email?: string | null;
        };
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          jenis: 'Cell Group' | 'Worship Night' | 'Retreat' | 'Misa Bersama' | 'Lain-Lain';
          tanggal: string;
          jam: string;
          keterangan: string | null;
          kolekte: number | null;
          pic: Record<string, string> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          jenis: Database['public']['Tables']['events']['Row']['jenis'];
          tanggal: string;
          jam: string;
          keterangan?: string | null;
          kolekte?: number | null;
          pic?: Record<string, string> | null;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      attendance: {
        Row: {
          id: string;
          event_id: string;
          member_id: string;
          hadir: boolean;
          updated_at: string;
        };
        Insert: { id?: string; event_id: string; member_id: string; hadir?: boolean };
        Update: Partial<{ hadir: boolean }>;
      };
      profiles: {
        Row: { id: string; nama: string; role: 'admin' | 'superadmin'; active: boolean; created_at: string };
        Insert: { id: string; nama: string; role: 'admin' | 'superadmin'; active?: boolean };
        Update: Partial<{ nama: string; role: 'admin' | 'superadmin'; active: boolean }>;
      };
    };
    // Kosong di placeholder ini — hasil `supabase gen types` asli akan
    // mengisi ini (termasuk metadata relasi FK yang dipakai untuk nested
    // select seperti `.select('*, cell_groups(nama)')`). Sebelum types
    // asli ada, nested select semacam itu tidak akan type-check dengan
    // sempurna — itu normal untuk placeholder, bukan bug di halaman yang
    // memakainya.
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

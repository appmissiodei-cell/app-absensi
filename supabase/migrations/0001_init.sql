-- ============================================================
-- 0001_init.sql
-- Skema dasar: Sistem Absensi Komunitas MD
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Cell Groups
-- ---------------------------------------------------------
create table cell_groups (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  koordinator_id uuid, -- FK ditambahkan setelah tabel members ada (lihat bawah)
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Anggota
-- ---------------------------------------------------------
create table members (
  id uuid primary key default gen_random_uuid(),
  nama_baptis text not null,
  nama_lengkap text not null,
  nik text,   -- nomor induk anggota, unik kalau diisi
  no_hp text,
  email text,
  cell_group_id uuid references cell_groups(id) on delete set null, -- null = "Belum Masuk CG"
  pelayanan text[] not null default '{}', -- maks 3, divalidasi di aplikasi (bukan constraint DB)
  tanggal_lahir date,
  wedding_anniversary date,
  status text not null default 'Aktif' check (status in ('Aktif','Tidak Aktif')),
  created_at timestamptz not null default now()
);

create unique index members_nik_unique_idx on members (nik) where nik is not null;

-- Sekarang FK koordinator_id -> members bisa dipasang
alter table cell_groups
  add constraint cell_groups_koordinator_id_fkey
  foreign key (koordinator_id) references members(id) on delete set null;

-- ---------------------------------------------------------
-- Kegiatan
-- ---------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in ('Cell Group','Worship Night','Retreat','Misa Bersama','Lain-Lain')),
  tanggal date not null,
  jam time not null,
  keterangan text,
  kolekte numeric, -- khusus Worship Night
  -- khusus Worship Night: {pd_mc, guest_admin, pujian_wl, pujian_singer, pujian_pemusik,
  --   avp, medsos, doa, snack, cg_usher, cg_kids, kesaksian}
  pic jsonb,
  created_at timestamptz not null default now()
);

create index events_tanggal_idx on events (tanggal);
create index events_jenis_idx on events (jenis);

-- ---------------------------------------------------------
-- Log Absensi (1 baris = 1 orang di 1 kegiatan)
-- ---------------------------------------------------------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  hadir boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create index attendance_event_id_idx on attendance (event_id);
create index attendance_member_id_idx on attendance (member_id);

-- ---------------------------------------------------------
-- Profil user (di atas Supabase Auth)
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role text not null check (role in ('admin','superadmin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- updated_at auto-touch untuk attendance
create or replace function touch_attendance_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger attendance_touch_updated_at
  before update on attendance
  for each row execute function touch_attendance_updated_at();

-- Anggota yang pernah tercatat HADIR di kegiatan apa pun tidak boleh dihapus.
-- Kalau semua barisnya hadir = false, anggota boleh dihapus (barisnya ikut terhapus lewat cascade).
create or replace function prevent_delete_member_with_hadir()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from attendance where member_id = old.id and hadir = true) then
    raise exception 'Anggota masih tercatat hadir di absensi' using errcode = '23503';
  end if;
  return old;
end;
$$;

create trigger members_prevent_delete_with_hadir
  before delete on members
  for each row execute function prevent_delete_member_with_hadir();

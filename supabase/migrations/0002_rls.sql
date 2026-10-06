-- ============================================================
-- 0002_rls.sql
-- Row Level Security — ditegakkan di DB, bukan cuma disembunyikan di UI.
--
-- Aturan:
--   superadmin : full access (select/insert/update/delete) semua tabel
--   admin      : select/insert/update di members, events, cell_groups,
--                attendance — TIDAK boleh delete apa pun
--   profiles   : admin hanya boleh lihat/update baris dirinya sendiri,
--                dan tidak boleh mengubah role/active miliknya sendiri
-- ============================================================

alter table cell_groups enable row level security;
alter table members enable row level security;
alter table events enable row level security;
alter table attendance enable row level security;
alter table profiles enable row level security;

-- ---------------------------------------------------------
-- Helper functions (security definer supaya bisa baca `profiles`
-- meski pemanggilnya belum punya policy select di tabel ini)
-- ---------------------------------------------------------
create or replace function is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'superadmin' and active = true
  );
$$;

create or replace function is_active_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and active = true and role in ('admin','superadmin')
  );
$$;

-- ---------------------------------------------------------
-- cell_groups / members / events / attendance
-- pola sama: staff aktif (admin+superadmin) boleh select/insert/update,
-- delete hanya superadmin.
-- ---------------------------------------------------------
create policy cell_groups_select on cell_groups for select using (is_active_staff());
create policy cell_groups_insert on cell_groups for insert with check (is_active_staff());
create policy cell_groups_update on cell_groups for update using (is_active_staff());
create policy cell_groups_delete on cell_groups for delete using (is_superadmin());

create policy members_select on members for select using (is_active_staff());
create policy members_insert on members for insert with check (is_active_staff());
create policy members_update on members for update using (is_active_staff());
create policy members_delete on members for delete using (is_superadmin());

create policy events_select on events for select using (is_active_staff());
create policy events_insert on events for insert with check (is_active_staff());
create policy events_update on events for update using (is_active_staff());
create policy events_delete on events for delete using (is_superadmin());

create policy attendance_select on attendance for select using (is_active_staff());
create policy attendance_insert on attendance for insert with check (is_active_staff());
create policy attendance_update on attendance for update using (is_active_staff());
create policy attendance_delete on attendance for delete using (is_superadmin());

-- ---------------------------------------------------------
-- profiles: admin hanya baris sendiri, superadmin semua baris.
-- ---------------------------------------------------------
create policy profiles_select on profiles
  for select using (id = auth.uid() or is_superadmin());

create policy profiles_update on profiles
  for update using (id = auth.uid() or is_superadmin());

create policy profiles_insert on profiles
  for insert with check (is_superadmin());

create policy profiles_delete on profiles
  for delete using (is_superadmin());

-- Trigger: admin tidak boleh menaikkan role/active dirinya sendiri
-- lewat baris profiles miliknya sendiri (harus lewat superadmin).
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_superadmin() then
    if new.role is distinct from old.role or new.active is distinct from old.active then
      raise exception 'Tidak boleh mengubah role atau status aktif akun sendiri';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_block_self_escalation
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- Catatan uji RLS (jangan cuma percaya UI menyembunyikan tombol):
--   1. Login sebagai admin -> coba DELETE langsung ke /rest/v1/members?id=eq.<uuid>
--      lewat REST API -> harus ditolak (403 / row tidak berubah).
--   2. Login sebagai admin -> coba SELECT * from profiles -> hanya baris
--      dirinya sendiri yang muncul.
--   3. Login sebagai admin -> coba UPDATE profiles set role='superadmin'
--      where id = auth.uid() -> harus gagal (trigger).

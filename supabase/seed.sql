-- ============================================================
-- seed.sql — DATA REAL Komunitas MD (88 anggota)
-- Sumber: "Absensi Ceria Missio Dei" (Sheet3 + Sheet4 + Sheet5, sudah digabung).
--
-- ⚠️ Blok DELETE di bawah MENGHAPUS semua isi cell_groups, members, events,
--    attendance (termasuk data dummy lama). Jalankan HANYA di awal, sebelum
--    ada data absensi asli yang diinput. Jangan jalankan ulang setelah
--    app dipakai.
--
-- Catatan data:
--   * Tanggal lahir / wedding anniversary kosong (null) kalau belum ada datanya.
--   * Anggota tanpa sel = "Belum Masuk CG" (cell_group_id null).
--   * Koordinator tiap CG masih kosong — isi lewat menu Cell Group > Edit.
--   * NIK, No. HP, Email ikut dimasukkan (kolom dari migration 0003_member_contact.sql
--     — jalankan migration itu SEBELUM seed ini).
--   * Nama baptis kosong disimpan sebagai string kosong ('').
--   * Pelayanan dipetakan ke daftar baku di lib/constants.ts (maks 3);
--     Tim Medsos / Digital Production / Panda disatukan jadi Tim Panda.
--   * Hanya ada 1 kegiatan contoh (Worship Night 9 Okt 2026); absensi belum ada.
-- ============================================================

delete from attendance;
delete from events;
delete from members;
delete from cell_groups;

insert into cell_groups (id, nama, koordinator_id) values
  ('00000004-0000-0000-0000-000000000001', 'Paulus', null),
  ('00000004-0000-0000-0000-000000000002', 'Valentinus', null),
  ('00000004-0000-0000-0000-000000000003', 'Fransiskus Xaverius', null),
  ('00000004-0000-0000-0000-000000000004', 'Young Pro A', null),
  ('00000004-0000-0000-0000-000000000005', 'Young Pro B', null),
  ('00000004-0000-0000-0000-000000000006', 'Young Pro C', null);

insert into members (id, nik, nama_baptis, nama_lengkap, cell_group_id, pelayanan, tanggal_lahir, wedding_anniversary, status, no_hp, email) values
  ('00000001-0000-0000-0000-000000000001', '1032', 'Lucia', 'Leyonie Nathasia', '00000004-0000-0000-0000-000000000003', array['Tim Panda'], null, null, 'Aktif', '08128888708', 'lleyoni@yahoo.com'),
  ('00000001-0000-0000-0000-000000000002', '1033', 'Fransisca', 'Linda Andriana Wijaya', '00000004-0000-0000-0000-000000000003', array['Tim Panda','Tim Doa'], '1992-08-30', '2023-07-08', 'Aktif', '085642013678', 'lindaandrianaw@gmail.com'),
  ('00000001-0000-0000-0000-000000000003', null, 'Maria', 'Maria Felicita Intansari', '00000004-0000-0000-0000-000000000003', array[]::text[], '1991-04-10', '2020-12-12', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000004', '1040', 'Natalie', 'Novianti Boentoro', '00000004-0000-0000-0000-000000000003', array['Sekretaris','Bendahara','Tim Panda'], '1992-11-05', '2019-12-10', 'Aktif', '082134712277', 'noviantiboentoro@gmail.com'),
  ('00000001-0000-0000-0000-000000000005', '1016', 'Leonardus', 'Dicky Madiangga', '00000004-0000-0000-0000-000000000003', array['Tim AV'], '1990-08-15', '2019-10-12', 'Aktif', '081327903052', 'cupank150890@gmail.com'),
  ('00000001-0000-0000-0000-000000000006', null, 'Yohannita', 'Natalia', '00000004-0000-0000-0000-000000000003', array[]::text[], '1991-12-28', '2017-09-01', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000007', '1047', 'Yulius', 'Yulius Ari Budi Nugroho', '00000004-0000-0000-0000-000000000003', array['Tim Pujian'], '1984-07-03', '2010-10-16', 'Aktif', '085228278008', 'julio.njoo@gmail.com'),
  ('00000001-0000-0000-0000-000000000008', '1013', 'Margaretta', 'Devitasari', '00000004-0000-0000-0000-000000000003', array['Tim WN Umum','Tim Pujian'], '1984-10-14', '2010-10-16', 'Aktif', '081328179765', 'dephie.zzz@gmail.com'),
  ('00000001-0000-0000-0000-000000000009', '1029', 'Karolus', 'Karolus Agung Saputro', '00000004-0000-0000-0000-000000000003', array['Ketua Komunitas','Tim Pewarta'], '1989-10-22', '2017-09-01', 'Aktif', '087838422457', 'karolus.agung.saputro@gmail.com'),
  ('00000001-0000-0000-0000-000000000010', null, 'Michael', 'Michael Tirta Nirmala', '00000004-0000-0000-0000-000000000003', array[]::text[], '1984-04-24', '2020-12-12', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000011', null, '', 'Andy Soebroto', '00000004-0000-0000-0000-000000000003', array[]::text[], '1986-07-10', '2023-07-08', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000012', null, 'Alexander', 'Daniel Chayadi', '00000004-0000-0000-0000-000000000002', array['Tim AV'], '1986-01-16', '2018-11-11', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000013', null, 'Michael', 'Giri Widodo Prasetyo', '00000004-0000-0000-0000-000000000002', array['Tim AV'], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000014', null, 'Theresia', 'Astrid Ellyana', '00000004-0000-0000-0000-000000000002', array[]::text[], '1994-09-10', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000015', '1046', 'Yoshua', 'Yoshua Setyo Nugroho Wibowo', '00000004-0000-0000-0000-000000000002', array['Tim AV'], '1991-05-09', '2020-07-04', 'Aktif', '081329303732', 'yoshua.setyo@gmail.com'),
  ('00000001-0000-0000-0000-000000000016', '1036', 'Maria', 'Maria Juniaria', '00000004-0000-0000-0000-000000000002', array['Tim Pujian'], '1990-06-14', '2020-07-04', 'Aktif', '082171816677', 'mariajuniaria@gmail.com'),
  ('00000001-0000-0000-0000-000000000017', '1009', 'Fransiska', 'Christie Yuanita Lessiohadi', '00000004-0000-0000-0000-000000000002', array['Tim Pujian'], '1990-05-13', '2017-11-11', 'Aktif', '081559870031', 'christieyuanitalessiohadi@yahoo.com'),
  ('00000001-0000-0000-0000-000000000018', null, 'Maria Bernadeta', 'Dyah Ernawati', '00000004-0000-0000-0000-000000000001', array['Tim Doa'], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000019', null, 'Antonius', 'Antonius Sumarwanto', '00000004-0000-0000-0000-000000000001', array['Tim Doa'], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000020', '1001', 'Benediktus', 'Alamay Wisando', '00000004-0000-0000-0000-000000000001', array['Tim AV'], null, null, 'Aktif', '085725129059', 'sando.alamay@gmail.com'),
  ('00000001-0000-0000-0000-000000000021', null, 'Aloysius', 'Aloysius Supriyantoro', '00000004-0000-0000-0000-000000000002', array['Tim Pujian'], '1969-06-21', '2016-12-14', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000022', '1004', 'Gregorius', 'Andre Prasetya', '00000004-0000-0000-0000-000000000002', array['Sekretaris','Tim WN Umum','Tim Pewarta'], '1988-07-20', '2015-10-04', 'Aktif', '081327951135', 'andreprasetya0788@gmail.com'),
  ('00000001-0000-0000-0000-000000000023', '1018', 'Elizabeth Maria', 'Faustina Farica', '00000004-0000-0000-0000-000000000002', array['Tim Doa'], '1992-12-03', '2018-12-01', 'Aktif', '0818777722', 'faustinafarica@gmail.com'),
  ('00000001-0000-0000-0000-000000000024', '1024', 'Stephanie', 'Ira Sudardja', null, array['Ketua Sel Pasutri','Tim Pujian'], '1975-09-04', '2003-02-01', 'Aktif', '081328999008', 'irasudardja@gmail.com'),
  ('00000001-0000-0000-0000-000000000025', '1025', 'David', 'Irawan Chandra Sumampauw', null, array['Ketua Sel Pasutri','Tim Pujian'], '1975-10-12', '2003-02-01', 'Aktif', '081328999009', 'sumampauw@gmail.com'),
  ('00000001-0000-0000-0000-000000000026', null, 'Irene', 'Irene Rieza Hapsari', '00000004-0000-0000-0000-000000000002', array['Tim Pujian'], '1975-03-17', '2016-12-14', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000027', '1041', 'Yohanes', 'Oktrianto Hendro Saputro', '00000004-0000-0000-0000-000000000002', array['Tim Organisasi'], '1991-10-26', '2018-12-01', 'Aktif', '081222948989', 'saputro.oktrianto@gmail.com'),
  ('00000001-0000-0000-0000-000000000028', '1027', 'Yohanes', 'Jimmy Budianto', '00000004-0000-0000-0000-000000000001', array['Tim Doa'], '1990-02-16', '2021-10-10', 'Aktif', '0872850577', 'j.budianto90@gmail.com'),
  ('00000001-0000-0000-0000-000000000029', '1044', 'Sylvester', 'Sugiantoro Susanto', '00000004-0000-0000-0000-000000000001', array['Tim Pujian'], '1983-09-05', null, 'Aktif', '081802180800', 'Slam_all7@yahoo.com'),
  ('00000001-0000-0000-0000-000000000030', '1045', 'Yohanes', 'Willy Budiawan', '00000004-0000-0000-0000-000000000001', array['Tim Pujian','Tim Pewarta'], '1989-01-11', '2018-01-20', 'Aktif', '087888732878', 'willybudiawan.md@gmail.com'),
  ('00000001-0000-0000-0000-000000000031', '1012', 'Marta', 'Dessy Kumalasari', '00000004-0000-0000-0000-000000000001', array['Tim Pujian'], '1992-12-27', '2018-01-20', 'Aktif', '087791043992', 'martadessy27@gmail.com'),
  ('00000001-0000-0000-0000-000000000032', null, 'Aquilina', 'Kristiani Merica', '00000004-0000-0000-0000-000000000001', array['Bendahara'], '1990-04-20', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000033', '1005', 'Antonius', 'Andryan Kurniadi', '00000004-0000-0000-0000-000000000001', array['Tim AV'], '1993-07-06', null, 'Aktif', '082140088200', 'andryankurniadi@gmail.com'),
  ('00000001-0000-0000-0000-000000000034', null, 'Maria Immaculata', 'Diyahsari Hastaningsih', '00000004-0000-0000-0000-000000000001', array['Tim Youth'], '1984-04-02', '2010-12-26', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000035', null, 'Seraphim', 'Amelia Christina', '00000004-0000-0000-0000-000000000001', array[]::text[], '1992-11-13', '2021-10-10', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000036', null, 'Yosef', 'Aria Yudo Nugroho', '00000004-0000-0000-0000-000000000001', array['Tim Youth'], '1983-12-09', '2010-12-26', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000037', '1022', 'Florensius', 'Handy Irawan Susanto', '00000004-0000-0000-0000-000000000001', array['Tim WN Umum'], '1982-03-26', '2019-01-19', 'Aktif', '085104930016', 'lavitz26@gmail.com'),
  ('00000001-0000-0000-0000-000000000038', '1031', 'Laurensia', 'Laurensia Veronica Andriana Natalia', '00000004-0000-0000-0000-000000000001', array['Tim Pujian'], '1987-12-17', '2015-10-25', 'Aktif', '08122627717', null),
  ('00000001-0000-0000-0000-000000000039', '1034', 'Fransiskus Asisi', 'Mahendra Kinky Saputra', '00000004-0000-0000-0000-000000000001', array['Tim Pewarta'], '1985-11-06', '2015-10-25', 'Aktif', '08562500350', 'mahendrakinky.mk@gmail.com'),
  ('00000001-0000-0000-0000-000000000040', '1039', 'Teresia', 'Natalina Caesy Kamari', '00000004-0000-0000-0000-000000000001', array[]::text[], '1992-01-07', '2019-01-19', 'Aktif', '085727758886', 'nanacaesy@gmail.com'),
  ('00000001-0000-0000-0000-000000000041', '1049', 'Ignatius', 'Kevin Prabawa Na', '00000004-0000-0000-0000-000000000002', array['Tim Young Professional','Tim Tema'], null, null, 'Aktif', '081327720702', 'kevin.prabawa.na@gmail.com'),
  ('00000001-0000-0000-0000-000000000042', '1019', 'Anastasia', 'Fellicia Wieka Sutanto', '00000004-0000-0000-0000-000000000002', array['Tim Young Professional','Tim Pujian'], '1989-02-26', '2019-01-01', 'Aktif', '081297571328', 'fellicia.wieka@yahooo.co.id'),
  ('00000001-0000-0000-0000-000000000043', null, '', 'Dominikus Ivan', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000044', '1089', '', 'Daniel', '00000004-0000-0000-0000-000000000004', array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000045', null, '', 'Steve', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000046', null, '', 'Josi', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000047', null, '', 'Ardhi', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000048', null, '', 'Carolina Olivia', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000049', null, '', 'Kimby', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000050', null, '', 'Hana Ivana', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000051', '1056', 'Stefanus Gregorius', 'Ivan Marcellino Sutanto', '00000004-0000-0000-0000-000000000004', array[]::text[], '1993-03-12', null, 'Tidak Aktif', '08112619642', 'ivanmarcellino@outlook.com'),
  ('00000001-0000-0000-0000-000000000052', '1020', 'Alfonsus Ferdinandus', 'Ferry Sugiyanto', '00000004-0000-0000-0000-000000000004', array['Tim AV'], '1985-05-24', null, 'Aktif', '08174173489', 'depotecoroso@gmail.com'),
  ('00000001-0000-0000-0000-000000000053', null, 'Yohanes', 'Pashadeno Senjasaqurela Suwarno', '00000004-0000-0000-0000-000000000004', array[]::text[], '1999-02-05', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000054', null, '', 'Domingos', null, array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000055', '1008', 'Giovanni', 'Caroline Margaretha', '00000004-0000-0000-0000-000000000005', array['Tim Pujian'], '1985-03-08', null, 'Aktif', '081904522259', 'carolinemargaretha@ymail.com'),
  ('00000001-0000-0000-0000-000000000056', null, 'Caecilia', 'Dian Mayasari', '00000004-0000-0000-0000-000000000006', array['Tim Panda'], '1990-11-27', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000057', null, 'Anastasia', 'Diana Susanti A', '00000004-0000-0000-0000-000000000004', array[]::text[], '1988-09-02', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000058', null, 'Aloysius', 'Olvan Andeska Setiawan', '00000004-0000-0000-0000-000000000006', array[]::text[], '1993-04-13', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000059', null, 'Claudia', 'Diannita Natalia', '00000004-0000-0000-0000-000000000005', array[]::text[], null, null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000060', '1088', '', 'Iva Permatasari', '00000004-0000-0000-0000-000000000004', array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000061', null, 'Theresia', 'Danis Ayu Widiastutik', null, array['Tim Young Professional'], '1993-05-31', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000062', null, 'Paulus', 'Frans Mulya Hartono', '00000004-0000-0000-0000-000000000005', array['Tim AV'], '1988-09-08', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000063', null, 'Adrianus', 'Hendri Arianto', '00000004-0000-0000-0000-000000000001', array[]::text[], '1985-02-06', '2011-12-10', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000064', null, 'Kalista', 'Kalista Santi Arum Wahyuningsih', '00000004-0000-0000-0000-000000000001', array['Tim Doa'], '1988-01-17', '2022-05-15', 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000065', null, 'Stefana', 'Stefana Iriana Dewi', '00000004-0000-0000-0000-000000000005', array['Tim Doa'], '1986-09-10', null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000066', null, 'Anastasia', 'Anastasia Sherly Widowati', null, array[]::text[], '1994-03-05', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000067', null, 'Antonius', 'Andrew Sophian Putra', null, array[]::text[], '1986-06-04', '2012-07-07', 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000068', null, 'Antonia', 'Antonia Elvina', '00000004-0000-0000-0000-000000000006', array['Tim Panda'], '1994-04-22', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000069', null, 'Eugenia', 'Febby Gunawan Siswanto', null, array[]::text[], '2000-02-04', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000070', null, 'Fransiska', 'Maria Natalia Dwiastuti', '00000004-0000-0000-0000-000000000006', array['Tim Panda'], '1995-01-08', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000071', null, 'Katherine', 'Melani Puspitasari', '00000004-0000-0000-0000-000000000003', array[]::text[], null, null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000072', null, 'Vincentia', 'Monica', null, array[]::text[], '1989-12-02', '2012-07-07', 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000073', null, 'Maria Magdalena', 'Neressa Arviana', null, array[]::text[], '1991-11-01', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000074', null, 'Gabriella', 'Steffi Carolina Dibrata', null, array[]::text[], '1989-06-15', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000075', null, 'Yohanes Paulus', 'Aswin Surya Hartanto', null, array[]::text[], '1991-08-06', '2016-03-09', 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000076', null, 'Teresa', 'Charoline Agustin', null, array[]::text[], '1997-08-29', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000077', null, 'Gregorius', 'Dita Murpradana', null, array[]::text[], '1988-03-24', '2018-01-21', 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000078', null, 'Francisco Diaz', 'Novianto Bimo Nugroho', null, array[]::text[], '1993-11-25', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000079', null, 'Veronica', 'Risa Pramesti', null, array[]::text[], '1992-10-11', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000080', null, 'Silveria', 'Silveria Anditawati Wibriasari', null, array[]::text[], '1986-06-20', '2020-10-03', 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000081', null, 'Franciskus Xaverius', 'Yanuar Krisandi Setyawan', null, array[]::text[], '1992-09-01', null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000082', null, 'Eugenia', 'Eugenia Clarissa Soebagio', null, array[]::text[], null, null, 'Tidak Aktif', null, null),
  ('00000001-0000-0000-0000-000000000083', '1074', 'Georgius', 'George Peter Sudarmono', '00000004-0000-0000-0000-000000000003', array['Tim Doa'], null, null, 'Aktif', '081548696888', 'george.darmono@gmail.com'),
  ('00000001-0000-0000-0000-000000000084', '1075', '', 'Anna Halim', '00000004-0000-0000-0000-000000000003', array['Tim Doa'], null, null, 'Aktif', '087836118883', null),
  ('00000001-0000-0000-0000-000000000085', '1080', 'Emma', 'Ivana Ayudya Suranggara', '00000004-0000-0000-0000-000000000004', array[]::text[], null, null, 'Aktif', '081326105656', null),
  ('00000001-0000-0000-0000-000000000086', '1082', 'Stefanus', 'Stevanus Ricky Adrian', '00000004-0000-0000-0000-000000000004', array[]::text[], null, null, 'Aktif', '085712859005', null),
  ('00000001-0000-0000-0000-000000000087', '1085', '', 'Alabbi', '00000004-0000-0000-0000-000000000004', array[]::text[], null, null, 'Aktif', null, null),
  ('00000001-0000-0000-0000-000000000088', '1095', '', 'Ricky', null, array[]::text[], null, null, 'Aktif', null, null);

-- Satu kegiatan contoh (dummy): Worship Night 9 Okt 2026. Boleh dihapus/diedit lewat app.
insert into events (id, jenis, tanggal, jam, keterangan, kolekte, pic) values
  ('00000003-0000-0000-0000-000000000001', 'Worship Night', '2026-10-09', '19:00', 'Iman yang Anti Mood Swing', null,
   '{"pd_mc":"","guest_admin":"","pujian_wl":"","pujian_singer":"","pujian_pemusik":"","avp":"","medsos":"","doa":"","snack":"","cg_usher":"","cg_kids":"","kesaksian":""}'::jsonb);

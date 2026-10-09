// Backup data Supabase ke file JSON + CSV (folder ./backup).
// Dijalankan oleh GitHub Actions (lihat .github/workflows/backup.yml) atau manual:
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup.mjs
// Tidak ada kredensial di file ini. Hasil backup berisi data pribadi: JANGAN di-commit.
import { mkdir, writeFile } from 'node:fs/promises';

const URL_ = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.');
  process.exit(1);
}

const TABLES = ['cell_groups', 'members', 'events', 'attendance', 'profiles'];
const PAGE = 1000;

async function fetchAll(table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${URL_}/rest/v1/${table}?select=*&order=id&limit=${PAGE}&offset=${offset}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) throw new Error(`Gagal membaca ${table}: HTTP ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n') + '\r\n';
}

await mkdir('backup', { recursive: true });
const summary = {};
for (const t of TABLES) {
  const rows = await fetchAll(t);
  summary[t] = rows.length;
  await writeFile(`backup/${t}.json`, JSON.stringify(rows, null, 2));
  await writeFile(`backup/${t}.csv`, toCsv(rows));
  console.log(`${t}: ${rows.length} baris`);
}
await writeFile('backup/_info.json', JSON.stringify({ dibuat: new Date().toISOString(), jumlah_baris: summary }, null, 2));

// Pengaman: backup yang kosong/tidak masuk akal dianggap gagal supaya tidak menimpa backup bagus.
if (summary.members === 0 || summary.cell_groups === 0) {
  console.error('Backup mencurigakan: tabel members/cell_groups kosong. Dibatalkan.');
  process.exit(2);
}

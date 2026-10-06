'use client';

// components/charts/AttendanceBarChart.tsx
//
// Port dari barChartSvg() di mockup, pakai Recharts. Tinggi chart TETAP
// (fixed di height prop pada ResponsiveContainer) — batang dinormalisasi
// terhadap nilai tertinggi di dataset, bukan 1px per orang, jadi aman
// walau jumlah anggota bertambah jadi 50-100 orang: tinggi chart tidak
// ikut membesar, cuma skalanya yang menyesuaikan. Lebar yang bertambah
// kalau sesinya banyak sudah ditangani lewat scroll horizontal di
// pembungkusnya (lihat attendanceChartSection di page Ringkasan).
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point = { label: string; value: number };

export function AttendanceBarChart({ data, color }: { data: Point[]; color: string }) {
  const minWidth = Math.max(data.length * 38, 260);
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ width: minWidth, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

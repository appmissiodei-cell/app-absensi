import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { LaporanData } from './laporan';

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  sub: { fontSize: 10, color: '#62718A', marginBottom: 12 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E0E8F4', paddingVertical: 4 },
  head: { backgroundColor: '#EFF4FB', fontWeight: 700 },
  note: { marginTop: 8, fontSize: 9, color: '#8A97AC' },
});

export function LaporanPdf({ data }: { data: LaporanData }) {
  const n = data.columns.length;
  const widths = data.scope === 'event' ? [0.2, 0.25, 0.4, 0.15] : [0.4, 0.3, 0.15, 0.15];
  const cell = (v: string | number, i: number, bold?: boolean) => (
    <Text key={i} style={{ width: `${widths[i] * 100}%`, paddingHorizontal: 4, fontWeight: bold ? 700 : 400 }}>{String(v)}</Text>
  );
  return (
    <Document title={data.title}>
      <Page size="A4" style={s.page} wrap>
        <Text style={s.title}>{data.title}</Text>
        <Text style={s.sub}>Periode: {data.periode}</Text>
        <View style={[s.row, s.head]} fixed>{data.columns.map((c, i) => cell(c, i, true))}</View>
        {data.rows.map((r, ri) => (
          <View key={ri} style={s.row} wrap={false}>{r.slice(0, n).map((v, i) => cell(v, i))}</View>
        ))}
        {data.footer && <View style={s.row}>{data.footer.map((v, i) => cell(v, i, true))}</View>}
        {data.notes.length > 0 && <Text style={s.note}>Difilter — {data.notes.join(' · ')}</Text>}
      </Page>
    </Document>
  );
}

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCBTData } from '@/lib/store';
import { HasilUjianSiswa, JawabanDetailSiswa } from '@/types/cbt';

function HasilNilaiContent() {
  const searchParams = useSearchParams();
  const initialJadwalId = searchParams.get('jadwalId') || 'ALL';

  const { hasilList, allHasilList, jadwalList, allJadwalList } = useCBTData();
  const [scopeFilter, setScopeFilter] = useState<'mine' | 'all'>('mine');
  const activeHasilSource = scopeFilter === 'mine' ? hasilList : allHasilList;
  const activeJadwalSource = scopeFilter === 'mine' ? jadwalList : allJadwalList;

  // Filters
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>(initialJadwalId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State for Student Answer Sheet
  const [inspectedStudent, setInspectedStudent] = useState<HasilUjianSiswa | null>(null);

  // Filtered List
  const filteredHasil = useMemo(() => {
    return activeHasilSource.filter((item) => {
      const matchJadwal = selectedJadwalId === 'ALL' || item.jadwalId === selectedJadwalId;
      const matchQuery =
        item.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nisn.includes(searchQuery);
      const matchKelas = selectedKelas === 'ALL' || item.kelas === selectedKelas;
      const matchStatus = selectedStatus === 'ALL' || item.statusKelulusan === selectedStatus;

      return matchJadwal && matchQuery && matchKelas && matchStatus;
    });
  }, [activeHasilSource, selectedJadwalId, searchQuery, selectedKelas, selectedStatus]);

  // Analytics Computations
  const totalCount = filteredHasil.length;
  const scores = filteredHasil.map((h) => h.nilaiAkhir);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const averageScore =
    scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';

  const tuntasCount = filteredHasil.filter((h) => h.statusKelulusan === 'TUNTAS').length;
  const tuntasPercentage = totalCount > 0 ? Math.round((tuntasCount / totalCount) * 100) : 0;

  // Active Schedule Details (if selected)
  const currentJadwal = activeJadwalSource.find((j) => j.id === selectedJadwalId);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredHasil.length === 0) {
      alert('Tidak ada data hasil ujian untuk diekspor!');
      return;
    }

    const headers = [
      'No',
      'Nama Siswa',
      'NISN',
      'Kelas',
      'Waktu Submit',
      'Durasi Pengerjaan',
      'Nilai Akhir',
      'Status Kelulusan',
      'Skor PG',
      'Skor PGK',
      'Skor Menjodohkan',
      'Skor Uraian',
      'Penguasaan HOTS (%)',
    ];

    const rows = filteredHasil.map((item, idx) => [
      idx + 1,
      `"${item.namaSiswa}"`,
      `'${item.nisn}`,
      item.kelas,
      item.waktuSubmit,
      `"${item.durasiPengerjaan}"`,
      item.nilaiAkhir,
      item.statusKelulusan,
      item.breakdown.pg,
      item.breakdown.pgk,
      item.breakdown.menjodohkan,
      item.breakdown.uraian,
      `${item.breakdown.hotsMasteryRate}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Hasil_CBT_${currentJadwal ? currentJadwal.token : 'Semua'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Hasil & Nilai Siswa CBT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi perolehan nilai, capaian kompetensi AKM, dan inspeksi detail lembar jawaban siswa.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* ANALYTICS SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Nilai Tertinggi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Nilai Tertinggi</span>
            <div className="text-2xl font-black text-emerald-600">{highestScore}</div>
            <span className="text-[11px] text-slate-400">Skor maksimum (100)</span>
          </div>
        </div>

        {/* Metric 2: Nilai Terendah */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Nilai Terendah</span>
            <div className="text-2xl font-black text-rose-600">{lowestScore}</div>
            <span className="text-[11px] text-slate-400">Perlu pendampingan remedial</span>
          </div>
        </div>

        {/* Metric 3: Rata-Rata Kelas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Rata-Rata Kelas</span>
            <div className="text-2xl font-black text-slate-900">{averageScore}</div>
            <span className="text-[11px] text-slate-500 font-medium">KKM Standar: 75</span>
          </div>
        </div>

        {/* Metric 4: Persentase Ketuntasan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Ketuntasan Klasikal</span>
            <div className="text-2xl font-black text-indigo-600">{tuntasPercentage}%</div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                style={{ width: `${tuntasPercentage}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Scope Switcher: Hasil Siswa Saya vs Semua Ujian */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cakupan:
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setScopeFilter('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scopeFilter === 'mine'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📌 Ujian Saya</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    scopeFilter === 'mine' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {hasilList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌐 Semua Ujian</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    scopeFilter === 'all' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {allHasilList.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Exam Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Pilih Sesi Ujian:</span>
          </div>
          <select
            value={selectedJadwalId}
            onChange={(e) => setSelectedJadwalId(e.target.value)}
            className="p-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 max-w-xl w-full"
          >
            <option value="ALL">-- Tampilkan Semua Sesi Ujian ({activeJadwalSource.length}) --</option>
            {activeJadwalSource.map((j) => (
              <option key={j.id} value={j.id}>
                {j.judul} ({j.mataPelajaran})
              </option>
            ))}
          </select>
        </div>

        {/* Search & Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Kelas filter */}
          <div>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700"
            >
              <option value="ALL">Semua Rombel Kelas</option>
              {Array.from(new Set(hasilList.map((h) => h.kelas).filter(Boolean))).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700"
            >
              <option value="ALL">Semua Status Ketuntasan</option>
              <option value="TUNTAS">Tuntas (Nilai &ge; 75)</option>
              <option value="BELUM_TUNTAS">Belum Tuntas (Nilai &lt; 75)</option>
            </select>
          </div>
        </div>
      </div>

      {/* RESULTS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Nama Siswa</th>
                <th className="px-4 py-3.5">Kelas / Rombel</th>
                <th className="px-4 py-3.5">Waktu Submit</th>
                <th className="px-4 py-3.5 text-center">Nilai Akhir</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Rincian Skor Per Butir</th>
                <th className="px-4 py-3.5 text-center">HOTS Mastery</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHasil.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Award className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {hasilList.length === 0 ? 'Belum Ada Rekaman Hasil Ujian Siswa' : 'Tidak ada hasil yang sesuai filter'}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {hasilList.length === 0
                          ? 'Isian nilai lama telah dibersihkan untuk simulasi baru. Silakan coba kerjakan ujian melalui Portal Siswa untuk menguji kalkulasi skor otomatis.'
                          : 'Coba ganti filter atau pilih opsi Semua Jadwal Ujian.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHasil.map((item) => {
                  const isTuntas = item.statusKelulusan === 'TUNTAS';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Kelas */}
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div className="font-bold text-slate-900">{item.namaSiswa}</div>
                      </td>

                      {/* Kelas */}
                      <td className="px-4 py-3.5 font-semibold text-blue-700">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.kelas}
                        </span>
                      </td>

                      {/* Waktu Submit */}
                      <td className="px-4 py-3.5 text-slate-500">
                        <div>{item.waktuSubmit}</div>
                        <div className="text-[10px] text-slate-400">{item.durasiPengerjaan}</div>
                      </td>

                      {/* Nilai Akhir */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-base font-black ${
                            isTuntas ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.nilaiAkhir}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isTuntas
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isTuntas ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {item.statusKelulusan}
                        </span>
                      </td>

                      {/* Breakdown Tags */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            PG: {item.breakdown.pg}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                            PGK: {item.breakdown.pgk}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
                            Jodoh: {item.breakdown.menjodohkan}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">
                            Uraian: {item.breakdown.uraian}
                          </span>
                        </div>
                      </td>

                      {/* HOTS Mastery */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          {item.breakdown.hotsMasteryRate}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setInspectedStudent(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lembar Jawaban</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= MODAL DETAIL LEMBAR JAWABAN SISWA ======================= */}
      {inspectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Inspeksi Lembar Jawaban Siswa
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {inspectedStudent.namaSiswa}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Kelas: {inspectedStudent.kelas}
                  </span>
                  <span>•</span>
                  <span>Disubmit: {inspectedStudent.waktuSubmit}</span>
                </div>
              </div>

              {/* Score Badge */}
              <div className="text-right">
                <div
                  className={`text-3xl font-black ${
                    inspectedStudent.statusKelulusan === 'TUNTAS'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {inspectedStudent.nilaiAkhir}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inspectedStudent.statusKelulusan === 'TUNTAS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {inspectedStudent.statusKelulusan}
                </span>
              </div>
            </div>

            {/* Questions Review List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pemeriksaan Butir per Butir (Kunci Jawaban vs Respon Siswa):
              </h4>

              {inspectedStudent.jawabanDetail.map((soal, idx) => (
                <div
                  key={soal.soalId}
                  className={`p-4 rounded-2xl border text-xs space-y-3 ${
                    soal.isBenar
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  {/* Top Bar of each question */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Soal #{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {soal.tipeSoal}
                      </span>
                      {soal.isHots && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          HOTS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">
                        Poin: {soal.nilaiDiperoleh} / {soal.bobot}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          soal.isBenar
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {soal.isBenar ? 'BENAR' : 'PERLU PERBAIKAN'}
                      </span>
                    </div>
                  </div>

                  {/* Pertanyaan */}
                  <p className="font-medium text-slate-800 leading-relaxed">{soal.pertanyaan}</p>

                  {/* Comparison: Student Answer vs Answer Key */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Jawaban Siswa:
                      </span>
                      <p
                        className={`font-semibold ${
                          soal.isBenar ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {soal.jawabanSiswa}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Kunci Jawaban Guru:
                      </span>
                      <p className="font-semibold text-slate-700">{soal.kunciJawaban}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Pengerjaan otomatis tervalidasi oleh Engine CBT.
              </span>
              <button
                onClick={() => setInspectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Tutup Lembar Jawaban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HasilNilaiPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-sm">
          Memuat Hasil & Nilai Siswa...
        </div>
      }
    >
      <HasilNilaiContent />
    </Suspense>
  );
}


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
  Edit3,
  Save,
  Wand2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useCBTData } from '@/lib/store';
import { HasilUjianSiswa, JawabanDetailSiswa } from '@/types/cbt';

function HasilNilaiContent() {
  const searchParams = useSearchParams();
  const initialJadwalId = searchParams.get('jadwalId') || 'ALL';

  const { hasilList, allHasilList, jadwalList, allJadwalList, addHasilUjian } = useCBTData();
  const [scopeFilter, setScopeFilter] = useState<'mine' | 'all'>('mine');
  const activeHasilSource = scopeFilter === 'mine' ? hasilList : allHasilList;
  const activeJadwalSource = scopeFilter === 'mine' ? jadwalList : allJadwalList;

  // Filters
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>(initialJadwalId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State for Student Answer Sheet & Manual Correction
  const [inspectedStudent, setInspectedStudent] = useState<HasilUjianSiswa | null>(null);
  const [editingStudentHasil, setEditingStudentHasil] = useState<HasilUjianSiswa | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

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

  // =========================================================================
  // HELPER & ACTIONS FOR INSPECTING & EDITING STUDENT SCORES (KOREKSI MANUAL)
  // =========================================================================
  const handleOpenLembarJawaban = (item: HasilUjianSiswa) => {
    setInspectedStudent(item);
    setEditingStudentHasil(JSON.parse(JSON.stringify(item)));
    setSaveSuccessMsg(null);
  };

  const recalculateHasilScores = (h: HasilUjianSiswa): HasilUjianSiswa => {
    let pg = 0;
    let pgk = 0;
    let menjodohkan = 0;
    let uraian = 0;
    let earnedHots = 0;
    let totalHots = 0;
    let totalScore = 0;
    let maxScore = 0;

    h.jawabanDetail.forEach((q) => {
      const bobot = q.bobot || 10;
      maxScore += bobot;
      const earned = Math.max(0, Math.min(bobot, Number(q.nilaiDiperoleh) || 0));
      totalScore += earned;

      if (q.isHots) {
        totalHots += bobot;
        earnedHots += earned;
      }

      if (q.tipeSoal === 'PG') pg += earned;
      else if (q.tipeSoal === 'PGK') pgk += earned;
      else if (q.tipeSoal === 'MENJODOHKAN') menjodohkan += earned;
      else if (q.tipeSoal === 'URAIAN') uraian += earned;
    });

    const scaledScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const kkm = currentJadwal?.kkm || 75;
    const isTuntas = scaledScore >= kkm;

    return {
      ...h,
      nilaiAkhir: scaledScore,
      statusKelulusan: isTuntas ? 'TUNTAS' : 'BELUM_TUNTAS',
      breakdown: {
        pg,
        pgk,
        menjodohkan,
        uraian,
        hotsMasteryRate: totalHots > 0 ? Math.round((earnedHots / totalHots) * 100) : 100,
      },
    };
  };

  const handleToggleQuestionStatus = (soalId: string, shouldBeBenar: boolean) => {
    if (!editingStudentHasil) return;
    const updated = JSON.parse(JSON.stringify(editingStudentHasil)) as HasilUjianSiswa;
    const targetQ = updated.jawabanDetail.find((d) => d.soalId === soalId);
    if (!targetQ) return;

    targetQ.isBenar = shouldBeBenar;
    targetQ.nilaiDiperoleh = shouldBeBenar ? targetQ.bobot : 0;

    const recalculated = recalculateHasilScores(updated);
    setEditingStudentHasil(recalculated);
  };

  const handleScoreInputChange = (soalId: string, points: number) => {
    if (!editingStudentHasil) return;
    const updated = JSON.parse(JSON.stringify(editingStudentHasil)) as HasilUjianSiswa;
    const targetQ = updated.jawabanDetail.find((d) => d.soalId === soalId);
    if (!targetQ) return;

    const safePoints = Math.max(0, Math.min(targetQ.bobot, points));
    targetQ.nilaiDiperoleh = safePoints;
    targetQ.isBenar = safePoints === targetQ.bobot;

    const recalculated = recalculateHasilScores(updated);
    setEditingStudentHasil(recalculated);
  };

  const handleAutoFixMenjodohkan = () => {
    if (!editingStudentHasil) return;
    const updated = JSON.parse(JSON.stringify(editingStudentHasil)) as HasilUjianSiswa;
    let fixedCount = 0;

    updated.jawabanDetail = updated.jawabanDetail.map((soal) => {
      if (soal.tipeSoal === 'MENJODOHKAN') {
        let isCorrect = false;
        let formattedAnswer = soal.jawabanSiswa;

        try {
          if (soal.jawabanSiswa.trim().startsWith('{') && soal.jawabanSiswa.trim().endsWith('}')) {
            const parsed = JSON.parse(soal.jawabanSiswa) as Record<string, string>;
            const parsedEntries = Object.entries(parsed);

            // Parse kunciJawaban: "Dekomposisi -> Memecah masalah menjadi bagian kecil; Pengenalan Pola -> ..."
            const keyPairs = soal.kunciJawaban.split(';').map((s) => {
              const [premis, target] = s.split('->').map((p) => (p || '').trim());
              return { premis: premis || '', target: target || '' };
            });

            const studentValues = parsedEntries.map(([_, v]) => v.trim().toLowerCase());
            const expectedTargets = keyPairs.map((kp) => kp.target.trim().toLowerCase());

            const matchedAll =
              expectedTargets.length > 0 &&
              expectedTargets.every((t) => studentValues.includes(t));

            if (matchedAll) {
              isCorrect = true;
              fixedCount++;
              formattedAnswer = keyPairs
                .map((kp, idx) => {
                  const val =
                    parsed[`pair-${idx + 1}`] ||
                    parsed[kp.premis] ||
                    studentValues[idx] ||
                    kp.target;
                  return `${kp.premis} -> ${val}`;
                })
                .join('; ');
            }
          } else {
            const keyTargets = soal.kunciJawaban
              .split(';')
              .map((s) => (s.split('->')[1] || '').trim().toLowerCase())
              .filter(Boolean);
            if (
              keyTargets.length > 0 &&
              keyTargets.every((t) => soal.jawabanSiswa.toLowerCase().includes(t))
            ) {
              isCorrect = true;
              fixedCount++;
            }
          }
        } catch (e) {
          console.warn('Auto-fix parse err:', e);
        }

        if (isCorrect) {
          return {
            ...soal,
            isBenar: true,
            nilaiDiperoleh: soal.bobot,
            jawabanSiswa: formattedAnswer,
          };
        }
      }
      return soal;
    });

    const recalculated = recalculateHasilScores(updated);
    setEditingStudentHasil(recalculated);
    setSaveSuccessMsg(
      fixedCount > 0
        ? `⚡ Berhasil mengoreksi ${fixedCount} butir Menjodohkan menjadi BENAR (Skor 100%). Klik "Simpan Perubahan Nilai" untuk menetapkan!`
        : 'Seluruh butir Menjodohkan telah diperiksa.'
    );
  };

  const handleSaveEditedHasil = () => {
    if (!editingStudentHasil) return;
    addHasilUjian(editingStudentHasil);
    setInspectedStudent(editingStudentHasil);
    setSaveSuccessMsg('✅ Sukses! Perubahan nilai dan koreksi jawaban berhasil disimpan ke sistem CBT.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
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
                          onClick={() => handleOpenLembarJawaban(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
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

      {/* ======================= MODAL DETAIL & KOREKSI LEMBAR JAWABAN SISWA ======================= */}
      {inspectedStudent && editingStudentHasil && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Inspeksi & Koreksi Lembar Jawaban Siswa
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {editingStudentHasil.namaSiswa}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Kelas: {editingStudentHasil.kelas}
                  </span>
                  <span>•</span>
                  <span>NISN: {editingStudentHasil.nisn}</span>
                  <span>•</span>
                  <span>Disubmit: {editingStudentHasil.waktuSubmit}</span>
                </div>
              </div>

              {/* Live Recalculated Score Badge */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400">NILAI AKHIR:</div>
                  <div
                    className={`text-3xl font-black ${
                      editingStudentHasil.statusKelulusan === 'TUNTAS'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {editingStudentHasil.nilaiAkhir}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      editingStudentHasil.statusKelulusan === 'TUNTAS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {editingStudentHasil.statusKelulusan}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setInspectedStudent(null);
                    setEditingStudentHasil(null);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {saveSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setSaveSuccessMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Teacher Correction Toolbar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/60 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Alat Koreksi Guru & Override Nilai</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Klik tombol cepat pada setiap butir soal untuk mengubah status penilaian respon siswa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFixMenjodohkan}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                  title="Otomatis mengecek dan membetulkan soal Menjodohkan yang format responnya cocok"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>⚡ Koreksi Otomatis Menjodohkan</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditedHasil}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Nilai</span>
                </button>
              </div>
            </div>

            {/* Questions Review & Edit List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Pemeriksaan Butir per Butir (Kunci Jawaban vs Respon Siswa):</span>
                <span className="text-[11px] font-normal normal-case text-slate-400">
                  Total {editingStudentHasil.jawabanDetail.length} Butir Soal
                </span>
              </h4>

              {editingStudentHasil.jawabanDetail.map((soal, idx) => (
                <div
                  key={soal.soalId || idx}
                  className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                    soal.isBenar
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  {/* Top Bar of each question */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm">Soal #{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-semibold text-[10px] border border-slate-200 shadow-xs">
                        {soal.tipeSoal}
                      </span>
                      {soal.isHots && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          HOTS
                        </span>
                      )}
                    </div>

                    {/* Quick Teacher Score Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionStatus(soal.soalId, true)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                          soal.isBenar
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                        }`}
                        title="Tandai butir ini sebagai BENAR (Skor Penuh)"
                      >
                        <Check className="w-3 h-3" />
                        <span>Tandai Benar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleQuestionStatus(soal.soalId, false)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                          !soal.isBenar
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                        title="Tandai butir ini sebagai PERLU PERBAIKAN (0 Poin)"
                      >
                        <X className="w-3 h-3" />
                        <span>Tandai Salah</span>
                      </button>

                      {/* Manual Score Input */}
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-300">
                        <span className="text-[10px] text-slate-500 font-bold">Poin:</span>
                        <input
                          type="number"
                          min="0"
                          max={soal.bobot}
                          value={soal.nilaiDiperoleh}
                          onChange={(e) =>
                            handleScoreInputChange(soal.soalId, parseFloat(e.target.value) || 0)
                          }
                          className="w-10 text-center font-bold text-slate-800 border-none p-0 focus:ring-0 text-xs"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">/ {soal.bobot}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pertanyaan */}
                  <p className="font-semibold text-slate-800 leading-relaxed">{soal.pertanyaan}</p>

                  {/* Comparison: Student Answer vs Answer Key */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Jawaban Siswa:
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            soal.isBenar
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {soal.isBenar ? 'BENAR' : 'PERLU PERBAIKAN'}
                        </span>
                      </div>
                      <p
                        className={`font-semibold text-xs leading-relaxed break-words ${
                          soal.isBenar ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {soal.jawabanSiswa}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Kunci Jawaban Guru:
                      </span>
                      <p className="font-semibold text-slate-700 text-xs leading-relaxed break-words">
                        {soal.kunciJawaban}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 text-center sm:text-left">
                Setelah mengoreksi atau mengubah poin, pastikan Anda menekan tombol <b>Simpan Perubahan Nilai</b>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEditedHasil}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Nilai</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInspectedStudent(null);
                    setEditingStudentHasil(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
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


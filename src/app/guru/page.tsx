'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getGuruProfile } from '@/lib/guru-auth';
import {
  FileQuestion,
  CalendarClock,
  Users,
  Award,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  BookOpen,
  Layers,
  Zap,
} from 'lucide-react';
import { useCBTData } from '@/lib/store';

export default function GuruOverviewPage() {
  const { soalList, allSoalList, jadwalList, hasilList, isLoaded } = useCBTData();
  const [teacherName, setTeacherName] = useState('Bapak/Ibu Guru');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const prof = getGuruProfile();
    if (prof?.namaLengkap) {
      setTeacherName(prof.namaLengkap);
    }
    if (prof?.role === 'admin' || prof?.username?.toLowerCase() === 'admin') {
      setIsAdmin(true);
    }

    const handleAuth = () => {
      const updated = getGuruProfile();
      if (updated?.namaLengkap) {
        setTeacherName(updated.namaLengkap);
      }
      if (updated?.role === 'admin' || updated?.username?.toLowerCase() === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    window.addEventListener('guru-auth-change', handleAuth);
    return () => window.removeEventListener('guru-auth-change', handleAuth);
  }, []);

  // Metric computations
  const totalSoal = soalList.length;
  const hotsCount = soalList.filter((s) => s.isHots).length;
  const regularCount = totalSoal - hotsCount;
  const hotsPercentage = totalSoal > 0 ? Math.round((hotsCount / totalSoal) * 100) : 0;

  const jadwalAktif = jadwalList.filter((j) => j.status === 'SEDANG_BERLANGSUNG').length;
  const totalJadwal = jadwalList.length;

  const totalSiswa = 128; // Enrolled across classes 7A-8D
  const totalSubmissions = hasilList.length;

  const averageScore =
    hasilList.length > 0
      ? (hasilList.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / hasilList.length).toFixed(1)
      : '0';

  const tuntasCount = hasilList.filter((h) => h.statusKelulusan === 'TUNTAS').length;
  const ketuntasanPersen = hasilList.length > 0 ? Math.round((tuntasCount / hasilList.length) * 100) : 0;

  // Breakdown by AKM subjects
  const literasiCount = soalList.filter((s) => s.mataPelajaran.toLowerCase().includes('literasi')).length;
  const numerasiCount = soalList.filter((s) => s.mataPelajaran.toLowerCase().includes('numerasi')).length;
  const sainsCount = soalList.filter((s) => s.mataPelajaran.toLowerCase().includes('ipa') || s.mataPelajaran.toLowerCase().includes('sains')).length;
  const ipsCount = soalList.filter((s) => s.mataPelajaran.toLowerCase().includes('ips') || s.mataPelajaran.toLowerCase().includes('sosial')).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* SUPER ADMIN NOTICE & QUICK ACCESS */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-700 p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-300/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  👑 Mode Super Administrator Aktif
                </h2>
                <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full">
                  Hak Akses Penuh
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Anda memiliki akses mengelola semua guru terdaftar, seluruh bank butir soal, jadwal ujian, dan rekap nilai siswa.
              </p>
            </div>
          </div>
          <Link
            href="/guru/admin"
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-extrabold text-xs shadow-md hover:bg-amber-50 transition flex items-center justify-center gap-1.5 shrink-0 hover:scale-[1.02]"
          >
            <span>Buka Konsol Super Admin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10 border border-blue-500/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Dashboard Guru Terpadu - SMP Fase D</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Selamat Datang, {teacherName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            Kelola bank soal berbasis AKM & HOTS, jadwalkan ujian interaktif, serta pantau capaian ketuntasan literasi dan numerasi siswa secara real-time.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/guru/bank-soal?tab=editor"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs sm:text-sm hover:bg-blue-50 shadow-md transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Soal AKM Baru</span>
            </Link>
            <Link
              href="/guru/jadwal"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-medium text-xs sm:text-sm backdrop-blur-sm border border-white/20 transition-all"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Rilis Jadwal CBT</span>
            </Link>
            <Link
              href="/guru/hasil"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 text-slate-200 font-medium text-xs sm:text-sm backdrop-blur-sm border border-white/10 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Analisis Hasil Siswa</span>
            </Link>
          </div>
        </div>

        {/* Decorative graphic / watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <Brain className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Bank Soal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Bank Soal
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalSoal}</span>
            <span className="text-xs text-slate-500 font-medium">
              butir soal Anda {allSoalList.length > totalSoal && `(total kolektif: ${allSoalList.length})`}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {hotsCount} HOTS ({hotsPercentage}%)
            </span>
            <Link href="/guru/bank-soal" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Kelola <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Jadwal CBT Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Jadwal CBT Aktif
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{jadwalAktif}</span>
            <span className="text-xs text-slate-500 font-medium">dari {totalJadwal} sesi</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-800 bg-amber-100/70 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Sesi Live Berjalan
            </span>
            <Link href="/guru/jadwal" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Atur Sesi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Siswa Terdaftar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Siswa Terdaftar
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalSiswa}</span>
            <span className="text-xs text-slate-500 font-medium">siswa terdata</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium text-slate-500">Target Fase D: VII & VIII</span>
            <span className="text-indigo-600 font-semibold">{totalSubmissions} submit</span>
          </div>
        </div>

        {/* Card 4: Rata-Rata Nilai CBT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Nilai CBT
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{averageScore}</span>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-md">
              {ketuntasanPersen}% Tuntas (&ge; 75)
            </span>
            <Link href="/guru/hasil" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Rapor <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: AKM & HOTS ANALYTICS vs RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): AKM & HOTS Distribution Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Distribusi Soal AKM & Kognitif */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Distribusi Dimensi AKM & Level Kognitif HOTS
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemetaan instrumen evaluasi berdasarkan Framework Asesmen Nasional Kemendikbudristek
                </p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-lg border border-blue-200">
                Fase D (SMP)
              </span>
            </div>

            {/* AKM Dimension Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Domain Asesmen Kompetensi Minimum</span>
                <span className="text-slate-500">Total {totalSoal} Soal Terdaftar</span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${Math.max(15, (literasiCount / (totalSoal || 1)) * 100)}%` }}
                  className="bg-blue-600 transition-all hover:opacity-90"
                  title={`Literasi Membaca: ${literasiCount} soal`}
                />
                <div
                  style={{ width: `${Math.max(15, (numerasiCount / (totalSoal || 1)) * 100)}%` }}
                  className="bg-emerald-500 transition-all hover:opacity-90"
                  title={`Numerasi: ${numerasiCount} soal`}
                />
                <div
                  style={{ width: `${Math.max(15, (sainsCount / (totalSoal || 1)) * 100)}%` }}
                  className="bg-violet-500 transition-all hover:opacity-90"
                  title={`Sains: ${sainsCount} soal`}
                />
                <div
                  style={{ width: `${Math.max(10, (ipsCount / (totalSoal || 1)) * 100)}%` }}
                  className="bg-amber-500 transition-all hover:opacity-90"
                  title={`Sosial Budaya: ${ipsCount} soal`}
                />
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="w-3 h-3 rounded-md bg-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Literasi ({literasiCount})</p>
                    <p className="text-[10px] text-slate-500">Teks Wacana & Fiksi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Numerasi ({numerasiCount})</p>
                    <p className="text-[10px] text-slate-500">Grafik, Data & Hitung</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50/60 border border-violet-100">
                  <span className="w-3 h-3 rounded-md bg-violet-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Sains ({sainsCount})</p>
                    <p className="text-[10px] text-slate-500">Eksplorasi Alam</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                  <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Sosial ({ipsCount})</p>
                    <p className="text-[10px] text-slate-500">Kearifan Nusantara</p>
                  </div>
                </div>
              </div>
            </div>

            {/* HOTS vs Regular Comparison Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Rasio HOTS (Higher-Order Thinking Skills)
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Level C4 - C6
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Menuntut penalaran analitis, evaluasi kritis, dan sintesis solusi nyata
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-2xl font-black text-slate-900">{hotsPercentage}%</span>
                <span className="text-xs text-slate-500 font-medium">
                  {hotsCount} HOTS : {regularCount} Reguler
                </span>
              </div>
            </div>

            {/* Cognitive Level Breakdown Grid (C1 - C6) */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Pemetaan Level Kognitif Bloom Terpadu
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                {[
                  { lvl: 'C1', name: 'Mengingat', count: 0, tag: 'LOTS' },
                  { lvl: 'C2', name: 'Memahami', count: 0, tag: 'LOTS' },
                  { lvl: 'C3', name: 'Menerapkan', count: 1, tag: 'MOTS' },
                  { lvl: 'C4', name: 'Menganalisis', count: 2, tag: 'HOTS' },
                  { lvl: 'C5', name: 'Mengevaluasi', count: 1, tag: 'HOTS' },
                  { lvl: 'C6', name: 'Mencipta', count: 1, tag: 'HOTS' },
                ].map((item) => (
                  <div
                    key={item.lvl}
                    className={`p-2.5 rounded-xl border transition-all ${
                      item.tag === 'HOTS'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>{item.lvl}</span>
                      <span
                        className={`px-1 rounded text-[9px] ${
                          item.tag === 'HOTS'
                            ? 'bg-amber-200/80 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-base font-extrabold mt-1 text-slate-900">{item.count}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Actionable Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">Siapkan Ujian Tengah Semester (ASTS Genap)</p>
                <p className="text-xs text-slate-300">
                  Pastikan stimulus gambar berkualitas tinggi dan kunci jawaban PGK tervalidasi.
                </p>
              </div>
            </div>
            <Link
              href="/guru/bank-soal?tab=editor"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs text-center shrink-0 transition-colors shadow-md shadow-blue-500/20"
            >
              + Tambah Soal Sekarang
            </Link>
          </div>
        </div>

        {/* Right Column (1 col): Recent Exam Activity & Active Schedule Snapshot */}
        <div className="space-y-6">
          {/* Active Schedule Quick Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Ujian Sedang Berjalan
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                LIVE
              </span>
            </div>

            {jadwalList.filter((j) => j.status === 'SEDANG_BERLANGSUNG').slice(0, 1).map((jadwal) => (
              <div key={jadwal.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {jadwal.mataPelajaran}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs bg-slate-800 text-amber-300 px-2.5 py-1 rounded-md shadow-sm">
                    <span>TOKEN:</span>
                    <span className="tracking-widest">{jadwal.token}</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-800 line-clamp-2">{jadwal.judul}</p>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Target Kelas:</span>
                    <span className="font-semibold text-slate-700">{jadwal.targetKelas.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durasi Waktu:</span>
                    <span className="font-semibold text-slate-700">{jadwal.durasiMenit} Menit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Soal:</span>
                    <span className="font-semibold text-slate-700">{jadwal.totalSoal} butir (Bobot {jadwal.totalBobot})</span>
                  </div>
                </div>

                <Link
                  href="/guru/jadwal"
                  className="block text-center w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Kelola Token & Jadwal
                </Link>
              </div>
            ))}
          </div>

          {/* Activity Feed: Recent Student Submissions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Aktivitas Ujian Terkini
              </h3>
              <Link href="/guru/hasil" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3">
              {hasilList.slice(0, 4).map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                      {res.namaSiswa.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{res.namaSiswa}</p>
                      <p className="text-[11px] text-slate-400">
                        {res.kelas} • {res.waktuSubmit.split(' ')[1] || 'Baru saja'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-black text-sm ${
                        res.statusKelulusan === 'TUNTAS' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {res.nilaiAkhir}
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        res.statusKelulusan === 'TUNTAS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {res.statusKelulusan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

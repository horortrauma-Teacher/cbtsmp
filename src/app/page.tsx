"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  BookOpen, 
  Calculator, 
  BrainCircuit, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Users, 
  FileCheck,
  CheckCircle2,
  KeyRound,
  UserCheck,
  LogIn,
  Unlock,
  Calendar
} from "lucide-react";
import { getGuruProfile } from "@/lib/guru-auth";
import { useCBTData } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { allJadwalList, jadwalList } = useCBTData();
  const availableSchedules = allJadwalList && allJadwalList.length > 0 ? allJadwalList : jadwalList;
  const [nama, setNama] = useState("");
  const [kelas, setKelas] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [isLoggedInGuru, setIsLoggedInGuru] = useState(false);
  const [guruName, setGuruName] = useState<string | null>(null);

  // Auto-select schedule
  useEffect(() => {
    if (availableSchedules.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(availableSchedules[0].id);
    }
  }, [availableSchedules, selectedScheduleId]);

  // Monitor Guru login status
  useEffect(() => {
    const checkAuth = () => {
      const profile = getGuruProfile();
      if (profile && profile.isLoggedIn) {
        setIsLoggedInGuru(true);
        setGuruName(profile.namaLengkap);
      } else {
        setIsLoggedInGuru(false);
        setGuruName(null);
      }
    };

    checkAuth();
    window.addEventListener("guru-auth-change", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("guru-auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const guruDestination = isLoggedInGuru ? "/guru" : "/guru/login";

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert("Silakan masukkan Nama Lengkap Siswa!");
      return;
    }
    if (!kelas.trim()) {
      alert("Silakan masukkan Kelas / Rombel Siswa (misal: 7-A, 8-1)!");
      return;
    }

    if (availableSchedules.length === 0) {
      alert("Belum ada jadwal ujian yang dibuat oleh guru. Silakan buka Dasbor Guru untuk membuat jadwal ujian terlebih dahulu!");
      return;
    }

    const targetId = selectedScheduleId || availableSchedules[0].id;

    // Set student info to session storage for exam persistence
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cbt_student_nama", nama);
      sessionStorage.setItem("cbt_student_kelas", kelas);
      sessionStorage.setItem("cbt_student_nisn", kelas);
      sessionStorage.setItem(`cbt_exam_started_${targetId}`, "true");
    }

    router.push(`/exam/${targetId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-700 to-indigo-800 bg-clip-text text-transparent">
                CBT Guru Hebat Indonesia
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                Fase D (SMP) & SMA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={guruDestination}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm hover:border-slate-400"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{isLoggedInGuru ? "Dasbor Guru" : "Portal Guru"}</span>
            </Link>
            <Link
              href="/exam/demo-fase-d"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition shadow-sm shadow-sky-500/25"
            >
              <span>Demo CBT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Portals Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform CBT Terintegrasi AKM & HOTS Kurikulum Merdeka</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Asesmen Berbasis Komputer Modern untuk{" "}
            <span className="text-sky-600 underline decoration-sky-300 decoration-wavy decoration-2">
              Siswa SMP & SMA
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Didesain khusus untuk Asesmen Kompetensi Minimum (AKM) Literasi Membaca dan Numerasi Fase D. Dilengkapi wacana stimulus interaktif, ragam tipe soal PGK, menjodohkan, dan analisis HOTS.
          </p>
        </div>

        {/* Two Entrance Cards: Siswa & Guru */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto w-full">
          {/* Student Exam Access Card (Left/Primary) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-sky-400/80 shadow-xl shadow-sky-100 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-sky-100/50 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Portal Siswa - Masuk Ujian</h2>
                    <p className="text-xs text-slate-500">Pilih sesi ujian dan masukkan identitas siswa</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Server Aktif
                </span>
              </div>

              <form onSubmit={handleStartExam} className="space-y-4">
                {/* Pilih Sesi Jadwal Ujian */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>Pilih Sesi Ujian CBT Aktif:</span>
                  </label>
                  {availableSchedules.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                      <p className="font-bold">Belum ada Jadwal Ujian yang dibuat oleh guru.</p>
                      <p className="text-[11px] text-slate-600">
                        Silakan buka <b>Dasbor Guru</b> untuk membuat jadwal ujian baru terlebih dahulu.
                      </p>
                      <Link
                        href="/guru/jadwal"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                      >
                        <span>Ke Menu Jadwal Guru</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border-2 border-sky-300 bg-sky-50/40 text-slate-800 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      {availableSchedules.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.mataPelajaran} — {j.judul} ({j.totalSoal} Soal • {j.durasiMenit} Menit)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      required
                      placeholder="Masukkan Nama Lengkap Anda"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium text-slate-800 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Kelas / Rombel Siswa
                    </label>
                    <input
                      type="text"
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      required
                      placeholder="Contoh: 7-A, 7-1, 8-B, dll"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium text-slate-800 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={availableSchedules.length === 0}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-white transition shadow-lg flex items-center justify-center gap-2 text-base cursor-pointer ${
                      availableSchedules.length === 0
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-500/25 hover:scale-[1.01]'
                    }`}
                  >
                    <span>🚀 Mulai Ujian Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autosave & Proteksi Gangguan Jaringan</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Durasi: 60 Menit</span>
              </div>
            </div>
          </div>

          {/* Teacher Portal Card (Right) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Portal Guru</h2>
                    <p className="text-xs text-slate-500">Kelola soal, jadwal CBT, dan penilaian</p>
                  </div>
                </div>
                {isLoggedInGuru && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Sesi Aktif
                  </span>
                )}
              </div>

              {/* Default Credential Info Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs mb-5">
                <div className="flex items-center gap-2 mb-1.5 text-indigo-900 font-bold">
                  <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Kredensial Akses Guru:</span>
                </div>
                <div className="pl-6 space-y-1 text-slate-600 text-[11px]">
                  <p>
                    Username: <span className="font-mono font-semibold text-slate-800">budi_santoso</span> (atau NIP/Preset)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>Password default:</span>
                    <span className="font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      cbt2026
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 border border-slate-200/60">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Bank Soal AKM & HOTS</p>
                    <p className="text-slate-500">Input wacana stimulus, soal PG, PGK, menjodohkan, dan uraian.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 border border-slate-200/60">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Manajemen Jadwal CBT</p>
                    <p className="text-slate-500">Rilis jadwal ujian, acak urutan soal, dan batas durasi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 border border-slate-200/60">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Koreksi & Analitik Nilai</p>
                    <p className="text-slate-500">Skor otomatis, persentase HOTS, dan ekspor lembar nilai.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link
                href={guruDestination}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 text-sm"
              >
                {isLoggedInGuru ? (
                  <>
                    <span>Buka Dasbor Guru ({guruName || "Aktif"})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Portal Guru (Login)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Link>
              <Link
                href={isLoggedInGuru ? "/guru/bank-soal" : "/guru/login"}
                className="w-full py-2 px-4 rounded-xl font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition flex items-center justify-center gap-2 text-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Langsung ke Input Soal & Stimulus</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Grid Highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Literasi Membaca</h3>
              <p className="text-xs text-slate-500 mt-1">
                Wacana saintifik, narasi, dan infografis terintegrasi dalam tampilan split-screen.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Numerasi Realistis</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data tabel statistik, diagram batang, dan pemecahan masalah kontekstual.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Standar Soal HOTS</h3>
              <p className="text-xs text-slate-500 mt-1">
                Level kognitif C4 (Menganalisis), C5 (Mengevaluasi), dan C6 (Mencipta).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">4 Format Soal AKM</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilihan Ganda (PG), Pilihan Ganda Kompleks (PGK), Menjodohkan, dan Uraian.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 CBT Guru Hebat Indonesia. Platform Asesmen SMP Fase D & SMA.</span>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Next.js App Router</span>
            <span>&bull;</span>
            <span>Tailwind CSS</span>
            <span>&bull;</span>
            <span>Supabase Database</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

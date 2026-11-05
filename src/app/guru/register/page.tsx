'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  User,
  Lock,
  School,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FolderLock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { registerGuru } from '@/lib/guru-auth';

export default function GuruRegisterPage() {
  const router = useRouter();

  // Form State
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [nip, setNip] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!namaLengkap.trim()) {
      setErrorMessage('Nama lengkap beserta gelar akademik wajib diisi.');
      return;
    }

    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username minimal 3 karakter (hanya huruf kecil, angka, dan tanda hubung).');
      return;
    }

    if (!sekolah.trim()) {
      setErrorMessage('Asal sekolah / madrasah wajib diisi.');
      return;
    }

    if (!mataPelajaran.trim()) {
      setErrorMessage('Mata pelajaran yang diampu wajib diisi.');
      return;
    }

    if (password.length < 4) {
      setErrorMessage('Kata sandi minimal 4 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerGuru({
        username: cleanUser,
        password: password,
        namaLengkap: namaLengkap.trim(),
        nip: nip.trim(),
        sekolah: sekolah.trim(),
        mataPelajaran: mataPelajaran.trim(),
      });

      if (!result.success) {
        setIsLoading(false);
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(`Akun berhasil dibuat! Mengalihkan ke Dasbor Guru sebagai ${namaLengkap.trim()}...`);

      // Clear client storage so previous accounts are completely flushed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cbt_soal_bank');
        localStorage.removeItem('cbt_jadwal_list');
        localStorage.removeItem('cbt_stimulus_list');
        localStorage.removeItem('cbt_hasil_ujian');
      }

      setTimeout(() => {
        router.push('/guru');
      }, 900);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal mendaftarkan akun guru.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl mb-4">
        <Link
          href="/guru/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Masuk Guru</span>
        </Link>
      </div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/20 ring-4 ring-sky-500/15 mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Daftar Akun Guru Baru
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Buat akun pribadi Anda untuk mengelola Bank Soal, Stimulus Wacana, & Jadwal CBT Mandiri
        </p>
      </div>

      {/* Main Register Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-7 px-6 sm:px-9 shadow-2xl rounded-3xl border border-slate-800 text-slate-100">
          {/* Security & Isolation Callout */}
          <div className="mb-5 p-3.5 rounded-2xl bg-sky-950/50 border border-sky-800/40 text-sky-200 text-xs flex items-start gap-2.5">
            <FolderLock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px] sm:text-xs">
              <strong className="text-sky-300">Ruang Data Terisolasi:</strong> Setiap akun guru memiliki direktori penyimpanan dan bank soal tersendiri di Supabase Cloud. Soal yang Anda buat aman dan tidak akan bercampur dengan guru lain.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Nama Lengkap + Gelar */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                Nama Lengkap & Gelar Akademik <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Grid 2 kolom: Username & NIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  Username Unik Akun <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Contoh: bu_siti / 19740921"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Digunakan saat masuk (login).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  NIP / NUPTK (Opsional)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="18 digit NIP resmi"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Grid 2 kolom: Sekolah & Mapel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-sky-400" />
                  Asal Sekolah / Madrasah <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sekolah}
                  onChange={(e) => setSekolah(e.target.value)}
                  placeholder="Contoh: SMP Negeri 1"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  Mata Pelajaran Diampu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  placeholder="Contoh: Bahasa Indonesia"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Grid 2 kolom: Password & Konfirmasi Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    Kata Sandi <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Tutup' : 'Lihat'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  Konfirmasi Sandi <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi Anda"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/70 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/70 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mendaftarkan ke Database Supabase...</span>
                </>
              ) : (
                <>
                  <span>✨ Buat Akun & Masuk ke Dasbor Guru</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Redirection Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Sudah memiliki akun guru sebelumnya?{' '}
              <Link
                href="/guru/login"
                className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition"
              >
                Masuk di Sini
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Sistem CBT Asesmen Kompetensi Siswa &bull; Database Terisolasi Cloud Supabase
        </p>
      </div>
    </div>
  );
}

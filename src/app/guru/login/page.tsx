'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  FolderLock,
} from 'lucide-react';
import { loginGuru } from '@/lib/guru-auth';

export default function GuruLoginPage() {
  const router = useRouter();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage('Username atau NIP wajib diisi.');
      return;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginGuru({
        username: cleanUsername,
        password: password,
      });

      if (!result.success || !result.session) {
        setIsLoading(false);
        setErrorMessage(result.message);
        return;
      }

      const activeSession = result.session;
      setSuccessMessage(`Login berhasil! Selamat datang, ${activeSession.namaLengkap}...`);

      // Flush old local storage to ensure fresh teacher environment
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cbt_soal_bank');
        localStorage.removeItem('cbt_jadwal_list');
        localStorage.removeItem('cbt_stimulus_list');
        localStorage.removeItem('cbt_hasil_ujian');
      }

      setTimeout(() => {
        if (activeSession.role === 'admin' || activeSession.username.toLowerCase() === 'admin') {
          router.push('/guru/admin');
        } else {
          router.push('/guru');
        }
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menghubungi database.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top back navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Ujian Siswa</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/20 mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Portal Masuk Guru & Proktor
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Sistem CBT Asesmen Kompetensi Minimum (AKM) & Kurikulum Merdeka SMP Fase D
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-800 text-slate-100">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input 1: Username / NIP */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Username / NIP Guru <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ketik Username atau NIP Anda"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Kata Sandi (Password) <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Kata Sandi Anda"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/70 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{errorMessage}</p>
                  <p className="text-[11px] text-rose-400 font-semibold">
                    Belum punya akun? Silakan daftar akun baru di bawah.
                  </p>
                </div>
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
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Database Supabase...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dasbor Guru</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-medium tracking-wider">
                Akun Guru Baru
              </span>
            </div>
          </div>

          {/* Register Prompt Button */}
          <Link
            href="/guru/register"
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Belum Punya Akun? Daftar Akun Guru Baru</span>
          </Link>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Sistem Terintegrasi Supabase Cloud &bull; Direktori Penyimpanan Terisolasi
        </p>
      </div>
    </div>
  );
}

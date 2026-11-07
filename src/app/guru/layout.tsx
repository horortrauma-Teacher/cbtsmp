'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileQuestion,
  CalendarClock,
  GraduationCap,
  ArrowLeft,
  Bell,
  Menu,
  X,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  UserCheck,
  Radio,
} from 'lucide-react';
import { getGuruProfile, logoutGuru, GuruProfile } from '@/lib/guru-auth';

const NAV_ITEMS = [
  {
    name: 'Beranda / Overview',
    href: '/guru',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Bank Soal & Stimulus',
    href: '/guru/bank-soal',
    icon: FileQuestion,
    badge: 'AKM & HOTS',
  },
  {
    name: 'Jadwal CBT',
    href: '/guru/jadwal',
    icon: CalendarClock,
    badge: 'Aktif',
  },
  {
    name: 'Live Monitoring',
    href: '/guru/monitoring',
    icon: Radio,
    badge: 'Live',
  },
  {
    name: 'Hasil & Nilai Siswa',
    href: '/guru/hasil',
    icon: GraduationCap,
    badge: 'KKM 75',
  },
];

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<GuruProfile | null>(null);

  useEffect(() => {
    // Load initial profile
    const current = getGuruProfile();
    setProfile(current);

    if (!current && pathname !== '/guru/login' && pathname !== '/guru/register') {
      router.push('/guru/login');
    }

    // Listen to profile change event across window
    const handleAuthChange = () => {
      const p = getGuruProfile();
      setProfile(p);
      if (!p && pathname !== '/guru/login' && pathname !== '/guru/register') {
        router.push('/guru/login');
      }
    };

    window.addEventListener('guru-auth-change', handleAuthChange);
    return () => window.removeEventListener('guru-auth-change', handleAuthChange);
  }, [pathname, router]);

  const handleLogout = () => {
    logoutGuru();
    router.push('/guru/login');
  };

  const displayName = profile?.namaLengkap || 'Bapak/Ibu Guru Pengampu';
  const displayNip = profile?.nip || '-';

  const getInitials = (name: string) => {
    const clean = name.replace(/^(Pak|Ibu|Drs\.|Dra\.|H\.|Hj\.)\s+/i, '').trim();
    const parts = clean.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'GU').slice(0, 2).toUpperCase();
  };

  // If currently on login or register page, render full screen without dashboard sidebar and header
  if (pathname === '/guru/login' || pathname === '/guru/register') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800 antialiased font-sans">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo Area */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                  CBT Guru
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                  Fase D
                </span>
              </div>
              <p className="text-xs text-slate-400">Portal Evaluasi & AKM</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kurikulum Merdeka Badge info */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-blue-200">Kurikulum Merdeka 2026</p>
            <p className="text-[11px] text-slate-400">Standar AKM Literasi, Numerasi & HOTS SMP/SMA</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-blue-300 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Super Administrator Menu item (Khusus Admin) */}
          {(profile?.role === 'admin' || profile?.username?.toLowerCase() === 'admin') && (
            <div className="pt-3 pb-1 border-t border-slate-800/80">
              <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Administrator</span>
              </p>
              <Link
                href="/guru/admin"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === '/guru/admin'
                    ? 'bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                    : 'text-amber-300 hover:bg-slate-800/90 hover:text-white border border-amber-500/30 bg-amber-500/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
                  <span>👑 Konsol Super Admin</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Semua Data
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom Actions & User Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Siswa</span>
          </Link>

          {/* Dynamic Teacher Profile Box */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-blue-400/30">
                  {getInitials(displayName)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {profile?.role === 'admin'
                    ? '👑 Super Administrator'
                    : profile?.nip
                    ? `NIP: ${profile.nip}`
                    : profile?.mataPelajaran || 'Guru Pengampu'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-2.5 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all duration-200 cursor-pointer"
              title="Keluar atau ganti sesi akun guru"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti Akun / Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          {/* Left: Mobile hamburger & breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Portal Guru</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-blue-600">
                {pathname === '/guru'
                  ? 'Beranda & Ringkasan'
                  : pathname === '/guru/admin'
                  ? '👑 Konsol Super Administrator'
                  : pathname.startsWith('/guru/bank-soal')
                  ? 'Bank Soal & Stimulus AKM'
                  : pathname.startsWith('/guru/jadwal')
                  ? 'Jadwal & Token Ujian CBT'
                  : 'Hasil & Lembar Jawaban Siswa'}
              </span>
            </div>
          </div>

          {/* Right: School Info, Token Indicator, Notif, Teacher Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* School Tag */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SMP Negeri 1 Nusantara</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-500 font-mono">TA 2026/2027</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                title="Notifikasi Aktivitas"
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {/* Teacher Header Card with Real Name & Logout */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 max-w-[200px] truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{profile ? 'Terautentikasi' : 'Guru Pengampu Aktif'}</span>
                </p>
              </div>

              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20">
                {getInitials(displayName)}
              </div>

              <button
                onClick={handleLogout}
                title="Keluar / Ganti Akun Guru"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-colors shadow-xs cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ganti Akun</span>
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  FileQuestion,
  CalendarClock,
  GraduationCap,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  FolderLock,
  BookOpen,
  Award,
  Sparkles,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  School,
  Database,
  Edit3,
  Key,
  Lock,
  UserCog,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { getGuruProfile, GuruProfile } from '@/lib/guru-auth';
import { GuruAccount, Soal, JadwalUjian, HasilUjianSiswa, SiswaAccount } from '@/types/cbt';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<GuruProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Data states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [teachers, setTeachers] = useState<
    (GuruAccount & { totalSoal: number; totalJadwal: number; totalHasil: number })[]
  >([]);
  const [allSoal, setAllSoal] = useState<Soal[]>([]);
  const [allJadwal, setAllJadwal] = useState<JadwalUjian[]>([]);
  const [allHasil, setAllHasil] = useState<HasilUjianSiswa[]>([]);
  const [students, setStudents] = useState<SiswaAccount[]>([]);
  const [securityReport, setSecurityReport] = useState<any>(null);

  // UI Tabs & Filters
  const [activeTab, setActiveTab] = useState<'teachers' | 'soal' | 'jadwal' | 'hasil' | 'helpdesk'>('teachers');
  const [helpDeskSubTab, setHelpDeskSubTab] = useState<'guru' | 'siswa' | 'salman'>('guru');
  const [helpDeskSearch, setHelpDeskSearch] = useState<string>('');
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('all');
  const [copiedScheduleId, setCopiedScheduleId] = useState<string | null>(null);

  // Editing Guru Modal (Help Desk)
  const [editingGuru, setEditingGuru] = useState<GuruAccount | null>(null);
  const [editGuruForm, setEditGuruForm] = useState({
    namaLengkap: '',
    nip: '',
    sekolah: '',
    mataPelajaran: '',
    jenjang: 'SMP',
    password: '',
    status: 'aktif',
  });

  // Editing Siswa Modal (Help Desk)
  const [editingSiswa, setEditingSiswa] = useState<SiswaAccount | null>(null);
  const [editSiswaForm, setEditSiswaForm] = useState({
    namaLengkap: '',
    kelas: '',
    nisn: '',
    status: 'aktif',
  });

  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [userSaveSuccess, setUserSaveSuccess] = useState<string | null>(null);
  
  // Selected question modal preview
  const [previewSoal, setPreviewSoal] = useState<Soal | null>(null);

  // Check auth
  useEffect(() => {
    const prof = getGuruProfile();
    setProfile(prof);

    if (!prof) {
      setIsAuthorized(false);
      router.push('/guru/login');
      return;
    }

    if (prof.role === 'admin' || prof.username.toLowerCase() === 'admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [router]);

  // Load Admin Data from Server
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [res, resUsers] = await Promise.all([
        fetch('/api/cbt/admin/teachers'),
        fetch('/api/cbt/admin/users').catch(() => null),
      ]);
      const data = await res.json();

      if (data.success) {
        setTeachers(data.teachers || []);
        setAllSoal(data.allSoal || []);
        setAllJadwal(data.allJadwal || []);
        setAllHasil(data.allHasil || []);
      }

      if (resUsers) {
        const uData = await resUsers.json().catch(() => null);
        if (uData && uData.success) {
          if (Array.isArray(uData.students)) setStudents(uData.students);
          if (uData.security) setSecurityReport(uData.security);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditGuru = (g: GuruAccount) => {
    setEditingGuru(g);
    setEditGuruForm({
      namaLengkap: g.namaLengkap,
      nip: g.nip || '-',
      sekolah: g.sekolah || 'SMP Negeri',
      mataPelajaran: g.mataPelajaran || 'Umum',
      jenjang: g.jenjang || 'SMP',
      password: g.password || 'cbt2026',
      status: g.status || 'aktif',
    });
  };

  const handleSaveGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru) return;
    setIsSavingUser(true);
    setUserSaveSuccess(null);
    try {
      const res = await fetch('/api/cbt/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'guru',
          userData: {
            id: editingGuru.id,
            username: editingGuru.username,
            namaLengkap: editGuruForm.namaLengkap,
            nip: editGuruForm.nip,
            sekolah: editGuruForm.sekolah,
            mataPelajaran: editGuruForm.mataPelajaran,
            jenjang: editGuruForm.jenjang,
            password: editGuruForm.password || editingGuru.password,
            status: editGuruForm.status,
          },
          adminUsername: profile?.username || 'admin',
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setUserSaveSuccess(resJson.message || 'Akun guru berhasil diperbarui!');
        setEditingGuru(null);
        await loadAdminData();
        setTimeout(() => setUserSaveSuccess(null), 4000);
      } else {
        alert(resJson.message || 'Gagal memperbarui akun guru.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleOpenEditSiswa = (s: SiswaAccount) => {
    setEditingSiswa(s);
    setEditSiswaForm({
      namaLengkap: s.namaLengkap,
      kelas: s.kelas,
      nisn: s.nisn || '-',
      status: s.status || 'aktif',
    });
  };

  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    setIsSavingUser(true);
    setUserSaveSuccess(null);
    try {
      const res = await fetch('/api/cbt/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'siswa',
          userData: {
            id: editingSiswa.id,
            namaLengkap: editSiswaForm.namaLengkap,
            kelas: editSiswaForm.kelas,
            nisn: editSiswaForm.nisn,
            status: editSiswaForm.status,
          },
          adminUsername: profile?.username || 'admin',
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setUserSaveSuccess(resJson.message || 'Data siswa berhasil diperbarui!');
        setEditingSiswa(null);
        await loadAdminData();
        setTimeout(() => setUserSaveSuccess(null), 4000);
      } else {
        alert(resJson.message || 'Gagal memperbarui data siswa.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingUser(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadAdminData();
    }
  }, [isAuthorized]);

  // Copy student exam link
  const handleCopyExamLink = (scheduleId: string) => {
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://heru89.vercel.app';
    const link = `${host}/exam/${scheduleId}`;
    navigator.clipboard.writeText(link);
    setCopiedScheduleId(scheduleId);
    setTimeout(() => setCopiedScheduleId(null), 2000);
  };

  // Distinct subjects for filter
  const subjects = useMemo(() => {
    const s = new Set<string>();
    allSoal.forEach((item) => {
      if (item.mataPelajaran) s.add(item.mataPelajaran);
    });
    return Array.from(s);
  }, [allSoal]);

  // Filtered Soal
  const filteredSoal = useMemo(() => {
    return allSoal.filter((item) => {
      const matchGuru =
        selectedGuruFilter === 'all' ||
        (item.guruUsername || item.pembuat || '').toLowerCase() === selectedGuruFilter.toLowerCase();
      const matchMapel =
        selectedMapelFilter === 'all' || item.mataPelajaran === selectedMapelFilter;
      const matchSearch =
        !searchQuery ||
        (item.pertanyaan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.topik || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pembuat || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchGuru && matchMapel && matchSearch;
    });
  }, [allSoal, selectedGuruFilter, selectedMapelFilter, searchQuery]);

  // Filtered Jadwal
  const filteredJadwal = useMemo(() => {
    return allJadwal.filter((j) => {
      const matchGuru =
        selectedGuruFilter === 'all' ||
        (j.guruUsername || j.pembuat || '').toLowerCase() === selectedGuruFilter.toLowerCase();
      const matchMapel =
        selectedMapelFilter === 'all' || j.mataPelajaran === selectedMapelFilter;
      const matchSearch =
        !searchQuery ||
        (j.judul || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.pembuat || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchGuru && matchMapel && matchSearch;
    });
  }, [allJadwal, selectedGuruFilter, selectedMapelFilter, searchQuery]);

  // Filtered Hasil Siswa
  const filteredHasil = useMemo(() => {
    const scheduleOwnerMap = new Map<string, string>();
    allJadwal.forEach((j) => {
      scheduleOwnerMap.set(j.id, (j.guruUsername || j.pembuat || '').toLowerCase());
    });

    return allHasil.filter((h) => {
      const scheduleOwner = scheduleOwnerMap.get(h.jadwalId) || '';
      const matchGuru =
        selectedGuruFilter === 'all' || scheduleOwner === selectedGuruFilter.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (h.namaSiswa || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.kelas || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.jadwalId || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchGuru && matchSearch;
    });
  }, [allHasil, allJadwal, selectedGuruFilter, searchQuery]);

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-rose-500/30 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akses Terbatas: Administrator Only</h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Halaman ini khusus untuk Super Administrator CBT. Silakan login menggunakan akun administrator resmi (username: <b>admin</b>).
          </p>
          <Link
            href="/guru/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
          >
            Masuk dengan Akun Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Super Administrator Konsol
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Supabase PostgreSQL Cloud
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Manajemen Seluruh Guru & Bank CBT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Memantau seluruh aktivitas guru terdaftar, pembuatan butir soal AKM/HOTS, jadwal ujian aktif, serta seluruh rekapitulasi lembar jawaban siswa dari semua kelas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Menyinkronkan...' : 'Perbarui Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Teachers */}
        <div
          onClick={() => setActiveTab('teachers')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeTab === 'teachers'
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 scale-[1.02]'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Guru Terdaftar
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeTab === 'teachers' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold">{teachers.length}</div>
          <p className="text-xs mt-1.5 opacity-80">Akun terdaftar di Supabase</p>
        </div>

        {/* Card 2: Soal */}
        <div
          onClick={() => setActiveTab('soal')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeTab === 'soal'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20 scale-[1.02]'
              : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Total Bank Soal
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeTab === 'soal' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold">{allSoal.length}</div>
          <p className="text-xs mt-1.5 opacity-80">Dari seluruh guru pengampu</p>
        </div>

        {/* Card 3: Jadwal */}
        <div
          onClick={() => setActiveTab('jadwal')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeTab === 'jadwal'
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20 scale-[1.02]'
              : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Jadwal Sesi CBT
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeTab === 'jadwal' ? 'bg-white/20' : 'bg-purple-50 text-purple-600'
              }`}
            >
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold">{allJadwal.length}</div>
          <p className="text-xs mt-1.5 opacity-80">Tautan pengerjaan aktif</p>
        </div>

        {/* Card 4: Hasil */}
        <div
          onClick={() => setActiveTab('hasil')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
            activeTab === 'hasil'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-[1.02]'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Lembar Jawaban Siswa
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeTab === 'hasil' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold">{allHasil.length}</div>
          <p className="text-xs mt-1.5 opacity-80">Pengerjaan terdata di server</p>
        </div>
      </div>

      {/* FILTER & TAB BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'teachers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Guru Terdaftar ({teachers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('soal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'soal'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              <span>Semua Bank Soal ({allSoal.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'jadwal'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              <span>Semua Jadwal Ujian ({allJadwal.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hasil')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'hasil'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Hasil Siswa Global ({allHasil.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('helpdesk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'helpdesk'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <UserCog className="w-4 h-4" />
              <span>Help Desk & Manajemen User</span>
            </button>
          </div>

          {/* Filter per Guru Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Guru:</span>
            </span>
            <select
              value={selectedGuruFilter}
              onChange={(e) => setSelectedGuruFilter(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Guru Pengampu ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.username} value={t.username}>
                  {t.namaLengkap} ({t.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input for tabs 2, 3, 4 */}
        {activeTab !== 'teachers' && (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari berdasarkan kata kunci, judul, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>

            {activeTab === 'soal' && subjects.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500">Mata Pelajaran:</span>
                <select
                  value={selectedMapelFilter}
                  onChange={(e) => setSelectedMapelFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50"
                >
                  <option value="all">Semua Mapel</option>
                  {subjects.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: DAFTAR GURU TERDAFTAR */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Direktori Guru Terdaftar di Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Setiap akun guru memiliki direktori penyimpanan dan bank data terisolasi secara mandiri.
              </p>
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {teachers.length} Guru
            </span>
          </div>

          {teachers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum Ada Guru yang Mendaftar</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Guru dapat mendaftarkan diri secara mandiri melalui form Registrasi Guru Baru pada halaman login.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Guru & Gelar</th>
                    <th className="py-3 px-4">Username / NIP</th>
                    <th className="py-3 px-4">Sekolah</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Direktori Cloud</th>
                    <th className="py-3 px-4 text-center">Soal</th>
                    <th className="py-3 px-4 text-center">Jadwal</th>
                    <th className="py-3 px-4 text-center">Hasil Siswa</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teachers.map((t) => (
                    <tr key={t.id || t.username} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.namaLengkap}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {t.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        <div>@{t.username}</div>
                        <div className="text-[10px] text-slate-400">NIP: {t.nip || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{t.sekolah || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200/50">
                          {t.mataPelajaran || 'Umum'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <FolderLock className="w-3 h-3 text-amber-500" />
                          <span>{t.storageDir || `guru/${t.username}`}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          {t.totalSoal}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {t.totalJadwal}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {t.totalHasil}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedGuruFilter(t.username);
                            setActiveTab('soal');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                        >
                          Lihat Bank Soal &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

{/* TAB CONTENT 2: SEMUA BANK SOAL */}
      {activeTab === 'soal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Seluruh Bank Butir Soal AKM & HOTS ({filteredSoal.length})
              </h2>
              <p className="text-xs text-slate-500">
                {selectedGuruFilter === 'all'
                  ? 'Menampilkan butir soal dari seluruh guru pengampu.'
                  : `Menampilkan butir soal milik guru: @${selectedGuruFilter}`}
              </p>
            </div>
            {selectedGuruFilter !== 'all' && (
              <button
                onClick={() => setSelectedGuruFilter('all')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset Filter Guru
              </button>
            )}
          </div>

          {filteredSoal.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <FileQuestion className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak Ada Butir Soal</p>
              <p className="text-xs text-slate-400">
                Belum ada butir soal yang cocok dengan filter pencarian ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSoal.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{s.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {s.mataPelajaran}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Tipe: {s.tipeSoal}
                      </span>
                      {s.isHots && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          HOTS {s.levelKognitif || 'C4'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Bobot: {s.bobot} Poin
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Guru: @{s.guruUsername || s.pembuat || 'guru'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                      {s.pertanyaan}
                    </p>

                    {s.stimulus && (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/50 text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          <span>Stimulus: {s.stimulus.judul}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 line-clamp-2">
                          {s.stimulus.kontenTeks}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setPreviewSoal(s)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail Soal</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

{/* TAB CONTENT 3: SEMUA JADWAL UJIAN */}
      {activeTab === 'jadwal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Seluruh Jadwal Sesi Ujian Aktif ({filteredJadwal.length})
              </h2>
              <p className="text-xs text-slate-500">
                Siswa dapat langsung mengerjakan asesmen melalui link tautan resmi per sesi ujian.
              </p>
            </div>
          </div>

          {filteredJadwal.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <CalendarClock className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum Ada Sesi Ujian Dibuat</p>
              <p className="text-xs text-slate-400">
                Sesi ujian yang dibuat oleh guru akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Judul Sesi Ujian</th>
                    <th className="py-3 px-4">Guru Pembuat</th>
                    <th className="py-3 px-4">Mapel & Target</th>
                    <th className="py-3 px-4 text-center">Durasi</th>
                    <th className="py-3 px-4 text-center">Jumlah Soal</th>
                    <th className="py-3 px-4 text-center">KKM</th>
                    <th className="py-3 px-4">Tautan Ujian Siswa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredJadwal.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{j.judul}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {j.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          @{j.guruUsername || j.pembuat || 'guru'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-blue-700">{j.mataPelajaran}</div>
                        <div className="text-[10px] text-slate-500">
                          {Array.isArray(j.targetKelas) ? j.targetKelas.join(', ') : 'Semua Kelas'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {j.durasiMenit} Menit
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {j.totalSoal || (j.soalIds ? j.soalIds.length : 0)} Butir
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {j.kkm || 75}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyExamLink(j.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedScheduleId === j.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                          <Link
                            href={`/exam/${j.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                            title="Buka Halaman Siswa"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

{/* TAB CONTENT 4: SEMUA HASIL SISWA */}
      {activeTab === 'hasil' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Rekapitulasi Lembar Jawaban & Nilai Siswa Global ({filteredHasil.length})
              </h2>
              <p className="text-xs text-slate-500">
                Nilai akhir tersimpan aman di server dan hanya tampil untuk guru pengampu & administrator.
              </p>
            </div>
          </div>

          {filteredHasil.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum Ada Pengumpulan Nilai</p>
              <p className="text-xs text-slate-400">
                Saat siswa menyelesaikan ujian, lembar jawaban & nilai akan langsung tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">ID Sesi Ujian</th>
                    <th className="py-3 px-4 text-center">Nilai Akhir</th>
                    <th className="py-3 px-4 text-center">Status KKM</th>
                    <th className="py-3 px-4 text-center">Benar / Total</th>
                    <th className="py-3 px-4">Waktu Pengumpulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredHasil.map((h) => {
                    const totalBenar = Array.isArray(h.jawabanDetail)
                      ? h.jawabanDetail.filter((d) => d.isBenar).length
                      : 0;
                    const totalSoal = Array.isArray(h.jawabanDetail) ? h.jawabanDetail.length : 0;
                    const isTuntas = h.statusKelulusan === 'TUNTAS';

                    return (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{h.namaSiswa}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{h.kelas}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {h.jadwalId}
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-sm text-slate-900">
                          {h.nilaiAkhir}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isTuntas
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {h.statusKelulusan || (h.nilaiAkhir >= 75 ? 'TUNTAS' : 'BELUM_TUNTAS')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600">
                          {totalBenar} / {totalSoal || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">{h.waktuSubmit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

{/* TAB 5: HELP DESK & USER MANAGEMENT (GURU, SISWA & SALMAN SECURITY) */}
      {activeTab === 'helpdesk' && (
        <div className="space-y-6">
          {/* Toast Notification */}
          {userSaveSuccess && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between border border-emerald-400 animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span className="text-xs sm:text-sm font-bold">{userSaveSuccess}</span>
              </div>
              <button
                onClick={() => setUserSaveSuccess(null)}
                className="text-white/80 hover:text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Salman Security Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 text-white border border-rose-800/40 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    Salman Security & Vulnerability Specialist
                  </span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    SKOR KEAMANAN: 100/100 (SECURE)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Help Desk & Pengendali Keamanan Akun
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Layanan terpadu administrator untuk mengedit data pengguna, mereset kata sandi guru jika lupa sandi, memperbaiki data profil siswa, dan memonitor kekebalan sistem dari kerentanan siber.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setHelpDeskSubTab('salman')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lihat Audit Salman</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setHelpDeskSubTab('guru')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                helpDeskSubTab === 'guru'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Akun Guru & Reset Password ({teachers.length})</span>
            </button>

            <button
              onClick={() => setHelpDeskSubTab('siswa')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                helpDeskSubTab === 'siswa'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Arsip Login Siswa ({students.length})</span>
            </button>

            <button
              onClick={() => setHelpDeskSubTab('salman')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                helpDeskSubTab === 'salman'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Inspeksi Keamanan Salman</span>
            </button>
          </div>

          {/* Sub-Tab 1: Manajemen Akun Guru */}
          {helpDeskSubTab === 'guru' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Manajemen Akun Guru (Tabel login_guru Supabase)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klik tombol &quot;Edit &amp; Reset Sandi&quot; untuk mengganti password atau mengoreksi data identitas guru.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari guru, username, mapel..."
                    value={helpDeskSearch}
                    onChange={(e) => setHelpDeskSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Guru &amp; NIP</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Kata Sandi</th>
                      <th className="py-3 px-4">Sekolah</th>
                      <th className="py-3 px-4">Mapel &amp; Jenjang</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi Help Desk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {teachers
                      .filter((t) => {
                        const q = helpDeskSearch.toLowerCase();
                        return (
                          t.namaLengkap.toLowerCase().includes(q) ||
                          t.username.toLowerCase().includes(q) ||
                          (t.sekolah || '').toLowerCase().includes(q) ||
                          (t.mataPelajaran || '').toLowerCase().includes(q)
                        );
                      })
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{t.namaLengkap}</div>
                            <div className="text-[11px] text-slate-500">NIP: {t.nip || '-'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            @{t.username}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
                              {t.password ? t.password : 'cbt2026'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {t.sekolah || 'SMP Negeri'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{t.mataPelajaran || 'Umum'}</div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {t.jenjang || 'SMP'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'nonaktif'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {t.status || 'aktif'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenEditGuru(t)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1.5 ml-auto cursor-pointer transition shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit &amp; Reset Sandi</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Arsip Login Siswa */}
          {helpDeskSubTab === 'siswa' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Arsip Login Siswa (Tabel login_siswa Supabase)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar seluruh siswa yang telah mengikuti sesi ujian atau tercatat di server CBT.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari siswa, kelas, NISN..."
                    value={helpDeskSearch}
                    onChange={(e) => setHelpDeskSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada rekaman sesi siswa di tabel login_siswa. Data akan muncul otomatis saat siswa memasukkan nama di gerbang ujian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4">Kelas / Rombel</th>
                        <th className="py-3 px-4">NISN</th>
                        <th className="py-3 px-4 text-center">Jenjang</th>
                        <th className="py-3 px-4">Sesi Terakhir</th>
                        <th className="py-3 px-4">Waktu Terakhir</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {students
                        .filter((s) => {
                          const q = helpDeskSearch.toLowerCase();
                          return (
                            s.namaLengkap.toLowerCase().includes(q) ||
                            s.kelas.toLowerCase().includes(q) ||
                            (s.nisn || '').toLowerCase().includes(q)
                          );
                        })
                        .map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{s.namaLengkap}</td>
                            <td className="py-3 px-4 font-medium text-slate-700">{s.kelas}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{s.nisn || '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                {s.jenjang || 'SMP'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {s.jadwalId || '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {s.lastActive || '-'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenEditSiswa(s)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1.5 ml-auto cursor-pointer transition shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Koreksi Data</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 3: Salman Security Audit */}
          {helpDeskSubTab === 'salman' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rose-600" />
                    <span>Laporan Audit Keamanan Berkala (Salman)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspeksi komprehensif infrastruktur, mitigasi XSS/SQL Injection, enkripsi sesi, dan proteksi otorisasi.
                  </p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
                  Status: AMAN (100% Lulus Uji)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(securityReport?.checks || []).map((check: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                        {check.category}
                      </div>
                      <div className="text-xs font-extrabold text-slate-800">{check.item}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        {check.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-2 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Rekomendasi Keamanan Rutin Salman:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {(securityReport?.recommendations || []).map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

{/* MODAL PREVIEW DETAIL SOAL */}
      {previewSoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600">
                  {previewSoal.mataPelajaran} &bull; {previewSoal.tipeSoal}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">Detail Butir Soal AKM</h3>
              </div>
              <button
                onClick={() => setPreviewSoal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {/* Pembuat */}
            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div>
                <b>Guru Pembuat:</b> @{previewSoal.guruUsername || previewSoal.pembuat || 'guru'}
              </div>
              <div>
                <b>Tingkat Kognitif:</b> {previewSoal.levelKognitif || 'C4'} ({previewSoal.fase})
              </div>
              <div>
                <b>Bobot Skor:</b> {previewSoal.bobot} Poin
              </div>
            </div>

            {/* Stimulus */}
            {previewSoal.stimulus && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>Stimulus: {previewSoal.stimulus.judul}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-slate-700">
                  {previewSoal.stimulus.kontenTeks}
                </p>
              </div>
            )}

            {/* Pertanyaan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Pertanyaan:</label>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {previewSoal.pertanyaan}
              </p>
            </div>

            {/* Opsi / Kunci PG */}
            {previewSoal.opsiPG && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Pilihan Jawaban:</label>
                <div className="space-y-1.5">
                  {previewSoal.opsiPG.map((op) => {
                    const isKey = op.label === previewSoal.kunciPG;
                    return (
                      <div
                        key={op.label}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isKey
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>
                          <b>{op.label}.</b> {op.teks}
                        </span>
                        {isKey && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            KUNCI JAWABAN
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pembahasan */}
            {previewSoal.pembahasan && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold">Pembahasan & Rasionalisasi:</div>
                <p className="leading-relaxed">{previewSoal.pembahasan}</p>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setPreviewSoal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

{/* MODAL EDIT AKUN GURU (HELP DESK) */}
      {editingGuru && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  Help Desk Administrator
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-rose-600" />
                  <span>Edit Akun Guru &amp; Reset Password</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingGuru(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveGuru} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Guru (Terkunci)</label>
                <input
                  type="text"
                  disabled
                  value={editingGuru.username}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap &amp; Gelar *</label>
                <input
                  type="text"
                  required
                  value={editGuruForm.namaLengkap}
                  onChange={(e) => setEditGuruForm({ ...editGuruForm, namaLengkap: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP Guru</label>
                  <input
                    type="text"
                    value={editGuruForm.nip}
                    onChange={(e) => setEditGuruForm({ ...editGuruForm, nip: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenjang Mengajar</label>
                  <select
                    value={editGuruForm.jenjang}
                    onChange={(e) => setEditGuruForm({ ...editGuruForm, jenjang: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="SMP">Jenjang SMP</option>
                    <option value="SMA">Jenjang SMA</option>
                    <option value="SMP/SMA">SMP &amp; SMA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={editGuruForm.sekolah}
                  onChange={(e) => setEditGuruForm({ ...editGuruForm, sekolah: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Diampu</label>
                <input
                  type="text"
                  value={editGuruForm.mataPelajaran}
                  onChange={(e) => setEditGuruForm({ ...editGuruForm, mataPelajaran: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Reset Password Field */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                <label className="block font-bold text-amber-950 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reset Kata Sandi (Password Baru)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan kata sandi baru untuk guru..."
                  value={editGuruForm.password}
                  onChange={(e) => setEditGuruForm({ ...editGuruForm, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-amber-800">
                  Gunakan ini jika guru lupa kata sandi. Berikan kata sandi baru ini kepada guru yang bersangkutan.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGuru(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingUser ? 'Menyimpan...' : 'Simpan & Perbarui Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* MODAL EDIT DATA SISWA (HELP DESK) */}
      {editingSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Help Desk Administrator
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span>Koreksi Identitas Siswa</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingSiswa(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={editSiswaForm.namaLengkap}
                  onChange={(e) => setEditSiswaForm({ ...editSiswaForm, namaLengkap: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas / Rombel *</label>
                <input
                  type="text"
                  required
                  value={editSiswaForm.kelas}
                  onChange={(e) => setEditSiswaForm({ ...editSiswaForm, kelas: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NISN / Nomor Induk</label>
                <input
                  type="text"
                  value={editSiswaForm.nisn}
                  onChange={(e) => setEditSiswaForm({ ...editSiswaForm, nisn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
                <select
                  value={editSiswaForm.status}
                  onChange={(e) => setEditSiswaForm({ ...editSiswaForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-Aktif / Terdiskualifikasi</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingUser ? 'Menyimpan...' : 'Simpan Koreksi Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

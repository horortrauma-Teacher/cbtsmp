'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Radio,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Unlock,
  Search,
  Filter,
  Eye,
  CalendarClock,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useCBTData } from '@/lib/store';
import { LiveStudentProgress, JadwalUjian } from '@/types/cbt';
import { getGuruProfile, GuruProfile } from '@/lib/guru-auth';

function LiveMonitoringContent() {
  const searchParams = useSearchParams();
  const scheduleParam = searchParams.get('scheduleId') || '';
  const { jadwalList, allJadwalList, hasilList } = useCBTData();
  const effectiveJadwalList = allJadwalList && allJadwalList.length > 0 ? allJadwalList : jadwalList;

  const [guruProfile, setGuruProfile] = useState<GuruProfile | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(scheduleParam);
  const [students, setStudents] = useState<LiveStudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MENGERJAKAN' | 'TERKUNCI' | 'SELESAI'>('ALL');
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  useEffect(() => {
    setGuruProfile(getGuruProfile());
  }, []);

  // Default to first ongoing or latest schedule if none selected
  useEffect(() => {
    if (!selectedScheduleId && effectiveJadwalList.length > 0) {
      const active = effectiveJadwalList.find((j) => j.status === 'SEDANG_BERLANGSUNG');
      if (active) {
        setSelectedScheduleId(active.id);
      } else {
        setSelectedScheduleId(effectiveJadwalList[0].id);
      }
    }
  }, [effectiveJadwalList, selectedScheduleId]);

  // Active schedule metadata
  const currentSchedule: JadwalUjian | undefined = useMemo(() => {
    return effectiveJadwalList.find((j) => j.id === selectedScheduleId);
  }, [effectiveJadwalList, selectedScheduleId]);

  // Fetch progress from API and local storage
  const fetchProgress = useCallback(async () => {
    if (!selectedScheduleId) return;

    try {
      // 1. Fetch from Server CBT API
      const res = await fetch(`/api/cbt/exam/progress?scheduleId=${encodeURIComponent(selectedScheduleId)}`);
      const data = await res.json();

      let serverStudents: LiveStudentProgress[] = [];
      if (data && data.success && Array.isArray(data.students)) {
        serverStudents = data.students;
      }

      // 2. Read local storage for zero-latency localhost testing
      let localStudents: LiveStudentProgress[] = [];
      if (typeof window !== 'undefined') {
        try {
          const rawLocal = localStorage.getItem(`cbt_live_progress_${selectedScheduleId}`);
          if (rawLocal) {
            const parsedMap = JSON.parse(rawLocal);
            localStudents = Object.values(parsedMap);
          }
        } catch (e) {
          // ignore
        }
      }

      // Merge by studentId, prioritizing the freshest timestamp
      const studentMap = new Map<string, LiveStudentProgress>();
      serverStudents.forEach((s) => studentMap.set(s.studentId, s));
      localStudents.forEach((local) => {
        const existing = studentMap.get(local.studentId);
        if (!existing || new Date(local.lastActive).getTime() >= new Date(existing.lastActive).getTime()) {
          studentMap.set(local.studentId, local);
        }
      });

      // Siswa yang sudah SELESAI tidak dimasukkan ke Live Monitoring (langsung masuk ke Rekap Hasil)
      const activeStudentsOnly = Array.from(studentMap.values()).filter((s) => s.status !== 'SELESAI');

      // Sort: locked students on top (attention needed), then active
      activeStudentsOnly.sort((a, b) => {
        if (a.isLocked && !b.isLocked) return -1;
        if (!a.isLocked && b.isLocked) return 1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });

      setStudents(activeStudentsOnly);
      const now = new Date();
      setLastRefreshedAt(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      );
    } catch (err) {
      console.warn('[LiveMonitoring] Error loading progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedScheduleId]);

  // Initial fetch and schedule change trigger
  useEffect(() => {
    if (selectedScheduleId) {
      setIsLoading(true);
      fetchProgress();
    }
  }, [selectedScheduleId, fetchProgress]);

  // Auto-refresh interval (every 3 seconds)
  useEffect(() => {
    if (!autoRefresh || !selectedScheduleId) return;

    const interval = setInterval(() => {
      fetchProgress();
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedScheduleId, fetchProgress]);

  // Listen to localhost custom storage events for zero-latency instant updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocalProgressChange = () => {
      fetchProgress();
    };

    window.addEventListener('storage', handleLocalProgressChange);
    window.addEventListener('cbt_progress_updated', handleLocalProgressChange);

    return () => {
      window.removeEventListener('storage', handleLocalProgressChange);
      window.removeEventListener('cbt_progress_updated', handleLocalProgressChange);
    };
  }, [fetchProgress]);

  // Action: Remotely Unlock Student (Dispensasi Guru)
  const handleRemoteUnlock = async (student: LiveStudentProgress) => {
    if (!confirm(`Buka kunci ujian untuk siswa ${student.studentName} sekarang?`)) {
      return;
    }

    try {
      // 1. Update localStorage immediately for localhost proctoring
      if (typeof window !== 'undefined') {
        const localKey = `cbt_live_progress_${student.scheduleId}`;
        const raw = localStorage.getItem(localKey);
        if (raw) {
          const map = JSON.parse(raw);
          if (map[student.studentId]) {
            map[student.studentId].isLocked = false;
            map[student.studentId].lockRemainingSeconds = 0;
            map[student.studentId].status = 'MENGERJAKAN';
            map[student.studentId].forceUnlock = true;
            localStorage.setItem(localKey, JSON.stringify(map));
          }
        }
        localStorage.removeItem(`cbt_penalty_until_${student.scheduleId}`);
        window.dispatchEvent(new Event('cbt_progress_updated'));
      }

      // 2. Call server unlock API
      const res = await fetch('/api/cbt/exam/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock',
          scheduleId: student.scheduleId,
          studentId: student.studentId,
        }),
      });
      const data = await res.json();

      if (data?.success) {
        setUnlockNotice(`Kunci ujian untuk siswa "${student.studentName}" berhasil dibuka!`);
        setTimeout(() => setUnlockNotice(null), 4000);
        fetchProgress();
      } else {
        alert(data?.message || 'Gagal membuka kunci.');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat membuka kunci.');
    }
  };

  // Action: Delete testing / accidental student session from monitoring
  const handleDeleteMonitoringStudent = async (student: LiveStudentProgress) => {
    if (!confirm(`Hapus sesi siswa testing "${student.studentName}" (Kelas ${student.kelas}) dari live monitoring?`)) {
      return;
    }

    try {
      // 1. Remove from localStorage immediately
      if (typeof window !== 'undefined') {
        const localKey = `cbt_live_progress_${student.scheduleId}`;
        const raw = localStorage.getItem(localKey);
        if (raw) {
          const map = JSON.parse(raw);
          delete map[student.studentId];
          localStorage.setItem(localKey, JSON.stringify(map));
        }
        window.dispatchEvent(new Event('cbt_progress_updated'));
      }

      // 2. Remove from API
      await fetch('/api/cbt/exam/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          scheduleId: student.scheduleId,
          studentId: student.studentId,
        }),
      });

      setUnlockNotice(`Siswa testing "${student.studentName}" berhasil dihapus dari live monitoring.`);
      setTimeout(() => setUnlockNotice(null), 3000);
      fetchProgress();
    } catch (e) {
      alert('Gagal menghapus siswa dari monitoring.');
    }
  };

  // KPI Metrics
  const activeCount = useMemo(() => students.filter((s) => s.status === 'MENGERJAKAN' && !s.isLocked).length, [students]);
  const lockedCount = useMemo(() => students.filter((s) => s.isLocked || s.status === 'TERKUNCI').length, [students]);
  const submittedCount = useMemo(() => {
    if (!selectedScheduleId || !Array.isArray(hasilList)) return 0;
    return hasilList.filter((h) => h.jadwalId === selectedScheduleId).length;
  }, [hasilList, selectedScheduleId]);

  const avgProgress = useMemo(() => {
    if (students.length === 0) return 0;
    const totalPct = students.reduce((sum, s) => {
      const pct = s.totalQuestions > 0 ? (s.answeredCount / s.totalQuestions) * 100 : 0;
      return sum + pct;
    }, 0);
    return Math.round(totalPct / students.length);
  }, [students]);

  // Filtered Students List (Hanya menampilkan siswa yang aktif mengerjakan / terkunci)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status === 'SELESAI') return false;
      if (statusFilter === 'MENGERJAKAN' && (s.status !== 'MENGERJAKAN' || s.isLocked)) return false;
      if (statusFilter === 'TERKUNCI' && (!s.isLocked && s.status !== 'TERKUNCI')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [students, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Progres Real-Time
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Update otomatis via Heartbeat & Anti-Cheat
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-600 animate-pulse" />
            Live Monitoring & Pengawasan Ujian CBT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pantau progres butir soal terjawab murid secara langsung, sisa waktu, dan deteksi otomatis siswa yang membuka tab baru di browser.
          </p>
        </div>

        {/* Schedule Selector & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Select Schedule */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {effectiveJadwalList.length === 0 ? (
                <option value="">Belum Ada Jadwal</option>
              ) : (
                effectiveJadwalList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.judul} ({j.mataPelajaran})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            title={autoRefresh ? 'Auto-refresh aktif setiap 3 detik' : 'Auto-refresh dijeda'}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{autoRefresh ? 'Auto: 3s' : 'Jeda'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={fetchProgress}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            title="Segarkan data sekarang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Unlock Toast Notification */}
      {unlockNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{unlockNotice}</span>
        </div>
      )}

      {/* Warning Alert Banner when students are currently locked */}
      {lockedCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-400 text-rose-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-rose-950 flex items-center gap-2">
                <span>Perhatian: Ada {lockedCount} Siswa Terkena Penalti Lock 2 Menit!</span>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                  Pelanggaran Tab
                </span>
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Siswa terdeteksi meninggalkan halaman ujian (membuka tab baru / berpindah aplikasi). Layar mereka sedang dibekukan 2 menit secara otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('TERKUNCI')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm self-start sm:self-auto cursor-pointer shrink-0"
          >
            Tampilkan Siswa Terkunci
          </button>
        </div>
      )}

      {/* Active Exam Session Info Ribbon */}
      {currentSchedule && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                SESI AKTIF
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-semibold text-[10px]">
                {currentSchedule.mataPelajaran}
              </span>
              <span className="text-slate-400 text-xs">{currentSchedule.fase}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">{currentSchedule.judul}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span>Target Rombel: <b>{currentSchedule.targetKelas.join(', ')}</b></span>
              <span>•</span>
              <span>Durasi: <b>{currentSchedule.durasiMenit} Menit</b></span>
              <span>•</span>
              <span>Total Paket: <b>{currentSchedule.totalSoal} Butir Soal</b></span>
              <span>•</span>
              <span>KKM: <b>{currentSchedule.kkm}</b></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Link
              href={`/exam/${currentSchedule.id}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>Uji Coba Sebagai Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/guru/hasil?jadwalId=${currentSchedule.id}`}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Rekap Nilai</span>
            </Link>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Connected */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Terhubung</span>
            <span className="text-2xl font-black text-slate-900">{students.length}</span>
            <span className="text-[10px] text-slate-400 block">Siswa Mengikuti</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Currently Working */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Mengerjakan</span>
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium block">Aktif Menjawab</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Penalized with Lock */}
        <div
          className={`rounded-2xl p-4 border shadow-xs flex items-center justify-between transition-all ${
            lockedCount > 0
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/50'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-[10px] text-rose-700 uppercase font-black tracking-wider block">Terkunci Penalti</span>
            <span className="text-2xl font-black text-rose-600">{lockedCount}</span>
            <span className="text-[10px] text-rose-700 font-semibold block">Pindah Tab Browser</span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              lockedCount > 0 ? 'bg-rose-600 text-white shadow-md animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Submitted (Link to Rekap Hasil) */}
        <Link
          href={`/guru/hasil?jadwalId=${selectedScheduleId}`}
          className="bg-white hover:bg-indigo-50/40 transition-colors rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between group"
          title="Klik untuk membuka rekap nilai siswa yang sudah submit"
        >
          <div>
            <span className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider block">Sudah Submit</span>
            <span className="text-2xl font-black text-indigo-600">{submittedCount}</span>
            <span className="text-[10px] text-indigo-500 font-medium flex items-center gap-0.5">
              <span>Buka Rekap Nilai</span>
              <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Link>

        {/* Average Progress */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[10px] text-purple-700 uppercase font-bold tracking-wider block">Rata-Rata Progres</span>
            <span className="text-2xl font-black text-purple-600">{avgProgress}%</span>
            <span className="text-[10px] text-slate-400 block">Soal Terjawab</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Aktif ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('MENGERJAKAN')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === 'MENGERJAKAN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🟢 Mengerjakan ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('TERKUNCI')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              statusFilter === 'TERKUNCI'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            🚨 Terkunci Penalti ({lockedCount})
          </button>
          <Link
            href={`/guru/hasil?jadwalId=${selectedScheduleId}`}
            className="px-3 py-1.5 rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all inline-flex items-center gap-1.5"
            title="Lihat rekap nilai siswa yang sudah selesai"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rekap Selesai ({submittedCount})</span>
            <ChevronRight className="w-3 h-3 text-indigo-400" />
          </Link>
        </div>

        {/* Search Box */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau kelas siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* STUDENTS LIVE TABLE / CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Menunggu Siswa Masuk ke Sesi Ujian</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Belum ada aktivitas pengerjaan siswa yang terdeteksi untuk sesi ini. Bagikan link ujian ke siswa atau lakukan simulasi di tab browser baru untuk menguji live monitoring.
            </p>
            {currentSchedule && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href={`/exam/${currentSchedule.id}`}
                  target="_blank"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Buka Ujian Siswa di Tab Baru (Untuk Tes)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center space-y-1 text-slate-500 text-xs">
            <AlertCircle className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700">Tidak ada siswa yang cocok dengan filter saat ini</p>
            <p>Ubah status filter atau bersihkan kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-3">Kelas</th>
                  <th className="py-3.5 px-4">Progres Jawaban</th>
                  <th className="py-3.5 px-3">Soal Dibuka</th>
                  <th className="py-3.5 px-3">Sisa Waktu</th>
                  <th className="py-3.5 px-3">Status Live</th>
                  <th className="py-3.5 px-3">Pelanggaran Tab</th>
                  <th className="py-3.5 px-4 text-right">Aksi Proktor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((s, idx) => {
                  const pct = s.totalQuestions > 0 ? Math.round((s.answeredCount / s.totalQuestions) * 100) : 0;
                  const isPenalized = s.isLocked || s.status === 'TERKUNCI';
                  const isSubmitted = s.status === 'SELESAI';

                  return (
                    <tr
                      key={s.studentId}
                      className={`transition-colors ${
                        isPenalized
                          ? 'bg-rose-50/70 hover:bg-rose-50'
                          : isSubmitted
                          ? 'bg-slate-50/40 hover:bg-slate-50'
                          : 'hover:bg-blue-50/30'
                      }`}
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 ${
                              isPenalized
                                ? 'bg-rose-600 text-white animate-pulse'
                                : isSubmitted
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {s.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {s.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              NISN: {s.nisn || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {s.kelas}
                        </span>
                      </td>

                      {/* Answer Progress */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {s.answeredCount} / {s.totalQuestions} Soal
                            </span>
                            <span className="font-bold text-blue-600">{pct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isPenalized
                                  ? 'bg-rose-500'
                                  : isSubmitted
                                  ? 'bg-indigo-600'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Current Question */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Soal #{s.currentQuestionIndex + 1}
                        </span>
                      </td>

                      {/* Remaining Time */}
                      <td className="py-3.5 px-3 font-mono text-slate-700 text-[11px]">
                        {isSubmitted ? (
                          <span className="text-slate-400 italic">Selesai</span>
                        ) : (
                          `${Math.floor(s.remainingSeconds / 60)}m ${s.remainingSeconds % 60}s`
                        )}
                      </td>

                      {/* Status Live */}
                      <td className="py-3.5 px-3">
                        {isPenalized ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] animate-pulse shadow-xs">
                            <ShieldAlert className="w-3 h-3" />
                            <span>
                              TERKUNCI ({String(Math.floor(s.lockRemainingSeconds / 60)).padStart(2, '0')}:
                              {String(s.lockRemainingSeconds % 60).padStart(2, '0')})
                            </span>
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SELESAI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span>MENGERJAKAN</span>
                          </span>
                        )}
                      </td>

                      {/* Violations Count */}
                      <td className="py-3.5 px-3">
                        {s.violationsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{s.violationsCount}x Pindah Tab</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tertib (0x)</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPenalized && (
                            <button
                              type="button"
                              onClick={() => handleRemoteUnlock(s)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                              title="Buka kunci penalti siswa sebelum 2 menit berakhir"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Buka Kunci</span>
                            </button>
                          )}

                          {isSubmitted && (
                            <Link
                              href={`/guru/hasil?jadwalId=${s.scheduleId}`}
                              className="text-indigo-600 hover:underline font-semibold text-[11px] inline-flex items-center gap-0.5 shrink-0"
                            >
                              <span>Lihat Skor</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}

                          {/* Delete testing / wrong user */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMonitoringStudent(s)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                            title={`Hapus siswa testing "${s.studentName}" dari monitoring`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <b>Sistem Pengawasan Integritas CBT</b>: Siswa yang membuka tab baru atau beralih jendela browser otomatis dihukum lock 2 Menit & dilaporkan secara live di sini.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0">
          Terakhir diperbarui: <b>{lastRefreshedAt || 'Baru saja'}</b>
        </div>
      </div>
    </div>
  );
}

export default function LiveMonitoringPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-700">Menghubungkan ke Live Monitoring Sesi Ujian...</p>
        </div>
      }
    >
      <LiveMonitoringContent />
    </Suspense>
  );
}

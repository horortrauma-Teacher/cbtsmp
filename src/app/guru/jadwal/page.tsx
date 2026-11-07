'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Plus,
  Copy,
  Check,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Clock,
  Layers,
  Sparkles,
  Users,
  Eye,
  Key,
  Shuffle,
  RefreshCw,
  AlertCircle,
  X,
  BookOpen,
  GraduationCap,
  Unlock,
  Lock,
  ArrowRight,
  Share2,
  Send,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  Radio
} from 'lucide-react';
import { useCBTData } from '@/lib/store';
import { JadwalUjian, Fase, Soal, TipeSoal } from '@/types/cbt';
import { getGuruProfile, GuruProfile } from '@/lib/guru-auth';
import {
  JenjangPendidikan,
  getMataPelajaranByJenjang,
  getTopikByMataPelajaran,
  TopikMateri,
  MataPelajaranDetail
} from '@/lib/curriculum-data';

/**
 * Filter cerdas untuk mencocokkan butir soal dengan Jenjang & Mata Pelajaran
 */
function isSoalMatchingMapelAndJenjang(
  s: Soal,
  targetJenjang: JenjangPendidikan,
  targetMapel: string
): boolean {
  if (!targetMapel) return true;

  // 1. Jenjang check
  if (s.jenjang && s.jenjang !== targetJenjang) {
    return false;
  }
  if (s.fase) {
    if (targetJenjang === 'SMP' && (s.fase.includes('SMA') || s.fase.includes('Fase E') || s.fase.includes('Fase F'))) {
      return false;
    }
    if (targetJenjang === 'SMA' && (s.fase.includes('SMP') || s.fase.includes('Fase D'))) {
      return false;
    }
  }

  // 2. Normalization
  const cleanTarget = targetMapel.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSoal = (s.mataPelajaran || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!cleanSoal) return false;
  if (cleanTarget === cleanSoal) return true;
  if (cleanTarget.includes(cleanSoal) || cleanSoal.includes(cleanTarget)) return true;

  // 3. Subject core keywords
  const roots = [
    'indonesia',
    'inggris',
    'matematika',
    'informatika',
    'ipa',
    'ips',
    'pancasila',
    'pkn',
    'agama',
    'pjok',
    'seni',
    'fisika',
    'kimia',
    'biologi',
    'ekonomi',
    'geografi',
    'sosiologi',
    'sejarah',
  ];
  for (const root of roots) {
    if (cleanTarget.includes(root) && cleanSoal.includes(root)) {
      return true;
    }
  }

  return false;
}

export default function JadwalCBTPage() {
  const { soalList, allSoalList, jadwalList, allJadwalList, addJadwal, updateJadwalStatus, deleteJadwal } = useCBTData();
  const [guruProfile, setGuruProfileState] = useState<GuruProfile | null>(null);

  useEffect(() => {
    setGuruProfileState(getGuruProfile());
    const handleAuth = () => setGuruProfileState(getGuruProfile());
    window.addEventListener('guru-auth-change', handleAuth);
    return () => window.removeEventListener('guru-auth-change', handleAuth);
  }, []);

  // Create form modal / drawer open state
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Share modal state
  const [shareModalJadwal, setShareModalJadwal] = useState<JadwalUjian | null>(null);
  const [copiedTextNotice, setCopiedTextNotice] = useState<string | null>(null);

  const getExamLink = (jadwalId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/exam/${jadwalId}`;
    }
    return `http://localhost:3000/exam/${jadwalId}`;
  };

  const getShareMessage = (j: JadwalUjian) => {
    const link = getExamLink(j.id);
    return `📢 *PEMBERITAHUAN UJIAN CBT ONLINE*\nMata Pelajaran: *${j.mataPelajaran}*\nUjian: *${j.judul}*\n${j.topik ? `Topik: ${j.topik}\n` : ''}Target: *${j.targetKelas.join(', ')}*\nDurasi: *${j.durasiMenit} Menit* (${j.totalSoal} Soal)\n\nSilakan klik tautan login ujian di bawah ini:\n🔗 *${link}*\n\n*(Siswa wajib memasukkan Nama Lengkap dan Kelas pada halaman login sebelum mulai mengerjakan agar hasil terekap).*`;
  };

  const handleCopyLinkDirect = (jadwalId: string) => {
    const link = getExamLink(jadwalId);
    navigator.clipboard.writeText(link);
    setCopiedTextNotice('Link ujian murid berhasil disalin!');
    setTimeout(() => setCopiedTextNotice(null), 3000);
  };

  const handleCopyShareText = (j: JadwalUjian) => {
    const text = getShareMessage(j);
    navigator.clipboard.writeText(text);
    setCopiedTextNotice('Format pesan pengumuman WhatsApp berhasil disalin!');
    setTimeout(() => setCopiedTextNotice(null), 3000);
  };

  // ===================== FORM STATES =====================
  const [judul, setJudul] = useState('');
  const [jenjangForm, setJenjangForm] = useState<JenjangPendidikan>('SMP');
  const [mapelList, setMapelList] = useState<MataPelajaranDetail[]>([]);
  const [mapel, setMapel] = useState('Informatika');
  const [topikList, setTopikList] = useState<TopikMateri[]>([]);
  const [topikForm, setTopikForm] = useState<string>('');
  
  // Target Kelas & Durasi: default Kelas 7 SMP dan Kelas 8 SMP
  const [targetKelas, setTargetKelas] = useState<string[]>(['Kelas 7 SMP', 'Kelas 8 SMP']);
  const [durasiMenit, setDurasiMenit] = useState<number>(60);

  // Waktu
  const [waktuMulai, setWaktuMulai] = useState(new Date().toISOString().slice(0, 16));
  const [waktuSelesai, setWaktuSelesai] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(true);
  const [kkm, setKkm] = useState(75);

  // Selected questions from Bank Soal
  const [selectedSoalIds, setSelectedSoalIds] = useState<string[]>([]);

  // Picker Filter, Search, and Scope states
  const [filterTipeSoal, setFilterTipeSoal] = useState<'ALL' | TipeSoal>('ALL');
  const [searchQuerySoal, setSearchQuerySoal] = useState<string>('');
  const [showAllMapelSoal, setShowAllMapelSoal] = useState<boolean>(false);

  // Update mapel list when jenjang changes
  useEffect(() => {
    const list = getMataPelajaranByJenjang(jenjangForm);
    setMapelList(list);
    if (list.length > 0) {
      setMapel(list[0].nama);
    } else {
      setMapel('');
    }
  }, [jenjangForm]);

  // Update topik list when mapel changes
  useEffect(() => {
    if (!mapel) {
      setTopikList([]);
      setTopikForm('');
      return;
    }
    const topics = getTopikByMataPelajaran(jenjangForm, mapel);
    setTopikList(topics);
    if (topics.length > 0) {
      setTopikForm(topics[0].nama);
    } else {
      setTopikForm('');
    }
  }, [jenjangForm, mapel]);

  // Questions strictly matching the active Subject and Level
  const mapelQuestions = useMemo(() => {
    return soalList.filter((s) => isSoalMatchingMapelAndJenjang(s, jenjangForm, mapel));
  }, [soalList, jenjangForm, mapel]);

  // Filtered questions displayed in picker
  const displayedPickerQuestions = useMemo(() => {
    const baseList = showAllMapelSoal ? soalList : (mapelQuestions.length > 0 ? mapelQuestions : soalList);
    return baseList.filter((s) => {
      // Type filter
      if (filterTipeSoal !== 'ALL' && s.tipeSoal !== filterTipeSoal) {
        return false;
      }
      // Search text filter
      if (searchQuerySoal.trim()) {
        const q = searchQuerySoal.toLowerCase();
        const textMatch =
          (s.pertanyaan || '').toLowerCase().includes(q) ||
          (s.topik || '').toLowerCase().includes(q) ||
          (s.mataPelajaran || '').toLowerCase().includes(q);
        if (!textMatch) return false;
      }
      return true;
    });
  }, [soalList, mapelQuestions, showAllMapelSoal, filterTipeSoal, searchQuerySoal]);

  // Type counts based on current active scope
  const typeCounts = useMemo(() => {
    const baseList = showAllMapelSoal ? soalList : (mapelQuestions.length > 0 ? mapelQuestions : soalList);
    return {
      ALL: baseList.length,
      PG: baseList.filter((s) => s.tipeSoal === 'PG').length,
      PGK: baseList.filter((s) => s.tipeSoal === 'PGK').length,
      MENJODOHKAN: baseList.filter((s) => s.tipeSoal === 'MENJODOHKAN').length,
      URAIAN: baseList.filter((s) => s.tipeSoal === 'URAIAN').length,
    };
  }, [soalList, mapelQuestions, showAllMapelSoal]);

  // Auto-select questions: ONLY select questions matching the active subject & jenjang!
  useEffect(() => {
    if (isFormOpen && soalList.length > 0) {
      const matched = soalList.filter((s) => isSoalMatchingMapelAndJenjang(s, jenjangForm, mapel));
      // Auto-select the matched questions for this subject only
      if (matched.length > 0) {
        setSelectedSoalIds(matched.map((s) => s.id));
      } else {
        setSelectedSoalIds([]);
      }
    }
  }, [isFormOpen, jenjangForm, mapel, soalList]);

  // Calculate total selected count and bobot
  const selectedQuestions = useMemo(() => {
    return soalList.filter((s) => selectedSoalIds.includes(s.id));
  }, [soalList, selectedSoalIds]);

  const totalSelectedBobot = useMemo(() => {
    return selectedQuestions.reduce((sum, s) => sum + s.bobot, 0);
  }, [selectedQuestions]);

  const selectedCountByType = useMemo(() => {
    return {
      PG: selectedQuestions.filter((s) => s.tipeSoal === 'PG').length,
      PGK: selectedQuestions.filter((s) => s.tipeSoal === 'PGK').length,
      MENJODOHKAN: selectedQuestions.filter((s) => s.tipeSoal === 'MENJODOHKAN').length,
      URAIAN: selectedQuestions.filter((s) => s.tipeSoal === 'URAIAN').length,
    };
  }, [selectedQuestions]);

  // Toggle question selection
  const handleToggleSoal = (id: string) => {
    if (selectedSoalIds.includes(id)) {
      setSelectedSoalIds(selectedSoalIds.filter((item) => item !== id));
    } else {
      setSelectedSoalIds([...selectedSoalIds, id]);
    }
  };

  // Quick preset actions for teacher convenience
  const handleSelectOnlyPgAndEssay = () => {
    const targetPool = showAllMapelSoal ? soalList : (mapelQuestions.length > 0 ? mapelQuestions : soalList);
    const pgAndEssay = targetPool.filter((s) => s.tipeSoal === 'PG' || s.tipeSoal === 'URAIAN');
    setSelectedSoalIds(pgAndEssay.map((s) => s.id));
  };

  const handleSelectAllMapel = () => {
    const targetPool = showAllMapelSoal ? soalList : (mapelQuestions.length > 0 ? mapelQuestions : soalList);
    setSelectedSoalIds(targetPool.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSoalIds([]);
  };

  // Toggle class target selection
  const handleToggleTargetKelas = (kls: string) => {
    if (targetKelas.includes(kls)) {
      if (targetKelas.length > 1) {
        setTargetKelas(targetKelas.filter((k) => k !== kls));
      }
    } else {
      setTargetKelas([...targetKelas, kls]);
    }
  };

  // Handle Form Submit
  const handleCreateJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert('Judul Ujian wajib diisi!');
      return;
    }
    if (selectedSoalIds.length === 0) {
      alert('Pilih minimal 1 butir soal dari Bank Soal untuk ujian ini!');
      return;
    }

    const calculatedFase: Fase = jenjangForm === 'SMP' ? 'Fase D (SMP)' : 'Fase E (SMA 10)';

    const newJadwal: JadwalUjian = {
      id: `cbt-${Date.now()}`,
      judul,
      jenjang: jenjangForm,
      mataPelajaran: mapel,
      topik: topikForm,
      fase: calculatedFase,
      targetKelas,
      durasiMenit: Number(durasiMenit),
      token: '',
      tanpaToken: true,
      waktuMulai,
      waktuSelesai,
      acakSoal,
      acakOpsi,
      status: 'SEDANG_BERLANGSUNG', // Langsung aktif agar siap disimulasikan
      soalIds: selectedSoalIds,
      totalSoal: selectedSoalIds.length,
      totalBobot: totalSelectedBobot,
      kkm,
      pembuat: guruProfile?.namaLengkap || 'Guru Penanggung Jawab CBT',
      guruUsername: guruProfile?.username || '',
    };

    addJadwal(newJadwal);
    setIsFormOpen(false);
    // Reset form states
    setJudul('');
    setSelectedSoalIds([]);
    setFilterTipeSoal('ALL');
    setSearchQuerySoal('');
    setShowAllMapelSoal(false);
    alert(`Jadwal Ujian "${judul}" berhasil dibuat dan siap dikerjakan oleh siswa!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Jadwal Ujian CBT & Simulasi Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur pelaksanaan sesi evaluasi, target rombel kelas, kelengkapan materi Kurikulum Merdeka, dan rilis ujian untuk siswa.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Jadwal Ujian Baru</span>
        </button>
      </div>

      {/* SCHEDULES LIST GRID */}
      <div className="space-y-4">
        {jadwalList.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <CalendarClock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Belum Ada Jadwal Ujian CBT Aktif
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Seluruh isian jadwal lama telah dibersihkan. Anda dapat merilis Jadwal Ujian CBT baru dengan materi lengkap (SMP & SMA) sehingga siswa bisa langsung memulai ujian.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Jadwal Ujian CBT Baru</span>
              </button>
            </div>
          </div>
        ) : (
          jadwalList.map((jadwal) => {
            const isLive = jadwal.status === 'SEDANG_BERLANGSUNG';
            const isCompleted = jadwal.status === 'SELESAI';

            return (
              <div
                key={jadwal.id}
                className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all space-y-4 ${
                  isLive
                    ? 'border-emerald-300 ring-1 ring-emerald-400 shadow-md'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Top row: Status, Subject, Target */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {isLive && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        AKTIF (SIAP DIKERJAKAN)
                      </span>
                    )}
                    {jadwal.status === 'DIJADWALKAN' && (
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        DIJADWALKAN
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        SELESAI
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                      {jadwal.mataPelajaran}
                    </span>
                    {jadwal.topik && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-semibold text-xs border border-purple-200">
                        {jadwal.topik}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium">{jadwal.fase}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{jadwal.judul}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      Target: <strong className="text-slate-800">{jadwal.targetKelas.join(', ')}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Durasi: <strong className="text-slate-800">{jadwal.durasiMenit} Menit</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-400" />
                      Paket: <strong className="text-slate-800">{jadwal.totalSoal} Butir Soal</strong> (Bobot: {jadwal.totalBobot})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shuffle className="w-4 h-4 text-slate-400" />
                      Acak Soal: <strong className="text-slate-800">{jadwal.acakSoal ? 'Ya' : 'Tidak'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      KKM:{' '}
                      <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        {jadwal.kkm}
                      </strong>
                    </span>
                    {jadwal.pembuat && (
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Pembuat: <strong>{jadwal.pembuat}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Time Interval & Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500">
                    Akses Ujian: <span className="font-semibold text-slate-700">{jadwal.waktuMulai.replace('T', ' ')}</span> s/d{' '}
                    <span className="font-semibold text-slate-700">{jadwal.waktuSelesai.replace('T', ' ')}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Progress Monitoring Button */}
                    <Link
                      href={`/guru/monitoring?scheduleId=${jadwal.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Pantau progres murid secara real-time dan deteksi pelanggaran tab"
                    >
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>📡 Pantau Progres (Live)</span>
                    </Link>

                    {/* Share Link to Students */}
                    <button
                      type="button"
                      onClick={() => setShareModalJadwal(jadwal)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan Link Murid</span>
                    </button>

                    {/* Direct Simulation Link for testing */}
                    <Link
                      href={`/exam/${jadwal.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>🚀 Uji Coba Simulasi Ujian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Status Toggle Switcher */}
                    {jadwal.status !== 'SEDANG_BERLANGSUNG' ? (
                      <button
                        onClick={() => updateJadwalStatus(jadwal.id, 'SEDANG_BERLANGSUNG')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Aktifkan Sesi</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateJadwalStatus(jadwal.id, 'SELESAI')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Selesaikan Sesi</span>
                      </button>
                    )}

                    {/* View Submissions */}
                    <Link
                      href={`/guru/hasil?jadwalId=${jadwal.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Nilai Siswa</span>
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm('Hapus jadwal ujian ini?')) {
                          deleteJadwal(jadwal.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================= MODAL: RILIS JADWAL CBT BARU ======================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-blue-600" />
                  Konfigurasi Jadwal Ujian CBT Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Lengkapi materi Kurikulum Merdeka (SMP & SMA) dan tentukan butir soal yang diujikan.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateJadwal} className="space-y-5">
              {/* Active Teacher Creator Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                    {guruProfile?.namaLengkap
                      ? guruProfile.namaLengkap.slice(0, 2).toUpperCase()
                      : 'GU'}
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold uppercase block">
                      Guru Penanggung Jawab / Pembuat Jadwal:
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {guruProfile?.namaLengkap || 'Bapak/Ibu Guru Pengampu'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                  Aktif Terhubung
                </span>
              </div>

              {/* 1. Pilih Jenjang Pendidikan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>1. Jenjang Pendidikan:</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setJenjangForm('SMP')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      jenjangForm === 'SMP'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">Jenjang SMP</span>
                      <span className={`text-[10px] ${jenjangForm === 'SMP' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Fase D (Kelas 7-9)
                      </span>
                    </div>
                    {jenjangForm === 'SMP' && <Check className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setJenjangForm('SMA')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      jenjangForm === 'SMA'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">Jenjang SMA</span>
                      <span className={`text-[10px] ${jenjangForm === 'SMA' ? 'text-blue-100' : 'text-slate-500'}`}>
                        Fase E & F (Kelas 10-12)
                      </span>
                    </div>
                    {jenjangForm === 'SMA' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2 & 3: Judul, Mapel, Topik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Sesi Ujian *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Asesmen Sumatif Akhir Semester (ASAS) Informatika 2026"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Mata Pelajaran ({jenjangForm})</span>
                  </label>
                  <select
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama} [{m.kategori}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Topik Materi</span>
                  </label>
                  <select
                    value={topikForm}
                    onChange={(e) => setTopikForm(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    {topikList.length === 0 ? (
                      <option value="">Pilih Mata Pelajaran Dahulu</option>
                    ) : (
                      topikList.map((t) => (
                        <option key={t.id} value={t.nama}>
                          {t.nama}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Grid: KKM & Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KKM Kelulusan</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={kkm}
                    onChange={(e) => setKkm(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Target Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Rombel Kelas:</label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Pilih sasaran rombel ujian (murid nantinya akan menuliskan nama kelasnya secara spesifik di portal siswa, misal: 7-A, 8-1):
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {['Kelas 7 SMP', 'Kelas 8 SMP'].map((kls) => {
                    const isChecked = targetKelas.includes(kls);
                    return (
                      <button
                        type="button"
                        key={kls}
                        onClick={() => handleToggleTargetKelas(kls)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        <span>{kls}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Randomize Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acakSoal}
                    onChange={(e) => setAcakSoal(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Acak Urutan Soal (Anti-Mencontek)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acakOpsi}
                    onChange={(e) => setAcakOpsi(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-700">Acak Pilihan Opsi PG</span>
                </label>
              </div>

              {/* QUESTION PICKER SECTION */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-900">
                        Pilih Paket Butir Soal ({selectedSoalIds.length} Terpilih)
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        {mapel} ({jenjangForm})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>
                        Total Bobot: <strong className="text-blue-600 font-bold">{totalSelectedBobot} Poin</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">
                        Rincian: PG ({selectedCountByType.PG}), PGK ({selectedCountByType.PGK}), Menjodohkan ({selectedCountByType.MENJODOHKAN}), Uraian ({selectedCountByType.URAIAN})
                      </span>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectOnlyPgAndEssay}
                      title="Pilih butir soal Pilihan Ganda & Uraian/Essay saja"
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hanya PG & Essay</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectAllMapel}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Pilih Semua Soal Mapel Ini
                    </button>

                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                {/* Filter Tipe Soal Tabs & Search Input */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  {/* Tipe Soal Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFilterTipeSoal('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterTipeSoal === 'ALL'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({typeCounts.ALL})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTipeSoal('PG')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterTipeSoal === 'PG'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      PG ({typeCounts.PG})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTipeSoal('PGK')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterTipeSoal === 'PGK'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      PGK ({typeCounts.PGK})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTipeSoal('MENJODOHKAN')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterTipeSoal === 'MENJODOHKAN'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      Menjodohkan ({typeCounts.MENJODOHKAN})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTipeSoal('URAIAN')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterTipeSoal === 'URAIAN'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      Uraian / Essay ({typeCounts.URAIAN})
                    </button>
                  </div>

                  {/* Search Box */}
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari butir pertanyaan..."
                      value={searchQuerySoal}
                      onChange={(e) => setSearchQuerySoal(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Scope Toggle */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllMapelSoal}
                      onChange={(e) => setShowAllMapelSoal(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span>Tampilkan juga seluruh soal dari mapel lain ({soalList.length} butir)</span>
                  </label>
                  <span>Menampilkan {displayedPickerQuestions.length} butir soal</span>
                </div>

                {/* List of selectable questions */}
                {soalList.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold text-amber-900">
                      Bank Soal Anda saat ini masih kosong
                    </p>
                    <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                      Silakan buka menu <b>Bank Soal</b> untuk men-generate soal AI (Gemini) atau membuat soal terlebih dahulu sebelum merilis jadwal ujian.
                    </p>
                    <Link
                      href="/guru/bank-soal"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ke Bank Soal & Generate Soal AI</span>
                    </Link>
                  </div>
                ) : mapelQuestions.length === 0 && !showAllMapelSoal ? (
                  <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-blue-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-900">
                      Belum ada butir soal spesifik untuk Mata Pelajaran "{mapel}" ({jenjangForm})
                    </p>
                    <p className="text-[11px] text-slate-600 max-w-md mx-auto">
                      Di Bank Soal Anda saat ini terdapat {soalList.length} butir soal dari mata pelajaran lain. Anda dapat membuat soal baru untuk {mapel} atau menampilkan seluruh bank soal.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <Link
                        href={`/guru/bank-soal?tab=generator`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ Buat / Generate Soal {mapel}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShowAllMapelSoal(true)}
                        className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 cursor-pointer"
                      >
                        Tampilkan Seluruh Bank Soal ({soalList.length})
                      </button>
                    </div>
                  </div>
                ) : displayedPickerQuestions.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Tidak ada butir soal yang cocok</p>
                    <p className="text-[11px] text-slate-500">
                      Coba ganti filter tipe soal atau hapus kata kunci pencarian.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                    {displayedPickerQuestions.map((s, idx) => {
                      const isSelected = selectedSoalIds.includes(s.id);
                      const typeBadgeStyle =
                        s.tipeSoal === 'PG'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : s.tipeSoal === 'PGK'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : s.tipeSoal === 'MENJODOHKAN'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSoal(s.id)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-400 ring-1 ring-blue-300 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded mt-0.5 pointer-events-none shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="font-bold text-slate-800">#{idx + 1}</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${typeBadgeStyle}`}>
                                {s.tipeSoal === 'PG'
                                  ? 'Pilihan Ganda'
                                  : s.tipeSoal === 'PGK'
                                  ? 'PG Kompleks'
                                  : s.tipeSoal === 'MENJODOHKAN'
                                  ? 'Menjodohkan'
                                  : 'Uraian / Essay'}
                              </span>
                              <span className="text-slate-600 font-medium text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                {s.mataPelajaran}
                              </span>
                              {s.topik && (
                                <span className="text-purple-700 text-[10px] font-medium truncate max-w-[200px]">
                                  ({s.topik})
                                </span>
                              )}
                            </div>
                            <p className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                              {s.pertanyaan}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded shrink-0">
                            {s.bobot} Poin
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedSoalIds.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    selectedSoalIds.length === 0
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Rilis Jadwal Ujian {selectedSoalIds.length > 0 ? `(${selectedSoalIds.length} Soal)` : ''}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL BAGIKAN LINK UJIAN KE MURID ================= */}
      {shareModalJadwal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Bagikan Link Ujian ke Murid
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {shareModalJadwal.judul} • {shareModalJadwal.mataPelajaran}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalJadwal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Notification Banner when copied */}
              {copiedTextNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{copiedTextNotice}</span>
                </div>
              )}

              {/* 1. Direct Exam Link Box */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Link Langsung Halaman Login & Pengerjaan Ujian Murid:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getExamLink(shareModalJadwal.id)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLinkDirect(shareModalJadwal.id)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  *Murid yang mengklik link ini akan langsung diarahkan ke halaman login siswa untuk mengisi Nama Lengkap dan Kelas sebelum mengerjakan soal, sehingga terekap otomatis di data guru.
                </p>
              </div>

              {/* 2. Formatted Announcement Message for WhatsApp / Classroom */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Format Pesan WhatsApp & Google Classroom:</span>
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={getShareMessage(shareModalJadwal)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed resize-none focus:outline-none select-all"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyShareText(shareModalJadwal)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks WhatsApp</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareMessage(shareModalJadwal))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Buka WhatsApp Web Langsung</span>
                  </a>

                  <Link
                    href={`/exam/${shareModalJadwal.id}`}
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition flex items-center gap-1 ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pratinjau Halaman Siswa</span>
                  </Link>
                </div>
              </div>

              {/* 3. Guide note for students */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-[11px] text-blue-900">
                <p className="font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  <span>Petunjuk Pengerjaan Murid:</span>
                </p>
                <p className="text-slate-600 leading-normal">
                  Murid membuka link, mengisi <b>Nama Lengkap</b> dan <b>Kelas / Rombel</b> (misal: 7-A, 8-1), lalu langsung mengerjakan <b>{shareModalJadwal.totalSoal} butir soal</b>. Skor otomatis terekam ke menu <b>Hasil Ujian Guru</b>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShareModalJadwal(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

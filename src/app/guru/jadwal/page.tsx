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
  ArrowLeft,
  Share2,
  Send,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  Radio,
  Edit3,
  ShieldAlert
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

function toDateTimeLocalString(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return new Date().toISOString().slice(0, 16);
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
}

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

/**
 * Filter cerdas untuk mencocokkan butir soal dengan Topik Pembelajaran yang dipilih
 */
function isSoalMatchingTopic(soal: Soal, targetTopic: string): boolean {
  if (!targetTopic || targetTopic.trim() === '' || targetTopic === 'ALL') {
    return true;
  }
  if (!soal.topik || soal.topik.trim() === '') {
    return false;
  }

  const sTopik = soal.topik.trim().toLowerCase();
  const tTopik = targetTopic.trim().toLowerCase();

  // 1. Exact match (case insensitive)
  if (sTopik === tTopik) return true;

  // 2. Main concept match (sebelum tanda kurung jika ada)
  // Contoh: "Berpikir Komputasional (Decomposisi, Pola, Abstraksi, Algoritma)" -> "Berpikir Komputasional"
  const sMain = sTopik.split('(')[0].trim();
  const tMain = tTopik.split('(')[0].trim();

  if (sMain === tMain && sMain.length >= 3) return true;

  // 3. Substring match
  if (sTopik.includes(tMain) || tTopik.includes(sMain)) return true;

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
  const [editingJadwalId, setEditingJadwalId] = useState<string | null>(null);
  const [judul, setJudul] = useState('');
  const [jenjangForm, setJenjangForm] = useState<JenjangPendidikan>('SMP');
  const [mapelList, setMapelList] = useState<MataPelajaranDetail[]>([]);
  const [mapel, setMapel] = useState('Informatika');
  const [topikList, setTopikList] = useState<TopikMateri[]>([]);
  // Multi-Select Topik Pembelajaran
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Target Kelas & Durasi: Default KOSONG (sesuai permintaan Guru)
  const [targetKelas, setTargetKelas] = useState<string[]>([]);
  const [durasiMenit, setDurasiMenit] = useState<number>(60);

  const availableRombelList = useMemo(() => {
    return jenjangForm === 'SMP'
      ? ['Kelas 7 SMP', 'Kelas 8 SMP', 'Kelas 9 SMP']
      : ['Kelas 10 SMA', 'Kelas 11 SMA', 'Kelas 12 SMA'];
  }, [jenjangForm]);

  // Waktu
  const [waktuMulai, setWaktuMulai] = useState(toDateTimeLocalString(new Date().toISOString()));
  const [waktuSelesai, setWaktuSelesai] = useState(
    toDateTimeLocalString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
  );
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(true);
  const [kkm, setKkm] = useState(75);

  const handleOpenEditModal = (j: JadwalUjian) => {
    setEditingJadwalId(j.id);
    setJudul(j.judul || '');
    setJenjangForm((j.jenjang as JenjangPendidikan) || 'SMP');
    setMapel(j.mataPelajaran || '');
    if (j.topik) {
      const parts = j.topik.split(',').map((t) => t.trim()).filter(Boolean);
      setSelectedTopics(parts);
    } else {
      setSelectedTopics([]);
    }
    setTargetKelas(j.targetKelas && j.targetKelas.length > 0 ? j.targetKelas : []);
    setDurasiMenit(j.durasiMenit || 60);
    setWaktuMulai(toDateTimeLocalString(j.waktuMulai));
    setWaktuSelesai(toDateTimeLocalString(j.waktuSelesai));
    setAcakSoal(j.acakSoal ?? true);
    setAcakOpsi(j.acakOpsi ?? true);
    setKkm(j.kkm || 75);
    setSelectedSoalIds(j.soalIds || []);
    setIsFormOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingJadwalId(null);
    setJudul('');
    setJenjangForm('SMP');
    setMapel('Informatika');
    const topics = getTopikByMataPelajaran('SMP', 'Informatika');
    setTopikList(topics);
    // Inisialisasi topik pertama jika tersedia
    setSelectedTopics(topics.length > 0 ? [topics[0].nama] : []);
    // Default rombel kosong (guru dapat memilih atau klik tombol Pilih Semua Rombel)
    setTargetKelas([]);
    setDurasiMenit(60);
    setWaktuMulai(toDateTimeLocalString(new Date().toISOString()));
    setWaktuSelesai(toDateTimeLocalString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()));
    setAcakSoal(true);
    setAcakOpsi(true);
    setKkm(75);
    setSelectedSoalIds([]);
    setShowAllMapelSoal(false);
    setIncludeReleasedSoal(false);
    setIsFormOpen(true);
  };

  // Selected questions from Bank Soal
  const [selectedSoalIds, setSelectedSoalIds] = useState<string[]>([]);

  // Picker Filter, Search, and Scope states
  const [filterTipeSoal, setFilterTipeSoal] = useState<'ALL' | TipeSoal>('ALL');
  const [searchQuerySoal, setSearchQuerySoal] = useState<string>('');
  const [showAllMapelSoal, setShowAllMapelSoal] = useState<boolean>(false);
  const [includeReleasedSoal, setIncludeReleasedSoal] = useState<boolean>(false);

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
      setSelectedTopics([]);
      return;
    }
    const topics = getTopikByMataPelajaran(jenjangForm, mapel);
    setTopikList(topics);
    if (!editingJadwalId) {
      // Default: pilih topik pertama jika tersedia
      setSelectedTopics(topics.length > 0 ? [topics[0].nama] : []);
    }
  }, [jenjangForm, mapel, editingJadwalId]);

  // Set ID butir soal yang SUDAH PERNAH DIRILIS di jadwal ujian mana pun
  const releasedSoalIds = useMemo(() => {
    const set = new Set<string>();
    const pool = (allJadwalList && allJadwalList.length > 0) ? allJadwalList : jadwalList;
    pool.forEach((j) => {
      // Jika sedang dalam mode edit suatu jadwal, jangan anggap soal di jadwal ini
      // sebagai "terpakai di jadwal lain" agar tetap tampil & terpilih
      if (editingJadwalId && j.id === editingJadwalId) return;
      if (Array.isArray(j.soalIds)) {
        j.soalIds.forEach((id) => {
          if (id) set.add(id);
        });
      }
    });
    return set;
  }, [allJadwalList, jadwalList, editingJadwalId]);

  // Soal yang memenuhi syarat: sesuai Mapel & Jenjang, sesuai Topik Form aktif (bisa lebih dari 1 topik), dan BELUM PERNAH DIRILIS
  const eligibleQuestions = useMemo(() => {
    return soalList.filter((s) => {
      // 1. Cek kecocokan Mapel & Jenjang
      if (!showAllMapelSoal && !isSoalMatchingMapelAndJenjang(s, jenjangForm, mapel)) {
        return false;
      }

      // 2. Cek kecocokan Topik Pembelajaran yang dipilih (HANYA soal yang sesuai dengan salah satu topik yang dipilih)
      if (!showAllMapelSoal && selectedTopics.length > 0) {
        const matchesAnyTopic = selectedTopics.some((t) => isSoalMatchingTopic(s, t));
        if (!matchesAnyTopic) return false;
      }

      // 3. JANGAN MUNCULKAN SOAL YANG SUDAH PERNAH DIRILIS (kecuali opsi diaktifkan secara eksplisit)
      if (!includeReleasedSoal && releasedSoalIds.has(s.id)) {
        return false;
      }

      return true;
    });
  }, [
    soalList,
    showAllMapelSoal,
    jenjangForm,
    mapel,
    selectedTopics,
    includeReleasedSoal,
    releasedSoalIds,
  ]);

  // Total soal pada topik yang dipilih untuk transparansi dan indikator
  const totalTopicQuestions = useMemo(() => {
    return soalList.filter((s) => {
      if (!isSoalMatchingMapelAndJenjang(s, jenjangForm, mapel)) return false;
      if (selectedTopics.length > 0) {
        return selectedTopics.some((t) => isSoalMatchingTopic(s, t));
      }
      return true;
    });
  }, [soalList, jenjangForm, mapel, selectedTopics]);

  const alreadyReleasedCountInThisTopic = useMemo(() => {
    return totalTopicQuestions.filter((s) => releasedSoalIds.has(s.id)).length;
  }, [totalTopicQuestions, releasedSoalIds]);

  // Filtered questions displayed in picker
  const displayedPickerQuestions = useMemo(() => {
    return eligibleQuestions.filter((s) => {
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
  }, [eligibleQuestions, filterTipeSoal, searchQuerySoal]);

  // Type counts based on current active scope
  const typeCounts = useMemo(() => {
    return {
      ALL: eligibleQuestions.length,
      PG: eligibleQuestions.filter((s) => s.tipeSoal === 'PG').length,
      PGK: eligibleQuestions.filter((s) => s.tipeSoal === 'PGK').length,
      MENJODOHKAN: eligibleQuestions.filter((s) => s.tipeSoal === 'MENJODOHKAN').length,
      URAIAN: eligibleQuestions.filter((s) => s.tipeSoal === 'URAIAN').length,
    };
  }, [eligibleQuestions]);

  // Auto-select questions: HANYA pilih butir soal yang sesuai topik aktif DAN belum pernah dirilis!
  useEffect(() => {
    if (!editingJadwalId && isFormOpen) {
      if (eligibleQuestions.length > 0) {
        setSelectedSoalIds(eligibleQuestions.map((s) => s.id));
      } else {
        setSelectedSoalIds([]);
      }
    }
  }, [editingJadwalId, isFormOpen, eligibleQuestions]);

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
    const pgAndEssay = eligibleQuestions.filter((s) => s.tipeSoal === 'PG' || s.tipeSoal === 'URAIAN');
    setSelectedSoalIds(pgAndEssay.map((s) => s.id));
  };

  const handleSelectAllTopic = () => {
    setSelectedSoalIds(eligibleQuestions.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSoalIds([]);
  };

  // Toggle class target selection
  const handleToggleTargetKelas = (kls: string) => {
    if (targetKelas.includes(kls)) {
      setTargetKelas(targetKelas.filter((k) => k !== kls));
    } else {
      setTargetKelas([...targetKelas, kls]);
    }
  };

  // Handle Form Submit (Create or Edit)
  const handleCreateJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert('Judul Ujian wajib diisi!');
      return;
    }
    if (targetKelas.length === 0) {
      alert('Harap pilih minimal 1 target rombel kelas! (Atau klik tombol "Pilih Semua Rombel")');
      return;
    }
    if (selectedSoalIds.length === 0) {
      alert('Pilih minimal 1 butir soal dari Bank Soal untuk ujian ini!');
      return;
    }

    const calculatedFase: Fase = jenjangForm === 'SMP' ? 'Fase D (SMP)' : 'Fase E (SMA 10)';
    const finalTopik = selectedTopics.length > 0 ? selectedTopics.join(', ') : mapel;

    if (editingJadwalId) {
      // Mode Edit: pertahankan ID, pembuat, token, dan status sesi yang ada
      const existing = jadwalList.find((j) => j.id === editingJadwalId);
      const updatedJadwal: JadwalUjian = {
        id: editingJadwalId,
        judul,
        jenjang: jenjangForm,
        mataPelajaran: mapel,
        topik: finalTopik,
        fase: calculatedFase,
        targetKelas,
        durasiMenit: Number(durasiMenit),
        token: existing?.token || '',
        tanpaToken: true,
        waktuMulai: new Date(waktuMulai).toISOString(),
        waktuSelesai: new Date(waktuSelesai).toISOString(),
        acakSoal,
        acakOpsi,
        status: existing?.status || 'SEDANG_BERLANGSUNG',
        soalIds: selectedSoalIds,
        totalSoal: selectedSoalIds.length,
        totalBobot: totalSelectedBobot,
        kkm,
        pembuat: existing?.pembuat || guruProfile?.namaLengkap || 'Guru Penanggung Jawab CBT',
        guruUsername: existing?.guruUsername || guruProfile?.username || '',
      };

      addJadwal(updatedJadwal);
      setIsFormOpen(false);
      setEditingJadwalId(null);
      alert(`Perubahan Jadwal Ujian "${judul}" berhasil disimpan!`);
    } else {
      // Mode Buat Baru
      const newJadwal: JadwalUjian = {
        id: `cbt-${Date.now()}`,
        judul,
        jenjang: jenjangForm,
        mataPelajaran: mapel,
        topik: finalTopik,
        fase: calculatedFase,
        targetKelas,
        durasiMenit: Number(durasiMenit),
        token: '',
        tanpaToken: true,
        waktuMulai: new Date(waktuMulai).toISOString(),
        waktuSelesai: new Date(waktuSelesai).toISOString(),
        acakSoal,
        acakOpsi,
        status: 'SEDANG_BERLANGSUNG',
        soalIds: selectedSoalIds,
        totalSoal: selectedSoalIds.length,
        totalBobot: totalSelectedBobot,
        kkm,
        pembuat: guruProfile?.namaLengkap || 'Guru Penanggung Jawab CBT',
        guruUsername: guruProfile?.username || '',
      };

      addJadwal(newJadwal);
      setIsFormOpen(false);
      alert(`Jadwal Ujian "${judul}" berhasil dibuat dan siap dikerjakan oleh siswa!`);
    }

    // Reset form states
    setJudul('');
    setSelectedSoalIds([]);
    setFilterTipeSoal('ALL');
    setSearchQuerySoal('');
    setShowAllMapelSoal(false);
  };

  // =========================================================================
  // SUB-HALAMAN: KONFIGURASI JADWAL CBT (BUKAN MODAL MENGAMBANG)
  // Menyesuaikan kenyamanan pengajar senior (font besar, tombol lega)
  // =========================================================================
  if (isFormOpen) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Top Header Navigasi Sub-Halaman */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
              <CalendarClock className="w-4 h-4 text-blue-700" />
              Sub-Bagian Jadwal CBT
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {editingJadwalId ? 'Edit Sesi Jadwal Ujian CBT' : 'Konfigurasi Rilis Jadwal Ujian CBT Baru'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {editingJadwalId
                ? 'Perbarui judul, durasi pengerjaan, rentang waktu akses, target rombel, multi-topik pembelajaran, atau paket butir soal.'
                : 'Lengkapi materi Kurikulum Merdeka (SMP & SMA), tentukan multi-topik, dan pilih butir soal yang diujikan.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsFormOpen(false);
              setEditingJadwalId(null);
            }}
            className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm sm:text-base border-2 border-slate-300 flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer self-start md:self-auto hover:scale-[1.02]"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
            <span>⬅️ Kembali ke Daftar Jadwal</span>
          </button>
        </div>

        {/* Sub-Halaman Form Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md space-y-8">
          <form onSubmit={handleCreateJadwal} className="space-y-8">
            {/* Active Teacher Creator Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                  {guruProfile?.namaLengkap
                    ? guruProfile.namaLengkap.slice(0, 2).toUpperCase()
                    : 'GU'}
                </div>
                <div>
                  <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block">
                    Guru Pengampu / Penanggung Jawab Sesi Ujian:
                  </span>
                  <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {guruProfile?.namaLengkap || 'Bapak/Ibu Guru Pengampu CBT'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-300 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Akun Guru Aktif
              </span>
            </div>

            {/* 1. Pilih Jenjang Pendidikan */}
            <div className="space-y-2">
              <label className="block text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>1. Jenjang Pendidikan:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <button
                  type="button"
                  onClick={() => setJenjangForm('SMP')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    jenjangForm === 'SMP'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <span className="font-black text-base block">Jenjang SMP</span>
                    <span className={`text-xs ${jenjangForm === 'SMP' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Fase D (Kelas 7, 8, 9)
                    </span>
                  </div>
                  {jenjangForm === 'SMP' && <Check className="w-5 h-5 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setJenjangForm('SMA')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    jenjangForm === 'SMA'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <span className="font-black text-base block">Jenjang SMA</span>
                    <span className={`text-xs ${jenjangForm === 'SMA' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Fase E & F (Kelas 10, 11, 12)
                    </span>
                  </div>
                  {jenjangForm === 'SMA' && <Check className="w-5 h-5 stroke-[3]" />}
                </button>
              </div>
            </div>

            {/* 2. Judul Ujian & Mata Pelajaran */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-base font-bold text-slate-800">
                  Judul Sesi Ujian *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester (ASAS) Informatika 2026"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  className="w-full p-4 text-base font-semibold rounded-2xl border-2 border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 text-slate-900 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>Mata Pelajaran ({jenjangForm}) *</span>
                </label>
                <select
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full p-4 text-base rounded-2xl border-2 border-slate-300 bg-white font-bold text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.nama}>
                      {m.nama} [{m.kategori}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Durasi Pengerjaan (Menit)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durasiMenit}
                  onChange={(e) => setDurasiMenit(Number(e.target.value))}
                  className="w-full p-4 text-base font-black rounded-2xl border-2 border-slate-300 text-blue-700 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* 3. MULTI-SELECT TOPIK PEMBELAJARAN (Bisa memilih lebih dari 1 topik) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <span>3. Topik Pembelajaran:</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {selectedTopics.length} Topik Dipilih
                    </span>
                  </label>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Centang satu atau lebih topik di bawah ini untuk menggabungkan materi butir soal ujian:
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTopics(topikList.map((t) => t.nama))}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    ✨ Pilih Semua Topik
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTopics([])}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                  >
                    Kosongkan Topik
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {topikList.length === 0 ? (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-500">
                    Pilih Mata Pelajaran terlebih dahulu untuk memuat topik kurikulum.
                  </div>
                ) : (
                  topikList.map((t) => {
                    const isChecked = selectedTopics.includes(t.nama);
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedTopics(selectedTopics.filter((x) => x !== t.nama));
                          } else {
                            setSelectedTopics([...selectedTopics, t.nama]);
                          }
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                          isChecked
                            ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-200 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm sm:text-base font-bold text-slate-900 block leading-snug">
                            {t.nama}
                          </span>
                          {t.deskripsi && (
                            <span className="text-xs text-slate-500 mt-1 line-clamp-2 block leading-relaxed">
                              {t.deskripsi}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedTopics.length === 0 && (
                <p className="text-xs font-semibold text-slate-500 italic">
                  * Jika semua topik kosong, sistem akan menampilkan seluruh soal dari mata pelajaran {mapel}.
                </p>
              )}
            </div>

            {/* 4. TARGET ROMBEL KELAS (Default KOSONG + Tombol Pilih Semua Rombel) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>4. Target Rombel Kelas:</span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {targetKelas.length} Rombel Terpilih
                    </span>
                  </label>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Pilih sasaran kelas ujian (siswa nantinya akan menuliskan nama kelasnya secara spesifik di portal siswa, misal: 7-A, 8-1).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTargetKelas([...availableRombelList])}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    ✨ Pilih Semua Rombel
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetKelas([])}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                  >
                    Kosongkan Pilihan
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                {availableRombelList.map((kls) => {
                  const isChecked = targetKelas.includes(kls);
                  return (
                    <button
                      type="button"
                      key={kls}
                      onClick={() => handleToggleTargetKelas(kls)}
                      className={`px-6 py-3.5 rounded-2xl text-sm sm:text-base font-extrabold transition-all border-2 cursor-pointer flex items-center gap-3 ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100 scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-white border-white text-blue-600' : 'border-slate-400 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span>{kls}</span>
                    </button>
                  );
                })}
              </div>
              {targetKelas.length === 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Rombel saat ini kosong. Silakan klik salah satu rombel di atas atau gunakan tombol &quot;Pilih Semua Rombel&quot;.</span>
                </div>
              )}
            </div>

            {/* 5. KKM & Waktu Akses Ujian */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <label className="block text-base font-bold text-slate-800">
                  KKM Kelulusan
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={kkm}
                  onChange={(e) => setKkm(Number(e.target.value))}
                  className="w-full p-4 text-base font-black rounded-2xl border-2 border-slate-300 text-emerald-700 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Waktu Mulai Akses *</span>
                </label>
                <input
                  type="datetime-local"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  required
                  className="w-full p-4 text-sm sm:text-base font-semibold rounded-2xl border-2 border-slate-300 text-slate-800 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-600" />
                  <span>Waktu Selesai Akses *</span>
                </label>
                <input
                  type="datetime-local"
                  value={waktuSelesai}
                  onChange={(e) => setWaktuSelesai(e.target.value)}
                  required
                  className="w-full p-4 text-sm sm:text-base font-semibold rounded-2xl border-2 border-slate-300 text-slate-800 bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-100"
                />
                <p className="text-xs text-slate-500">
                  * Mundurkan tanggal/jam ini jika ingin memperpanjang jadwal ujian murid.
                </p>
              </div>
            </div>

            {/* 6. Randomize Toggles */}
            <div className="flex flex-wrap items-center gap-8 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acakSoal}
                  onChange={(e) => setAcakSoal(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  Acak Urutan Soal (Anti-Mencontek)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acakOpsi}
                  onChange={(e) => setAcakOpsi(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  Acak Pilihan Opsi PG
                </span>
              </label>
            </div>

            {/* 7. QUESTION PICKER SECTION */}
            <div className="space-y-4 pt-4 border-t-2 border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <label className="text-base sm:text-lg font-black text-slate-900">
                      Pilih Paket Butir Soal ({selectedSoalIds.length} Terpilih)
                    </label>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                      {mapel} ({jenjangForm})
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                    <span>
                      Total Bobot: <strong className="text-blue-700 font-black">{totalSelectedBobot} Poin</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      Rincian: PG ({selectedCountByType.PG}), PGK ({selectedCountByType.PGK}), Menjodohkan ({selectedCountByType.MENJODOHKAN}), Uraian ({selectedCountByType.URAIAN})
                    </span>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectOnlyPgAndEssay}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hanya PG & Essay</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAllTopic}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Pilih Semua Soal Topik Ini
                  </button>

                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>

              {/* Filter Topik Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                    Filter Topik Aktif:
                  </span>
                  {selectedTopics.length > 0 ? (
                    selectedTopics.map((topikName) => (
                      <span key={topikName} className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs">
                        {topikName}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-700 text-white">
                      Semua Topik ({mapel})
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {eligibleQuestions.length} Soal Belum Dirilis
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {alreadyReleasedCountInThisTopic > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      {alreadyReleasedCountInThisTopic} soal sudah pernah dirilis disembunyikan
                    </span>
                  )}

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 font-semibold select-none ml-auto">
                    <input
                      type="checkbox"
                      checked={includeReleasedSoal}
                      onChange={(e) => setIncludeReleasedSoal(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Tampilkan yang sudah pernah dirilis</span>
                  </label>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => setFilterTipeSoal('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      filterTipeSoal === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({typeCounts.ALL})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTipeSoal('PG')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      filterTipeSoal === 'URAIAN'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Uraian ({typeCounts.URAIAN})
                  </button>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari butir pertanyaan..."
                    value={searchQuerySoal}
                    onChange={(e) => setSearchQuerySoal(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Questions Picker List */}
              <div className="space-y-2 border-2 border-slate-200 rounded-2xl p-4 bg-slate-50 max-h-[500px] overflow-y-auto">
                {displayedPickerQuestions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Tidak ada butir soal yang sesuai filter</p>
                    <p className="text-xs text-slate-500">Coba ganti filter tipe soal atau centang topik lain di atas.</p>
                  </div>
                ) : (
                  displayedPickerQuestions.map((s, idx) => {
                    const isSelected = selectedSoalIds.includes(s.id);
                    const typeBadgeStyle =
                      s.tipeSoal === 'PG'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : s.tipeSoal === 'PGK'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : s.tipeSoal === 'MENJODOHKAN'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300';

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleSoal(s.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-200 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-extrabold text-slate-900 text-sm">#{idx + 1}</span>
                            <span className={`font-bold px-2 py-0.5 rounded-md text-xs border ${typeBadgeStyle}`}>
                              {s.tipeSoal === 'PG'
                                ? 'Pilihan Ganda'
                                : s.tipeSoal === 'PGK'
                                ? 'PG Kompleks'
                                : s.tipeSoal === 'MENJODOHKAN'
                                ? 'Menjodohkan'
                                : 'Uraian / Essay'}
                            </span>
                            <span className="text-slate-700 font-semibold text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                              {s.mataPelajaran}
                            </span>
                            {s.topik && (
                              <span className="text-purple-700 text-xs font-semibold truncate max-w-[260px]">
                                ({s.topik})
                              </span>
                            )}
                            {releasedSoalIds.has(s.id) && (
                              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md text-xs border border-rose-300">
                                Sudah Pernah Dirilis
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 font-medium text-sm sm:text-base line-clamp-2 leading-relaxed">
                            {s.pertanyaan}
                          </p>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-lg shrink-0">
                          {s.bobot} Poin
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingJadwalId(null);
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-slate-300 text-slate-700 text-base font-black hover:bg-slate-100 cursor-pointer transition-all"
              >
                ⬅️ Batal & Kembali ke Jadwal
              </button>

              <button
                type="submit"
                disabled={selectedSoalIds.length === 0}
                className={`w-full sm:w-auto px-10 py-4 rounded-2xl text-white text-base sm:text-lg font-black shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  selectedSoalIds.length === 0
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 hover:scale-[1.02]'
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>
                  {editingJadwalId ? 'Simpan Perubahan Jadwal' : 'Simpan & Rilis Jadwal Ujian'}{' '}
                  {selectedSoalIds.length > 0 ? `(${selectedSoalIds.length} Soal Terpilih)` : ''}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          onClick={handleOpenCreateModal}
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
                onClick={handleOpenCreateModal}
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

                    {/* Edit Jadwal */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(jadwal)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Edit pengaturan sesi jadwal, durasi, tanggal akses, atau paket soal"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Jadwal</span>
                    </button>

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

      {/* Catatan: Form Konfigurasi Jadwal kini tampil menyatu sebagai Sub-Halaman Penuh (Full Page) */}

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

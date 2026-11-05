'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useCBTData } from '@/lib/store';
import { JadwalUjian, Fase } from '@/types/cbt';
import { getGuruProfile, GuruProfile } from '@/lib/guru-auth';
import {
  JenjangPendidikan,
  getMataPelajaranByJenjang,
  getTopikByMataPelajaran,
  TopikMateri,
  MataPelajaranDetail
} from '@/lib/curriculum-data';

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

  // Auto-select questions when modal opens if available
  useEffect(() => {
    if (isFormOpen && soalList.length > 0 && selectedSoalIds.length === 0) {
      setSelectedSoalIds(soalList.map((s) => s.id));
    }
  }, [isFormOpen, soalList]);

  // Calculate total selected count and bobot
  const selectedQuestions = soalList.filter((s) => selectedSoalIds.includes(s.id));
  const totalSelectedBobot = selectedQuestions.reduce((sum, s) => sum + s.bobot, 0);

  // Toggle question selection
  const handleToggleSoal = (id: string) => {
    if (selectedSoalIds.includes(id)) {
      setSelectedSoalIds(selectedSoalIds.filter((item) => item !== id));
    } else {
      setSelectedSoalIds([...selectedSoalIds, id]);
    }
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
    // Reset
    setJudul('');
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
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900">
                      Pilih Paket Butir Soal dari Bank Soal ({selectedSoalIds.length} terpilih)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Total Akumulasi Bobot: <span className="font-bold text-blue-600">{totalSelectedBobot} Poin</span>
                    </p>
                  </div>
                  {soalList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSoalIds.length === soalList.length) {
                          setSelectedSoalIds([]);
                        } else {
                          setSelectedSoalIds(soalList.map((s) => s.id));
                        }
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      {selectedSoalIds.length === soalList.length ? 'Batal Pilih Semua' : 'Pilih Semua Soal'}
                    </button>
                  )}
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
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                    {soalList.map((s, idx) => {
                      const isSelected = selectedSoalIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSoal(s.id)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded mt-0.5 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800">#{idx + 1}</span>
                              <span className="font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded text-[10px]">
                                {s.tipeSoal}
                              </span>
                              <span className="text-slate-500 text-[10px]">{s.mataPelajaran}</span>
                              {s.topik && (
                                <span className="text-purple-700 text-[10px] font-medium">({s.topik})</span>
                              )}
                            </div>
                            <p className="text-slate-800 font-medium line-clamp-2">
                              {s.pertanyaan}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">
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
                  disabled={soalList.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    soalList.length === 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Rilis Jadwal Ujian</span>
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

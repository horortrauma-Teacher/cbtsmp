'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileQuestion,
  PlusCircle,
  Filter,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  Plus,
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  FileText,
  Download,
  Printer,
  FolderArchive,
} from 'lucide-react';
import { useCBTData } from '@/lib/store';
import { Soal, Stimulus, TipeSoal, LevelKognitif, Fase, TipeStimulus } from '@/types/cbt';
import { getGuruProfile, GuruProfile } from '@/lib/guru-auth';
import { AIGeneratorModal } from '@/components/guru/AIGeneratorModal';
import {
  JenjangPendidikan,
  KURIKULUM_DATA,
  getMataPelajaranByJenjang,
  getTopikByMataPelajaran,
  TopikMateri
} from '@/lib/curriculum-data';

export interface DokumenPaketSoal {
  id: string;
  jenjang: 'SMP' | 'SMA';
  mataPelajaran: string;
  topik: string;
  fase: string;
  kelas: string[];
  soalList: Soal[];
  totalSoal: number;
  totalBobot: number;
  tipeCounts: {
    PG: number;
    PGK: number;
    MENJODOHKAN: number;
    URAIAN: number;
  };
  hotsCount: number;
  pembuat: string;
  updatedAt: string;
}

function BankSoalContent() {
  const searchParams = useSearchParams();
  const { soalList, allSoalList, stimulusList, allStimulusList, addSoal, deleteSoal, addStimulus } = useCBTData();
  const [guruProfile, setGuruProfileState] = useState<GuruProfile | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'mine' | 'all'>('mine');

  // Active Tab: 'daftar' | 'generator' | 'editor' (Sub-Halaman penuh, tidak mengambang)
  const [activeTab, setActiveTab] = useState<'daftar' | 'generator' | 'editor'>('daftar');

  // State untuk membuka / mengedit dokumen paket soal tertentu
  const [activeInspectedDocId, setActiveInspectedDocId] = useState<string | null>(null);

  // AI Generator Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Cascading Form states for Manual Editor
  const [jenjangForm, setJenjangForm] = useState<JenjangPendidikan>('SMP');
  const [mapel, setMapel] = useState('Bahasa Indonesia (Literasi)');
  const [topikForm, setTopikForm] = useState<string>('Teks Deskripsi & Objek Budaya Nusantara');
  const [availableTopics, setAvailableTopics] = useState<TopikMateri[]>([]);

  useEffect(() => {
    setGuruProfileState(getGuruProfile());
    const handleAuth = () => setGuruProfileState(getGuruProfile());
    window.addEventListener('guru-auth-change', handleAuth);
    return () => window.removeEventListener('guru-auth-change', handleAuth);
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'editor') {
      setActiveTab('editor');
    } else if (tabParam === 'generator') {
      setActiveTab('generator');
    }
  }, [searchParams]);

  // Synchronize available topics based on selected jenjang & mapel
  useEffect(() => {
    const topics = getTopikByMataPelajaran(jenjangForm, mapel);
    setAvailableTopics(topics);
    if (topics.length > 0) {
      // Set to first topic if current topic is not in the list
      if (!topics.some(t => t.nama === topikForm)) {
        setTopikForm(topics[0].nama);
      }
    } else {
      setTopikForm('');
    }
  }, [jenjangForm, mapel]);

  // Toast / notification state
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Callback to receive AI-generated questions
  const handleSaveAIQuestions = (newSoalList: Soal[]) => {
    const authorName = guruProfile?.namaLengkap || 'Guru Pengampu CBT';
    const authorUsername = guruProfile?.username || '';

    newSoalList.forEach((s) => {
      const enrichedStim: Stimulus | undefined = s.stimulus
        ? {
            ...s.stimulus,
            pembuat: s.stimulus.pembuat || authorName,
            guruUsername: s.stimulus.guruUsername || authorUsername,
          }
        : undefined;

      const enrichedSoal: Soal = {
        ...s,
        pembuat: s.pembuat || authorName,
        guruUsername: s.guruUsername || authorUsername,
        stimulus: enrichedStim,
      };

      if (enrichedStim) {
        addStimulus(enrichedStim);
      }
      addSoal(enrichedSoal);
    });
    showToast(`Berhasil menambahkan ${newSoalList.length} butir soal AI ke Bank Soal!`);
    setActiveTab('daftar');
  };

  // ===================== FILTER STATES =====================
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<'ALL' | 'SMP' | 'SMA'>('ALL');
  const [filterMapel, setFilterMapel] = useState('ALL');
  const [filterFase, setFilterFase] = useState('ALL');
  const [filterTipe, setFilterTipe] = useState('ALL');
  const [filterHots, setFilterHots] = useState('ALL');

  // Preview Modal
  const [selectedPreviewSoal, setSelectedPreviewSoal] = useState<Soal | null>(null);

  // ===================== EDITOR FORM STATES =====================
  const [stimulusMode, setStimulusMode] = useState<'select' | 'new' | 'none'>('none');
  const [selectedStimulusId, setSelectedStimulusId] = useState<string>('');
  
  // New Stimulus fields
  const [newStimJudul, setNewStimJudul] = useState('');
  const [newStimTeks, setNewStimTeks] = useState('');
  const [newStimTipe, setNewStimTipe] = useState<TipeStimulus>('Literasi');
  const [newStimGambar, setNewStimGambar] = useState('');
  const [newStimSumber, setNewStimSumber] = useState('');

  // Question fields
  const [fase, setFase] = useState<Fase>('Fase D (SMP)');
  const [kelasSelected, setKelasSelected] = useState<string[]>(['Kelas 8']);
  const [tipeSoal, setTipeSoal] = useState<TipeSoal>('PG');
  const [isHots, setIsHots] = useState<boolean>(true);
  const [levelKognitif, setLevelKognitif] = useState<LevelKognitif>('C4');
  const [pertanyaan, setPertanyaan] = useState('');
  const [gambarSoal, setGambarSoal] = useState('');
  const [bobot, setBobot] = useState<number>(10);

  // PG Options
  const [opsiPG, setOpsiPG] = useState<{ id: string; label: string; teks: string }[]>([
    { id: 'opt-a', label: 'A', teks: '' },
    { id: 'opt-b', label: 'B', teks: '' },
    { id: 'opt-c', label: 'C', teks: '' },
    { id: 'opt-d', label: 'D', teks: '' },
  ]);
  const [kunciPG, setKunciPG] = useState<string>('opt-a');

  // PGK Options (multiple correct answers)
  const [opsiPGK, setOpsiPGK] = useState<{ id: string; teks: string; isKunci: boolean }[]>([
    { id: 'pgk-1', teks: '', isKunci: true },
    { id: 'pgk-2', teks: '', isKunci: false },
    { id: 'pgk-3', teks: '', isKunci: true },
    { id: 'pgk-4', teks: '', isKunci: false },
  ]);

  // Menjodohkan pairs
  const [pasangan, setPasangan] = useState<{ id: string; premis: string; target: string }[]>([
    { id: 'pair-1', premis: '', target: '' },
    { id: 'pair-2', premis: '', target: '' },
    { id: 'pair-3', premis: '', target: '' },
  ]);

  // Uraian fields
  const [rubrikUraian, setRubrikUraian] = useState('');
  const [kunciUraian, setKunciUraian] = useState('');

  // Helper to toggle kelas selection
  const handleToggleKelas = (kls: string) => {
    if (kelasSelected.includes(kls)) {
      if (kelasSelected.length > 1) {
        setKelasSelected(kelasSelected.filter((k) => k !== kls));
      }
    } else {
      setKelasSelected([...kelasSelected, kls]);
    }
  };

  // Helper to handle form submission
  const handleSaveSoal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pertanyaan.trim()) {
      alert('Pertanyaan wajib diisi!');
      return;
    }

    let finalStimulus: Stimulus | undefined = undefined;
    let finalStimulusId: string | undefined = undefined;

    if (stimulusMode === 'new') {
      if (!newStimJudul.trim() || !newStimTeks.trim()) {
        alert('Mohon isi Judul dan Konten Teks untuk Stimulus baru!');
        return;
      }
      const createdStim: Stimulus = {
        id: `stim-${Date.now()}`,
        judul: newStimJudul,
        kontenTeks: newStimTeks,
        tipe: newStimTipe,
        gambarUrl: newStimGambar || undefined,
        sumber: newStimSumber || undefined,
        pembuat: guruProfile?.namaLengkap || 'Guru Pengampu CBT',
        guruUsername: guruProfile?.username || '',
      };
      addStimulus(createdStim);
      finalStimulus = createdStim;
      finalStimulusId = createdStim.id;
    } else if (stimulusMode === 'select' && selectedStimulusId) {
      finalStimulus = allStimulusList.find((s) => s.id === selectedStimulusId);
      finalStimulusId = selectedStimulusId;
    }

    const newSoal: Soal = {
      id: `soal-${Date.now()}`,
      stimulusId: finalStimulusId,
      stimulus: finalStimulus,
      jenjang: jenjangForm,
      mataPelajaran: mapel,
      topik: topikForm,
      fase,
      kelas: kelasSelected,
      tipeSoal,
      isHots,
      levelKognitif,
      pertanyaan,
      gambarUrl: gambarSoal || undefined,
      bobot: Number(bobot) || 10,
      createdAt: new Date().toISOString().split('T')[0],
      pembuat: guruProfile?.namaLengkap || 'Guru Pengampu CBT',
      guruUsername: guruProfile?.username || '',
      ...(tipeSoal === 'PG' && {
        opsiPG,
        kunciPG,
      }),
      ...(tipeSoal === 'PGK' && {
        opsiPGK,
      }),
      ...(tipeSoal === 'MENJODOHKAN' && {
        pasanganMenjodohkan: pasangan,
      }),
      ...(tipeSoal === 'URAIAN' && {
        rubrikUraian,
        kunciUraian,
      }),
    };

    addSoal(newSoal);
    showToast('Berhasil menyimpan butir soal baru ke Bank Soal AKM!');
    
    // Reset form
    setPertanyaan('');
    setGambarSoal('');
    setActiveTab('daftar');
  };

  // Active questions dataset based on scope filter (Mine vs All)
  const activeSoalSource = scopeFilter === 'mine' ? soalList : allSoalList;

  // Filtered Soal
  const filteredSoal = activeSoalSource.filter((soal) => {
    const matchSearch =
      soal.pertanyaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (soal.stimulus?.judul || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (soal.pembuat || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchJenjang =
      filterJenjang === 'ALL'
        ? true
        : soal.jenjang
        ? soal.jenjang === filterJenjang
        : filterJenjang === 'SMP'
        ? soal.fase === 'Fase D (SMP)' ||
          (soal.kelas && soal.kelas.some((k) => k.includes('7') || k.includes('8') || k.includes('9')))
        : soal.fase.includes('SMA') ||
          (soal.kelas &&
            soal.kelas.some((k) => k.includes('10') || k.includes('11') || k.includes('12')));

    const matchMapel =
      filterMapel === 'ALL' ||
      soal.mataPelajaran.toLowerCase().includes(filterMapel.toLowerCase()) ||
      filterMapel.toLowerCase().includes(soal.mataPelajaran.toLowerCase());

    const matchFase = filterFase === 'ALL' || soal.fase === filterFase;
    const matchTipe = filterTipe === 'ALL' || soal.tipeSoal === filterTipe;
    const matchHots =
      filterHots === 'ALL'
        ? true
        : filterHots === 'HOTS'
        ? soal.isHots
        : !soal.isHots;

    return matchSearch && matchJenjang && matchMapel && matchFase && matchTipe && matchHots;
  });

  // Pengelompokan Butir Soal Menjadi File Dokumen Paket Soal (Poin 4)
  const dokumenPaketList: DokumenPaketSoal[] = useMemo(() => {
    const map = new Map<string, DokumenPaketSoal>();

    filteredSoal.forEach((s) => {
      const j = (s.jenjang || (s.fase?.includes('SMA') ? 'SMA' : 'SMP')) as 'SMP' | 'SMA';
      const m = s.mataPelajaran || 'Umum';
      const t = s.topik || 'Umum';
      const key = `${j}___${m}___${t}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          jenjang: j,
          mataPelajaran: m,
          topik: t,
          fase: s.fase || (j === 'SMP' ? 'Fase D (SMP)' : 'Fase E (SMA 10)'),
          kelas: s.kelas || [],
          soalList: [],
          totalSoal: 0,
          totalBobot: 0,
          tipeCounts: { PG: 0, PGK: 0, MENJODOHKAN: 0, URAIAN: 0 },
          hotsCount: 0,
          pembuat: s.pembuat || 'Guru CBT',
          updatedAt: s.createdAt || new Date().toISOString().split('T')[0],
        });
      }

      const doc = map.get(key)!;
      doc.soalList.push(s);
      doc.totalSoal += 1;
      doc.totalBobot += s.bobot;
      if (s.tipeSoal in doc.tipeCounts) {
        doc.tipeCounts[s.tipeSoal]++;
      }
      if (s.isHots) {
        doc.hotsCount += 1;
      }
    });

    return Array.from(map.values());
  }, [filteredSoal]);

  const activeInspectedDoc = useMemo(() => {
    if (!activeInspectedDocId) return null;
    return dokumenPaketList.find((d) => d.id === activeInspectedDocId) || null;
  }, [dokumenPaketList, activeInspectedDocId]);

  // Handler Download File DOC (.doc untuk Microsoft Word)
  const handleDownloadDoc = (doc: DokumenPaketSoal) => {
    const safeTitle = `Naskah_Soal_${doc.mataPelajaran}_${doc.topik}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.mataPelajaran} - ${doc.topik}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 2cm; }
          .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 18px; }
          .kop h2 { margin: 0; font-size: 15pt; text-transform: uppercase; font-weight: bold; }
          .kop h3 { margin: 2px 0; font-size: 13pt; font-weight: bold; }
          .kop p { margin: 2px 0; font-size: 11pt; }
          .meta { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11pt; }
          .meta td { padding: 3px 6px; vertical-align: top; }
          .soal-box { margin-bottom: 16px; page-break-inside: avoid; }
          .opsi { margin-left: 20px; list-style-type: upper-alpha; margin-top: 4px; }
          .opsi li { margin-bottom: 3px; }
          .key-page { page-break-before: always; margin-top: 30px; border-top: 2px dashed #000; padding-top: 15px; }
          table.kunci { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          table.kunci th, table.kunci td { border: 1px solid #000; padding: 6px; }
          table.kunci th { background: #f2f2f2; text-align: center; }
        </style>
      </head>
      <body>
        <div class="kop">
          <h2>PEMERINTAH DAERAH DINAS PENDIDIKAN</h2>
          <h3>ASESMEN SUMATIF CBT KURIKULUM MERDEKA</h3>
          <p>Tahun Ajaran 2026/2027 • Jenjang ${doc.jenjang} (${doc.fase})</p>
        </div>

        <table class="meta">
          <tr>
            <td width="22%"><b>Mata Pelajaran</b></td>
            <td width="38%">: ${doc.mataPelajaran}</td>
            <td width="18%"><b>Hari / Tanggal</b></td>
            <td width="22%">: ............................</td>
          </tr>
          <tr>
            <td><b>Topik Materi</b></td>
            <td>: ${doc.topik}</td>
            <td><b>Waktu</b></td>
            <td>: 60 Menit</td>
          </tr>
          <tr>
            <td><b>Total Soal</b></td>
            <td>: ${doc.totalSoal} Butir (${doc.totalBobot} Poin)</td>
            <td><b>Nama Murid</b></td>
            <td>: ............................</td>
          </tr>
        </table>
        <hr style="border: 0.5px solid #000; margin-bottom: 14px;" />

        <p style="font-size: 11pt; font-style: italic; margin-bottom: 14px;">
          <b>PETUNJUK UMUM:</b> Bacalah dengan teliti setiap butir soal dan stimulus wacana di bawah ini sebelum menjawab!
        </p>

        <div class="soal-list">
          ${doc.soalList.map((s, idx) => `
            <div class="soal-box">
              <p><b>${idx + 1}.</b> [${s.tipeSoal} • ${s.bobot} Poin] ${s.pertanyaan}</p>
              ${s.stimulus?.kontenTeks ? `<blockquote style="background:#f7f7f7; padding:8px 12px; border-left:3px solid #666; font-style:italic; margin:6px 0;"><b>Stimulus:</b> ${s.stimulus.kontenTeks}</blockquote>` : ''}
              ${s.opsiPG && s.opsiPG.length > 0 ? `
                <ol class="opsi">
                  ${s.opsiPG.map((o) => `<li>${o.teks}</li>`).join('')}
                </ol>
              ` : ''}
              ${s.opsiPGK && s.opsiPGK.length > 0 ? `
                <ul style="margin-left:20px; list-style-type: square; margin-top:4px;">
                  ${s.opsiPGK.map((o) => `<li>${o.teks}</li>`).join('')}
                </ul>
              ` : ''}
              ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                <table border="1" cellpadding="4" style="border-collapse:collapse; margin-left:20px; width:85%; font-size:10pt;">
                  <tr bgcolor="#eee"><th>Premis</th><th>Pasangan Target</th></tr>
                  ${s.pasanganMenjodohkan.map((p) => `<tr><td>${p.premis}</td><td>${p.target}</td></tr>`).join('')}
                </table>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="key-page">
          <h3 style="text-align: center; text-transform: uppercase;">KUNCI JAWABAN & PEDOMAN PENSKORAN</h3>
          <p style="font-size: 11pt; text-align: center; margin-bottom: 15px;">Dokumen Rahasia - Pegangan Guru Pengampu CBT</p>
          <table class="kunci">
            <tr>
              <th width="8%">No</th>
              <th width="18%">Bentuk Soal</th>
              <th>Kunci Jawaban / Rubrik</th>
              <th width="12%">Bobot</th>
            </tr>
            ${doc.soalList.map((s, idx) => `
              <tr>
                <td align="center">${idx + 1}</td>
                <td align="center">${s.tipeSoal}</td>
                <td>${s.kunciPG || (s.opsiPGK?.filter(o=>o.isKunci).map(o=>o.teks).join(', ')) || s.kunciUraian || (s.pasanganMenjodohkan ? s.pasanganMenjodohkan.map(p=>`${p.premis} &rarr; ${p.target}`).join('; ') : '-')}</td>
                <td align="center">${s.bobot}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Dokumen Word "${safeTitle}.doc" berhasil diunduh!`);
  };

  // Handler Download File PDF
  const handleDownloadPdf = (doc: DokumenPaketSoal) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Izinkan pop-up pada peramban Anda untuk mencetak naskah soal PDF.');
      return;
    }
    const safeTitle = `Naskah_Soal_${doc.mataPelajaran}_${doc.topik}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8'>
        <title>${doc.mataPelajaran} - ${doc.topik}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 15mm; }
          .kop { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .kop h2 { margin: 0; font-size: 16pt; font-weight: 800; }
          .kop h3 { margin: 2px 0; font-size: 13pt; font-weight: 700; }
          .kop p { margin: 2px 0; font-size: 10pt; color: #444; }
          .meta { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt; }
          .meta td { padding: 3px 6px; vertical-align: top; }
          .soal-box { margin-bottom: 15px; page-break-inside: avoid; }
          .opsi { margin-left: 20px; list-style-type: upper-alpha; margin-top: 4px; }
          .opsi li { margin-bottom: 3px; }
          .key-page { page-break-before: always; margin-top: 30px; border-top: 2px dashed #000; padding-top: 15px; }
          table.kunci { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          table.kunci th, table.kunci td { border: 1px solid #000; padding: 6px; }
          table.kunci th { background: #eee; text-align: center; }
          @media print {
            body { margin: 10mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; padding: 12px; background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #0369a1;">Naskah Siap Dicetak / Disimpan sebagai File PDF</p>
          <button onclick="window.print()" style="padding: 8px 20px; font-weight: bold; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">🖨️ Cetak / Simpan PDF Sekarang</button>
        </div>

        <div class="kop">
          <h2>PEMERINTAH DAERAH DINAS PENDIDIKAN</h2>
          <h3>NASKAH ASESMEN SUMATIF CBT KURIKULUM MERDEKA</h3>
          <p>Tahun Ajaran 2026/2027 • Jenjang ${doc.jenjang} (${doc.fase})</p>
        </div>

        <table class="meta">
          <tr>
            <td width="20%"><b>Mata Pelajaran</b></td>
            <td width="35%">: ${doc.mataPelajaran}</td>
            <td width="20%"><b>Hari / Tanggal</b></td>
            <td width="25%">: ............................</td>
          </tr>
          <tr>
            <td><b>Topik Materi</b></td>
            <td>: ${doc.topik}</td>
            <td><b>Waktu Pengerjaan</b></td>
            <td>: 60 Menit</td>
          </tr>
          <tr>
            <td><b>Total Soal</b></td>
            <td>: ${doc.totalSoal} Butir (${doc.totalBobot} Poin)</td>
            <td><b>Nama Lengkap Murid</b></td>
            <td>: ............................</td>
          </tr>
        </table>
        <hr style="border: 0.5px solid #000; margin-bottom: 12px;" />

        <div class="soal-list">
          ${doc.soalList.map((s, idx) => `
            <div class="soal-box">
              <p><b>${idx + 1}.</b> [${s.tipeSoal} • ${s.bobot} Poin] ${s.pertanyaan}</p>
              ${s.stimulus?.kontenTeks ? `<blockquote style="background:#f8fafc; padding:8px 12px; border-left:3px solid #64748b; font-style:italic; margin:6px 0;"><b>Stimulus:</b> ${s.stimulus.kontenTeks}</blockquote>` : ''}
              ${s.opsiPG && s.opsiPG.length > 0 ? `
                <ol class="opsi">
                  ${s.opsiPG.map((o) => `<li>${o.teks}</li>`).join('')}
                </ol>
              ` : ''}
              ${s.opsiPGK && s.opsiPGK.length > 0 ? `
                <ul style="margin-left:20px; list-style-type: square; margin-top:4px;">
                  ${s.opsiPGK.map((o) => `<li>${o.teks}</li>`).join('')}
                </ul>
              ` : ''}
              ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                <table border="1" cellpadding="4" style="border-collapse:collapse; margin-left:20px; width:85%; font-size:10pt;">
                  <tr bgcolor="#f1f5f9"><th>Premis</th><th>Pasangan Target</th></tr>
                  ${s.pasanganMenjodohkan.map((p) => `<tr><td>${p.premis}</td><td>${p.target}</td></tr>`).join('')}
                </table>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="key-page">
          <h3 style="text-align: center; text-transform: uppercase;">KUNCI JAWABAN & PEDOMAN PENSKORAN</h3>
          <p style="font-size: 10pt; text-align: center; margin-bottom: 12px;">Dokumen Pegangan Guru Pengampu CBT</p>
          <table class="kunci">
            <tr>
              <th width="8%">No</th>
              <th width="18%">Bentuk</th>
              <th>Kunci Jawaban</th>
              <th width="12%">Bobot</th>
            </tr>
            ${doc.soalList.map((s, idx) => `
              <tr>
                <td align="center">${idx + 1}</td>
                <td align="center">${s.tipeSoal}</td>
                <td>${s.kunciPG || (s.opsiPGK?.filter(o=>o.isKunci).map(o=>o.teks).join(', ')) || s.kunciUraian || (s.pasanganMenjodohkan ? s.pasanganMenjodohkan.map(p=>`${p.premis} &rarr; ${p.target}`).join('; ') : '-')}</td>
                <td align="center">${s.bobot}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
    printWin.document.write(docHtml);
    printWin.document.close();
    showToast(`Jendela cetak / download PDF untuk "${safeTitle}" telah disiapkan.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Bank Soal & Stimulus Asesmen AKM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manajemen butir soal terstandar AKM (Literasi, Numerasi, HOTS) dengan dukungan stimulus wacana multi-modal.
          </p>
        </div>

        {/* Header Actions: Sub-Halaman Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center p-1.5 bg-slate-100 rounded-2xl border-2 border-slate-200 gap-1.5">
            <button
              onClick={() => {
                setActiveTab('daftar');
                setActiveInspectedDocId(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'daftar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📁 Dokumen Paket ({dokumenPaketList.length} Berkas)</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-800 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>⚡ Generator AI (Sub-Halaman)</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>✍️ Buat Soal Manual (Sub-Halaman)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================= TAB 1: DAFTAR SOAL ======================= */}
      {activeTab === 'daftar' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            {/* Scope Switcher: Soal Saya vs Semua Soal Guru */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cakupan:
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('mine')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scopeFilter === 'mine'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📌 Soal Saya</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        scopeFilter === 'mine' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {soalList.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scopeFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🌐 Semua Soal Guru</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        scopeFilter === 'all' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {allSoalList.length}
                    </span>
                  </button>
                </div>
              </div>

              {guruProfile?.namaLengkap && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>
                    Akun Aktif: <b className="text-slate-800">{guruProfile.namaLengkap}</b>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan stimulus wacana atau teks pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Reset filter button */}
              {(filterJenjang !== 'ALL' || filterMapel !== 'ALL' || filterFase !== 'ALL' || filterTipe !== 'ALL' || filterHots !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterJenjang('ALL');
                    setFilterMapel('ALL');
                    setFilterFase('ALL');
                    setFilterTipe('ALL');
                    setFilterHots('ALL');
                  }}
                  className="px-3 py-2 text-xs text-rose-600 font-semibold hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Quick Jenjang Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Jenjang:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFilterJenjang('ALL');
                  setFilterMapel('ALL');
                  setFilterFase('ALL');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  filterJenjang === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                🏢 Semua Jenjang (SMP & SMA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterJenjang('SMP');
                  setFilterMapel('ALL');
                  setFilterFase('Fase D (SMP)');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  filterJenjang === 'SMP'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                📘 Jenjang SMP (Fase D: Kelas 7-9)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterJenjang('SMA');
                  setFilterMapel('ALL');
                  setFilterFase('ALL');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  filterJenjang === 'SMA'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                📗 Jenjang SMA (Fase E & F: Kelas 10-12)
              </button>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenjang</label>
                <select
                  value={filterJenjang}
                  onChange={(e) => {
                    const newJ = e.target.value as 'ALL' | 'SMP' | 'SMA';
                    setFilterJenjang(newJ);
                    setFilterMapel('ALL');
                    if (newJ === 'SMP') setFilterFase('Fase D (SMP)');
                    else setFilterFase('ALL');
                  }}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-slate-800 font-semibold"
                >
                  <option value="ALL">Semua Jenjang</option>
                  <option value="SMP">Jenjang SMP (Fase D)</option>
                  <option value="SMA">Jenjang SMA (Fase E & F)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Mata Pelajaran {filterJenjang !== 'ALL' ? `(${filterJenjang})` : ''}
                </label>
                <select
                  value={filterMapel}
                  onChange={(e) => setFilterMapel(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                >
                  <option value="ALL">Semua Mata Pelajaran</option>
                  {filterJenjang === 'SMP' &&
                    KURIKULUM_DATA.SMP.mataPelajaran.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama} [{m.kategori}]
                      </option>
                    ))}
                  {filterJenjang === 'SMA' &&
                    KURIKULUM_DATA.SMA.mataPelajaran.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama} [{m.kategori}]
                      </option>
                    ))}
                  {filterJenjang === 'ALL' && (
                    <>
                      <optgroup label="── Jenjang SMP (Fase D) ──">
                        {KURIKULUM_DATA.SMP.mataPelajaran.map((m) => (
                          <option key={`all-smp-${m.id}`} value={m.nama}>
                            {m.nama} [{m.kategori}]
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="── Jenjang SMA (Fase E & F) ──">
                        {KURIKULUM_DATA.SMA.mataPelajaran.map((m) => (
                          <option key={`all-sma-${m.id}`} value={m.nama}>
                            {m.nama} [{m.kategori}]
                          </option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Fase / Kelas</label>
                <select
                  value={filterFase}
                  onChange={(e) => setFilterFase(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                >
                  <option value="ALL">Semua Fase</option>
                  {filterJenjang !== 'SMA' && (
                    <option value="Fase D (SMP)">Fase D (SMP Kelas 7-9)</option>
                  )}
                  {filterJenjang !== 'SMP' && (
                    <>
                      <option value="Fase E (SMA 10)">Fase E (SMA Kelas 10)</option>
                      <option value="Fase F (SMA 11-12)">Fase F (SMA Kelas 11-12)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bentuk Soal</label>
                <select
                  value={filterTipe}
                  onChange={(e) => setFilterTipe(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value="ALL">Semua Bentuk Soal</option>
                  <option value="PG">Pilihan Ganda (PG)</option>
                  <option value="PGK">Pilihan Ganda Kompleks (PGK)</option>
                  <option value="MENJODOHKAN">Menjodohkan</option>
                  <option value="URAIAN">Uraian / Esai</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Karakteristik HOTS</label>
                <select
                  value={filterHots}
                  onChange={(e) => setFilterHots(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value="ALL">Semua Karakteristik</option>
                  <option value="HOTS">HOTS (Level C4 - C6)</option>
                  <option value="REGULER">Reguler (Level C1 - C3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Release to Exam Guidance Banner if questions exist */}
          {activeSoalSource.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-700/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    ✓ {activeSoalSource.length} Soal Tersedia di Bank Soal ({scopeFilter === 'mine' ? 'Soal Saya' : 'Kolektif'})
                  </span>
                  <span className="text-xs text-slate-300">Siap Diujikan</span>
                </div>
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Ingin Membagikan Link Pengerjaan Soal ke Murid?
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Bank Soal adalah gudang penyimpanan materi. Untuk membuat <b>link ujian yang bisa diakses & dikerjakan siswa</b>, rilis butir soal ini ke menu <b>Jadwal Ujian</b>. Di sana Anda dapat menyalin tautan langsung dan format pesan pengumuman WhatsApp.
                </p>
              </div>

              <Link
                href="/guru/jadwal"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
              >
                <span>🚀 Rilis ke Jadwal & Ambil Link Siswa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* TAMPILAN BERKAS DOKUMEN PAKET SOAL ATAU DETAIL PAKET (Poin 4) */}
          {activeInspectedDoc ? (
            /* Sub-Halaman Detail Berkas Dokumen Paket Soal */
            <div className="space-y-6">
              {/* Header Dokumen Paket */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-blue-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveInspectedDocId(null)}
                    className="flex items-center gap-2 text-slate-700 hover:text-blue-700 font-bold text-base px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-all cursor-pointer w-fit"
                  >
                    <ArrowLeft className="w-5 h-5 text-blue-600" />
                    <span>⬅️ Kembali ke Daftar Dokumen Paket</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(activeInspectedDoc)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>📄 Download PDF (Siap Cetak)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(activeInspectedDoc)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>📝 Download DOC (Word)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMapel(activeInspectedDoc.mataPelajaran);
                        setTopikForm(activeInspectedDoc.topik);
                        setJenjangForm(activeInspectedDoc.jenjang);
                        setActiveTab('editor');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>➕ Tambah Soal Manual</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs">
                      {activeInspectedDoc.jenjang} • {activeInspectedDoc.fase}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs">
                      Topik: {activeInspectedDoc.topik}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Penyusun: {activeInspectedDoc.pembuat}
                    </span>
                    {activeInspectedDoc.hotsCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        <Sparkles className="w-3 h-3" />
                        {activeInspectedDoc.hotsCount} Butir HOTS
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {activeInspectedDoc.mataPelajaran} — {activeInspectedDoc.topik}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Dokumen ini berisi total <b>{activeInspectedDoc.totalSoal} butir soal</b> dengan akumulasi <b>bobot {activeInspectedDoc.totalBobot} poin</b> (PG: {activeInspectedDoc.tipeCounts.PG}, PGK: {activeInspectedDoc.tipeCounts.PGK}, Menjodohkan: {activeInspectedDoc.tipeCounts.MENJODOHKAN}, Uraian: {activeInspectedDoc.tipeCounts.URAIAN}).
                  </p>
                </div>
              </div>

              {/* Daftar Butir Soal Dokumen Ini */}
              <div className="space-y-4">
                {activeInspectedDoc.soalList.map((soal: Soal, idx: number) => (
                  <div
                    key={soal.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Badges & Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {soal.mataPelajaran}
                        </span>
                        {soal.topik && (
                          <span className="font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            {soal.topik}
                          </span>
                        )}
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {soal.fase}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Target: {soal.kelas.join(', ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {soal.isHots ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            HOTS ({soal.levelKognitif})
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {soal.levelKognitif}
                          </span>
                        )}

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {soal.tipeSoal === 'PG'
                            ? 'Pilihan Ganda'
                            : soal.tipeSoal === 'PGK'
                            ? 'PG Kompleks'
                            : soal.tipeSoal === 'MENJODOHKAN'
                            ? 'Menjodohkan'
                            : 'Uraian'}
                        </span>

                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Bobot: {soal.bobot} Poin
                        </span>
                      </div>
                    </div>

                    {/* Stimulus Preview */}
                    {soal.stimulus && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <BookOpen className="w-3.5 h-3.5" />
                            Stimulus: {soal.stimulus.judul}
                          </span>
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-normal">
                            {soal.stimulus.tipe}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {soal.stimulus.kontenTeks}
                        </p>
                      </div>
                    )}

                    {/* Pertanyaan */}
                    <div className="text-sm font-semibold text-slate-800 leading-relaxed">
                      {soal.pertanyaan}
                    </div>

                    {/* Options / Key preview */}
                    {soal.tipeSoal === 'PG' && soal.opsiPG && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {soal.opsiPG.map((opt: any) => {
                          const isCorrect = opt.id === soal.kunciPG;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span className="flex-1 min-w-0">{opt.teks}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {soal.tipeSoal === 'PGK' && soal.opsiPGK && (
                      <div className="space-y-1.5 text-xs pt-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Pernyataan & Kunci Kebenaran:</p>
                        {soal.opsiPGK.map((opt: any, i: number) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                              opt.isKunci
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-700">
                                {i + 1}
                              </span>
                              <span>{opt.teks}</span>
                            </div>
                            {opt.isKunci && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Kunci: BENAR
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {soal.tipeSoal === 'MENJODOHKAN' && soal.pasanganMenjodohkan && (
                      <div className="space-y-1.5 text-xs pt-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Pasangan Premis & Target:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {soal.pasanganMenjodohkan.map((pair: any, pIdx: number) => (
                            <div
                              key={pair.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-slate-800">
                                {pIdx + 1}. {pair.premis}
                              </span>
                              <div className="flex items-center gap-2 text-indigo-700 font-medium">
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{pair.target}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {soal.tipeSoal === 'URAIAN' && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5">
                        <p className="font-bold text-amber-900">Pedoman Penskoran & Rubrik:</p>
                        <p className="text-slate-700 whitespace-pre-line">{soal.rubrikUraian}</p>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-slate-500">
                        <span>Dibuat: {soal.createdAt}</span>
                        {soal.pembuat && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              Penyusun: {soal.pembuat}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewSoal(soal)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau Siswa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
                              deleteSoal(soal.id);
                              showToast('Soal berhasil dihapus dari bank soal');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid Berkas Dokumen Paket Soal */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FolderArchive className="w-6 h-6 text-blue-600" />
                    <span>Berkas Dokumen Paket Soal ({dokumenPaketList.length} Paket Tersedia)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Soal telah dirapikan menjadi dokumen paket per materi/topik. Klik <b>Buka & Kelola</b> untuk melihat atau mengedit butir soal, atau klik tombol <b>PDF / Word</b> untuk langsung mengunduh naskah ujian cetak.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('generator')}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Generate via AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>➕ Buat Manual</span>
                  </button>
                </div>
              </div>

              {dokumenPaketList.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                    <FileQuestion className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {activeSoalSource.length === 0
                        ? scopeFilter === 'mine'
                          ? 'Bank Soal Anda Masih Kosong'
                          : 'Bank Soal Kolektif Masih Kosong'
                        : 'Tidak Ada Dokumen Paket Soal yang Sesuai Filter'}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                      {activeSoalSource.length === 0
                        ? 'Belum ada butir soal yang tersimpan di akun ini. Anda dapat langsung meng-generate butir soal otomatis berbasis materi lewat AI atau menyusun soal AKM baru secara mandiri.'
                        : 'Coba sesuaikan kata kunci pencarian atau ubah filter jenjang/mapel di atas.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('generator')}
                      className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ Generate Soal dengan AI (Gemini)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="px-5 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>➕ Tambah Soal Manual</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {dokumenPaketList.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between gap-5 group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-600 text-blue-700 group-hover:text-white flex items-center justify-center transition-colors shadow-inner">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                                {doc.jenjang} • {doc.fase}
                              </span>
                              <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors mt-1 line-clamp-1">
                                {doc.mataPelajaran}
                              </h4>
                            </div>
                          </div>
                          {doc.hotsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs shrink-0">
                              <Sparkles className="w-3 h-3" />
                              {doc.hotsCount} HOTS
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Topik Pembelajaran:
                          </span>
                          <p className="text-sm font-extrabold text-purple-900 line-clamp-2">
                            📖 {doc.topik}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-500 block text-[11px]">Jumlah Butir:</span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {doc.totalSoal} Soal ({doc.totalBobot} Poin)
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-500 block text-[11px]">Komposisi Soal:</span>
                            <span className="font-bold text-slate-800 text-[11px] line-clamp-1">
                              PG:{doc.tipeCounts.PG} • PGK:{doc.tipeCounts.PGK} • Jdh:{doc.tipeCounts.MENJODOHKAN} • Esai:{doc.tipeCounts.URAIAN}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <button
                          type="button"
                          onClick={() => setActiveInspectedDocId(doc.id)}
                          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md hover:shadow-blue-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>👁️ Buka & Kelola Butir Soal</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(doc)}
                            className="py-2.5 px-3 rounded-xl border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>📄 Unduh PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="py-2.5 px-3 rounded-xl border-2 border-indigo-500 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>📝 Unduh DOC</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: GENERATOR AI SUB-HALAMAN (Poin 3) ======================= */}
      {activeTab === 'generator' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('daftar')}
              className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-bold text-base px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-blue-600" />
              <span>⬅️ Kembali ke Bank Soal</span>
            </button>
            <span className="text-sm font-bold text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-200">
              ⚡ Sub-Halaman AI Question Generator (Gemini)
            </span>
          </div>

          <AIGeneratorModal
            isOpen={true}
            inlineMode={true}
            onClose={() => setActiveTab('daftar')}
            onSaveSoalList={handleSaveAIQuestions}
            guruProfile={guruProfile}
          />
        </div>
      )}

      {/* ======================= TAB 3: INPUT / EDITOR SOAL BARU ======================= */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSaveSoal} className="space-y-6">
          {/* Active Teacher Author Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-300">
                {guruProfile?.namaLengkap
                  ? guruProfile.namaLengkap.replace(/^(Pak|Ibu|Drs\.|Dra\.|H\.|Hj\.)\s+/i, '').slice(0, 2).toUpperCase()
                  : 'GU'}
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Guru Penulis / Penyusun Soal:
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {guruProfile?.namaLengkap || 'Bapak/Ibu Guru Pengampu'}
                </p>
                <p className="text-xs text-slate-500">
                  {guruProfile?.nip ? `NIP: ${guruProfile.nip}` : 'Sesi Guru Terautentikasi'} • {guruProfile?.mataPelajaran || 'Mata Pelajaran Kurikulum Merdeka'}
                </p>
              </div>
            </div>
            <div className="self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terhubung ke Profil Guru</span>
              </span>
            </div>
          </div>

          {/* SECTION 1: STIMULUS AKM CREATOR / SELECTOR */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  1. Stimulus Wacana / Infografis (Ciri Khas AKM)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AKM mewajibkan butir soal bersandar pada stimulus kontekstual dunia nyata.
                </p>
              </div>

              {/* Stimulus Mode Pill */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStimulusMode('select')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    stimulusMode === 'select' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Pilih yang Ada ({stimulusList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStimulusMode('new')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    stimulusMode === 'new' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  + Buat Stimulus Baru
                </button>
                <button
                  type="button"
                  onClick={() => setStimulusMode('none')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    stimulusMode === 'none' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Tanpa Stimulus
                </button>
              </div>
            </div>

            {/* Stimulus: SELECT EXISTING */}
            {stimulusMode === 'select' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Pilih Stimulus dari Bank:</label>
                <select
                  value={selectedStimulusId}
                  onChange={(e) => setSelectedStimulusId(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {stimulusList.map((stim) => (
                    <option key={stim.id} value={stim.id}>
                      [{stim.tipe}] {stim.judul}
                    </option>
                  ))}
                </select>

                {/* Stimulus Preview Card */}
                {selectedStimulusId && (() => {
                  const currStim = stimulusList.find((s) => s.id === selectedStimulusId);
                  if (!currStim) return null;
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{currStim.judul}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                          {currStim.tipe}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed line-clamp-3">{currStim.kontenTeks}</p>
                      {currStim.gambarUrl && (
                        <div className="mt-2 flex items-center gap-2 text-blue-600">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">Memiliki lampiran visual/infografis</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Stimulus: CREATE NEW INLINE */}
            {stimulusMode === 'new' && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Wacana / Stimulus *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Ekosistem Hutan Mangrove Kulon Progo"
                      value={newStimJudul}
                      onChange={(e) => setNewStimJudul(e.target.value)}
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Stimulus</label>
                    <select
                      value={newStimTipe}
                      onChange={(e) => setNewStimTipe(e.target.value as TipeStimulus)}
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Literasi">Literasi Membaca</option>
                      <option value="Numerasi">Numerasi & Data</option>
                      <option value="Sains">Sains Eksplorasi</option>
                      <option value="Sosial Budaya">Sosial Kebhinekaan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konten Teks Wacana / Kasus Realita *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan teks wacana, narasi cerita, berita ilmiah, atau fenomena alam..."
                    value={newStimTeks}
                    onChange={(e) => setNewStimTeks(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Gambar / Infografis (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={newStimGambar}
                      onChange={(e) => setNewStimGambar(e.target.value)}
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sumber Referensi Data
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: LIPI / Kemdikbud 2024"
                      value={newStimSumber}
                      onChange={(e) => setNewStimSumber(e.target.value)}
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {stimulusMode === 'none' && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                Soal ini akan disajikan secara langsung tanpa kotak bacaan/stimulus pendukung.
              </p>
            )}
          </div>

          {/* SECTION 2: QUESTION ATTRIBUTES & COGNITIVE LEVEL */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  2. Klasifikasi Jenjang, Mata Pelajaran & Topik Materi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih jenjang, mata pelajaran, dan topik materi kurikulum secara spesifik.
                </p>
              </div>

              {/* Fast AI Trigger from Editor */}
              <button
                type="button"
                onClick={() => setIsAIModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>⚡ Buat Soal Otomatis dengan AI</span>
              </button>
            </div>

            {/* Jenjang Toggle Button */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Jenjang Pendidikan *
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJenjangForm('SMP');
                    setFase('Fase D (SMP)');
                    setKelasSelected(['Kelas 8']);
                    const firstMapel = getMataPelajaranByJenjang('SMP')[0]?.nama || '';
                    if (firstMapel) setMapel(firstMapel);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    jenjangForm === 'SMP'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Jenjang SMP (Fase D: Kelas 7, 8, 9)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJenjangForm('SMA');
                    setFase('Fase E (SMA 10)');
                    setKelasSelected(['Kelas 10']);
                    const firstMapel = getMataPelajaranByJenjang('SMA')[0]?.nama || '';
                    if (firstMapel) setMapel(firstMapel);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    jenjangForm === 'SMA'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Jenjang SMA (Fase E/F: Kelas 10, 11, 12)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mata Pelajaran (Dynamic based on Jenjang) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran ({jenjangForm}) *
                </label>
                <select
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {getMataPelajaranByJenjang(jenjangForm).map((m) => (
                    <option key={m.id} value={m.nama}>
                      {m.nama} [{m.kategori}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Topik Pembelajaran (Cascading dropdown based on selected Mata Pelajaran) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Topik / Pokok Bahasan *</span>
                  <span className="text-[10px] text-purple-600 font-semibold">
                    {availableTopics.length} Topik
                  </span>
                </label>
                <select
                  value={topikForm}
                  onChange={(e) => setTopikForm(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border-2 border-purple-400 bg-purple-50/50 text-purple-950 font-semibold focus:ring-2 focus:ring-purple-300"
                >
                  {availableTopics.length === 0 ? (
                    <option value="">Belum ada topik untuk mata pelajaran ini</option>
                  ) : (
                    availableTopics.map((t) => (
                      <option key={t.id} value={t.nama}>
                        {t.nama}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Tipe Soal AKM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bentuk Soal AKM *</label>
                <select
                  value={tipeSoal}
                  onChange={(e) => setTipeSoal(e.target.value as TipeSoal)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-900 font-bold"
                >
                  <option value="PG">Pilihan Ganda (PG)</option>
                  <option value="PGK">Pilihan Ganda Kompleks (PGK)</option>
                  <option value="MENJODOHKAN">Menjodohkan (Matching)</option>
                  <option value="URAIAN">Uraian / Esai</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fase Kurikulum */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fase Kurikulum *</label>
                <select
                  value={fase}
                  onChange={(e) => setFase(e.target.value as Fase)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {jenjangForm === 'SMP' ? (
                    <option value="Fase D (SMP)">Fase D (SMP Kelas 7-9)</option>
                  ) : (
                    <>
                      <option value="Fase E (SMA 10)">Fase E (SMA Kelas 10)</option>
                      <option value="Fase F (SMA 11-12)">Fase F (SMA Kelas 11-12)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Bobot Nilai */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bobot Nilai (Poin) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bobot}
                  onChange={(e) => setBobot(Number(e.target.value))}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-bold text-blue-600"
                />
              </div>
            </div>

            {/* Target Kelas Badges */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Target Tingkat Kelas (Bisa Lebih Dari Satu):
              </label>
              <div className="flex flex-wrap gap-2">
                {['Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12'].map((kls) => {
                  const isChecked = kelasSelected.includes(kls);
                  return (
                    <button
                      type="button"
                      key={kls}
                      onClick={() => handleToggleKelas(kls)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {kls}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HOTS & Cognitive Level C1-C6 Row */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* HOTS Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_hots_checkbox"
                  checked={isHots}
                  onChange={(e) => setIsHots(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="is_hots_checkbox" className="cursor-pointer">
                  <span className="text-xs font-bold text-amber-950 block">Soal HOTS (AKM)</span>
                  <span className="text-[11px] text-amber-800">Higher-Order Thinking Skills</span>
                </label>
              </div>

              {/* Level Kognitif Selector */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="text-xs font-bold text-amber-950 shrink-0">Level Kognitif Bloom:</label>
                <select
                  value={levelKognitif}
                  onChange={(e) => setLevelKognitif(e.target.value as LevelKognitif)}
                  className="flex-1 p-2 text-xs rounded-lg border border-amber-300 bg-white font-medium text-slate-800"
                >
                  <option value="C1">C1 - Mengingat (Recall / LOTS)</option>
                  <option value="C2">C2 - Memahami (Comprehension / LOTS)</option>
                  <option value="C3">C3 - Menerapkan (Application / MOTS)</option>
                  <option value="C4">C4 - Menganalisis (Analysis / HOTS)</option>
                  <option value="C5">C5 - Mengevaluasi (Evaluation / HOTS)</option>
                  <option value="C6">C6 - Mencipta / Merancang (Create / HOTS)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: QUESTION TEXT & MEDIA */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileQuestion className="w-5 h-5 text-indigo-600" />
              3. Redaksi Kalimat Pertanyaan
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teks Pertanyaan / Instruksi Kerja Siswa *
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan rumusan pertanyaan secara jelas, padat, dan tidak ambigu..."
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                required
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Gambar Soal / Diagram (Opsional)
              </label>
              <input
                type="text"
                placeholder="https://... jika ada gambar diagram khusus pertanyaan ini"
                value={gambarSoal}
                onChange={(e) => setGambarSoal(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* SECTION 4: DYNAMIC ANSWER BUILDER BASED ON TIPE_SOAL */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                4. Opsi Jawaban & Kunci Validasi ({tipeSoal})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tipeSoal === 'PG' && 'Tentukan pilihan opsi A-E dan klik tombol radio pada kunci jawaban yang benar.'}
                {tipeSoal === 'PGK' && 'Pilihan Ganda Kompleks: Centang kotak opsi yang merupakan jawaban BENAR (bisa lebih dari satu).'}
                {tipeSoal === 'MENJODOHKAN' && 'Pasangkan premis di kolom kiri dengan respon/target di kolom kanan.'}
                {tipeSoal === 'URAIAN' && 'Tuliskan rubrik penskoran terukur dan kunci/kata kunci esai rujukan guru.'}
              </p>
            </div>

            {/* DYNAMIC CASE: PILIHAN GANDA (PG) */}
            {tipeSoal === 'PG' && (
              <div className="space-y-3">
                {opsiPG.map((opt, idx) => {
                  const isChecked = kunciPG === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setKunciPG(opt.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        title="Klik untuk jadikan kunci jawaban"
                      >
                        {opt.label}
                      </button>

                      <input
                        type="text"
                        placeholder={`Teks opsi jawaban ${opt.label}...`}
                        value={opt.teks}
                        onChange={(e) => {
                          const updated = [...opsiPG];
                          updated[idx].teks = e.target.value;
                          setOpsiPG(updated);
                        }}
                        className="flex-1 p-2 text-xs sm:text-sm bg-white rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500"
                      />

                      <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold">
                        <input
                          type="radio"
                          name="kunciPG"
                          id={`kunci-${opt.id}`}
                          checked={isChecked}
                          onChange={() => setKunciPG(opt.id)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label
                          htmlFor={`kunci-${opt.id}`}
                          className={`cursor-pointer ${isChecked ? 'text-emerald-700' : 'text-slate-500'}`}
                        >
                          {isChecked ? 'Kunci Jawaban' : 'Pilih Kunci'}
                        </label>
                      </div>
                    </div>
                  );
                })}

                {opsiPG.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextLabel = String.fromCharCode(65 + opsiPG.length);
                      setOpsiPG([
                        ...opsiPG,
                        { id: `opt-${nextLabel.toLowerCase()}`, label: nextLabel, teks: '' },
                      ]);
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Opsi {String.fromCharCode(65 + opsiPG.length)}
                  </button>
                )}
              </div>
            )}

            {/* DYNAMIC CASE: PILIHAN GANDA KOMPLEKS (PGK) */}
            {tipeSoal === 'PGK' && (
              <div className="space-y-3">
                {opsiPGK.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      opt.isKunci ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>

                    <input
                      type="text"
                      placeholder={`Pernyataan ${idx + 1}...`}
                      value={opt.teks}
                      onChange={(e) => {
                        const updated = [...opsiPGK];
                        updated[idx].teks = e.target.value;
                        setOpsiPGK(updated);
                      }}
                      className="flex-1 p-2 text-xs sm:text-sm bg-white rounded-lg border border-slate-300"
                    />

                    <div className="shrink-0 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`pgk-${opt.id}`}
                        checked={opt.isKunci}
                        onChange={(e) => {
                          const updated = [...opsiPGK];
                          updated[idx].isKunci = e.target.checked;
                          setOpsiPGK(updated);
                        }}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor={`pgk-${opt.id}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                        {opt.isKunci ? (
                          <span className="text-emerald-700">Kunci Benar</span>
                        ) : (
                          <span className="text-slate-400">Pernyataan Salah</span>
                        )}
                      </label>
                    </div>

                    {opsiPGK.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOpsiPGK(opsiPGK.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Hapus baris"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setOpsiPGK([
                      ...opsiPGK,
                      { id: `pgk-${Date.now()}`, teks: '', isKunci: false },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris Pernyataan
                </button>
              </div>
            )}

            {/* DYNAMIC CASE: MENJODOHKAN (MATCHING) */}
            {tipeSoal === 'MENJODOHKAN' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700 px-1">
                  <span>Kolom Kiri (Premis / Konsep / Masalah)</span>
                  <span>Kolom Kanan (Jawaban Pasangan / Solusi)</span>
                </div>

                {pasangan.map((pair, idx) => (
                  <div
                    key={pair.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Premis ${idx + 1}...`}
                      value={pair.premis}
                      onChange={(e) => {
                        const updated = [...pasangan];
                        updated[idx].premis = e.target.value;
                        setPasangan(updated);
                      }}
                      className="w-full sm:flex-1 p-2 text-xs bg-white rounded-lg border border-slate-300"
                    />

                    <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />

                    <input
                      type="text"
                      placeholder={`Pasangan target ${idx + 1}...`}
                      value={pair.target}
                      onChange={(e) => {
                        const updated = [...pasangan];
                        updated[idx].target = e.target.value;
                        setPasangan(updated);
                      }}
                      className="w-full sm:flex-1 p-2 text-xs bg-white rounded-lg border border-slate-300"
                    />

                    {pasangan.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPasangan(pasangan.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded self-end sm:self-center"
                        title="Hapus pasangan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setPasangan([
                      ...pasangan,
                      { id: `pair-${Date.now()}`, premis: '', target: '' },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Pasangan Menjodohkan
                </button>
              </div>
            )}

            {/* DYNAMIC CASE: URAIAN / ESAI */}
            {tipeSoal === 'URAIAN' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pedoman Penskoran / Rubrik Penilaian *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Contoh: Skor 40 jika menjelaskan 3 aspek secara komprehensif, Skor 25 jika hanya 2 aspek..."
                    value={rubrikUraian}
                    onChange={(e) => setRubrikUraian(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kunci Jawaban Rujukan / Kata Kunci Esensial Guru
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh jawaban ideal atau kata kunci penting yang harus ada dalam jawaban siswa..."
                    value={kunciUraian}
                    onChange={(e) => setKunciUraian(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FORM ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('daftar')}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Check className="w-4 h-4" />
              <span>Simpan ke Bank Soal</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================= MODAL PREVIEW SOAL SEBAGAI SISWA ======================= */}
      {selectedPreviewSoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold">
                  Simulasi Tampilan Siswa CBT
                </span>
                {selectedPreviewSoal.isHots && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    HOTS {selectedPreviewSoal.levelKognitif}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPreviewSoal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stimulus in Modal */}
            {selectedPreviewSoal.stimulus && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-slate-900 text-sm">{selectedPreviewSoal.stimulus.judul}</p>
                <p className="text-slate-700 leading-relaxed">{selectedPreviewSoal.stimulus.kontenTeks}</p>
                {selectedPreviewSoal.stimulus.sumber && (
                  <p className="text-[10px] text-slate-400 italic">Sumber: {selectedPreviewSoal.stimulus.sumber}</p>
                )}
              </div>
            )}

            {/* Question Text */}
            <div className="text-sm font-semibold text-slate-800 leading-relaxed">
              {selectedPreviewSoal.pertanyaan}
            </div>

            {/* Options Interactive Simulation */}
            {selectedPreviewSoal.tipeSoal === 'PG' && selectedPreviewSoal.opsiPG && (
              <div className="space-y-2">
                {selectedPreviewSoal.opsiPG.map((opt) => (
                  <label
                    key={opt.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 text-xs cursor-pointer transition-all"
                  >
                    <input type="radio" name="preview_pg" className="w-4 h-4 text-blue-600" />
                    <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[11px]">
                      {opt.label}
                    </span>
                    <span className="text-slate-700">{opt.teks}</span>
                  </label>
                ))}
              </div>
            )}

            {selectedPreviewSoal.tipeSoal === 'PGK' && selectedPreviewSoal.opsiPGK && (
              <div className="space-y-2">
                <p className="text-xs text-blue-600 font-semibold">* Siswa dapat mencentang lebih dari satu pilihan yang benar:</p>
                {selectedPreviewSoal.opsiPGK.map((opt) => (
                  <label
                    key={opt.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 text-xs cursor-pointer transition-all"
                  >
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-slate-700">{opt.teks}</span>
                  </label>
                ))}
              </div>
            )}

            {selectedPreviewSoal.tipeSoal === 'MENJODOHKAN' && selectedPreviewSoal.pasanganMenjodohkan && (
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-600">Pasangkan pernyataan berikut:</p>
                <div className="space-y-2">
                  {selectedPreviewSoal.pasanganMenjodohkan.map((pair, idx) => (
                    <div key={pair.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{idx + 1}. {pair.premis}</span>
                      <select className="p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700">
                        <option value="">-- Pilih Jawaban Pasangan --</option>
                        {selectedPreviewSoal.pasanganMenjodohkan?.map((p) => (
                          <option key={p.id} value={p.target}>{p.target}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPreviewSoal.tipeSoal === 'URAIAN' && (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Kotak input jawaban esai siswa..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-slate-50"
                  disabled
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPreviewSoal(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI QUESTION GENERATOR MODAL */}
      <AIGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSaveSoalList={handleSaveAIQuestions}
        guruProfile={guruProfile}
      />
    </div>
  );
}

export default function BankSoalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-sm">
          Memuat Bank Soal & Stimulus...
        </div>
      }
    >
      <BankSoalContent />
    </Suspense>
  );
}


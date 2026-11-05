'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  HelpCircle,
  GraduationCap,
  ArrowRight,
  Check,
  RotateCw,
  FileText,
  Sliders,
  ChevronDown,
  Globe,
  ExternalLink,
  UploadCloud,
  FileUp,
  FileCheck2,
  FileType,
  Paperclip,
  Presentation
} from 'lucide-react';
import {
  JenjangPendidikan,
  getJenjangList,
  getMataPelajaranByJenjang,
  getTopikByMataPelajaran,
  MataPelajaranDetail,
  TopikMateri
} from '@/lib/curriculum-data';
import { Soal, TipeSoal, LevelKognitif, Fase } from '@/types/cbt';
import { GuruProfile } from '@/lib/guru-auth';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSoalList: (soalList: Soal[]) => void;
  guruProfile?: GuruProfile | null;
}

export function AIGeneratorModal({
  isOpen,
  onClose,
  onSaveSoalList,
  guruProfile
}: AIGeneratorModalProps) {
  // Jenjang & Selection states
  const [jenjang, setJenjang] = useState<JenjangPendidikan>('SMP');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedTopik, setSelectedTopik] = useState<string>('');

  // Options
  const [selectedTipeSoal, setSelectedTipeSoal] = useState<TipeSoal[]>(['PG', 'PGK']);
  const [jumlahSoal, setJumlahSoal] = useState<number>(3);
  const [isHots, setIsHots] = useState<boolean>(true);
  const [levelKognitif, setLevelKognitif] = useState<LevelKognitif>('C4');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Derived lists
  const [mapelList, setMapelList] = useState<MataPelajaranDetail[]>([]);
  const [topikList, setTopikList] = useState<TopikMateri[]>([]);

  // Generator states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [generatedSoal, setGeneratedSoal] = useState<Soal[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'curriculum-bank' | null>(null);
  const [webSources, setWebSources] = useState<string[]>([]);
  const [groundedWithWeb, setGroundedWithWeb] = useState<boolean>(false);
  const [groundedWithDoc, setGroundedWithDoc] = useState<boolean>(false);
  const [documentNameResult, setDocumentNameResult] = useState<string | null>(null);

  // Document Upload States
  const [modeSumber, setModeSumber] = useState<'web' | 'dokumen'>('web');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedDocText, setUploadedDocText] = useState<string>('');
  const [uploadedDocName, setUploadedDocName] = useState<string>('');
  const [uploadedDocMeta, setUploadedDocMeta] = useState<{
    wordCount: number;
    fileSizeFormatted: string;
    preview: string;
    fileType: string;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Update mapel list when jenjang changes
  useEffect(() => {
    const list = getMataPelajaranByJenjang(jenjang);
    setMapelList(list);
    if (list.length > 0) {
      setSelectedMapel(list[0].nama);
    } else {
      setSelectedMapel('');
    }
  }, [jenjang]);

  // Update topik list when mapel changes
  useEffect(() => {
    if (!selectedMapel) {
      setTopikList([]);
      setSelectedTopik('');
      return;
    }
    const topics = getTopikByMataPelajaran(jenjang, selectedMapel);
    setTopikList(topics);
    if (topics.length > 0) {
      setSelectedTopik(topics[0].nama);
    } else {
      setSelectedTopik('');
    }
  }, [jenjang, selectedMapel]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGeneratedSoal([]);
      setNotification(null);
      setIsLoading(false);
      setCustomPrompt('');
      setUploadedFile(null);
      setUploadedDocText('');
      setUploadedDocName('');
      setUploadedDocMeta(null);
      setDocUploadError(null);
      setModeSumber('web');
      setWebSources([]);
      setAiProvider(null);
    }
  }, [isOpen]);

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const validExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(fileExt)) {
      setDocUploadError(`Format berkas "${fileExt}" tidak didukung. Harap unggah berkas PDF, Word (.docx/.doc), PowerPoint (.pptx/.ppt), atau Teks (.txt).`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setDocUploadError('Ukuran berkas melebihi batas maksimal 20 MB.');
      return;
    }

    setIsUploadingDoc(true);
    setDocUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai/parse-document', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membaca materi dari berkas dokumen.');
      }

      setUploadedFile(file);
      setUploadedDocText(data.text);
      setUploadedDocName(data.fileName);
      setUploadedDocMeta({
        wordCount: data.wordCount,
        fileSizeFormatted: data.fileSizeFormatted,
        preview: data.preview,
        fileType: data.fileType
      });
      setModeSumber('dokumen');
      setNotification({
        type: 'success',
        text: `Dokumen "${data.fileName}" berhasil dibaca (${data.wordCount} kata materi). AI akan merumuskan butir soal berbasis langsung dari materi berkas ini!`
      });
    } catch (err: any) {
      setDocUploadError(err.message || 'Terjadi gangguan saat memproses berkas dokumen.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleRemoveDoc = () => {
    setUploadedFile(null);
    setUploadedDocText('');
    setUploadedDocName('');
    setUploadedDocMeta(null);
    setDocUploadError(null);
    setModeSumber('web');
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (modeSumber === 'dokumen' && (!uploadedDocText || uploadedDocText.length < 20)) {
      setNotification({
        type: 'error',
        text: 'Harap unggah dokumen materi (PDF / Word / PPT) terlebih dahulu atau beralih ke Mode Riset Web!'
      });
      return;
    }

    if (!selectedTopik) {
      setNotification({
        type: 'error',
        text: 'Harap pilih Topik Pembelajaran terlebih dahulu sebelum generate soal AI!'
      });
      return;
    }

    if (selectedTipeSoal.length === 0) {
      setNotification({
        type: 'error',
        text: 'Harap centang minimal 1 tipe butir soal (misal PG dan PGK) sebelum generate!'
      });
      return;
    }

    setIsLoading(true);
    setNotification(null);
    setLoadingStep(
      modeSumber === 'dokumen'
        ? `📄 Menelaah materi dokumen "${uploadedDocName}" (${uploadedDocMeta?.wordCount || 0} kata)...`
        : '🌐 Menelusuri ensiklopedia & materi ilmiah web secara real-time...'
    );

    try {
      const timer1 = setTimeout(() => {
        setLoadingStep(
          modeSumber === 'dokumen'
            ? `⚡ Gemini AI menyusun stimulus wacana & soal berbasis langsung dari isi "${uploadedDocName}"...`
            : '⚡ Gemini AI menganalisis data grounding web & menyusun stimulus wacana...'
        );
      }, 1000);

      const timer2 = setTimeout(() => {
        setLoadingStep('🔍 Memvalidasi keselarasan konsep faktual, opsi kunci jawaban & rubrik AKM...');
      }, 2400);

      const response = await fetch('/api/ai/generate-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenjang,
          mataPelajaran: selectedMapel,
          topik: selectedTopik,
          tipeSoal: selectedTipeSoal.length === 1 ? selectedTipeSoal[0] : 'CAMPURAN',
          tipeSoalList: selectedTipeSoal,
          jumlahSoal,
          isHots,
          levelKognitif,
          customPrompt,
          pembuat: guruProfile?.namaLengkap || 'Guru Pengampu CBT',
          documentText: modeSumber === 'dokumen' ? uploadedDocText : undefined,
          documentName: modeSumber === 'dokumen' ? uploadedDocName : undefined
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const result = await response.json();

      if (result.success && Array.isArray(result.soal)) {
        setGeneratedSoal(result.soal);
        setAiProvider(result.provider);
        setWebSources(result.webSources || []);
        setGroundedWithWeb(!!result.groundedWithWeb);
        setGroundedWithDoc(!!result.groundedWithDoc);
        setDocumentNameResult(result.documentName || (modeSumber === 'dokumen' ? uploadedDocName : null));
        setNotification({
          type: 'success',
          text: result.message || `Berhasil meng-generate ${result.soal.length} soal AI akurat!`
        });
      } else {
        setNotification({
          type: 'error',
          text: result.message || 'Gagal menghasilkan butir soal. Silakan coba kembali.'
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Koneksi ke layanan AI terganggu. Silakan periksa jaringan Anda.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setGeneratedSoal(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveAll = () => {
    if (generatedSoal.length === 0) return;
    const authorName = guruProfile?.namaLengkap || 'Guru CBT';
    const authorUsername = guruProfile?.username || '';

    const enrichedList: Soal[] = generatedSoal.map((s) => ({
      ...s,
      pembuat: s.pembuat || authorName,
      guruUsername: s.guruUsername || authorUsername,
      stimulus: s.stimulus
        ? {
            ...s.stimulus,
            pembuat: s.stimulus.pembuat || authorName,
            guruUsername: s.stimulus.guruUsername || authorUsername,
          }
        : undefined,
    }));

    onSaveSoalList(enrichedList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner border border-white/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  AI Question Generator
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wide">
                  Gemini 3.1 & Dokumen Guru
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Generate otomatis butir soal AKM & HOTS Kurikulum Merdeka (Bebas Halusinasi dengan Web Grounding & Upload Dokumen)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODAL BODY (SCROLLABLE) ================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Notification banner */}
          {notification && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5 font-medium">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{notification.text}</span>
              </div>
              {aiProvider && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-white rounded-md border text-slate-600">
                  Engine: {aiProvider === 'gemini' ? 'Google Gemini AI' : 'Kurikulum Merdeka Synthesis'}
                </span>
              )}
            </div>
          )}

          {/* ================= PILIH SUMBER RUJUKAN MATERI (WEB vs UNGGAH DOKUMEN GURU) ================= */}
          <div className="bg-white p-4 rounded-2xl border-2 border-indigo-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Sumber Materi Rujukan AI (Anti-Halusinasi):</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tentukan apakah AI meriset internet secara otomatis atau menyusun soal 100% dari dokumen modul guru
                </p>
              </div>
              
              {/* Segmented Tab Control */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setModeSumber('web')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    modeSumber === 'web'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 Riset Web & Kurikulum</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModeSumber('dokumen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    modeSumber === 'dokumen'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>📄 Unggah Dokumen Guru</span>
                  {uploadedDocMeta && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: WEB GROUNDING INFO */}
            {modeSumber === 'web' && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold">Mode Riset Web Aktif:</span> AI akan otomatis menelusuri artikel ensiklopedia ilmiah Indonesia (Wikipedia & bank materi pendidikan nasional) sesuai topik pelajaran yang Anda pilih di bawah untuk memastikan soal kontekstual dan bebas halusinasi.
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENT UPLOAD DROPZONE & PREVIEW */}
            {modeSumber === 'dokumen' && (
              <div className="space-y-3 pt-1">
                {!uploadedDocMeta ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => {
                      const input = document.getElementById('guru-doc-input') as HTMLInputElement;
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="guru-doc-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    {isUploadingDoc ? (
                      <div className="py-4 space-y-2">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                        <p className="text-xs font-bold text-indigo-950">
                          Sedang mengekstrak teks & struktur materi dari dokumen Anda...
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Membaca file PDF / Word / PPT untuk dijadikan acuan langsung butir soal AI
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">
                            Seret & jatuhkan berkas materi di sini, atau <span className="text-indigo-600 underline">Klik untuk Memilih</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Mendukung berkas: <b className="text-slate-700">PDF (.pdf)</b>, <b className="text-slate-700">Word (.docx, .doc)</b>, <b className="text-slate-700">PowerPoint (.pptx, .ppt)</b>, atau <b className="text-slate-700">Teks (.txt)</b> (Maks. 20 MB)
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">PDF</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">DOC / DOCX</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">PPT / PPTX</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">TXT</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-2 border-emerald-300 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <FileCheck2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-emerald-950">
                              {uploadedDocName}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 text-emerald-900 rounded-full">
                              {uploadedDocMeta.fileType}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            Ukuran: <b>{uploadedDocMeta.fileSizeFormatted}</b> • Isi Materi: <b className="text-emerald-900 font-extrabold">{uploadedDocMeta.wordCount.toLocaleString()} kata</b> berhasil diekstrak
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor="guru-doc-input-replace"
                          className="px-3 py-1.5 rounded-lg border border-emerald-400 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>Ganti Berkas</span>
                        </label>
                        <input
                          id="guru-doc-input-replace"
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveDoc}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1"
                          title="Hapus dokumen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Excerpt preview of the document */}
                    <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/80 text-[11px] text-slate-700 space-y-1">
                      <span className="font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pratinjau Cuplikan Materi yang Terbaca oleh AI:</span>
                      </span>
                      <p className="italic text-slate-600 line-clamp-2 leading-relaxed">
                        &quot;{uploadedDocMeta.preview}&quot;
                      </p>
                    </div>
                  </div>
                )}

                {docUploadError && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{docUploadError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= STEP 1, 2, 3: SELECTION CONTROLS ================= */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-4">
            
            {/* 1. Pilih Jenjang (SMP / SMA) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>1. Pilih Jenjang Pendidikan:</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setJenjang('SMP')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    jenjang === 'SMP'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-sm block">Jenjang SMP</span>
                    <span className={`text-[11px] ${jenjang === 'SMP' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Fase D (Kelas 7, 8, 9)
                    </span>
                  </div>
                  {jenjang === 'SMP' && <Check className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setJenjang('SMA')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    jenjang === 'SMA'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-sm block">Jenjang SMA</span>
                    <span className={`text-[11px] ${jenjang === 'SMA' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Fase E & F (Kelas 10, 11, 12)
                    </span>
                  </div>
                  {jenjang === 'SMA' && <Check className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 2 & 3. Dropdown Cascading: Mata Pelajaran -> Topik Materi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              
              {/* Mata Pelajaran Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>2. Mata Pelajaran ({jenjang}):</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {mapelList.length} mata pelajaran
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedMapel}
                    onChange={(e) => setSelectedMapel(e.target.value)}
                    className="w-full p-3 text-xs sm:text-sm bg-white rounded-xl border-2 border-slate-300 text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none appearance-none cursor-pointer pr-10"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama} [{m.kategori}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Topik Dropdown (Otomatis Menyesuaikan dengan Mata Pelajaran) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>3. Topik Pembelajaran:</span>
                  </span>
                  <span className="text-[11px] font-normal text-blue-600 font-medium">
                    {topikList.length > 0 ? `${topikList.length} Topik Tersedia` : 'Pilih Mapel Dahulu'}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedTopik}
                    onChange={(e) => setSelectedTopik(e.target.value)}
                    disabled={topikList.length === 0}
                    className={`w-full p-3 text-xs sm:text-sm rounded-xl border-2 outline-none appearance-none cursor-pointer pr-10 font-semibold ${
                      selectedTopik
                        ? 'border-purple-500 bg-purple-50/50 text-purple-950 focus:ring-2 focus:ring-purple-200'
                        : 'border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {topikList.length === 0 ? (
                      <option value="">Belum ada topik untuk pelajaran ini</option>
                    ) : (
                      topikList.map((t) => (
                        <option key={t.id} value={t.nama}>
                          {t.nama}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {/* Deskripsi topik yang terpilih */}
                {selectedTopik && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    {topikList.find(t => t.nama === selectedTopik)?.deskripsi}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Tipe Butir Soal (Checkbox / Ceklis Multi-Fitur) */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>4. Tipe Butir Soal (Centang Ceklis - Bisa Pilih 2 Fitur / Campuran):</span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 font-medium">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTipeSoal(['PG', 'PGK'])}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      selectedTipeSoal.length === 2 && selectedTipeSoal.includes('PG') && selectedTipeSoal.includes('PGK')
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ✓ 2 Fitur (PG + PGK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTipeSoal(['PG', 'PGK', 'MENJODOHKAN', 'URAIAN'])}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      selectedTipeSoal.length === 4
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Semua (4 Tipe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTipeSoal(['PG'])}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                      selectedTipeSoal.length === 1 && selectedTipeSoal.includes('PG')
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Hanya PG
                  </button>
                </div>
              </div>

              {/* Grid 4 Checkbox Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'PG' as TipeSoal,
                    label: 'Pilihan Ganda (PG)',
                    desc: '1 jawaban benar, 4 opsi (SMP) / 5 opsi (SMA)',
                    badge: 'Opsi Tunggal'
                  },
                  {
                    id: 'PGK' as TipeSoal,
                    label: 'Pilihan Ganda Kompleks (PGK)',
                    desc: 'Multi-centang pernyataan benar / salah',
                    badge: 'Multi Opsi'
                  },
                  {
                    id: 'MENJODOHKAN' as TipeSoal,
                    label: 'Menjodohkan',
                    desc: 'Memasangkan kolom premis dan target akurat',
                    badge: 'Pasangan'
                  },
                  {
                    id: 'URAIAN' as TipeSoal,
                    label: 'Uraian / Esai',
                    desc: 'Analisis terbuka & rubrik penskoran AKM',
                    badge: 'Esai'
                  }
                ].map((opt) => {
                  const isChecked = selectedTipeSoal.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedTipeSoal((prev) => {
                          if (prev.includes(opt.id)) {
                            if (prev.length <= 1) return prev; // Pertahankan minimal 1
                            return prev.filter((t) => t !== opt.id);
                          } else {
                            return [...prev, opt.id];
                          }
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer relative ${
                        isChecked
                          ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border-blue-500 shadow-xs ring-2 ring-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 opacity-75'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isChecked ? 'text-blue-950 font-extrabold' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status Pilihan Ceklis */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 pt-1">
                <span>
                  Centang tipe soal yang diinginkan ({selectedTipeSoal.length} terpilih: <b className="text-blue-700">{selectedTipeSoal.join(', ')}</b>)
                </span>
                {selectedTipeSoal.length === 2 && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mode 2 Fitur Aktif</span>
                  </span>
                )}
              </div>
            </div>

            {/* Parameter Jumlah Soal, HOTS, Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>5. Jumlah Soal:</span>
                  <span className="text-blue-600 font-extrabold">{jumlahSoal} Butir Soal</span>
                </label>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {[3, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setJumlahSoal(num)}
                      className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg border transition cursor-pointer ${
                        jumlahSoal === num
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {num === 20 ? '⚡ 20 Soal' : `${num} Soal`}
                    </button>
                  ))}
                </div>
                <select
                  value={jumlahSoal}
                  onChange={(e) => setJumlahSoal(Number(e.target.value))}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold text-blue-700 text-xs"
                >
                  <option value={1}>1 Soal (Kilat)</option>
                  <option value={3}>3 Soal (Rekomendasi Cepat)</option>
                  <option value={5}>5 Soal (Latihan Singkat)</option>
                  <option value={10}>10 Soal (Paket Standar)</option>
                  <option value={20}>20 Soal (Paket Tryout / Ujian Lengkap 20 Butir)</option>
                </select>
                {jumlahSoal === 20 && (
                  <p className="text-[10px] text-blue-600 font-semibold mt-1">
                    ⚡ Mode Tryout: 20 butir soal akan didistribusikan merata ke tipe yang dicentang.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  6. Karakteristik HOTS:
                </label>
                <select
                  value={isHots ? 'HOTS' : 'REGULER'}
                  onChange={(e) => setIsHots(e.target.value === 'HOTS')}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 font-semibold text-amber-700 text-xs"
                >
                  <option value="HOTS">HOTS (Penalaran Kritis & Studi Kasus)</option>
                  <option value="REGULER">Reguler (Konseptual & Pemahaman)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isHots ? 'Menuntut analisis, sintesis & evaluasi data kontekstual' : 'Fokus pada penguasaan materi konseptual'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  7. Level Taksonomi Bloom:
                </label>
                <select
                  value={levelKognitif}
                  onChange={(e) => setLevelKognitif(e.target.value as LevelKognitif)}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 text-xs"
                >
                  <option value="C4">C4 - Menganalisis (Standar AKM)</option>
                  <option value="C5">C5 - Mengevaluasi / Menilai</option>
                  <option value="C6">C6 - Mencipta / Merumuskan Solusi</option>
                  <option value="C3">C3 - Menerapkan / Kalkulasi</option>
                  <option value="C2">C2 - Memahami Konsep</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Level penalaran kognitif siswa dalam penyelesaian soal
                </p>
              </div>
            </div>

            {/* Optional Custom Prompt */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Instruksi Khusus untuk AI (Opsional):
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Contoh: Fokuskan pada studi kasus lingkungan di Indonesia / Berikan grafik perbandingan..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* GENERATE BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {!selectedTopik ? (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Pilih topik terlebih dahulu untuk mengaktifkan AI Generator
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Siap menghasilkan <b>{jumlahSoal} butir soal</b> ({selectedTipeSoal.join(' + ')}) untuk topik &quot;{selectedTopik}&quot;
                    </span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedTopik || isLoading || selectedTipeSoal.length === 0}
                className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !selectedTopik || isLoading || selectedTipeSoal.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-lg active:scale-98'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sedang Memproses AI ({jumlahSoal} Soal)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>⚡ Generate {jumlahSoal} Soal dengan AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ================= LOADING ANIMATION ================= */}
          {isLoading && (
            <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/50 border border-blue-200 text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Google Gemini AI sedang merancang soal Asesmen AKM...
                </h4>
                <p className="text-xs text-indigo-700 font-semibold mt-1">
                  {loadingStep}
                </p>
              </div>
            </div>
          )}

          {/* ================= PREVIEW HASIL GENERATE ================= */}
          {generatedSoal.length > 0 && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Hasil Pratinjau Butir Soal AI ({generatedSoal.length} Soal)
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    Siap Disimpan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Document Grounding verification banner */}
              {groundedWithDoc && documentNameResult && (
                <div className="p-3 bg-emerald-50/90 rounded-xl border-2 border-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-950">
                  <div className="flex items-center gap-2 font-bold">
                    <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Soal 100% Dirumuskan dari Dokumen Guru: <b className="text-emerald-900 underline">&quot;{documentNameResult}&quot;</b>
                    </span>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                    Bebas Halusinasi • Terikat Dokumen Materi
                  </span>
                </div>
              )}

              {/* Web Grounding verification banner */}
              {groundedWithWeb && webSources.length > 0 && !groundedWithDoc && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs flex flex-wrap items-center justify-between gap-2 text-blue-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Materi Diverifikasi via Web Grounding (Bebas Halusinasi):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-blue-700">
                    {webSources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200 hover:text-blue-950 font-semibold"
                      >
                        <span>Referensi #{i + 1}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards List */}
              <div className="space-y-4">
                {generatedSoal.map((soal, idx) => (
                  <div
                    key={soal.id}
                    className="bg-white p-5 rounded-2xl border-2 border-slate-200/90 shadow-xs hover:border-blue-300 transition-all space-y-3 relative group"
                  >
                    {/* Top Row Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold px-2.5 py-0.5 rounded bg-blue-600 text-white">
                          #{idx + 1}
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {soal.tipeSoal}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {soal.mataPelajaran}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
                          {soal.topik || selectedTopik}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {soal.isHots && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                            HOTS {soal.levelKognitif}
                          </span>
                        )}
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Bobot: {soal.bobot} poin
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(soal.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                          title="Hapus butir ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stimulus Preview (if available) */}
                    {soal.stimulus && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>Stimulus: {soal.stimulus.judul}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                              {soal.stimulus.tipe}
                            </span>
                          </div>
                          {soal.stimulus.sumber && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {soal.stimulus.sumber}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 whitespace-pre-line line-clamp-3">
                          {soal.stimulus.kontenTeks}
                        </p>
                      </div>
                    )}

                    {/* Question text */}
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        {soal.pertanyaan}
                      </p>
                    </div>

                    {/* Opsi / Content detail depending on type */}
                    {soal.tipeSoal === 'PG' && soal.opsiPG && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {soal.opsiPG.map((opt) => {
                          const isKey = opt.id === soal.kunciPG;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                                isKey
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isKey ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span className="flex-1">{opt.teks}</span>
                              {isKey && (
                                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                                  KUNCI
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {soal.tipeSoal === 'PGK' && soal.opsiPGK && (
                      <div className="space-y-1.5 text-xs pt-1">
                        {soal.opsiPGK.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                              opt.isKunci
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>
                              {oIdx + 1}. {opt.teks}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                opt.isKunci ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.isKunci ? 'BENAR' : 'SALAH'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {soal.tipeSoal === 'MENJODOHKAN' && soal.pasanganMenjodohkan && (
                      <div className="space-y-1 text-xs pt-1">
                        {soal.pasanganMenjodohkan.map((pair, pIdx) => (
                          <div
                            key={pair.id}
                            className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-200 flex items-center justify-between text-indigo-950"
                          >
                            <span className="font-semibold">{pIdx + 1}. {pair.premis}</span>
                            <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{pair.target}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {soal.tipeSoal === 'URAIAN' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                        <span className="font-bold text-amber-900 block">Pedoman Penskoran:</span>
                        <p className="text-slate-700 whitespace-pre-line">{soal.rubrikUraian}</p>
                      </div>
                    )}

                    {/* Pembahasan & Verifikasi Ilmiah */}
                    {soal.pembahasan && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pembahasan & Verifikasi Ilmiah:</span>
                        </span>
                        <p className="text-emerald-900 whitespace-pre-line leading-relaxed font-normal">
                          {soal.pembahasan}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {generatedSoal.length > 0 ? (
              <span className="font-semibold text-slate-700">
                {generatedSoal.length} soal siap ditambahkan ke Bank Soal
              </span>
            ) : (
              <span>Pilih jenjang, mapel, topik, lalu klik tombol Generate AI</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            {generatedSoal.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Semua ({generatedSoal.length}) ke Bank Soal</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

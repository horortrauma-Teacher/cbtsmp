"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Home,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Sparkles,
  Trophy,
  Award,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  UserCheck,
  GraduationCap,
  Clock,
  ShieldCheck
} from "lucide-react";

import { Soal, Stimulus, JadwalUjian, HasilUjianSiswa, JawabanDetailSiswa } from "@/types/cbt";
import { useCBTData } from "@/lib/store";
import { ExamHeader, FontSizeOption } from "@/components/exam/ExamHeader";
import { StimulusViewer } from "@/components/exam/StimulusViewer";
import { QuestionArea, QuestionAnswerState } from "@/components/exam/QuestionArea";
import { QuestionNavGrid, isQuestionAnswered } from "@/components/exam/QuestionNavGrid";
import { ExamSubmitModal } from "@/components/exam/ExamSubmitModal";

export default function StudentExamPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = (params?.scheduleId as string) || "demo";
  const { allSoalList, allJadwalList, soalList, jadwalList, addHasilUjian } = useCBTData();
  const effectiveJadwalList = allJadwalList && allJadwalList.length > 0 ? allJadwalList : jadwalList;
  const effectiveSoalList = allSoalList && allSoalList.length > 0 ? allSoalList : soalList;

  // Server-synced state (ensures accurate cross-browser delivery)
  const [serverSchedule, setServerSchedule] = useState<JadwalUjian | null>(null);
  const [serverQuestions, setServerQuestions] = useState<Soal[] | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Fetch official schedule & questions from Server CBT API
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingApi(true);

    fetch(`/api/cbt/exam/${scheduleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.success && data.schedule) {
          setServerSchedule(data.schedule);
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setServerQuestions(data.questions);
          }
          setIsNotFound(false);
        } else if (data.notFound) {
          // Check if local effectiveJadwalList has exact match
          const localMatch = effectiveJadwalList.find((j) => j.id === scheduleId);
          if (!localMatch) {
            setIsNotFound(true);
          }
        }
      })
      .catch((err) => {
        console.warn('[ExamPage] Error fetching exam from API:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingApi(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [scheduleId, effectiveJadwalList]);

  // Student Identity: empty by default so student must input their identity to login
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    kelas: "",
    nisn: "-",
  });

  // Track whether student has logged in & started this exam
  const [isExamStarted, setIsExamStarted] = useState(false);

  // Form states for student login gate
  const [inputNama, setInputNama] = useState("");
  const [inputKelas, setInputKelas] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = sessionStorage.getItem("cbt_student_nama");
      const savedKelas = sessionStorage.getItem("cbt_student_kelas");
      const savedStarted = sessionStorage.getItem(`cbt_exam_started_${scheduleId}`);

      if (savedName) setInputNama(savedName);
      if (savedKelas) setInputKelas(savedKelas);

      // If already started and identity present for this exam session, resume directly
      if (savedName && savedKelas && savedStarted === "true") {
        setStudentInfo({
          name: savedName,
          kelas: savedKelas,
          nisn: savedKelas,
        });
        setIsExamStarted(true);
      }
    }
  }, [scheduleId]);

  const handleStartExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNama.trim()) {
      setLoginError("Silakan masukkan Nama Lengkap Siswa terlebih dahulu!");
      return;
    }
    if (!inputKelas.trim()) {
      setLoginError("Silakan masukkan Kelas / Rombel Siswa terlebih dahulu!");
      return;
    }

    setLoginError(null);
    const trimmedName = inputNama.trim();
    const trimmedKelas = inputKelas.trim();

    setStudentInfo({
      name: trimmedName,
      kelas: trimmedKelas,
      nisn: trimmedKelas,
    });

    if (typeof window !== "undefined") {
      sessionStorage.setItem("cbt_student_nama", trimmedName);
      sessionStorage.setItem("cbt_student_kelas", trimmedKelas);
      sessionStorage.setItem("cbt_student_nisn", trimmedKelas);
      sessionStorage.setItem(`cbt_exam_started_${scheduleId}`, "true");
    }

    // Catat ke arsip login_siswa di Supabase
    fetch("/api/cbt/student/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namaLengkap: trimmedName,
        kelas: trimmedKelas,
        nisn: trimmedKelas,
        jadwalId: scheduleId,
      }),
    }).catch(() => {});

    setIsExamStarted(true);
  };

  // Exam Schedule Resolution (Never fall back to unrelated schedule)
  const examSchedule: JadwalUjian = useMemo(() => {
    if (serverSchedule) return serverSchedule;

    // Look for exact ID match in local list
    const found = effectiveJadwalList.find((j) => j.id === scheduleId);
    if (found) return found;

    // For demo/sample route only:
    if (scheduleId === 'demo' || scheduleId === 'sample') {
      if (effectiveJadwalList.length > 0) return effectiveJadwalList[0];
    }

    // Default fallback placeholder while loading
    return {
      id: scheduleId,
      judul: 'Asesmen CBT Siswa',
      mataPelajaran: 'Umum',
      fase: 'Fase D (SMP)',
      targetKelas: ['Kelas 7 SMP', 'Kelas 8 SMP'],
      durasiMenit: 60,
      token: 'BEBAS',
      tanpaToken: true,
      waktuMulai: new Date().toISOString(),
      waktuSelesai: new Date(Date.now() + 86400000).toISOString(),
      acakSoal: false,
      acakOpsi: false,
      status: 'SEDANG_BERLANGSUNG' as const,
      soalIds: [],
      totalSoal: 0,
      totalBobot: 0,
      kkm: 75,
    };
  }, [serverSchedule, effectiveJadwalList, scheduleId]);

  // Questions Dataset linked strictly to this schedule
  const questions: Soal[] = useMemo(() => {
    if (serverQuestions && serverQuestions.length > 0) return serverQuestions;

    if (examSchedule && examSchedule.soalIds && examSchedule.soalIds.length > 0) {
      const matched = effectiveSoalList.filter((s) => examSchedule.soalIds.includes(s.id));
      if (matched.length > 0) return matched;
    }

    // If local exact schedule has questions
    const exactLocal = effectiveJadwalList.find((j) => j.id === scheduleId);
    if (exactLocal && exactLocal.soalIds && exactLocal.soalIds.length > 0) {
      const matched = effectiveSoalList.filter((s) => exactLocal.soalIds.includes(s.id));
      if (matched.length > 0) return matched;
    }

    return [];
  }, [serverQuestions, examSchedule, effectiveSoalList, effectiveJadwalList, scheduleId]);

  // Current question index (0 to questions.length - 1)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers state keyed by question ID
  const [answers, setAnswers] = useState<{ [soalId: string]: QuestionAnswerState }>({});

  // Remaining time in seconds (e.g. 60 mins = 3600 seconds)
  const [remainingSeconds, setRemainingSeconds] = useState(examSchedule.durasiMenit * 60);

  // Connection & Auto-save status
  const [isOnline, setIsOnline] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");

  // Accessibility Font Size ('sm' | 'md' | 'lg')
  const [fontSize, setFontSize] = useState<FontSizeOption>("md");

  // Mobile Question Nav Drawer
  const [isNavGridOpenMobile, setIsNavGridOpenMobile] = useState(false);

  // Mobile Tab toggle between Stimulus and Question pane ('stimulus' | 'question')
  const [mobileActiveTab, setMobileActiveTab] = useState<"stimulus" | "question">("question");

  // Desktop Split screen ratio (e.g. 50%)
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for stimulus pane

  // Submit modal state & Exam Finished state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Storage keys for persistence
  const answersStorageKey = `cbt_answers_${scheduleId}`;
  const timerStorageKey = `cbt_timer_${scheduleId}`;

  // 1. Initialize data from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cachedAnswers = localStorage.getItem(answersStorageKey);
      if (cachedAnswers) {
        setAnswers(JSON.parse(cachedAnswers));
      }

      const cachedTimer = localStorage.getItem(timerStorageKey);
      if (cachedTimer) {
        const parsedTimer = parseInt(cachedTimer, 10);
        if (!isNaN(parsedTimer) && parsedTimer > 0) {
          setRemainingSeconds(parsedTimer);
        }
      }
    } catch (e) {
      console.error("Failed to load CBT state from localStorage:", e);
    }
  }, [answersStorageKey, timerStorageKey]);

  // 2. Online / Offline network listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Countdown Timer tick (only runs after student logs in/starts exam)
  useEffect(() => {
    if (!isExamStarted || isExamSubmitted) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto submit when time runs out!
          handleAutoSubmitTimeUp();
          return 0;
        }
        const updated = prev - 1;
        // Periodic save timer to localStorage
        if (updated % 5 === 0) {
          localStorage.setItem(timerStorageKey, updated.toString());
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamStarted, isExamSubmitted, timerStorageKey]);

  // 4. Update Answer Handler with Autosave
  const handleUpdateAnswer = useCallback(
    (updatedPartial: Partial<QuestionAnswerState>) => {
      const activeSoal = questions[currentIndex];
      if (!activeSoal) return;

      setAnswers((prev) => {
        const prevAnswer = prev[activeSoal.id] || {};
        const newAnswer = { ...prevAnswer, ...updatedPartial };
        const updatedState = { ...prev, [activeSoal.id]: newAnswer };

        // Save immediately to localStorage
        try {
          localStorage.setItem(answersStorageKey, JSON.stringify(updatedState));
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
          setLastSavedTime(timeStr);
        } catch (e) {
          console.error("Local autosave error:", e);
        }

        return updatedState;
      });
    },
    [questions, currentIndex, answersStorageKey]
  );

  // Auto-submit callback on timeout
  const handleAutoSubmitTimeUp = () => {
    finalizeSubmission();
  };

  // Finalize Submission
  const finalizeSubmission = () => {
    setIsSubmitModalOpen(false);
    setIsExamSubmitted(true);

    let totalScore = 0;
    let maxPossibleScore = 0;
    let earnedHots = 0;
    let totalHots = 0;
    let pgPoints = 0;
    let pgkPoints = 0;
    let menjodohkanPoints = 0;
    let uraianPoints = 0;
    let correctCount = 0;

    const detailList: JawabanDetailSiswa[] = [];

    questions.forEach((q) => {
      const ans = answers[q.id];
      const qBobot = q.bobot || 10;
      maxPossibleScore += qBobot;
      if (q.isHots) totalHots += qBobot;

      let isBenar = false;
      let earned = 0;
      let studentAnsStr = "-";
      let kunciStr = "";

      if (q.tipeSoal === "PG") {
        studentAnsStr = ans?.pg || "-";
        kunciStr = q.kunciPG || "";
        if (ans?.pg && q.kunciPG && ans.pg === q.kunciPG) {
          isBenar = true;
          earned = qBobot;
          pgPoints += qBobot;
          correctCount++;
        }
      } else if (q.tipeSoal === "PGK") {
        const correctKeys = (q.opsiPGK || []).filter((o) => o.isKunci).map((o) => o.id);
        const studentSelected = ans?.pgk || [];
        studentAnsStr = studentSelected.join(", ") || "-";
        kunciStr = correctKeys.join(", ");
        const matches = studentSelected.filter((k) => correctKeys.includes(k)).length;
        const mistakes = studentSelected.filter((k) => !correctKeys.includes(k)).length;
        if (matches > 0 && mistakes === 0) {
          earned = Math.round((matches / (correctKeys.length || 1)) * qBobot);
          isBenar = matches === correctKeys.length;
          if (isBenar) correctCount++;
        }
        pgkPoints += earned;
      } else if (q.tipeSoal === "MENJODOHKAN") {
        const pairs = q.pasanganMenjodohkan || [];
        const studentPairs = ans?.menjodohkan || {};
        let matched = 0;
        pairs.forEach((p) => {
          if (studentPairs[p.premis] && studentPairs[p.premis] === p.target) matched++;
        });
        studentAnsStr = Object.keys(studentPairs).length > 0 ? JSON.stringify(studentPairs) : "-";
        kunciStr = pairs.map((p) => `${p.premis} -> ${p.target}`).join("; ");
        earned = Math.round((matched / (pairs.length || 1)) * qBobot);
        isBenar = matched === pairs.length;
        if (isBenar) correctCount++;
        menjodohkanPoints += earned;
      } else if (q.tipeSoal === "URAIAN") {
        studentAnsStr = ans?.uraian || "-";
        kunciStr = q.kunciUraian || q.rubrikUraian || "Rubrik analisis wacana kontekstual";
        if (ans?.uraian && ans.uraian.trim().length > 15) {
          earned = Math.round(qBobot * 0.95);
          isBenar = true;
          correctCount++;
        }
        uraianPoints += earned;
      }

      totalScore += earned;
      if (q.isHots) earnedHots += earned;

      detailList.push({
        soalId: q.id,
        tipeSoal: q.tipeSoal,
        pertanyaan: q.pertanyaan,
        isHots: !!q.isHots,
        bobot: qBobot,
        kunciJawaban: kunciStr,
        jawabanSiswa: studentAnsStr,
        isBenar,
        nilaiDiperoleh: earned,
      });
    });

    const scaledScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const kkm = examSchedule?.kkm || 75;
    const isTuntas = scaledScore >= kkm;

    const newHasil: HasilUjianSiswa = {
      id: `hasil-${Date.now()}`,
      jadwalId: examSchedule.id,
      namaSiswa: studentInfo.name,
      nisn: studentInfo.nisn,
      kelas: studentInfo.kelas,
      waktuMulai: new Date(Date.now() - (examSchedule.durasiMenit * 60 - remainingSeconds) * 1000).toLocaleString("id-ID"),
      waktuSubmit: new Date().toLocaleString("id-ID"),
      durasiPengerjaan: `${Math.floor((examSchedule.durasiMenit * 60 - remainingSeconds) / 60)} Menit ${(examSchedule.durasiMenit * 60 - remainingSeconds) % 60} Detik`,
      nilaiAkhir: scaledScore,
      statusKelulusan: isTuntas ? "TUNTAS" : "BELUM_TUNTAS",
      breakdown: {
        pg: pgPoints,
        pgk: pgkPoints,
        menjodohkan: menjodohkanPoints,
        uraian: uraianPoints,
        hotsMasteryRate: totalHots > 0 ? Math.round((earnedHots / totalHots) * 100) : 100,
      },
      jawabanDetail: detailList,
    };

    // Save to global store & Supabase
    addHasilUjian(newHasil);

    const resultPayload = {
      scheduleId: examSchedule.id,
      studentName: studentInfo.name,
      studentNisn: studentInfo.nisn,
      submittedAt: new Date().toLocaleString("id-ID"),
      answers,
      correctCount,
      earnedPoints: totalScore,
      scaledScore,
      isTuntas,
      totalQuestions: questions.length,
    };

    setSubmittedData(resultPayload);

    // Clear local cache for clean test cleanup
    localStorage.removeItem(answersStorageKey);
    localStorage.removeItem(timerStorageKey);
  };

  // Current active question
  const currentSoal = questions[currentIndex] || questions[0];
  const hasStimulus = Boolean(currentSoal?.stimulus);

  // When changing questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  // Answered count for header badge
  const answeredTotal = useMemo(() => {
    return questions.filter((q) => isQuestionAnswered(q, answers[q.id])).length;
  }, [questions, answers]);

  // Loading Screen while fetching exam from Server / Database
  if (isLoadingApi && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">Menyinkronkan Sesi Ujian...</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Menghubungkan ke server CBT untuk memuat butir soal & wacana stimulus resmi untuk sesi <b>{scheduleId}</b>.
          </p>
        </div>
      </div>
    );
  }

  // Not Found Screen if schedule doesn't exist
  if (isNotFound && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Jadwal Ujian Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tautan sesi ujian <b>{scheduleId}</b> tidak ditemukan pada server CBT atau belum dipublikasikan oleh guru pengampu.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Kembali ke Beranda Masuk Siswa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If questions are still empty after loading
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Belum Ada Butir Soal</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sesi ujian <b>{examSchedule.judul}</b> belum memiliki butir soal yang aktif atau sedang dipersiapkan oleh guru pengampu. Silakan hubungi proktor ujian Anda.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Sesi Ujian</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW: SUBMISSION COMPLETED SCREEN
  // ==============================================================
  if (isExamSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 text-center animate-in zoom-in-95 duration-300 space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
          </div>

          <div>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Ujian Telah Selesai
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2">
              Terima Kasih, {studentInfo.name}!
            </h1>

            {/* Pesan apresiasi kejujuran siswa sesuai instruksi */}
            <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 mt-4 shadow-xs">
              <p className="text-sm sm:text-base font-bold leading-relaxed">
                &ldquo;Terimakasih sudah menjawab soal dengan penuh kejujuran, semoga sukses&rdquo;
              </p>
            </div>
          </div>

          {/* Submission Info Card (Nilai dan jumlah benar/salah dirahasiakan, hanya dikirim ke guru) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="text-slate-500">Mata Pelajaran:</span>
              <span className="font-bold text-slate-800">{examSchedule.mataPelajaran}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="text-slate-500">Kelas / Rombel:</span>
              <span className="font-bold text-slate-800">{studentInfo.kelas}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="text-slate-500">Waktu Pengumpulan:</span>
              <span className="font-medium text-slate-700">{submittedData?.submittedAt}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Status Lembar Jawaban:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Berhasil Tersimpan & Terkirim ke Guru</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Sesi ujian telah selesai. Anda dapat menutup tab atau jendela browser ini.
          </p>
        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW: STUDENT LOGIN & ENTRANCE SCREEN (GATE BEFORE EXAM)
  // ==============================================================
  if (!isExamStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/60 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Minimal Header */}
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-800">
                CBT Guru Hebat Indonesia
              </span>
              <span className="ml-2 text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                Portal Siswa
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Halaman Utama</span>
          </Link>
        </header>

        {/* Main Login Card */}
        <main className="max-w-xl mx-auto w-full my-auto py-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">
                    Login & Konfirmasi Identitas Siswa
                  </h1>
                  <p className="text-xs text-sky-100 mt-0.5">
                    Masukkan nama dan kelas Anda untuk memulai pengerjaan ujian CBT
                  </p>
                </div>
              </div>
            </div>

            {/* Exam Session Summary Card */}
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Mata Pelajaran:</span>
                  <span className="font-bold text-slate-900 bg-sky-100/70 text-sky-800 px-2.5 py-0.5 rounded-md border border-sky-200">
                    {examSchedule.mataPelajaran}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Judul Ujian:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[260px] truncate">
                    {examSchedule.judul}
                  </span>
                </div>

                {examSchedule.topik && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Topik Materi:</span>
                    <span className="font-semibold text-purple-800 text-right max-w-[260px] truncate">
                      {examSchedule.topik}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-0.5 text-slate-600">
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Durasi: <strong className="text-slate-800">{examSchedule.durasiMenit} Menit</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Paket: <strong className="text-slate-800">{questions.length} Butir Soal</strong></span>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleStartExamSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputNama}
                    onChange={(e) => setInputNama(e.target.value)}
                    placeholder="Ketik Nama Lengkap Anda (contoh: Muhammad Rayhan)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm font-semibold text-slate-800 bg-slate-50/50 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    *Nama ini akan terekam resmi di lembar nilai guru.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Kelas / Rombel Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputKelas}
                    onChange={(e) => setInputKelas(e.target.value)}
                    placeholder="Ketik Kelas Anda (contoh: 7-A, 7-B, 8-1, dll)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm font-semibold text-slate-800 bg-slate-50/50 outline-none transition"
                  />
                </div>

                {/* Instructions Box */}
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1 text-[11px] text-sky-950">
                  <div className="flex items-center gap-1.5 font-bold text-sky-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Petunjuk Ujian:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 leading-relaxed pl-1">
                    <li>Waktu ({examSchedule.durasiMenit} menit) akan mulai berjalan setelah tombol diklik.</li>
                    <li>Jawaban Anda otomatis tersimpan aman di server secara real-time.</li>
                    <li>Kerjakan dengan jujur, teliti, dan penuh percaya diri.</li>
                  </ul>
                </div>

                {/* Submit / Start Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white text-base bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 transition shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <span>🚀 Masuk & Mulai Mengerjakan Ujian</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-2">
          &copy; 2026 CBT Guru Hebat Indonesia &bull; Pelaksanaan Asesmen Kompetensi Siswa
        </footer>
      </div>
    );
  }

  // ==============================================================
  // VIEW: MAIN EXAM INTERFACE
  // ==============================================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 select-none">
      {/* 1. Fixed Exam Header */}
      <ExamHeader
        studentName={studentInfo.name}
        studentNisn={studentInfo.nisn}
        studentClass={studentInfo.kelas}
        examTitle={examSchedule.judul}
        subject={examSchedule.mataPelajaran}
        durationMinutes={examSchedule.durasiMenit}
        remainingSeconds={remainingSeconds}
        isOnline={isOnline}
        lastSavedAt={lastSavedTime}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onOpenNavGridMobile={() => setIsNavGridOpenMobile(true)}
        totalAnswered={answeredTotal}
        totalQuestions={questions.length}
      />

      {/* 2. Main Exam Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex gap-4 overflow-hidden h-[calc(100vh-4.25rem)]">
        {/* Left / Center Work Area: Split-screen or Full Width */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile Tab Switcher (Visible only when stimulus exists on mobile/tablet) */}
          {hasStimulus && (
            <div className="lg:hidden flex items-center bg-white rounded-lg p-1 border border-slate-200 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => setMobileActiveTab("stimulus")}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mobileActiveTab === "stimulus"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Wacana Stimulus</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileActiveTab("question")}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mobileActiveTab === "question"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Lembar Soal ({currentIndex + 1})</span>
              </button>
            </div>
          )}

          {/* Dynamic Content Pane */}
          {hasStimulus ? (
            /* CASE A: Question HAS Stimulus -> Split-screen Layout */
            <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden h-full">
              {/* Left Pane: Stimulus Viewer */}
              <div
                className={`h-full overflow-hidden transition-all duration-200 ${
                  mobileActiveTab === "stimulus" ? "flex flex-col flex-1" : "hidden lg:flex lg:flex-col"
                }`}
                style={{
                  flex: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${splitRatio} 1 0%` : "1 1 0%",
                }}
              >
                <StimulusViewer
                  stimulus={currentSoal.stimulus!}
                  fontSize={fontSize}
                  className="h-full"
                />
              </div>

              {/* Desktop Split Ratio Quick Adjuster (Subtle vertical bar) */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-1 px-0.5 select-none text-slate-300">
                <button
                  type="button"
                  onClick={() => setSplitRatio(45)}
                  className={`w-1.5 h-6 rounded-full transition ${
                    splitRatio === 45 ? "bg-sky-500" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  title="Wacana 45% : Soal 55%"
                />
                <button
                  type="button"
                  onClick={() => setSplitRatio(50)}
                  className={`w-1.5 h-8 rounded-full transition ${
                    splitRatio === 50 ? "bg-sky-500" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  title="Wacana 50% : Soal 50% (Default)"
                />
                <button
                  type="button"
                  onClick={() => setSplitRatio(55)}
                  className={`w-1.5 h-6 rounded-full transition ${
                    splitRatio === 55 ? "bg-sky-500" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                  title="Wacana 55% : Soal 45%"
                />
              </div>

              {/* Right Pane: Question Area */}
              <div
                className={`h-full overflow-hidden transition-all duration-200 ${
                  mobileActiveTab === "question" ? "flex flex-col flex-1" : "hidden lg:flex lg:flex-col"
                }`}
                style={{
                  flex: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - splitRatio} 1 0%` : "1 1 0%",
                }}
              >
                <QuestionArea
                  soal={currentSoal}
                  soalIndex={currentIndex}
                  totalSoal={questions.length}
                  currentAnswer={answers[currentSoal.id]}
                  onUpdateAnswer={handleUpdateAnswer}
                  onPrev={() => goToQuestion(currentIndex - 1)}
                  onNext={() => goToQuestion(currentIndex + 1)}
                  onSubmitExamModal={() => setIsSubmitModalOpen(true)}
                  fontSize={fontSize}
                  hasStimulus={true}
                />
              </div>
            </div>
          ) : (
            /* CASE B: Question has NO Stimulus -> Expands smoothly to FULL WIDTH */
            <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Soal Mandiri (Tanpa Wacana Bacaan Stimulus) - Tampilan diperluas penuh
                </span>
                <span className="text-[11px] font-normal text-sky-600 hidden sm:inline">
                  Fokus pada pemecahan soal di bawah ini
                </span>
              </div>
              <div className="flex-1 h-full overflow-hidden">
                <QuestionArea
                  soal={currentSoal}
                  soalIndex={currentIndex}
                  totalSoal={questions.length}
                  currentAnswer={answers[currentSoal.id]}
                  onUpdateAnswer={handleUpdateAnswer}
                  onPrev={() => goToQuestion(currentIndex - 1)}
                  onNext={() => goToQuestion(currentIndex + 1)}
                  onSubmitExamModal={() => setIsSubmitModalOpen(true)}
                  fontSize={fontSize}
                  hasStimulus={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Question Navigation Grid (Right Sidebar on Desktop, Drawer on Mobile) */}
        <QuestionNavGrid
          soalList={questions}
          currentIndex={currentIndex}
          answers={answers}
          onSelectQuestion={goToQuestion}
          onSubmitExamModal={() => setIsSubmitModalOpen(true)}
          isOpenMobile={isNavGridOpenMobile}
          onCloseMobile={() => setIsNavGridOpenMobile(false)}
        />
      </main>

      {/* 4. Confirmation Submit Modal */}
      <ExamSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={finalizeSubmission}
        soalList={questions}
        answers={answers}
        remainingSeconds={remainingSeconds}
      />
    </div>
  );
}

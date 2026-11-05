import { supabase, isSupabaseConfigured } from './supabase/client';
import {
  Stimulus,
  Soal,
  JadwalUjian,
  Siswa,
  HasilUjian,
  ExamWithDetails,
  ScoreResult,
} from './supabase/types';
import {
  MOCK_STIMULI,
  MOCK_QUESTIONS,
  MOCK_SCHEDULES,
  MOCK_STUDENTS,
  MOCK_RESULTS,
  getMockExamWithDetails,
} from './mock-data';
import { calculateAKMScore } from './scoring-engine';

// ==========================================
// IN-MEMORY CACHE & STORAGE (FOR OFFLINE / MOCK DEV)
// ==========================================

let inMemoryStimuli: Stimulus[] = [...MOCK_STIMULI];
let inMemoryQuestions: Soal[] = [...MOCK_QUESTIONS];
let inMemorySchedules: JadwalUjian[] = [...MOCK_SCHEDULES];
let inMemoryResults: HasilUjian[] = [...MOCK_RESULTS];
let inMemoryStudents: Siswa[] = [...MOCK_STUDENTS];

// Debounce timer map for background sync
const debounceTimers: Record<string, NodeJS.Timeout> = {};

// Local storage helpers with SSR safety
const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    console.warn('[CBT Storage] Failed to read from localStorage:', err);
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    console.warn('[CBT Storage] Failed to write to localStorage:', err);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn('[CBT Storage] Failed to remove from localStorage:', err);
  }
};

export interface LocalSessionState {
  scheduleId: string;
  studentId: string;
  status: 'belum_mulai' | 'sedang_mengerjakan' | 'selesai';
  waktuMulai: string;
  sisaWaktuDetik: number;
  jawaban: Record<string, any>;
  ragu: Record<string, boolean>;
  lastSavedAt: string;
}

const getSessionKey = (scheduleId: string, studentId: string) =>
  `cbt_session_${scheduleId}_${studentId}`;

// ==========================================
// 1. EXAM SCHEDULE & QUESTION FETCHING
// ==========================================

/**
 * Retrieves an exam schedule with all linked questions and stimuli.
 * Seamlessly uses Supabase if online & configured, otherwise serves realistic mock data.
 */
export const getExamSchedule = async (scheduleId: string): Promise<ExamWithDetails | null> => {
  if (!isSupabaseConfigured()) {
    return getMockExamWithDetails(scheduleId);
  }

  try {
    // 1. Fetch Schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('jadwal_ujian')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !scheduleData) {
      console.warn('[CBT Service] Exam schedule not found in Supabase, using mock fallback.', scheduleError);
      return getMockExamWithDetails(scheduleId);
    }

    const schedule = scheduleData as unknown as JadwalUjian;
    const soalIds = schedule.soal_ids || [];

    if (soalIds.length === 0) {
      return {
        ...schedule,
        soal_list: [],
        stimuli_list: [],
      };
    }

    // 2. Fetch Questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('bank_soal')
      .select('*')
      .in('id', soalIds);

    if (questionsError || !questionsData) {
      console.warn('[CBT Service] Failed to load questions from Supabase, using mock fallback.');
      return getMockExamWithDetails(scheduleId);
    }

    const rawQuestions = questionsData as unknown as Soal[];

    // 3. Fetch Stimuli
    const stimulusIds = Array.from(
      new Set(rawQuestions.map((q) => q.stimulus_id).filter((id): id is string => Boolean(id)))
    );

    let stimuliList: Stimulus[] = [];
    if (stimulusIds.length > 0) {
      const { data: stimuliData } = await supabase
        .from('stimulus')
        .select('*')
        .in('id', stimulusIds);

      if (stimuliData) {
        stimuliList = stimuliData as unknown as Stimulus[];
      }
    }

    const stimulusMap = new Map<string, Stimulus>();
    stimuliList.forEach((s) => stimulusMap.set(s.id, s));

    // Order questions according to schedule.soal_ids
    const questionMap = new Map<string, Soal>();
    rawQuestions.forEach((q) => questionMap.set(q.id, q));

    const orderedQuestions = soalIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Soal => Boolean(q))
      .map((q, idx) => ({
        ...q,
        nomor_urut: idx + 1,
        stimulus: q.stimulus_id ? stimulusMap.get(q.stimulus_id) : undefined,
      }));

    return {
      ...schedule,
      soal_list: orderedQuestions,
      stimuli_list: stimuliList,
    };
  } catch (error) {
    console.error('[CBT Service] Error in getExamSchedule, fallback to mock data:', error);
    return getMockExamWithDetails(scheduleId);
  }
};

/**
 * Retrieves all available exam schedules
 */
export const getAllSchedules = async (): Promise<JadwalUjian[]> => {
  if (!isSupabaseConfigured()) {
    return inMemorySchedules;
  }

  try {
    const { data, error } = await supabase
      .from('jadwal_ujian')
      .select('*')
      .order('tanggal_mulai', { ascending: false });

    if (error || !data || data.length === 0) {
      return inMemorySchedules;
    }

    return data as unknown as JadwalUjian[];
  } catch (error) {
    console.error('[CBT Service] Error fetching all schedules:', error);
    return inMemorySchedules;
  }
};

/**
 * Verifies if the entered token matches the schedule's required access token.
 */
export const verifyExamToken = async (
  token: string,
  scheduleId?: string
): Promise<{ valid: boolean; schedule?: JadwalUjian; message: string }> => {
  const cleanToken = token.trim().toUpperCase();

  const schedules = await getAllSchedules();
  let targetSchedule: JadwalUjian | undefined;

  if (scheduleId) {
    targetSchedule = schedules.find((s) => s.id === scheduleId);
  } else {
    // Find active schedule matching this token
    targetSchedule = schedules.find(
      (s) => s.status === 'aktif' && s.token.toUpperCase() === cleanToken
    );
  }

  if (!targetSchedule) {
    return { valid: false, message: 'Jadwal ujian tidak ditemukan atau belum aktif.' };
  }

  if (targetSchedule.token.toUpperCase() !== cleanToken) {
    return { valid: false, message: 'Token ujian tidak valid. Silakan tanyakan kepada pengawas ujian.' };
  }

  return { valid: true, schedule: targetSchedule, message: 'Token valid. Selamat mengerjakan!' };
};

// ==========================================
// 2. REAL-TIME AUTOSAVE & PERSISTENCE ENGINE
// ==========================================

/**
 * Retrieves stored session from browser localStorage or initialized state.
 * Crucial for recovering student answers after internet loss, page reload, or device shutdown.
 */
export const getStoredSession = (
  scheduleId: string,
  studentId: string
): LocalSessionState | null => {
  const raw = getStorageItem(getSessionKey(scheduleId, studentId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalSessionState;
  } catch (err) {
    console.warn('[CBT Storage] Failed to parse session JSON:', err);
    return null;
  }
};

/**
 * Initializes or restores an exam session for a student.
 */
export const initOrRestoreSession = (
  scheduleId: string,
  studentId: string,
  durasiMenit: number
): LocalSessionState => {
  const existing = getStoredSession(scheduleId, studentId);
  if (existing) {
    return existing;
  }

  const newSession: LocalSessionState = {
    scheduleId,
    studentId,
    status: 'sedang_mengerjakan',
    waktuMulai: new Date().toISOString(),
    sisaWaktuDetik: durasiMenit * 60,
    jawaban: {},
    ragu: {},
    lastSavedAt: new Date().toISOString(),
  };

  setStorageItem(getSessionKey(scheduleId, studentId), JSON.stringify(newSession));
  return newSession;
};

/**
 * Synchronously backs up student answers to browser localStorage and debounces
 * asynchronous sync to Supabase database.
 *
 * @param scheduleId Unique ID of exam schedule
 * @param studentId Unique ID / NISN of student
 * @param soalId ID of the answered question
 * @param answer Answer data (string, array, or object)
 * @param isRagu Boolean flag indicating if student flagged question as doubtful
 * @param remainingSeconds Current countdown seconds left
 */
export const saveAnswerRealtime = (
  scheduleId: string,
  studentId: string,
  soalId: string,
  answer: any,
  isRagu: boolean,
  remainingSeconds?: number
): { success: boolean; timestamp: string } => {
  const timestamp = new Date().toISOString();
  const sessionKey = getSessionKey(scheduleId, studentId);

  // 1. Synchronous localStorage backup (instant, resilient against crash/offline)
  let currentSession = getStoredSession(scheduleId, studentId);
  if (!currentSession) {
    currentSession = {
      scheduleId,
      studentId,
      status: 'sedang_mengerjakan',
      waktuMulai: timestamp,
      sisaWaktuDetik: remainingSeconds ?? 3600,
      jawaban: {},
      ragu: {},
      lastSavedAt: timestamp,
    };
  }

  currentSession.jawaban[soalId] = answer;
  currentSession.ragu[soalId] = isRagu;
  currentSession.lastSavedAt = timestamp;
  if (remainingSeconds !== undefined) {
    currentSession.sisaWaktuDetik = remainingSeconds;
  }

  setStorageItem(sessionKey, JSON.stringify(currentSession));

  // 2. Debounced background sync to Supabase (800ms debounce)
  const timerKey = `${scheduleId}_${studentId}`;
  if (debounceTimers[timerKey]) {
    clearTimeout(debounceTimers[timerKey]);
  }

  debounceTimers[timerKey] = setTimeout(async () => {
    delete debounceTimers[timerKey];

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const payload = {
        jadwal_id: scheduleId,
        siswa_id: studentId,
        status: 'sedang_mengerjakan',
        sisa_waktu_detik: currentSession.sisaWaktuDetik,
        jawaban_siswa: currentSession.jawaban,
        ragu_ragu: currentSession.ragu,
        last_sync_at: timestamp,
      };

      await supabase
        .from('hasil_ujian')
        .upsert(payload as any, { onConflict: 'jadwal_id,siswa_id' });
    } catch (err) {
      console.warn('[CBT Autosave] Background Supabase sync failed, answer preserved locally:', err);
    }
  }, 800);

  return { success: true, timestamp };
};

/**
 * Flushes any pending debounced sync immediately (e.g. before page unload or submit).
 */
export const flushPendingSync = async (scheduleId: string, studentId: string): Promise<void> => {
  const timerKey = `${scheduleId}_${studentId}`;
  if (debounceTimers[timerKey]) {
    clearTimeout(debounceTimers[timerKey]);
    delete debounceTimers[timerKey];
  }

  const session = getStoredSession(scheduleId, studentId);
  if (!session || !isSupabaseConfigured()) return;

  try {
    const payload = {
      jadwal_id: scheduleId,
      siswa_id: studentId,
      status: session.status,
      sisa_waktu_detik: session.sisaWaktuDetik,
      jawaban_siswa: session.jawaban,
      ragu_ragu: session.ragu,
      last_sync_at: new Date().toISOString(),
    };

    await supabase
      .from('hasil_ujian')
      .upsert(payload as any, { onConflict: 'jadwal_id,siswa_id' });
  } catch (err) {
    console.warn('[CBT Flush] Flush error:', err);
  }
};

/**
 * Clears stored temporary working session for a student.
 */
export const clearStoredSession = (scheduleId: string, studentId: string): void => {
  removeStorageItem(getSessionKey(scheduleId, studentId));
};

// ==========================================
// 3. EXAM SUBMISSION & SCORING PIPELINE
// ==========================================

export interface SubmitExamResult {
  success: boolean;
  scoreResult: ScoreResult;
  hasilUjian: HasilUjian;
  message: string;
}

/**
 * Submits the student's test, calculates scores using the AKM scoring engine,
 * and saves the result to Supabase or the in-memory/localStorage store.
 */
export const submitExam = async (
  scheduleId: string,
  studentId: string,
  answers: Record<string, any>,
  raguMap: Record<string, boolean> = {},
  remainingSeconds: number = 0
): Promise<SubmitExamResult> => {
  // 1. Fetch exam details and questions
  const exam = await getExamSchedule(scheduleId);
  const questions = exam?.soal_list || MOCK_QUESTIONS;

  // 2. Score with AKM scoring engine
  const scoreResult = calculateAKMScore(questions, answers);

  // 3. Find or construct student info
  let student = inMemoryStudents.find((s) => s.id === studentId || s.nisn === studentId);
  if (!student) {
    student = {
      id: studentId,
      nama: `Siswa (${studentId})`,
      nisn: studentId,
      kelas: exam?.tingkat_kelas || 'Kelas VIII',
      sekolah: 'SMP Negeri 1 Nusantara',
      role: 'siswa',
    };
  }

  const session = getStoredSession(scheduleId, studentId);
  const waktuMulai = session?.waktuMulai || new Date(Date.now() - 3600000).toISOString();
  const waktuSelesai = new Date().toISOString();

  const hasilUjian: HasilUjian = {
    id: `hasil_${scheduleId}_${studentId}_${Date.now()}`,
    jadwal_id: scheduleId,
    siswa_id: studentId,
    siswa: student,
    status: 'selesai',
    waktu_mulai: waktuMulai,
    waktu_selesai: waktuSelesai,
    sisa_waktu_detik: remainingSeconds,
    jawaban_siswa: answers,
    ragu_ragu: raguMap,
    nilai_akhir: scoreResult.finalScore,
    detail_skor: scoreResult,
    last_sync_at: waktuSelesai,
    created_at: waktuSelesai,
  };

  // 4. Update in-memory results store
  const existingIdx = inMemoryResults.findIndex(
    (r) => r.jadwal_id === scheduleId && (r.siswa_id === studentId || r.siswa?.nisn === studentId)
  );
  if (existingIdx >= 0) {
    inMemoryResults[existingIdx] = hasilUjian;
  } else {
    inMemoryResults.unshift(hasilUjian);
  }

  // Backup to completed exam in localStorage for persistence across reloads
  setStorageItem(`cbt_completed_${scheduleId}_${studentId}`, JSON.stringify(hasilUjian));

  // Also update aggregated all results list in localStorage
  try {
    const rawAll = getStorageItem('cbt_all_submissions');
    const allList: HasilUjian[] = rawAll ? JSON.parse(rawAll) : [];
    const listIdx = allList.findIndex(
      (r) => r.jadwal_id === scheduleId && r.siswa_id === studentId
    );
    if (listIdx >= 0) {
      allList[listIdx] = hasilUjian;
    } else {
      allList.unshift(hasilUjian);
    }
    setStorageItem('cbt_all_submissions', JSON.stringify(allList));
  } catch (e) {
    console.warn('Failed to update cbt_all_submissions in storage', e);
  }

  // 5. Clean up temporary working session
  clearStoredSession(scheduleId, studentId);

  // 6. Supabase Persistence if configured
  if (isSupabaseConfigured()) {
    try {
      const dbPayload = {
        jadwal_id: scheduleId,
        siswa_id: studentId,
        status: 'selesai',
        waktu_selesai: waktuSelesai,
        sisa_waktu_detik: remainingSeconds,
        jawaban_siswa: answers,
        ragu_ragu: raguMap,
        nilai_akhir: scoreResult.finalScore,
        detail_skor: scoreResult as any,
        last_sync_at: waktuSelesai,
      };

      await supabase
        .from('hasil_ujian')
        .upsert(dbPayload as any, { onConflict: 'jadwal_id,siswa_id' });
    } catch (err) {
      console.error('[CBT Service] Supabase submission error:', err);
    }
  }

  return {
    success: true,
    scoreResult,
    hasilUjian,
    message: 'Ujian berhasil diselesaikan dan dikirim.',
  };
};

// ==========================================
// 4. TEACHER DASHBOARD & ANALYTICS
// ==========================================

/**
 * Retrieves all student results, optionally filtered by schedule ID.
 * Merges Supabase results, in-memory mock submissions, and localStorage completed tests.
 */
export const getStudentResults = async (scheduleId?: string): Promise<HasilUjian[]> => {
  let combinedResults: HasilUjian[] = [...inMemoryResults];

  // Merge any submissions saved in browser localStorage
  if (typeof window !== 'undefined') {
    try {
      const rawStored = getStorageItem('cbt_all_submissions');
      if (rawStored) {
        const localList: HasilUjian[] = JSON.parse(rawStored);
        localList.forEach((localItem) => {
          if (!combinedResults.some((r) => r.id === localItem.id)) {
            combinedResults.unshift(localItem);
          }
        });
      }
    } catch (e) {
      console.warn('Failed parsing local submissions', e);
    }
  }

  // If Supabase is connected, query database
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('hasil_ujian')
        .select('*, siswa(*)');

      if (scheduleId) {
        query = query.eq('jadwal_id', scheduleId);
      }

      const { data, error } = await query.order('waktu_selesai', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as unknown as HasilUjian[];
      }
    } catch (err) {
      console.warn('[CBT Service] Supabase error in getStudentResults:', err);
    }
  }

  if (scheduleId) {
    return combinedResults.filter((r) => r.jadwal_id === scheduleId);
  }

  return combinedResults;
};

/**
 * Allows a teacher to manually grade an essay (Uraian) question and re-calculate the final score.
 */
export const updateUraianManualGrade = async (
  resultId: string,
  soalId: string,
  manualScore: number
): Promise<{ success: boolean; updatedResult?: HasilUjian }> => {
  const result = inMemoryResults.find((r) => r.id === resultId);
  if (!result) {
    return { success: false };
  }

  const exam = await getExamSchedule(result.jadwal_id);
  const questions = exam?.soal_list || MOCK_QUESTIONS;

  const currentManualScores: Record<string, number> = {};
  result.detail_skor?.breakdown.forEach((b) => {
    if (b.jenisSoal === 'Uraian' && b.soalId === soalId) {
      currentManualScores[b.soalId] = manualScore;
    }
  });
  currentManualScores[soalId] = manualScore;

  const newScoreResult = calculateAKMScore(
    questions,
    result.jawaban_siswa,
    currentManualScores
  );

  result.nilai_akhir = newScoreResult.finalScore;
  result.detail_skor = newScoreResult;

  if (isSupabaseConfigured()) {
    try {
      await (supabase
        .from('hasil_ujian') as any)
        .update({
          nilai_akhir: newScoreResult.finalScore,
          detail_skor: newScoreResult as any,
        })
        .eq('id', resultId);
    } catch (e) {
      console.warn('Failed to update Supabase grade', e);
    }
  }

  return { success: true, updatedResult: result };
};

// ==========================================
// 5. QUESTION BANK & SCHEDULE MANAGEMENT
// ==========================================

export const getStimuli = async (): Promise<Stimulus[]> => {
  if (!isSupabaseConfigured()) {
    return inMemoryStimuli;
  }

  try {
    const { data, error } = await supabase.from('stimulus').select('*');
    if (error || !data || data.length === 0) {
      return inMemoryStimuli;
    }
    return data as unknown as Stimulus[];
  } catch (err) {
    return inMemoryStimuli;
  }
};

export const getQuestions = async (): Promise<Soal[]> => {
  if (!isSupabaseConfigured()) {
    return inMemoryQuestions;
  }

  try {
    const { data, error } = await supabase.from('bank_soal').select('*');
    if (error || !data || data.length === 0) {
      return inMemoryQuestions;
    }
    return data as unknown as Soal[];
  } catch (err) {
    return inMemoryQuestions;
  }
};

export const createQuestion = async (questionData: Partial<Soal>): Promise<Soal> => {
  const newId = questionData.id || `soal-bank-${Date.now()}`;
  const fullQuestion: Soal = {
    id: newId,
    stimulus_id: questionData.stimulus_id || null,
    nomor_urut: questionData.nomor_urut || inMemoryQuestions.length + 1,
    jenis_soal: questionData.jenis_soal || 'PG',
    tingkat_kognitif: questionData.tingkat_kognitif || 'C4',
    is_hots: questionData.is_hots ?? true,
    domain: questionData.domain || 'Literasi Membaca',
    konteks: questionData.konteks || 'Saintifik',
    fase: questionData.fase || 'Fase D',
    pertanyaan: questionData.pertanyaan || 'Pertanyaan baru',
    opsi_jawaban: questionData.opsi_jawaban,
    pasangan_menjodohkan: questionData.pasangan_menjodohkan,
    pernyataan_benar_salah: questionData.pernyataan_benar_salah,
    kunci_jawaban: questionData.kunci_jawaban,
    rubrik: questionData.rubrik,
    bobot_soal: questionData.bobot_soal || 15,
    pembahasan: questionData.pembahasan,
    created_at: new Date().toISOString(),
  };

  inMemoryQuestions.push(fullQuestion);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('bank_soal').insert(fullQuestion as any);
    } catch (e) {
      console.warn('Failed to insert question into Supabase:', e);
    }
  }

  return fullQuestion;
};

export const createSchedule = async (scheduleData: Partial<JadwalUjian>): Promise<JadwalUjian> => {
  const newId = scheduleData.id || `jadwal-${Date.now()}`;
  const fullSchedule: JadwalUjian = {
    id: newId,
    judul: scheduleData.judul || 'Ujian Baru',
    deskripsi: scheduleData.deskripsi || '',
    mata_pelajaran: scheduleData.mata_pelajaran || 'AKM',
    fase: scheduleData.fase || 'Fase D',
    tingkat_kelas: scheduleData.tingkat_kelas || 'Kelas VIII',
    tanggal_mulai: scheduleData.tanggal_mulai || new Date().toISOString(),
    tanggal_selesai: scheduleData.tanggal_selesai || new Date(Date.now() + 86400000 * 7).toISOString(),
    durasi_menit: scheduleData.durasi_menit || 60,
    token: scheduleData.token || 'AKM' + Math.floor(1000 + Math.random() * 9000),
    status: scheduleData.status || 'aktif',
    soal_ids: scheduleData.soal_ids || [],
    acak_soal: scheduleData.acak_soal ?? false,
    acak_opsi: scheduleData.acak_opsi ?? false,
    tampilkan_hasil_ke_siswa: scheduleData.tampilkan_hasil_ke_siswa ?? true,
    total_soal: scheduleData.soal_ids ? scheduleData.soal_ids.length : 0,
    created_at: new Date().toISOString(),
  };

  inMemorySchedules.push(fullSchedule);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('jadwal_ujian').insert(fullSchedule as any);
    } catch (e) {
      console.warn('Failed to insert schedule into Supabase:', e);
    }
  }

  return fullSchedule;
};

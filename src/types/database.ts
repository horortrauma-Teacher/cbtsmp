/**
 * Database Types for CBT AKM & HOTS Platform (SMP Fase D & SMA)
 * Auto-compatible with Supabase PostgreSQL Schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'guru' | 'siswa';

export type TipeStimulus = 'literasi' | 'numerasi' | 'saintifik';

export type TipeSoal = 'PG' | 'PGK' | 'Menjodohkan' | 'Uraian';

export type LevelKognitif =
  | 'C1_Mengingat'
  | 'C2_Memahami'
  | 'C3_Menerapkan'
  | 'C4_Menganalisis'
  | 'C5_Mengevaluasi'
  | 'C6_Mencipta';

export type JadwalStatus = 'draft' | 'aktif' | 'selesai';

export type HasilStatus = 'sedang_mengerjakan' | 'selesai' | 'dibatalkan';

// ============================================================================
// QUESTION & ANSWER JSON PAYLOADS
// ============================================================================

export interface PGOptionItem {
  id: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
  image?: string;
}

export type PGOption = PGOptionItem[];

export interface PGKOptionItem {
  id: string;
  text: string;
  image?: string;
}

export type PGKOption = PGKOptionItem[];

export interface MenjodohkanPremise {
  id: string;
  text: string;
  image?: string;
}

export interface MenjodohkanTarget {
  id: string;
  text: string;
  image?: string;
}

export interface MenjodohkanOption {
  premises: MenjodohkanPremise[];
  targets: MenjodohkanTarget[];
}

export interface RubrikUraianItem {
  aspek: string;
  skor_maks: number;
  kriteria: string;
}

export interface UraianOption {
  rubrik?: RubrikUraianItem[];
  petunjuk?: string;
  [key: string]: any;
}

export type OpsiJawabanData =
  | PGOption
  | PGKOption
  | MenjodohkanOption
  | UraianOption
  | null;

export interface MenjodohkanPair {
  premise_id: string;
  target_id: string;
}

export type PGAnswerKey = string; // e.g. "B"
export type PGKAnswerKey = string[]; // e.g. ["A", "C", "D"]
export type MenjodohkanAnswerKey = MenjodohkanPair[];
export type UraianAnswerKey = {
  rubrik_kunci?: string;
  [key: string]: Json | undefined;
} | string;

export type KunciJawabanData =
  | PGAnswerKey
  | PGKAnswerKey
  | MenjodohkanAnswerKey
  | UraianAnswerKey;

// ============================================================================
// STUDENT EXAM ANSWER & SCORE PAYLOADS
// ============================================================================

export type StudentAnswerValue =
  | string // for PG or Uraian
  | string[] // for PGK
  | MenjodohkanPair[] // for Menjodohkan
  | null;

export interface StudentAnswerItem {
  answer: StudentAnswerValue;
  is_ragu: boolean;
  answered_at: string;
}

export type StudentAnswersMap = Record<string, StudentAnswerItem>; // key is bank_soal_id

export interface DetailSkor {
  score_pg: number;
  score_pgk: number;
  score_menjodohkan: number;
  score_uraian: number;
  total_hots_score: number;
  total_soal: number;
  total_terjawab: number;
  total_benar: number;
  total_bobot_maksimal?: number;
  total_perolehan_bobot?: number;
}

// ============================================================================
// TABLE ROW DEFINITIONS
// ============================================================================

export interface UserRow {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  nisn: string | null;
  nip: string | null;
  kelas: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StimulusSoalRow {
  id: string;
  guru_id: string | null;
  judul: string;
  konten_teks: string | null;
  media_url: string | null;
  tipe_stimulus: TipeStimulus;
  sumber: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankSoalRow {
  id: string;
  guru_id: string;
  stimulus_id: string | null;
  mata_pelajaran: string;
  fase: string;
  tingkat_kelas: number;
  pertanyaan: string;
  tipe_soal: TipeSoal;
  is_hots: boolean;
  level_kognitif: LevelKognitif;
  opsi_jawaban: OpsiJawabanData;
  kunci_jawaban: KunciJawabanData;
  pembahasan: string | null;
  bobot_soal: number;
  created_at: string;
  updated_at: string;
}

export interface JadwalUjianRow {
  id: string;
  guru_id: string;
  judul_ujian: string;
  mata_pelajaran: string;
  deskripsi: string | null;
  fase: string;
  target_kelas: string[];
  durasi_menit: number;
  token_ujian: string;
  waktu_mulai: string;
  waktu_selesai: string;
  acak_soal: boolean;
  acak_opsi: boolean;
  tampilkan_nilai: boolean;
  status: JadwalStatus;
  created_at: string;
  updated_at: string;
}

export interface JadwalSoalRow {
  id: string;
  jadwal_id: string;
  bank_soal_id: string;
  urutan: number;
  created_at: string;
}

export interface HasilUjianRow {
  id: string;
  jadwal_id: string;
  siswa_id: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  status: HasilStatus;
  jawaban_siswa: StudentAnswersMap;
  nilai_akhir: number;
  detail_skor: DetailSkor;
  catatan_guru: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DTOs & COMPOSITE TYPES FOR CLIENT APP
// ============================================================================

export interface BankSoalWithStimulus extends BankSoalRow {
  stimulus?: StimulusSoalRow | null;
}

export interface StudentSoalItem {
  urutan: number;
  bank_soal_id: string;
  pertanyaan: string;
  tipe_soal: TipeSoal;
  is_hots: boolean;
  level_kognitif: LevelKognitif;
  bobot_soal: number;
  opsi_jawaban: OpsiJawabanData;
  stimulus: {
    id: string;
    judul: string;
    konten_teks: string | null;
    media_url: string | null;
    tipe_stimulus: TipeStimulus;
    sumber: string | null;
  } | null;
  jawaban_tersimpan?: StudentAnswerItem | null;
}

export interface StudentExamSessionResponse {
  status: 'success' | 'completed' | 'error';
  message?: string;
  hasil_id?: string;
  nilai_akhir?: number;
  detail_skor?: DetailSkor;
  ujian?: {
    id: string;
    judul_ujian: string;
    mata_pelajaran: string;
    deskripsi: string | null;
    durasi_menit: number;
    waktu_mulai_pengerjaan: string;
    waktu_selesai_jadwal: string;
    acak_soal: boolean;
    acak_opsi: boolean;
  };
  total_soal?: number;
  soal?: StudentSoalItem[];
}

export interface JadwalUjianWithDetails extends JadwalUjianRow {
  guru?: Pick<UserRow, 'id' | 'nama' | 'nip'>;
  total_soal?: number;
  peserta_count?: number;
}

export interface HasilUjianWithDetails extends HasilUjianRow {
  siswa?: Pick<UserRow, 'id' | 'nama' | 'nisn' | 'kelas'>;
  jadwal?: Pick<JadwalUjianRow, 'id' | 'judul_ujian' | 'mata_pelajaran' | 'durasi_menit'>;
}

// ============================================================================
// SUPABASE CLIENT DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & Pick<UserRow, 'nama' | 'email' | 'role'>;
        Update: Partial<UserRow>;
      };
      stimulus_soal: {
        Row: StimulusSoalRow;
        Insert: Partial<StimulusSoalRow> & Pick<StimulusSoalRow, 'judul' | 'tipe_stimulus'>;
        Update: Partial<StimulusSoalRow>;
      };
      bank_soal: {
        Row: BankSoalRow;
        Insert: Partial<BankSoalRow> &
          Pick<
            BankSoalRow,
            | 'guru_id'
            | 'mata_pelajaran'
            | 'tingkat_kelas'
            | 'pertanyaan'
            | 'tipe_soal'
            | 'level_kognitif'
            | 'kunci_jawaban'
          >;
        Update: Partial<BankSoalRow>;
      };
      jadwal_ujian: {
        Row: JadwalUjianRow;
        Insert: Partial<JadwalUjianRow> &
          Pick<
            JadwalUjianRow,
            | 'guru_id'
            | 'judul_ujian'
            | 'mata_pelajaran'
            | 'durasi_menit'
            | 'token_ujian'
            | 'waktu_mulai'
            | 'waktu_selesai'
          >;
        Update: Partial<JadwalUjianRow>;
      };
      jadwal_soal: {
        Row: JadwalSoalRow;
        Insert: Partial<JadwalSoalRow> &
          Pick<JadwalSoalRow, 'jadwal_id' | 'bank_soal_id'>;
        Update: Partial<JadwalSoalRow>;
      };
      hasil_ujian: {
        Row: HasilUjianRow;
        Insert: Partial<HasilUjianRow> &
          Pick<HasilUjianRow, 'jadwal_id' | 'siswa_id'>;
        Update: Partial<HasilUjianRow>;
      };
    };
    Views: {
      v_soal_siswa: {
        Row: {
          jadwal_id: string;
          urutan: number;
          bank_soal_id: string;
          mata_pelajaran: string;
          fase: string;
          tingkat_kelas: number;
          pertanyaan: string;
          tipe_soal: TipeSoal;
          is_hots: boolean;
          level_kognitif: LevelKognitif;
          bobot_soal: number;
          opsi_jawaban: OpsiJawabanData;
          stimulus_id: string | null;
          stimulus_judul: string | null;
          stimulus_konten: string | null;
          stimulus_media_url: string | null;
          stimulus_tipe: TipeStimulus | null;
          stimulus_sumber: string | null;
        };
      };
    };
    Functions: {
      current_app_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      current_app_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole | null;
      };
      is_guru: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_siswa: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      calculate_exam_score: {
        Args: { p_hasil_id: string };
        Returns: number;
      };
      rpc_get_student_exam_session: {
        Args: { p_token: string; p_siswa_id: string };
        Returns: StudentExamSessionResponse;
      };
      rpc_submit_single_answer: {
        Args: {
          p_hasil_id: string;
          p_soal_id: string;
          p_answer: Json;
          p_is_ragu?: boolean;
        };
        Returns: { success: boolean; soal_id: string };
      };
      rpc_finish_exam_session: {
        Args: { p_hasil_id: string };
        Returns: {
          success: boolean;
          hasil_id: string;
          nilai_akhir: number;
          detail_skor: DetailSkor;
          waktu_selesai: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      tipe_stimulus: TipeStimulus;
      tipe_soal: TipeSoal;
      level_kognitif: LevelKognitif;
      jadwal_status: JadwalStatus;
      hasil_status: HasilStatus;
    };
  };
}

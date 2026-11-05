/**
 * Type definitions for CBT AKM (Asesmen Kompetensi Minimum) Fase D SMP
 * Matches the Supabase database schema and application state.
 */

export type TingkatKognitif = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type KategoriKognitif = 'LOTS' | 'MOTS' | 'HOTS';
export type JenisSoal = 'PG' | 'PGK' | 'Menjodohkan' | 'Uraian' | 'BenarSalah';
export type DomainAKM = 'Literasi Membaca' | 'Numerasi';
export type KonteksAKM = 'Personal' | 'Sosial Budaya' | 'Saintifik';
export type FaseAKM = 'Fase D' | 'Fase E' | 'Fase F';
export type StatusUjian = 'draft' | 'aktif' | 'selesai' | 'ditutup';
export type StatusSesi = 'belum_mulai' | 'sedang_mengerjakan' | 'selesai';

export interface OpsiPilihanGanda {
  id: string; // e.g., 'A', 'B', 'C', 'D'
  label: string; // e.g., 'A', 'B', 'C', 'D'
  text: string;
  media_url?: string;
}

export interface PasanganItem {
  id: string;
  text: string;
  media_url?: string;
}

export interface PasanganMenjodohkan {
  premis: PasanganItem[];
  respon: PasanganItem[];
}

export interface PernyataanItem {
  id: string;
  pernyataan: string;
  kunci: boolean;
}

export interface KriteriaRubrik {
  kriteria: string;
  skor_maksimal: number;
  panduan_penskoran?: string;
}

export interface RubrikPenilaian {
  total_skor: number;
  kriteria: KriteriaRubrik[];
}

export interface Stimulus {
  id: string;
  judul: string;
  teks_wacana: string;
  jenis_stimulus: KonteksAKM;
  sumber: string;
  media_url?: string;
  media_caption?: string;
  domain: DomainAKM;
  created_at?: string;
}

export interface Soal {
  id: string;
  stimulus_id?: string | null;
  nomor_urut?: number;
  jenis_soal: JenisSoal;
  tingkat_kognitif: TingkatKognitif;
  is_hots: boolean;
  domain: DomainAKM;
  konteks: KonteksAKM;
  fase: FaseAKM;
  pertanyaan: string;
  konten_media?: string;
  opsi_jawaban?: OpsiPilihanGanda[];
  pasangan_menjodohkan?: PasanganMenjodohkan;
  pernyataan_benar_salah?: PernyataanItem[];
  kunci_jawaban: any; // PG: string ('A'), PGK: string[] (['A','C']), Menjodohkan: Record<string, string>, BenarSalah: Record<string, boolean>, Uraian: string
  rubrik?: RubrikPenilaian;
  bobot_soal: number;
  pembahasan?: string;
  created_at?: string;
}

export interface JadwalUjian {
  id: string;
  judul: string;
  deskripsi: string;
  mata_pelajaran: string;
  fase: FaseAKM;
  tingkat_kelas: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  durasi_menit: number;
  token: string;
  status: StatusUjian;
  soal_ids: string[];
  acak_soal: boolean;
  acak_opsi: boolean;
  tampilkan_hasil_ke_siswa: boolean;
  total_soal?: number;
  created_at?: string;
}

export interface Siswa {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  sekolah: string;
  foto?: string;
  email?: string;
  role?: 'siswa' | 'guru' | 'admin';
}

export interface QuestionBreakdown {
  soalId: string;
  nomorUrut: number;
  jenisSoal: JenisSoal;
  tingkatKognitif: TingkatKognitif;
  isHots: boolean;
  domain: DomainAKM;
  bobot: number;
  pointsEarned: number;
  maxPoints: number;
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  studentAnswer: any;
  correctAnswer: any;
  rubrikEvaluation?: string;
  feedback?: string;
}

export interface ScoreCategoryBreakdown {
  pgScore: { earned: number; max: number; count: number };
  pgkScore: { earned: number; max: number; count: number };
  menjodohkanScore: { earned: number; max: number; count: number };
  uraianScore: { earned: number; max: number; count: number };
  benarSalahScore: { earned: number; max: number; count: number };
}

export interface ScoreDomainBreakdown {
  literasi: { earned: number; max: number; percentage: number };
  numerasi: { earned: number; max: number; percentage: number };
}

export interface ScoreResult {
  finalScore: number; // 0 - 100 normalized
  rawScore: number;
  maxScore: number;
  breakdown: QuestionBreakdown[];
  categoryBreakdown: ScoreCategoryBreakdown;
  domainBreakdown: ScoreDomainBreakdown;
  hotsMasteryRate: number; // percentage 0 - 100
  hotsEarned: number;
  hotsTotal: number;
  needsTeacherGrading: boolean;
  completedAt: string;
}

export interface HasilUjian {
  id: string;
  jadwal_id: string;
  siswa_id: string;
  siswa?: Siswa;
  status: StatusSesi;
  waktu_mulai: string;
  waktu_selesai?: string | null;
  sisa_waktu_detik: number;
  jawaban_siswa: Record<string, any>;
  ragu_ragu: Record<string, boolean>;
  nilai_akhir?: number | null;
  detail_skor?: ScoreResult | null;
  last_sync_at?: string;
  created_at?: string;
}

export interface ExamWithDetails extends JadwalUjian {
  soal_list: (Soal & { stimulus?: Stimulus })[];
  stimuli_list: Stimulus[];
}

/**
 * Database Schema mapping for Supabase Client
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      stimulus: {
        Row: Stimulus;
        Insert: Omit<Stimulus, 'created_at'> & { created_at?: string };
        Update: Partial<Stimulus>;
      };
      bank_soal: {
        Row: Soal;
        Insert: Omit<Soal, 'created_at'> & { created_at?: string };
        Update: Partial<Soal>;
      };
      jadwal_ujian: {
        Row: JadwalUjian;
        Insert: Omit<JadwalUjian, 'created_at'> & { created_at?: string };
        Update: Partial<JadwalUjian>;
      };
      siswa: {
        Row: Siswa;
        Insert: Siswa;
        Update: Partial<Siswa>;
      };
      hasil_ujian: {
        Row: HasilUjian;
        Insert: Omit<HasilUjian, 'created_at'> & { created_at?: string };
        Update: Partial<HasilUjian>;
      };
    };
  };
}

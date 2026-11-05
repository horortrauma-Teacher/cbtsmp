export type TipeSoal = 'PG' | 'PGK' | 'MENJODOHKAN' | 'URAIAN';
export type LevelKognitif = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type TipeStimulus = 'Literasi' | 'Numerasi' | 'Sains' | 'Sosial Budaya';
export type Fase = 'Fase D (SMP)' | 'Fase E (SMA 10)' | 'Fase F (SMA 11-12)';

export interface Stimulus {
  id: string;
  judul: string;
  kontenTeks: string;
  tipe: TipeStimulus;
  gambarUrl?: string;
  sumber?: string;
  pembuat?: string;
  guruUsername?: string;
}

export interface OpsiPG {
  id: string;
  label: string; // 'A', 'B', 'C', 'D', 'E'
  teks: string;
}

export interface PasanganMenjodohkan {
  id: string;
  premis: string; // Kiri
  target: string; // Kanan
}

export interface Soal {
  id: string;
  stimulusId?: string;
  stimulus?: Stimulus;
  jenjang?: 'SMP' | 'SMA';
  mataPelajaran: string;
  topik?: string;
  fase: Fase;
  kelas: string[];
  tipeSoal: TipeSoal;
  isHots: boolean;
  levelKognitif: LevelKognitif;
  pertanyaan: string;
  gambarUrl?: string;
  bobot: number;
  // Opsi & Kunci Jawaban
  opsiPG?: OpsiPG[];
  kunciPG?: string; // id opsi
  opsiPGK?: { id: string; teks: string; isKunci: boolean }[];
  pasanganMenjodohkan?: PasanganMenjodohkan[];
  rubrikUraian?: string;
  kunciUraian?: string;
  pembahasan?: string;
  createdAt: string;
  pembuat?: string;
  guruUsername?: string;
}

export interface JadwalUjian {
  id: string;
  judul: string;
  jenjang?: 'SMP' | 'SMA';
  mataPelajaran: string;
  topik?: string;
  fase: Fase;
  targetKelas: string[];
  durasiMenit: number;
  token: string;
  tanpaToken?: boolean;
  waktuMulai: string;
  waktuSelesai: string;
  acakSoal: boolean;
  acakOpsi: boolean;
  status: 'DIJADWALKAN' | 'SEDANG_BERLANGSUNG' | 'SELESAI';
  soalIds: string[];
  totalSoal: number;
  totalBobot: number;
  kkm: number;
  pembuat?: string;
  guruUsername?: string;
}

export interface JawabanDetailSiswa {
  soalId: string;
  tipeSoal: TipeSoal;
  pertanyaan: string;
  isHots: boolean;
  bobot: number;
  kunciJawaban: string;
  jawabanSiswa: string;
  isBenar: boolean;
  nilaiDiperoleh: number;
}

export interface HasilUjianSiswa {
  id: string;
  jadwalId: string;
  namaSiswa: string;
  nisn: string;
  kelas: string;
  waktuMulai: string;
  waktuSubmit: string;
  durasiPengerjaan: string;
  nilaiAkhir: number;
  statusKelulusan: 'TUNTAS' | 'BELUM_TUNTAS';
  breakdown: {
    pg: number;
    pgk: number;
    menjodohkan: number;
    uraian: number;
    hotsMasteryRate: number; // in percentage
  };
  jawabanDetail: JawabanDetailSiswa[];
  guruUsername?: string;
}

export interface GuruAccount {
  id: string;
  username: string;
  password?: string;
  namaLengkap: string;
  nip?: string;
  sekolah: string;
  mataPelajaran?: string;
  jenjang?: 'SMP' | 'SMA' | 'SMP/SMA';
  role: 'guru' | 'admin' | 'proktor';
  storageDir: string;
  status?: 'aktif' | 'nonaktif';
  createdAt: string;
  updatedAt?: string;
}

export interface SiswaAccount {
  id: string;
  namaLengkap: string;
  nisn: string;
  kelas: string;
  jenjang: 'SMP' | 'SMA';
  sekolah?: string;
  jadwalId?: string;
  lastActive: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
}

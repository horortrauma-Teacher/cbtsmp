-- ==============================================================================
-- SETUP TABEL CBT GURU HEBAT INDONESIA (SUPABASE POSTGRESQL)
-- Dikelola oleh: El Fath (Database Architect)
-- Cara Pakai: Copy-paste seluruh skrip ini ke SQL Editor di Dashboard Supabase lalu klik "Run".
-- ==============================================================================

-- 1. Tabel Stimulus Soal (Wacana / Literasi / Numerasi)
CREATE TABLE IF NOT EXISTS public.stimulus (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    konten_teks TEXT NOT NULL,
    tipe TEXT DEFAULT 'Literasi',
    gambar_url TEXT,
    sumber TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Bank Soal (AKM HOTS: PG, PGK, Menjodohkan, Uraian)
CREATE TABLE IF NOT EXISTS public.soal (
    id TEXT PRIMARY KEY,
    stimulus_id TEXT REFERENCES public.stimulus(id) ON DELETE SET NULL,
    jenjang TEXT DEFAULT 'SMP',
    mata_pelajaran TEXT NOT NULL,
    topik TEXT NOT NULL,
    fase TEXT DEFAULT 'Fase D (SMP)',
    kelas TEXT[] DEFAULT '{"Kelas 8"}',
    tipe_soal TEXT NOT NULL,
    is_hots BOOLEAN DEFAULT true,
    level_kognitif TEXT DEFAULT 'C4',
    pertanyaan TEXT NOT NULL,
    bobot NUMERIC DEFAULT 10,
    opsi_pg JSONB,
    kunci_pg TEXT,
    opsi_pgk JSONB,
    pasangan_menjodohkan JSONB,
    rubrik_uraian TEXT,
    kunci_uraian TEXT,
    pembahasan TEXT,
    pembuat TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Jadwal Ujian CBT (Bebas Token Masuk)
CREATE TABLE IF NOT EXISTS public.jadwal_ujian (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    fase TEXT DEFAULT 'Fase D (SMP)',
    target_kelas TEXT[] DEFAULT '{"Kelas 8"}',
    durasi_menit INTEGER DEFAULT 60,
    token TEXT DEFAULT 'BEBAS',
    tanpa_token BOOLEAN DEFAULT true,
    waktu_mulai TIMESTAMPTZ DEFAULT now(),
    waktu_selesai TIMESTAMPTZ DEFAULT now() + interval '7 days',
    acak_soal BOOLEAN DEFAULT false,
    acak_opsi BOOLEAN DEFAULT false,
    kkm NUMERIC DEFAULT 75,
    status TEXT DEFAULT 'SEDANG_BERLANGSUNG',
    soal_ids TEXT[] DEFAULT '{}',
    total_soal INTEGER DEFAULT 0,
    total_bobot NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Hasil Ujian Siswa (Penilaian Real-time)
CREATE TABLE IF NOT EXISTS public.hasil_ujian (
    id TEXT PRIMARY KEY,
    jadwal_id TEXT REFERENCES public.jadwal_ujian(id) ON DELETE CASCADE,
    nama_siswa TEXT NOT NULL,
    nisn TEXT NOT NULL,
    kelas TEXT NOT NULL,
    waktu_mulai TEXT,
    waktu_submit TEXT,
    durasi_pengerjaan TEXT,
    nilai_akhir NUMERIC DEFAULT 0,
    status_kelulusan TEXT DEFAULT 'BELUM_TUNTAS',
    breakdown JSONB,
    jawaban_detail JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Arsip Login & Akun Guru (Help Desk & Multi-Tenant Management)
CREATE TABLE IF NOT EXISTS public.login_guru (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    nip TEXT DEFAULT '-',
    sekolah TEXT DEFAULT 'SMP/SMA Negeri',
    mata_pelajaran TEXT DEFAULT 'Umum',
    jenjang TEXT DEFAULT 'SMP',
    role TEXT DEFAULT 'guru',
    storage_dir TEXT,
    status TEXT DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Arsip Login & Data Siswa (Help Desk & Ujian Real-Time)
CREATE TABLE IF NOT EXISTS public.login_siswa (
    id TEXT PRIMARY KEY,
    nama_lengkap TEXT NOT NULL,
    nisn TEXT DEFAULT '-',
    kelas TEXT NOT NULL,
    jenjang TEXT DEFAULT 'SMP',
    sekolah TEXT DEFAULT 'SMP/SMA',
    jadwal_id TEXT,
    last_active TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Aktifkan Row Level Security (RLS) Permissive untuk Akses CBT & Help Desk
ALTER TABLE public.stimulus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_siswa ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read-write stimulus" ON public.stimulus;
    CREATE POLICY "Allow public read-write stimulus" ON public.stimulus FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read-write soal" ON public.soal;
    CREATE POLICY "Allow public read-write soal" ON public.soal FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read-write jadwal_ujian" ON public.jadwal_ujian;
    CREATE POLICY "Allow public read-write jadwal_ujian" ON public.jadwal_ujian FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read-write hasil_ujian" ON public.hasil_ujian;
    CREATE POLICY "Allow public read-write hasil_ujian" ON public.hasil_ujian FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read-write login_guru" ON public.login_guru;
    CREATE POLICY "Allow public read-write login_guru" ON public.login_guru FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow public read-write login_siswa" ON public.login_siswa;
    CREATE POLICY "Allow public read-write login_siswa" ON public.login_siswa FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- ==============================================================================
-- SISTEM CBT (COMPUTER-BASED TEST) AKM & HOTS SMP FASE D & SMA
-- PostgreSQL / Supabase Schema Definition
-- Version: 1.0.0
-- Target: Kurikulum Merdeka (Fase D: SMP Kelas 7-9 & Fase E/F: SMA)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUM TYPES
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guru', 'siswa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipe_stimulus AS ENUM ('literasi', 'numerasi', 'saintifik');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipe_soal AS ENUM ('PG', 'PGK', 'Menjodohkan', 'Uraian');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE level_kognitif AS ENUM (
        'C1_Mengingat',
        'C2_Memahami',
        'C3_Menerapkan',
        'C4_Menganalisis',
        'C5_Mengevaluasi',
        'C6_Mencipta'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE jadwal_status AS ENUM ('draft', 'aktif', 'selesai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hasil_status AS ENUM ('sedang_mengerjakan', 'selesai', 'dibatalkan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: users
-- Deskripsi: Menyimpan profil pengguna CBT (Guru dan Siswa)
-- Terintegrasi opsional dengan Supabase Auth (auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'siswa',
    nisn VARCHAR(20) UNIQUE,
    nip VARCHAR(30) UNIQUE,
    kelas VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_role_identity CHECK (
        (role = 'siswa' AND nisn IS NOT NULL) OR 
        (role = 'guru' AND nip IS NOT NULL) OR
        (role IN ('guru', 'siswa'))
    )
);

-- ------------------------------------------------------------------------------
-- Table: stimulus_soal
-- Deskripsi: Bahan bacaan, infografis, data tabel, atau konteks saintifik AKM
-- Dapat digunakan bersama oleh banyak butir soal (induk stimulus)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stimulus_soal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    judul VARCHAR(255) NOT NULL,
    konten_teks TEXT,
    media_url TEXT,
    tipe_stimulus tipe_stimulus NOT NULL DEFAULT 'literasi',
    sumber TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Table: bank_soal
-- Deskripsi: Butir pertanyaan AKM & HOTS Kurikulum Merdeka
-- Mendukung 4 model soal: PG, PGK, Menjodohkan, dan Uraian
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_soal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stimulus_id UUID REFERENCES public.stimulus_soal(id) ON DELETE SET NULL,
    mata_pelajaran VARCHAR(100) NOT NULL,
    fase VARCHAR(50) NOT NULL DEFAULT 'Fase D (SMP)',
    tingkat_kelas SMALLINT NOT NULL CHECK (tingkat_kelas BETWEEN 7 AND 12),
    pertanyaan TEXT NOT NULL,
    tipe_soal tipe_soal NOT NULL,
    is_hots BOOLEAN NOT NULL DEFAULT false,
    level_kognitif level_kognitif NOT NULL DEFAULT 'C3_Menerapkan',
    opsi_jawaban JSONB,
    kunci_jawaban JSONB NOT NULL,
    pembahasan TEXT,
    bobot_soal NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (bobot_soal > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Table: jadwal_ujian
-- Deskripsi: Sesi pelaksanaan ujian CBT dengan token dan jadwal aktif
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jadwal_ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    judul_ujian VARCHAR(255) NOT NULL,
    mata_pelajaran VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    fase VARCHAR(50) NOT NULL DEFAULT 'Fase D (SMP)',
    target_kelas TEXT[] NOT NULL DEFAULT '{}',
    durasi_menit INTEGER NOT NULL CHECK (durasi_menit > 0),
    token_ujian VARCHAR(10) NOT NULL UNIQUE,
    waktu_mulai TIMESTAMPTZ NOT NULL,
    waktu_selesai TIMESTAMPTZ NOT NULL,
    acak_soal BOOLEAN NOT NULL DEFAULT true,
    acak_opsi BOOLEAN NOT NULL DEFAULT true,
    tampilkan_nilai BOOLEAN NOT NULL DEFAULT false,
    status jadwal_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_waktu_ujian CHECK (waktu_selesai > waktu_mulai)
);

-- ------------------------------------------------------------------------------
-- Table: jadwal_soal
-- Deskripsi: Relasi many-to-many antara sesi ujian dan butir bank soal
-- Menentukan urutan baku sebelum diacak untuk siswa
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jadwal_soal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jadwal_id UUID NOT NULL REFERENCES public.jadwal_ujian(id) ON DELETE CASCADE,
    bank_soal_id UUID NOT NULL REFERENCES public.bank_soal(id) ON DELETE CASCADE,
    urutan INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_jadwal_soal UNIQUE (jadwal_id, bank_soal_id),
    CONSTRAINT uq_jadwal_urutan UNIQUE (jadwal_id, urutan)
);

-- ------------------------------------------------------------------------------
-- Table: hasil_ujian
-- Deskripsi: Lembar jawaban dan hasil pengerjaan siswa
-- Menyimpan state pengerjaan, jawaban per butir, nilai akhir & detail skor
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hasil_ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jadwal_id UUID NOT NULL REFERENCES public.jadwal_ujian(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    waktu_mulai TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    waktu_selesai TIMESTAMPTZ,
    status hasil_status NOT NULL DEFAULT 'sedang_mengerjakan',
    jawaban_siswa JSONB NOT NULL DEFAULT '{}'::jsonb,
    nilai_akhir NUMERIC(5,2) DEFAULT 0.00 CHECK (nilai_akhir >= 0 AND nilai_akhir <= 100),
    detail_skor JSONB NOT NULL DEFAULT '{
        "score_pg": 0,
        "score_pgk": 0,
        "score_menjodohkan": 0,
        "score_uraian": 0,
        "total_hots_score": 0,
        "total_soal": 0,
        "total_terjawab": 0,
        "total_benar": 0
    }'::jsonb,
    catatan_guru TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_siswa_jadwal UNIQUE (jadwal_id, siswa_id)
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================

-- Index on users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_kelas ON public.users(kelas);
CREATE INDEX IF NOT EXISTS idx_users_nisn ON public.users(nisn);

-- Index on stimulus
CREATE INDEX IF NOT EXISTS idx_stimulus_tipe ON public.stimulus_soal(tipe_stimulus);
CREATE INDEX IF NOT EXISTS idx_stimulus_guru ON public.stimulus_soal(guru_id);

-- Index on bank_soal
CREATE INDEX IF NOT EXISTS idx_bank_soal_guru ON public.bank_soal(guru_id);
CREATE INDEX IF NOT EXISTS idx_bank_soal_stimulus ON public.bank_soal(stimulus_id);
CREATE INDEX IF NOT EXISTS idx_bank_soal_tipe ON public.bank_soal(tipe_soal);
CREATE INDEX IF NOT EXISTS idx_bank_soal_hots ON public.bank_soal(is_hots);
CREATE INDEX IF NOT EXISTS idx_bank_soal_mapel_fase ON public.bank_soal(mata_pelajaran, fase, tingkat_kelas);
CREATE INDEX IF NOT EXISTS idx_bank_soal_level ON public.bank_soal(level_kognitif);

-- Index on jadwal_ujian
CREATE INDEX IF NOT EXISTS idx_jadwal_guru ON public.jadwal_ujian(guru_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_token ON public.jadwal_ujian(token_ujian);
CREATE INDEX IF NOT EXISTS idx_jadwal_status ON public.jadwal_ujian(status);
CREATE INDEX IF NOT EXISTS idx_jadwal_waktu ON public.jadwal_ujian(waktu_mulai, waktu_selesai);
CREATE INDEX IF NOT EXISTS idx_jadwal_target_kelas ON public.jadwal_ujian USING GIN (target_kelas);

-- Index on jadwal_soal
CREATE INDEX IF NOT EXISTS idx_jadwal_soal_jadwal ON public.jadwal_soal(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_soal_bank ON public.jadwal_soal(bank_soal_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_soal_urutan ON public.jadwal_soal(jadwal_id, urutan);

-- Index on hasil_ujian
CREATE INDEX IF NOT EXISTS idx_hasil_jadwal ON public.hasil_ujian(jadwal_id);
CREATE INDEX IF NOT EXISTS idx_hasil_siswa ON public.hasil_ujian(siswa_id);
CREATE INDEX IF NOT EXISTS idx_hasil_status ON public.hasil_ujian(status);
CREATE INDEX IF NOT EXISTS idx_hasil_jawaban_gin ON public.hasil_ujian USING GIN (jawaban_siswa);
CREATE INDEX IF NOT EXISTS idx_hasil_skor_gin ON public.hasil_ujian USING GIN (detail_skor);

-- ==============================================================================
-- 5. TRIGGER FUNCTIONS (AUTOMATION & AUDIT)
-- ==============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger across tables
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_stimulus_updated_at ON public.stimulus_soal;
CREATE TRIGGER trg_stimulus_updated_at
    BEFORE UPDATE ON public.stimulus_soal
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_bank_soal_updated_at ON public.bank_soal;
CREATE TRIGGER trg_bank_soal_updated_at
    BEFORE UPDATE ON public.bank_soal
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_jadwal_ujian_updated_at ON public.jadwal_ujian;
CREATE TRIGGER trg_jadwal_ujian_updated_at
    BEFORE UPDATE ON public.jadwal_ujian
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_hasil_ujian_updated_at ON public.hasil_ujian;
CREATE TRIGGER trg_hasil_ujian_updated_at
    BEFORE UPDATE ON public.hasil_ujian
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 6. SECURITY HELPER FUNCTIONS
-- ==============================================================================

-- Mendapatkan ID pengguna aktif (kompatibel Supabase auth.uid() atau app session)
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(
        COALESCE(
            current_setting('request.jwt.claims', true)::jsonb->>'sub',
            current_setting('app.current_user_id', true)
        ), 
        ''
    )::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Mendapatkan role pengguna aktif
CREATE OR REPLACE FUNCTION public.current_app_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
    v_uid UUID;
BEGIN
    v_uid := public.current_app_user_id();
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role INTO v_role FROM public.users WHERE id = v_uid;
    RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Cek apakah pengguna aktif adalah Guru
CREATE OR REPLACE FUNCTION public.is_guru()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_app_user_role() = 'guru';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Cek apakah pengguna aktif adalah Siswa
CREATE OR REPLACE FUNCTION public.is_siswa()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_app_user_role() = 'siswa';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 7. SECURE VIEWS & RPC FOR EXAM ENGINE
-- ==============================================================================

-- View soal aman untuk siswa (Menghilangkan kunci_jawaban & pembahasan)
CREATE OR REPLACE VIEW public.v_soal_siswa AS
SELECT 
    js.jadwal_id,
    js.urutan,
    bs.id AS bank_soal_id,
    bs.mata_pelajaran,
    bs.fase,
    bs.tingkat_kelas,
    bs.pertanyaan,
    bs.tipe_soal,
    bs.is_hots,
    bs.level_kognitif,
    bs.bobot_soal,
    bs.opsi_jawaban,
    st.id AS stimulus_id,
    st.judul AS stimulus_judul,
    st.konten_teks AS stimulus_konten,
    st.media_url AS stimulus_media_url,
    st.tipe_stimulus AS stimulus_tipe,
    st.sumber AS stimulus_sumber
FROM public.jadwal_soal js
JOIN public.bank_soal bs ON js.bank_soal_id = bs.id
LEFT JOIN public.stimulus_soal st ON bs.stimulus_id = st.id;

-- RPC: Mengambil lembar soal ujian yang aman untuk siswa berdasarkan token
CREATE OR REPLACE FUNCTION public.rpc_get_student_exam_session(
    p_token VARCHAR(10),
    p_siswa_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_jadwal public.jadwal_ujian%ROWTYPE;
    v_hasil public.hasil_ujian%ROWTYPE;
    v_soal_list JSONB;
BEGIN
    -- 1. Cari jadwal ujian aktif berdasarkan token
    SELECT * INTO v_jadwal 
    FROM public.jadwal_ujian 
    WHERE token_ujian = UPPER(TRIM(p_token))
      AND status = 'aktif'
      AND now() BETWEEN waktu_mulai AND waktu_selesai;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ujian tidak ditemukan, token tidak valid, atau jadwal belum dimulai / sudah berakhir.';
    END IF;

    -- 2. Periksa atau buat record hasil_ujian untuk siswa ini
    SELECT * INTO v_hasil 
    FROM public.hasil_ujian 
    WHERE jadwal_id = v_jadwal.id AND siswa_id = p_siswa_id;

    IF NOT FOUND THEN
        INSERT INTO public.hasil_ujian (jadwal_id, siswa_id, status, waktu_mulai)
        VALUES (v_jadwal.id, p_siswa_id, 'sedang_mengerjakan', timezone('utc'::text, now()))
        RETURNING * INTO v_hasil;
    END IF;

    IF v_hasil.status = 'selesai' THEN
        RETURN jsonb_build_object(
            'status', 'completed',
            'message', 'Anda sudah menyelesaikan ujian ini.',
            'hasil_id', v_hasil.id,
            'nilai_akhir', v_hasil.nilai_akhir,
            'detail_skor', v_hasil.detail_skor
        );
    END IF;

    -- 3. Ambil daftar butir soal (tanpa kunci_jawaban)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'urutan', s.urutan,
            'bank_soal_id', s.bank_soal_id,
            'pertanyaan', s.pertanyaan,
            'tipe_soal', s.tipe_soal,
            'is_hots', s.is_hots,
            'level_kognitif', s.level_kognitif,
            'bobot_soal', s.bobot_soal,
            'opsi_jawaban', s.opsi_jawaban,
            'stimulus', CASE 
                WHEN s.stimulus_id IS NOT NULL THEN jsonb_build_object(
                    'id', s.stimulus_id,
                    'judul', s.stimulus_judul,
                    'konten_teks', s.stimulus_konten,
                    'media_url', s.stimulus_media_url,
                    'tipe_stimulus', s.stimulus_tipe,
                    'sumber', s.stimulus_sumber
                )
                ELSE NULL 
            END,
            'jawaban_tersimpan', v_hasil.jawaban_siswa->(s.bank_soal_id::text)
        ) ORDER BY s.urutan
    ), '[]'::jsonb) INTO v_soal_list
    FROM public.v_soal_siswa s
    WHERE s.jadwal_id = v_jadwal.id;

    RETURN jsonb_build_object(
        'status', 'success',
        'hasil_id', v_hasil.id,
        'ujian', jsonb_build_object(
            'id', v_jadwal.id,
            'judul_ujian', v_jadwal.judul_ujian,
            'mata_pelajaran', v_jadwal.mata_pelajaran,
            'deskripsi', v_jadwal.deskripsi,
            'durasi_menit', v_jadwal.durasi_menit,
            'waktu_mulai_pengerjaan', v_hasil.waktu_mulai,
            'waktu_selesai_jadwal', v_jadwal.waktu_selesai,
            'acak_soal', v_jadwal.acak_soal,
            'acak_opsi', v_jadwal.acak_opsi
        ),
        'total_soal', jsonb_array_length(v_soal_list),
        'soal', v_soal_list
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Menyimpan / Update jawaban butir soal secara real-time
CREATE OR REPLACE FUNCTION public.rpc_submit_single_answer(
    p_hasil_id UUID,
    p_soal_id UUID,
    p_answer JSONB,
    p_is_ragu BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_hasil public.hasil_ujian%ROWTYPE;
    v_updated_jawaban JSONB;
BEGIN
    SELECT * INTO v_hasil FROM public.hasil_ujian WHERE id = p_hasil_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lembar hasil ujian tidak ditemukan.';
    END IF;

    IF v_hasil.status != 'sedang_mengerjakan' THEN
        RAISE EXCEPTION 'Ujian sudah diserahkan atau dibatalkan. Tidak dapat menyimpan jawaban.';
    END IF;

    v_updated_jawaban := jsonb_set(
        COALESCE(v_hasil.jawaban_siswa, '{}'::jsonb),
        ARRAY[p_soal_id::text],
        jsonb_build_object(
            'answer', p_answer,
            'is_ragu', p_is_ragu,
            'answered_at', timezone('utc'::text, now())
        )
    );

    UPDATE public.hasil_ujian
    SET jawaban_siswa = v_updated_jawaban,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_hasil_id;

    RETURN jsonb_build_object('success', true, 'soal_id', p_soal_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Otomatisasi Penilaian Koreksi Ujian (Auto-Grading PG, PGK, Menjodohkan)
CREATE OR REPLACE FUNCTION public.calculate_exam_score(p_hasil_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_hasil public.hasil_ujian%ROWTYPE;
    v_jadwal public.jadwal_ujian%ROWTYPE;
    r RECORD;
    v_student_ans JSONB;
    v_is_correct BOOLEAN;
    v_item_score NUMERIC(5,2);
    v_total_bobot NUMERIC(8,2) := 0;
    v_total_perolehan NUMERIC(8,2) := 0;
    
    v_score_pg NUMERIC(5,2) := 0;
    v_score_pgk NUMERIC(5,2) := 0;
    v_score_menjodohkan NUMERIC(5,2) := 0;
    v_score_uraian NUMERIC(5,2) := 0;
    v_total_hots_score NUMERIC(5,2) := 0;
    
    v_total_soal INTEGER := 0;
    v_total_terjawab INTEGER := 0;
    v_total_benar INTEGER := 0;
    v_final_grade NUMERIC(5,2) := 0;
BEGIN
    SELECT * INTO v_hasil FROM public.hasil_ujian WHERE id = p_hasil_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hasil ujian % tidak ditemukan.', p_hasil_id;
    END IF;

    SELECT * INTO v_jadwal FROM public.jadwal_ujian WHERE id = v_hasil.jadwal_id;

    FOR r IN (
        SELECT 
            bs.id,
            bs.tipe_soal,
            bs.is_hots,
            bs.bobot_soal,
            bs.kunci_jawaban
        FROM public.jadwal_soal js
        JOIN public.bank_soal bs ON js.bank_soal_id = bs.id
        WHERE js.jadwal_id = v_hasil.jadwal_id
    ) LOOP
        v_total_soal := v_total_soal + 1;
        v_total_bobot := v_total_bobot + r.bobot_soal;
        v_item_score := 0;
        v_is_correct := false;

        v_student_ans := v_hasil.jawaban_siswa->(r.id::text)->'answer';

        IF v_student_ans IS NOT NULL AND v_student_ans != 'null'::jsonb THEN
            v_total_terjawab := v_total_terjawab + 1;

            -- Evaluasi Berdasarkan Tipe Soal
            IF r.tipe_soal = 'PG' THEN
                -- PG: Membandingkan string opsi (misal "A" == "A" atau {"selected": "A"})
                IF (jsonb_typeof(v_student_ans) = 'string' AND v_student_ans = r.kunci_jawaban)
                   OR (v_student_ans->>'selected' = r.kunci_jawaban#>>'{}')
                   OR (v_student_ans#>>'{}' = r.kunci_jawaban#>>'{}') THEN
                    v_is_correct := true;
                    v_item_score := r.bobot_soal;
                END IF;
                v_score_pg := v_score_pg + v_item_score;

            ELSIF r.tipe_soal = 'PGK' THEN
                -- PGK: Pilihan Ganda Kompleks (Array checkbox jawaban benar)
                -- Cocokkan elemen array secara tepat (set comparison)
                IF jsonb_typeof(v_student_ans) = 'array' AND jsonb_typeof(r.kunci_jawaban) = 'array' THEN
                    IF v_student_ans <@ r.kunci_jawaban AND r.kunci_jawaban <@ v_student_ans THEN
                        v_is_correct := true;
                        v_item_score := r.bobot_soal;
                    ELSE
                        -- Proporsional skor parsial jika ada opsi benar
                        DECLARE
                            v_kunci_len INT := jsonb_array_length(r.kunci_jawaban);
                            v_matching_count INT := 0;
                            v_elem TEXT;
                        BEGIN
                            FOR v_elem IN SELECT jsonb_array_elements_text(v_student_ans) LOOP
                                IF r.kunci_jawaban ? v_elem THEN
                                    v_matching_count := v_matching_count + 1;
                                ELSE
                                    v_matching_count := GREATEST(0, v_matching_count - 1);
                                END IF;
                            END LOOP;
                            IF v_kunci_len > 0 AND v_matching_count > 0 THEN
                                v_item_score := ROUND((v_matching_count::numeric / v_kunci_len::numeric) * r.bobot_soal, 2);
                            END IF;
                        END;
                    END IF;
                END IF;
                v_score_pgk := v_score_pgk + v_item_score;

            ELSIF r.tipe_soal = 'Menjodohkan' THEN
                -- Menjodohkan: Array pair [{"premise_id": "p1", "target_id": "t2"}]
                IF jsonb_typeof(v_student_ans) = 'array' AND jsonb_typeof(r.kunci_jawaban) = 'array' THEN
                    DECLARE
                        v_total_pairs INT := jsonb_array_length(r.kunci_jawaban);
                        v_correct_pairs INT := 0;
                    BEGIN
                        SELECT count(*) INTO v_correct_pairs
                        FROM jsonb_array_elements(v_student_ans) sa
                        WHERE EXISTS (
                            SELECT 1 FROM jsonb_array_elements(r.kunci_jawaban) ka
                            WHERE (ka->>'premise_id') = (sa->>'premise_id')
                              AND (ka->>'target_id') = (sa->>'target_id')
                        );

                        IF v_total_pairs > 0 THEN
                            v_item_score := ROUND((v_correct_pairs::numeric / v_total_pairs::numeric) * r.bobot_soal, 2);
                            IF v_correct_pairs = v_total_pairs THEN
                                v_is_correct := true;
                            END IF;
                        END IF;
                    END;
                END IF;
                v_score_menjodohkan := v_score_menjodohkan + v_item_score;

            ELSIF r.tipe_soal = 'Uraian' THEN
                -- Uraian: Nilai default manual oleh guru atau mempertahankan nilai existing jika sudah dinilai
                v_item_score := COALESCE((v_hasil.detail_skor->>'score_uraian')::numeric, 0.00);
            END IF;

            IF v_is_correct THEN
                v_total_benar := v_total_benar + 1;
            END IF;

            IF r.is_hots THEN
                v_total_hots_score := v_total_hots_score + v_item_score;
            END IF;

            v_total_perolehan := v_total_perolehan + v_item_score;
        END IF;
    END LOOP;

    -- Hitung skala 0-100
    IF v_total_bobot > 0 THEN
        v_final_grade := ROUND((v_total_perolehan / v_total_bobot) * 100.0, 2);
    ELSE
        v_final_grade := 0.00;
    END IF;

    -- Update lembar hasil ujian
    UPDATE public.hasil_ujian
    SET 
        nilai_akhir = v_final_grade,
        detail_skor = jsonb_build_object(
            'score_pg', v_score_pg,
            'score_pgk', v_score_pgk,
            'score_menjodohkan', v_score_menjodohkan,
            'score_uraian', v_score_uraian,
            'total_hots_score', v_total_hots_score,
            'total_soal', v_total_soal,
            'total_terjawab', v_total_terjawab,
            'total_benar', v_total_benar,
            'total_bobot_maksimal', v_total_bobot,
            'total_perolehan_bobot', v_total_perolehan
        ),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_hasil_id;

    RETURN v_final_grade;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Siswa Mengakhiri Ujian (Selesai Pengerjaan & Auto-Score)
CREATE OR REPLACE FUNCTION public.rpc_finish_exam_session(p_hasil_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_final_score NUMERIC(5,2);
    v_hasil public.hasil_ujian%ROWTYPE;
BEGIN
    UPDATE public.hasil_ujian
    SET 
        status = 'selesai',
        waktu_selesai = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_hasil_id;

    -- Hitung skor otomatis
    v_final_score := public.calculate_exam_score(p_hasil_id);

    SELECT * INTO v_hasil FROM public.hasil_ujian WHERE id = p_hasil_id;

    RETURN jsonb_build_object(
        'success', true,
        'hasil_id', p_hasil_id,
        'nilai_akhir', v_final_score,
        'detail_skor', v_hasil.detail_skor,
        'waktu_selesai', v_hasil.waktu_selesai
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stimulus_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_ujian ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: users
-- ------------------------------------------------------------------------------
-- Pengguna dapat membaca data profil sendiri, dan profil guru pengampu
CREATE POLICY "users_read_all"
    ON public.users FOR SELECT
    USING (true);

-- Pengguna hanya dapat memperbarui data dirinya sendiri
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (id = public.current_app_user_id() OR public.is_guru());

-- Admin / Guru dapat mendaftarkan siswa baru
CREATE POLICY "users_insert_guru"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS: stimulus_soal
-- ------------------------------------------------------------------------------
-- Guru dapat melihat semua stimulus atau stimulus miliknya
CREATE POLICY "stimulus_read_policy"
    ON public.stimulus_soal FOR SELECT
    USING (true);

-- Guru dapat membuat stimulus baru
CREATE POLICY "stimulus_insert_guru"
    ON public.stimulus_soal FOR INSERT
    WITH CHECK (public.is_guru() OR guru_id = public.current_app_user_id() OR guru_id IS NULL);

-- Guru dapat mengedit stimulus miliknya
CREATE POLICY "stimulus_update_guru"
    ON public.stimulus_soal FOR UPDATE
    USING (public.is_guru() OR guru_id = public.current_app_user_id());

-- Guru dapat menghapus stimulus miliknya
CREATE POLICY "stimulus_delete_guru"
    ON public.stimulus_soal FOR DELETE
    USING (public.is_guru() OR guru_id = public.current_app_user_id());

-- ------------------------------------------------------------------------------
-- RLS: bank_soal
-- ------------------------------------------------------------------------------
-- Guru dapat melihat semua butir bank soal
CREATE POLICY "bank_soal_select_guru"
    ON public.bank_soal FOR SELECT
    USING (
        public.is_guru() OR 
        guru_id = public.current_app_user_id() OR
        EXISTS (
            -- Siswa hanya dapat membaca soal saat sesi jadwal aktif berlangsung
            SELECT 1 FROM public.jadwal_soal js
            JOIN public.jadwal_ujian ju ON js.jadwal_id = ju.id
            JOIN public.hasil_ujian hu ON hu.jadwal_id = ju.id
            WHERE js.bank_soal_id = public.bank_soal.id
              AND hu.siswa_id = public.current_app_user_id()
              AND hu.status = 'sedang_mengerjakan'
        )
    );

-- Guru dapat mengelola butir bank soal
CREATE POLICY "bank_soal_insert_guru"
    ON public.bank_soal FOR INSERT
    WITH CHECK (public.is_guru() OR guru_id = public.current_app_user_id());

CREATE POLICY "bank_soal_update_guru"
    ON public.bank_soal FOR UPDATE
    USING (public.is_guru() OR guru_id = public.current_app_user_id());

CREATE POLICY "bank_soal_delete_guru"
    ON public.bank_soal FOR DELETE
    USING (public.is_guru() OR guru_id = public.current_app_user_id());

-- ------------------------------------------------------------------------------
-- RLS: jadwal_ujian
-- ------------------------------------------------------------------------------
-- Guru dapat melihat semua jadwal, Siswa melihat jadwal berstatus aktif
CREATE POLICY "jadwal_select_policy"
    ON public.jadwal_ujian FOR SELECT
    USING (
        public.is_guru() OR 
        guru_id = public.current_app_user_id() OR
        (status = 'aktif') OR
        EXISTS (
            SELECT 1 FROM public.hasil_ujian hu 
            WHERE hu.jadwal_id = public.jadwal_ujian.id 
              AND hu.siswa_id = public.current_app_user_id()
        )
    );

CREATE POLICY "jadwal_insert_guru"
    ON public.jadwal_ujian FOR INSERT
    WITH CHECK (public.is_guru() OR guru_id = public.current_app_user_id());

CREATE POLICY "jadwal_update_guru"
    ON public.jadwal_ujian FOR UPDATE
    USING (public.is_guru() OR guru_id = public.current_app_user_id());

CREATE POLICY "jadwal_delete_guru"
    ON public.jadwal_ujian FOR DELETE
    USING (public.is_guru() OR guru_id = public.current_app_user_id());

-- ------------------------------------------------------------------------------
-- RLS: jadwal_soal
-- ------------------------------------------------------------------------------
CREATE POLICY "jadwal_soal_select"
    ON public.jadwal_soal FOR SELECT
    USING (true);

CREATE POLICY "jadwal_soal_crud_guru"
    ON public.jadwal_soal FOR ALL
    USING (
        public.is_guru() OR 
        EXISTS (SELECT 1 FROM public.jadwal_ujian ju WHERE ju.id = jadwal_id AND ju.guru_id = public.current_app_user_id())
    );

-- ------------------------------------------------------------------------------
-- RLS: hasil_ujian
-- ------------------------------------------------------------------------------
-- Siswa membaca lembar hasilnya sendiri, Guru membaca hasil ujian kelasnya
CREATE POLICY "hasil_ujian_select"
    ON public.hasil_ujian FOR SELECT
    USING (
        siswa_id = public.current_app_user_id() OR
        public.is_guru() OR
        EXISTS (
            SELECT 1 FROM public.jadwal_ujian ju 
            WHERE ju.id = public.hasil_ujian.jadwal_id 
              AND ju.guru_id = public.current_app_user_id()
        )
    );

-- Siswa dapat menginsert hasil pengerjaan baru saat memulai
CREATE POLICY "hasil_ujian_insert_siswa"
    ON public.hasil_ujian FOR INSERT
    WITH CHECK (
        siswa_id = public.current_app_user_id() OR
        public.is_guru()
    );

-- Siswa dapat update jawaban saat sedang_mengerjakan, Guru dapat koreksi nilai
CREATE POLICY "hasil_ujian_update"
    ON public.hasil_ujian FOR UPDATE
    USING (
        (siswa_id = public.current_app_user_id() AND status = 'sedang_mengerjakan') OR
        public.is_guru() OR
        EXISTS (
            SELECT 1 FROM public.jadwal_ujian ju 
            WHERE ju.id = public.hasil_ujian.jadwal_id 
              AND ju.guru_id = public.current_app_user_id()
        )
    );

-- ==============================================================================
-- 9. COMPREHENSIVE REALISTIC SEED DATA (AKM INDONESIA FASE D)
-- ==============================================================================

-- Bersihkan data lama jika ada (idempotent re-run)
TRUNCATE TABLE public.hasil_ujian, public.jadwal_soal, public.jadwal_ujian, public.bank_soal, public.stimulus_soal, public.users CASCADE;

-- ------------------------------------------------------------------------------
-- 9.1 SEED USERS (1 Guru & 3 Siswa SMP)
-- ------------------------------------------------------------------------------
INSERT INTO public.users (id, nama, email, role, nip, nisn, kelas) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Pak Budi Santoso, S.Pd., M.Si.',
    'budi.santoso@smpnegeri1.sch.id',
    'guru',
    '198504122010011008',
    NULL,
    NULL
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Ahmad Fauzi',
    'ahmad.fauzi@siswa.smpnegeri1.sch.id',
    'siswa',
    NULL,
    '0098765432',
    'VIII-A'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Siti Rahma',
    'siti.rahma@siswa.smpnegeri1.sch.id',
    'siswa',
    NULL,
    '0098765433',
    'VIII-A'
),
(
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Budi Pratama',
    'budi.pratama@siswa.smpnegeri1.sch.id',
    'siswa',
    NULL,
    '0098765434',
    'VIII-B'
);

-- ------------------------------------------------------------------------------
-- 9.2 SEED STIMULUS AKM (LITERASI & NUMERASI SMP FASE D)
-- ------------------------------------------------------------------------------

-- Stimulus 1: Literasi Membaca Fase D (Konservasi Terumbu Karang di Raja Ampat)
INSERT INTO public.stimulus_soal (
    id,
    guru_id,
    judul,
    tipe_stimulus,
    sumber,
    media_url,
    konten_teks
) VALUES (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Konservasi Terumbu Karang dan Kearifan Lokal Sasi Laut di Raja Ampat',
    'literasi',
    'Pusat Asesmen Pendidikan Kemendikbudristek & Balai Konservasi Kawasan Perairan Nasional (BKKPN) Kupang',
    'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=1200&q=80',
    'Kepulauan Raja Ampat di Papua Barat Daya dikenal sebagai jantung dari "Segitiga Terumbu Karang Dunia" (Coral Triangle). Kawasan perairan ini menjadi rumah bagi lebih dari 550 jenis karang keras atau sekitar 75% dari seluruh spesies karang yang ada di bumi, serta dihuni oleh sekurangnya 1.400 jenis ikan karang.\n\nNamun, ekosistem yang begitu kaya ini menghadapi ancaman nyata dari aktivitas pemanasan global yang memicu pemutihan karang (coral bleaching), sedimentasi akibat alih fungsi lahan pesisir, serta sisa praktik penangkapan ikan merusak (destructive fishing) menggunakan bahan peledak potasium pada masa lalu. Bila tutupan karang hidup turun di bawah 25%, rantai makanan bahari akan runtuh dan hasil tangkapan nelayan tradisional setempat merosot hingga 60%.\n\nUntuk menjaga kelestarian lautnya, masyarakat adat suku Maya di Raja Ampat terus merawat tradisi leluhur bernama "Sasi Laut". Tradisi Sasi merupakan sistem larangan adat untuk tidak mengambil komoditas laut tertentu (seperti teripang, lola, lobster, dan kerapu) di zona suaka tertentu selama rentang waktu 1 hingga 2 tahun hingga ekosistem benar-benar pulih dan biota mencapai kematangan reproduksi. Upacara buka-tutup sasi dipimpin oleh tetua adat dan tokoh agama.\n\nKombinasi antara kearifan lokal Sasi Laut dan sains modern seperti teknologi transplantasi karang "biorock" (pengaliran arus listrik voltase rendah pada kerangka besi bawah laut) terbukti mempercepat laju pertumbuhan karang hingga 3 sampai 5 kali lebih pesat dibandingkan pertumbuhan alami, sekaligus mengembalikan tutupan karang hidup dari 32% pada tahun 2018 menjadi 68% pada tahun 2023.'
);

-- Stimulus 2: Numerasi Fase D (Analisis Penghematan Air Rumah Tangga Ramah Lingkungan)
INSERT INTO public.stimulus_soal (
    id,
    guru_id,
    judul,
    tipe_stimulus,
    sumber,
    media_url,
    konten_teks
) VALUES (
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Analisis Efisiensi Konsumsi Air Bersih Rumah Tangga Berkelanjutan',
    'numerasi',
    'Direktorat Sanitasi Ditjen Cipta Karya PUPR & Modul AKM Numerasi Lingkungan Hidup 2024',
    'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80',
    'Ketersediaan air bersih merupakan tantangan global yang tercantum dalam SDGs Poin 6 (Clean Water and Sanitation). Berdasarkan survei PDAM di suatu kawasan perumahan perkotaan dengan rata-rata 4 anggota keluarga per rumah tangga, konsumsi air bersih harian terbagi ke dalam berbagai aktivitas domestik.\n\nBerikut adalah tabel data perbandingan efisiensi konsumsi air berdasarkan teknologi peralatan saniter:\n\n1. Mandi (Durasi 5 Menit):\n   - Gayung / Bak Tradisional: rata-rata 60 liter per mandi.\n   - Pancuran (Shower Standar): rata-rata 45 liter per mandi (aliran 9 liter/menit).\n   - Pancuran Hemat Air (Low-flow Eco Shower): rata-rata 25 liter per mandi (aliran 5 liter/menit).\n\n2. Mencuci Piring:\n   - Keran Mengalir Tanpa Aerator: 15 liter per menit (rata-rata butuh 4 menit = 60 liter).\n   - Keran dengan Eco-Aerator Nozzle: 6 liter per menit (rata-rata butuh 4 menit = 24 liter).\n\n3. Pembilasan Kloset (Toilet Flush):\n   - Kloset Single Flush Konvensional: 9 liter sekali siram.\n   - Kloset Dual-Flush Eco: 3 liter untuk cairan, 6 liter untuk padatan (rata-rata tertimbang: 4,5 liter per siram).\n\nTarif air bersih PDAM untuk kelompok rumah tangga adalah Rp 4.500 per meter kubik (1 m³ = 1.000 liter). Sebuah keluarga yang terdiri dari 4 orang masing-masing mandi 2 kali sehari dan menggunakan kloset rata-rata 4 kali sehari per orang.'
);

-- ------------------------------------------------------------------------------
-- 9.3 SEED BANK SOAL (8 BUTIR AKM HOTS: PG, PGK, MENJODOHKAN, URAIAN)
-- ------------------------------------------------------------------------------

-- Butir 1: Literasi - Pilihan Ganda (PG HOTS)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '11111111-1111-4111-8111-111111111111',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Bahasa Indonesia (Literasi Membaca)',
    'Fase D (SMP)',
    8,
    'Berdasarkan bacaan teks mengenai konservasi perairan di Raja Ampat, manakah kesimpulan yang paling tepat mengenai hubungan antara tradisi adat "Sasi Laut" dan ketahanan pangan masyarakat pesisir?',
    'PG',
    true,
    'C4_Menganalisis',
    '[
        {"id": "A", "text": "Tradisi Sasi Laut mengurangi pendapatan nelayan secara permanen karena melarang eksploitasi perikanan sepanjang tahun."},
        {"id": "B", "text": "Tradisi Sasi Laut menjamin kelangsungan regenerasi biota laut secara periodik sehingga mencegah kepunahan dan menjaga stabilitas hasil tangkapan nelayan dalam jangka panjang."},
        {"id": "C", "text": "Sasi Laut hanya berfokus pada biota teripang dan lobster tanpa memberikan dampak positif pada tutupan terumbu karang hidup."},
        {"id": "D", "text": "Tradisi adat Sasi Laut bertentangan dengan penerapan metode sains modern teknologi biorock di kawasan suaka perairan."}
    ]'::jsonb,
    '"B"'::jsonb,
    'Pilihan B tepat karena teks menjelaskan bahwa Sasi Laut merupakan larangan adat periodik (1-2 tahun) yang memberi jeda waktu reproduksi bagi biota laut hingga pulih. Hal ini menjamin ketersediaan sumber daya dan mencegah kolapsnya rantai makanan nelayan.',
    1.00
);

-- Butir 2: Literasi - Pilihan Ganda Kompleks (PGK Multi-Select)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '22222222-2222-4222-8222-222222222222',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Bahasa Indonesia (Literasi Membaca)',
    'Fase D (SMP)',
    8,
    'Pilihlah seluruh pernyataan berikut yang SESUAI dan DIDUKUNG oleh fakta yang termuat dalam wacana konservasi Raja Ampat! (Jawaban benar lebih dari satu)',
    'PGK',
    true,
    'C5_Mengevaluasi',
    '[
        {"id": "A", "text": "Kawasan perairan Raja Ampat menampung sekitar 75 persen dari total ragam jenis karang keras di dunia."},
        {"id": "B", "text": "Penggunaan bahan peledak potasium merupakan metode ramah lingkungan yang direkomendasikan para peneliti modern."},
        {"id": "C", "text": "Integrasi teknologi biorock dapat mempercepat pertumbuhan struktur terumbu karang hingga 3 sampai 5 kali lebih cepat dari laju normal."},
        {"id": "D", "text": "Kenaikan suhu perairan dan alih fungsi lahan pesisir menjadi pemicu ancaman pemutihan karang dan sedimentasi."}
    ]'::jsonb,
    '["A", "C", "D"]'::jsonb,
    'Pernyataan A, C, dan D secara eksplisit tercantum dalam teks. Pernyataan B salah karena penangkapan dengan bom potasium adalah praktik merusak (destructive fishing) masa lalu yang merusak terumbu karang.',
    1.50
);

-- Butir 3: Literasi - Menjodohkan (Matching Table Premise-Target)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '33333333-3333-4333-8333-333333333333',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Bahasa Indonesia (Literasi Membaca)',
    'Fase D (SMP)',
    8,
    'Jodohkanlah pilar konservasi / istilah di kolom kiri (Premis) dengan penjelasan / fungsinya yang tepat di kolom kanan (Target)!',
    'Menjodohkan',
    false,
    'C3_Menerapkan',
    '{
        "premises": [
            {"id": "p1", "text": "Sasi Laut"},
            {"id": "p2", "text": "Teknologi Biorock"},
            {"id": "p3", "text": "Coral Bleaching"}
        ],
        "targets": [
            {"id": "t1", "text": "Fenomena pemutihan karang akibat pemanasan suhu permukaan air laut."},
            {"id": "t2", "text": "Aturan kearifan lokal suku Maya yang melarang pengambilan biota laut selama kurun waktu tertentu."},
            {"id": "t3", "text": "Metode stimulasi arus listrik tegangan rendah untuk merehabilitasi kerangka terumbu karang."},
            {"id": "t4", "text": "Teknik pembesaran ikan kerapu di kolam air tawar pedalaman."}
        ]
    }'::jsonb,
    '[
        {"premise_id": "p1", "target_id": "t2"},
        {"premise_id": "p2", "target_id": "t3"},
        {"premise_id": "p3", "target_id": "t1"}
    ]'::jsonb,
    'Pasangan yang benar: p1 (Sasi Laut) -> t2 (Aturan kearifan lokal), p2 (Biorock) -> t3 (Stimulasi arus listrik), p3 (Coral Bleaching) -> t1 (Fenomena pemutihan karang).',
    1.50
);

-- Butir 4: Numerasi - Pilihan Ganda (PG HOTS)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '44444444-4444-4444-8444-444444444444',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'Matematika (Numerasi AKM)',
    'Fase D (SMP)',
    8,
    'Keluarga Pak Handoko terdiri atas 4 orang anggota keluarga. Setiap anggota keluarga terbiasa mandi 2 kali sehari menggunakan gayung tradisional (60 liter/mandi). Jika seluruh anggota keluarga beralih menggunakan "Pancuran Hemat Air (Low-flow Eco Shower)", berapakah total volume air bersih yang berhasil dihemat oleh keluarga tersebut dalam kurun waktu 30 hari (1 bulan)?',
    'PG',
    true,
    'C3_Menerapkan',
    '[
        {"id": "A", "text": "4.200 liter"},
        {"id": "B", "text": "6.800 liter"},
        {"id": "C", "text": "8.400 liter"},
        {"id": "D", "text": "14.400 liter"}
    ]'::jsonb,
    '"C"'::jsonb,
    'Perhitungan: Penghematan per mandi = 60 liter - 25 liter = 35 liter. Total mandi per hari = 4 orang x 2 kali = 8 kali mandi. Penghematan harian = 8 x 35 liter = 280 liter/hari. Total penghematan 30 hari = 280 x 30 = 8.400 liter (8,4 m³). Jawaban C.',
    1.00
);

-- Butir 5: Numerasi - Pilihan Ganda Kompleks (PGK Evaluasi Finansial & Lingkungan)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '55555555-5555-4555-8555-555555555555',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'Matematika (Numerasi AKM)',
    'Fase D (SMP)',
    8,
    'Sebuah rumah tangga mengganti seluruh keran cuci piring (4 menit/hari pemakaian) dengan "Eco-Aerator Nozzle" dan mengganti kloset konvensional single flush (9 liter) menjadi "Dual-Flush Eco" (rata-rata 4,5 liter/siram). Jika 4 orang anggota keluarga menggunakan kloset rata-rata 4 kali sehari per orang, tentukan kebenaran pernyataan-pernyataan berikut! (Pilihlah semua pernyataan yang BENAR)',
    'PGK',
    true,
    'C4_Menganalisis',
    '[
        {"id": "A", "text": "Penghematan air dari aktivitas cuci piring dengan eco-aerator mencapai 36 liter per hari."},
        {"id": "B", "text": "Konsumsi air kloset konvensional untuk 4 orang (4x sehari) adalah 144 liter per hari."},
        {"id": "C", "text": "Penghematan dari penggantian kloset dual-flush adalah sebesar 72 liter per hari."},
        {"id": "D", "text": "Total penghematan biaya tagihan PDAM gabungan dari kedua peralatan tersebut dalam 30 hari adalah lebih dari Rp 14.500 (Tarif Rp 4.500/m³)."}
    ]'::jsonb,
    '["A", "B", "C", "D"]'::jsonb,
    'Semua pernyataan benar: A. Cuci piring: (15 - 6) x 4 menit = 36 liter/hari. B. Kloset konvensional: 4 orang x 4 kali x 9 L = 144 L/hari. C. Kloset dual-flush: 16 x 4,5 L = 72 L/hari (hemat 144 - 72 = 72 L/hari). D. Total hemat harian = 36 + 72 = 108 L/hari. Dalam 30 hari = 3.240 Liter = 3,24 m³. Biaya hemat = 3,24 x Rp 4.500 = Rp 14.580 (lebih dari Rp 14.500).',
    1.50
);

-- Butir 6: Numerasi - Menjodohkan (Matching Perbandingan Volume)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '66666666-6666-4666-8666-666666666666',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'Matematika (Numerasi AKM)',
    'Fase D (SMP)',
    8,
    'Jodohkanlah skenario pemakaian air pada tabel sebelah kiri dengan volume total air yang dikonsumsi per kejadian di tabel sebelah kanan!',
    'Menjodohkan',
    false,
    'C3_Menerapkan',
    '{
        "premises": [
            {"id": "p1", "text": "Mandi 1 orang selama 5 menit memakai shower standar"},
            {"id": "p2", "text": "Mencuci piring 4 menit dengan keran biasa tanpa aerator"},
            {"id": "p3", "text": "Mandi 1 orang dengan gayung tradisional"}
        ],
        "targets": [
            {"id": "t1", "text": "45 Liter"},
            {"id": "t2", "text": "60 Liter"},
            {"id": "t3", "text": "24 Liter"},
            {"id": "t4", "text": "25 Liter"}
        ]
    }'::jsonb,
    '[
        {"premise_id": "p1", "target_id": "t1"},
        {"premise_id": "p2", "target_id": "t2"},
        {"premise_id": "p3", "target_id": "t2"}
    ]'::jsonb,
    'Sesuai stimulus: p1 (Shower standar 5 menit) = 45 L -> t1; p2 (Cuci piring biasa 4 menit @ 15 L/m) = 60 L -> t2; p3 (Gayung tradisional) = 60 L -> t2.',
    1.50
);

-- Butir 7: Literasi - Uraian (Analisis HOTS Rekomendasi Kebijakan)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '77777777-7777-4777-8777-777777777777',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Bahasa Indonesia (Literasi Membaca)',
    'Fase D (SMP)',
    8,
    'Sebagai duta lingkungan muda di sekolahmu, jelaskanlah secara komprehensif mengapa perpaduan antara kearifan lokal tradisional (seperti Sasi Laut) dan inovasi teknologi modern (seperti Biorock) lebih efektif dalam menjamin keberlanjutan ekosistem dibandingkan hanya mengandalkan salah satu pendekatan saja!',
    'Uraian',
    true,
    'C6_Mencipta',
    '{
        "rubrik": [
            {"aspek": "Pemahaman Kearifan Lokal (Sasi)", "skor_maks": 30, "kriteria": "Menyebutkan peran kepatuhan sosial budaya dan perlindungan zona reproduksi."},
            {"aspek": "Pemahaman Sains Modern (Biorock)", "skor_maks": 30, "kriteria": "Menyebutkan percepatan laju pertumbuhan fisik karang (3-5 kali)."},
            {"aspek": "Sintesis Sinergi & Rekomendasi", "skor_maks": 40, "kriteria": "Mampu mengaitkan bahwa teknologi tanpa kepatuhan adat akan dirusak, dan adat tanpa sains lambat memulihkan karang rusak."}
        ]
    }'::jsonb,
    '{"rubrik_kunci": "Perpaduan keduanya efektif karena: (1) Sasi Laut menciptakan kepatuhan sosial budaya masyarakat setempat tanpa perlu biaya pengawasan mahal dari aparat; (2) Teknologi Biorock secara biologis mempercepat laju kalsifikasi karang 3-5x lipat mengatasi laju kerusakan; (3) Sinergi keduanya menciptakan ekosistem lestari dan berkelanjutan."}'::jsonb,
    'Penilaian uraian didasarkan pada ketepatan analisis sinergi dimensi sosial-kultural dan dimensi bioteknologi.',
    2.00
);

-- Butir 8: Numerasi - Uraian (Evaluasi HOTS Optimalisasi Anggaran Air)
INSERT INTO public.bank_soal (
    id,
    guru_id,
    stimulus_id,
    mata_pelajaran,
    fase,
    tingkat_kelas,
    pertanyaan,
    tipe_soal,
    is_hots,
    level_kognitif,
    opsi_jawaban,
    kunci_jawaban,
    pembahasan,
    bobot_soal
) VALUES (
    '88888888-8888-4888-8888-888888888888',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'Matematika (Numerasi AKM)',
    'Fase D (SMP)',
    8,
    'Sebuah sekolah SMP dengan 12 unit toilet siswa ingin memasang tandon penampungan air hujan (rainwater harvesting) berkapasitas 5.000 liter untuk pembilasan toilet. Jika setiap hari sekolah terjadi 400 kali pembilasan toilet dan sekolah beralih dari tombol siram 9 liter ke dual flush 4,5 liter:\n(a) Berapa liter air PDAM yang dihemat per hari berkat dual-flush?\n(b) Jika tandon air hujan terisi penuh 5.000 liter, untuk berapa hari operasional sekolah tandon tersebut dapat mencukupi 100% kebutuhan bilas kloset dual-flush?',
    'Uraian',
    true,
    'C5_Mengevaluasi',
    '{
        "rubrik": [
            {"aspek": "Kalkulasi Penghematan Harian (a)", "skor_maks": 50, "kriteria": "Menghitung selisih 400 x (9 - 4,5) = 1.800 Liter/hari."},
            {"aspek": "Kalkulasi Daya Tahan Tandon (b)", "skor_maks": 50, "kriteria": "Menghitung konsumsi harian baru 400 x 4,5 = 1.800 Liter; 5.000 / 1.800 = 2,77 hari atau 2 hari operasional penuh."}
        ]
    }'::jsonb,
    '{"jawaban_a": "1.800 liter per hari", "jawaban_b": "2,78 hari (atau dapat memenuhi 2 hari penuh dan 78% hari ketiga)"}'::jsonb,
    'Langkah: (a) Penghematan = 400 x (9 - 4,5 L) = 1.800 Liter/hari. (b) Kebutuhan harian kloset hemat = 400 x 4,5 L = 1.800 Liter/hari. Durasi tandon = 5.000 L / 1.800 L = 2,78 hari.',
    2.00
);

-- ------------------------------------------------------------------------------
-- 9.4 SEED JADWAL UJIAN (1 SESI AKTIF SMP DENGAN TOKEN "SMP001")
-- ------------------------------------------------------------------------------
INSERT INTO public.jadwal_ujian (
    id,
    guru_id,
    judul_ujian,
    mata_pelajaran,
    deskripsi,
    fase,
    target_kelas,
    durasi_menit,
    token_ujian,
    waktu_mulai,
    waktu_selesai,
    acak_soal,
    acak_opsi,
    tampilkan_nilai,
    status
) VALUES (
    '00112233-4455-6677-8899-aabbccddeeff',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Simulasi AKM CBT Fase D: Literasi Lingkungan & Numerasi Sanitasi',
    'AKM Terpadu (Literasi & Numerasi)',
    'Ujian Asesmen Kompetensi Minimum (AKM) berbasis HOTS untuk mengukur literasi membaca teks saintifik dan pemecahan masalah numerasi kontekstual.',
    'Fase D (SMP)',
    ARRAY['VIII-A', 'VIII-B'],
    90,
    'SMP001',
    timezone('utc'::text, now() - INTERVAL '1 hour'),
    timezone('utc'::text, now() + INTERVAL '23 hours'),
    true,
    true,
    true,
    'aktif'
);

-- ------------------------------------------------------------------------------
-- 9.5 SEED JADWAL SOAL (RELASIKAN 8 BUTIR KE JADWAL UJIAN)
-- ------------------------------------------------------------------------------
INSERT INTO public.jadwal_soal (jadwal_id, bank_soal_id, urutan) VALUES
('00112233-4455-6677-8899-aabbccddeeff', '11111111-1111-4111-8111-111111111111', 1),
('00112233-4455-6677-8899-aabbccddeeff', '22222222-2222-4222-8222-222222222222', 2),
('00112233-4455-6677-8899-aabbccddeeff', '33333333-3333-4333-8333-333333333333', 3),
('00112233-4455-6677-8899-aabbccddeeff', '44444444-4444-4444-8444-444444444444', 4),
('00112233-4455-6677-8899-aabbccddeeff', '55555555-5555-4555-8555-555555555555', 5),
('00112233-4455-6677-8899-aabbccddeeff', '66666666-6666-4666-8666-666666666666', 6),
('00112233-4455-6677-8899-aabbccddeeff', '77777777-7777-4777-8777-777777777777', 7),
('00112233-4455-6677-8899-aabbccddeeff', '88888888-8888-4888-8888-888888888888', 8);

-- ------------------------------------------------------------------------------
-- 9.6 SEED HASIL UJIAN (1 SISWA SELESAI & 1 SISWA SEDANG MENGERJAKAN)
-- ------------------------------------------------------------------------------

-- Siswa 1 (Ahmad Fauzi) - Selesai dengan nilai tinggi dan detail skor lengkap
INSERT INTO public.hasil_ujian (
    id,
    jadwal_id,
    siswa_id,
    waktu_mulai,
    waktu_selesai,
    status,
    jawaban_siswa,
    nilai_akhir,
    detail_skor,
    catatan_guru
) VALUES (
    'aa112233-4455-6677-8899-aabbccddeeff',
    '00112233-4455-6677-8899-aabbccddeeff',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    timezone('utc'::text, now() - INTERVAL '45 minutes'),
    timezone('utc'::text, now() - INTERVAL '5 minutes'),
    'selesai',
    '{
        "11111111-1111-4111-8111-111111111111": {
            "answer": "B",
            "is_ragu": false,
            "answered_at": "2026-11-03T01:10:00Z"
        },
        "22222222-2222-4222-8222-222222222222": {
            "answer": ["A", "C", "D"],
            "is_ragu": false,
            "answered_at": "2026-11-03T01:18:20Z"
        },
        "33333333-3333-4333-8333-333333333333": {
            "answer": [
                {"premise_id": "p1", "target_id": "t2"},
                {"premise_id": "p2", "target_id": "t3"},
                {"premise_id": "p3", "target_id": "t1"}
            ],
            "is_ragu": false,
            "answered_at": "2026-11-03T01:23:45Z"
        },
        "44444444-4444-4444-8444-444444444444": {
            "answer": "C",
            "is_ragu": false,
            "answered_at": "2026-11-03T01:28:10Z"
        },
        "55555555-5555-4555-8555-555555555555": {
            "answer": ["A", "B", "C", "D"],
            "is_ragu": false,
            "answered_at": "2026-11-03T01:34:00Z"
        },
        "66666666-6666-4666-8666-666666666666": {
            "answer": [
                {"premise_id": "p1", "target_id": "t1"},
                {"premise_id": "p2", "target_id": "t2"},
                {"premise_id": "p3", "target_id": "t2"}
            ],
            "is_ragu": false,
            "answered_at": "2026-11-03T01:37:12Z"
        },
        "77777777-7777-4777-8777-777777777777": {
            "answer": "Sinergi tradisi Sasi Laut dan Biorock sangat krusial. Sasi Laut memberikan perlindungan sosial dan moral adat agar nelayan tidak menangkap ikan di masa regenerasi, sedangkan Biorock mempercepat pemulihan fisik karang hingga 3-5 kali lebih cepat.",
            "is_ragu": false,
            "answered_at": "2026-11-03T01:43:00Z"
        },
        "88888888-8888-4888-8888-888888888888": {
            "answer": "(a) Penghematan air harian = 400 x (9 - 4,5) = 1.800 liter. (b) Kebutuhan harian kloset = 400 x 4,5 = 1.800 liter/hari. Maka tandon 5.000 liter dapat mencukupi 5000 / 1800 = 2,78 hari operasional sekolah.",
            "is_ragu": false,
            "answered_at": "2026-11-03T01:48:30Z"
        }
    }'::jsonb,
    95.83,
    '{
        "score_pg": 2.00,
        "score_pgk": 3.00,
        "score_menjodohkan": 3.00,
        "score_uraian": 3.50,
        "total_hots_score": 9.50,
        "total_soal": 8,
        "total_terjawab": 8,
        "total_benar": 8,
        "total_bobot_maksimal": 12.00,
        "total_perolehan_bobot": 11.50
    }'::jsonb,
    'Sangat baik dalam analisis literasi saintifik dan kemampuan komputasi numerasi lingkungan!'
);

-- Siswa 2 (Siti Rahma) - Sedang Mengerjakan (Active Session untuk Pengujian Realtime)
INSERT INTO public.hasil_ujian (
    id,
    jadwal_id,
    siswa_id,
    waktu_mulai,
    waktu_selesai,
    status,
    jawaban_siswa,
    nilai_akhir,
    detail_skor,
    catatan_guru
) VALUES (
    'bb223344-5566-7788-99aa-bbccddeeff00',
    '00112233-4455-6677-8899-aabbccddeeff',
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    timezone('utc'::text, now() - INTERVAL '15 minutes'),
    NULL,
    'sedang_mengerjakan',
    '{
        "11111111-1111-4111-8111-111111111111": {
            "answer": "B",
            "is_ragu": false,
            "answered_at": "2026-11-03T01:12:00Z"
        },
        "22222222-2222-4222-8222-222222222222": {
            "answer": ["A", "C"],
            "is_ragu": true,
            "answered_at": "2026-11-03T01:15:30Z"
        }
    }'::jsonb,
    0.00,
    '{
        "score_pg": 0,
        "score_pgk": 0,
        "score_menjodohkan": 0,
        "score_uraian": 0,
        "total_hots_score": 0,
        "total_soal": 8,
        "total_terjawab": 2,
        "total_benar": 0
    }'::jsonb,
    NULL
);

-- ==============================================================================
-- AKHIR DARI DOKUMEN SCHEMA POSTGRESQL / SUPABASE
-- ==============================================================================

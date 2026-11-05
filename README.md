# CBT Guru Hebat Indonesia - Platform Computer Based Test (SMP Fase D & SMA)

Platform Computer Based Test (CBT) modern berbasis **Next.js (App Router)**, **Tailwind CSS**, dan **Supabase PostgreSQL** yang dirancang khusus untuk Asesmen Kompetensi Minimum (AKM) Literasi Membaca & Numerasi serta evaluasi berpikir tingkat tinggi (HOTS - Higher Order Thinking Skills) Kurikulum Merdeka.

---

## 🌟 Fitur Utama

### 1. Desain Khusus Soal AKM (Asesmen Kompetensi Minimum)
- **Tampilan Split-Screen / Resizable Pane**:
  - **Sisi Kiri/Atas (`StimulusViewer`)**: Menampilkan wacana naratif literasi, tabel data numerasi, infografis dengan *zoom modal preview*, serta alat stabilo teks (*text highlighter*).
  - **Sisi Kanan/Bawah (`QuestionArea`)**: Area interaktif responsif untuk mengerjakan butir soal.
- **Dukungan 4 Format Soal AKM**:
  1. **Pilihan Ganda (PG)**: Kartu opsi radio standar dengan shortcut keyboard (1-4).
  2. **Pilihan Ganda Kompleks (PGK)**: Multi-select checkbox untuk soal dengan >1 jawaban benar.
  3. **Menjodohkan**: Interface memasangkan Premis (Kolom A) dengan Target Pasangan (Kolom B).
  4. **Uraian / Esai**: Textarea dinamis dengan live character & word counter serta panduan rubrik penalaran.
- **Standar HOTS (Level Kognitif Bloom C4 - C6)**:
  - C4 Menganalisis, C5 Mengevaluasi, dan C6 Mencipta dengan bobot poin proporsional.

### 2. Antarmuka Siswa (Student CBT Experience)
- **Exam Header**: Profil siswa (Nama, NISN, Kelas), indikator status online & autosave, pengatur ukuran huruf bacaan (A- / A / A+), dan live countdown timer dengan warna adaptif (Normal > Kuning > Merah pulsa).
- **Question Navigation Grid**: Kisi navigasi nomor soal dengan status visual (Hijau = Terjawab, Kuning = Ragu-ragu, Abu = Belum), filter cepat, serta tombol "Ragu-ragu" dan "Kumpulkan Ujian".
- **Autosave Real-Time & Offline Resilience**: Menyimpan jawaban seketika ke `localStorage` dan sinkronisasi berkala ke Supabase JSONB agar siswa terlindungi jika koneksi terputus.
- **Modal Konfirmasi Pengumpulan**: Menampilkan rekapitulasi butir terjawab, ragu-ragu, dan belum terjawab sebelum submit final.

### 3. Dasbor Guru (Teacher Admin Portal)
- **Overview & KPI**: Metrik bank soal, jadwal aktif, rasio HOTS vs Reguler, dan visualisasi domain AKM.
- **Bank Soal & Stimulus Builder**:
  - Pembuat wacana stimulus literasi & numerasi (1 stimulus dapat dipakai banyak soal).
  - Form pembuatan soal dengan selector tipe AKM, toggle HOTS, builder opsi dinamis, dan modal simulasi tampilan siswa.
- **Manajemen Jadwal CBT**: Pembuat jadwal dengan generator token 6 digit, pengaturan durasi, dan pemilih butir soal dari bank soal.
- **Hasil & Analisis Nilai Siswa**: Tabel rekapitulasi nilai akhir (0-100), status ketuntasan KKM, rincian skor per tipe soal, modal lembar jawaban siswa, dan fitur ekspor ke Excel/CSV.

### 4. Engine Penilaian Cerdas (AKM Scoring Engine)
- Formula proporsional AKM untuk PGK: `(Benar - Salah * 0.5) / TotalKunci * Bobot`.
- Rasio pencocokan pasangan untuk Menjodohkan.
- Kalkulasi otomatis persentase penguasaan HOTS (*HOTS Mastery Rate*).

---

## 🛠️ Tech Stack & Arsitektur
- **Framework**: Next.js 14 (App Router)
- **UI & Styling**: Tailwind CSS, Lucide React Icons
- **Database**: PostgreSQL (Supabase) dengan Row Level Security (RLS) & Stored Procedures (RPC)
- **Type Safety**: TypeScript 5

---

## 📂 Struktur Repositori

```text
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Portal Utama (Pintu Masuk Siswa & Guru)
│   │   ├── layout.tsx               # Root Layout
│   │   ├── globals.css              # Custom styling & scrollbars
│   │   ├── exam/
│   │   │   └── [scheduleId]/page.tsx # Halaman Ujian Siswa (Split-screen)
│   │   └── guru/
│   │       ├── layout.tsx           # Layout Dasbor Guru (Sidebar & Header)
│   │       ├── page.tsx             # Overview KPI & Chart AKM
│   │       ├── bank-soal/page.tsx   # Pengelolaan Soal & Stimulus Wacana
│   │       ├── jadwal/page.tsx      # Manajemen Jadwal & Token CBT
│   │       └── hasil/page.tsx       # Analisis Skor & Rekap Hasil Ujian
│   ├── components/
│   │   └── exam/
│   │       ├── ExamHeader.tsx       # Timer countdown, profil siswa, font resizer
│   │       ├── StimulusViewer.tsx   # Tampilan wacana literasi & numerasi
│   │       ├── QuestionArea.tsx     # Area butir soal (PG, PGK, Menjodohkan, Uraian)
│   │       ├── QuestionNavGrid.tsx  # Grid navigasi nomor soal & ragu-ragu
│   │       └── ExamSubmitModal.tsx  # Dialog konfirmasi penyelesaian ujian
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase client dengan safe mock fallback
│   │   │   └── types.ts             # Tipe skema database Supabase
│   │   ├── mock-data.ts             # Dataset realistis AKM SMP Fase D
│   │   ├── scoring-engine.ts        # Algoritma penskoran AKM & HOTS
│   │   └── cbt-service.ts           # Data access layer & autosave sync
│   └── types/
│       ├── database.ts              # Interface database Supabase & DTO
│       └── cbt.ts                   # Domain types AKM CBT
├── supabase/
│   ├── schema.sql                   # Skema DDL lengkap, RLS, triggers, seed data
│   └── README.md                    # Dokumentasi database, ERD, dan panduan RPC
└── package.json
```

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
2. Buka peramban di [http://localhost:3000](http://localhost:3000).
3. **Akses Cepat Pengujian**:
   - **Portal Siswa**: Buka `/` lalu klik **Masuk & Kerjakan Soal** (Token demo bawaan: `SMP001` atau `AKM2026`).
   - **Halaman Ujian Langsung**: Akses `/exam/demo-fase-d`.
   - **Portal Guru**: Akses `/guru` untuk mengelola Bank Soal, Jadwal, dan Nilai Siswa.

---

## 💾 Pengaturan Supabase (Opsional)
Aplikasi telah dilengkapi **Zero-Config Mock & LocalStorage Fallback**, sehingga dapat langsung diuji coba secara offline tanpa perlu mengisi kredensial database. 

Untuk menghubungkan ke project Supabase asli:
1. Jalankan isi file `supabase/schema.sql` pada SQL Editor di dashboard Supabase Anda.
2. Buat file `.env.local` di root proyek:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Restart server Next.js (`npm run dev`).

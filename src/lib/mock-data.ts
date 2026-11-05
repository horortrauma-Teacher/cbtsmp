import {
  Stimulus,
  Soal,
  JadwalUjian,
  Siswa,
  HasilUjian,
  ExamWithDetails
} from './supabase/types';

// ==========================================
// 1. MOCK STIMULI (WACANA AKM FASE D)
// ==========================================

export const MOCK_STIMULI: Stimulus[] = [
  {
    id: 'stimulus-literasi-mangrove',
    judul: 'Ekosistem Hutan Mangrove: Benteng Alami Pesisir Indonesia',
    domain: 'Literasi Membaca',
    jenis_stimulus: 'Saintifik',
    sumber: 'Kementerian Kelautan dan Perikanan (KKP) & BRIN (Pusat Riset Oseanografi, 2023)',
    media_url: 'https://images.unsplash.com/photo-1596766649174-8bcf950ba34c?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Infografis Zonasi Mangrove dari Laut ke Daratan: Zona Avicennia-Sonneratia, Zona Rhizophora, hingga Zona Bruguiera',
    teks_wacana: `Indonesia merupakan rumah bagi sekitar 3,36 juta hektare hutan mangrove, atau mewakili lebih dari 20% total luasan mangrove dunia. Ekosistem pesisir yang khas ini berada pada zona intertidal—wilayah pasang surut air laut di sepanjang garis pantai tropis dan subtropis.

Hutan mangrove bukan sekadar kumpulan pepohonan yang tumbuh di lumpur berair asin; ekosistem ini memiliki arsitektur ekologis berzonasi yang sangat mengagumkan:
1. **Zona Depan (Paling Dekat Laut):** Didominasi oleh jenis *Avicennia* (api-api) dan *Sonneratia* (pedada). Spesies ini memiliki akar napas (*pneumatofora*) menyerupai pensil yang menyembul vertikal ke atas permukaan lumpur hingga puluhan sentimeter untuk menghirup oksigen saat surut, serta mampu membuang kelebihan garam melalui kelenjar khusus pada daunnya.
2. **Zona Tengah:** Didominasi oleh genus *Rhizophora* (bakau kurap / bakau merah). Tanaman ini memiliki akar tunjang (*stilt root*) yang kokoh melengkung mencengkeram substrat lumpur labil. Anyaman rapat akar Rhizophora terbukti secara ilmiah mampu mereduksi kekuatan gelombang laut dan tsunami hingga 66%, sekaligus memerangkap sedimen lumpur pembentuk daratan baru.
3. **Zona Belakang (Mendekati Daratan Kering):** Didominasi oleh *Bruguiera* (tanjang/lindur) dan *Ceriops*. Spesies ini mengembangkan akar lutut (*knee root*) atau akar papan (*buttress*), menempati area dengan frekuensi genangan pasang laut yang lebih jarang dan salinitas lebih rendah.

Selain sebagai pelindung fisik pesisir dari abrasi ganas gelombang samudera, hutan mangrove kini menjadi fokus perhatian dunia dalam isu perubahan iklim global melalui konsep **"Blue Carbon" (Karbon Biru)**. Riset oseanografi membuktikan bahwa per hektare hutan mangrove mampu menyerap dan menyimpan karbon 4 hingga 5 kali lipat lebih banyak dibandingkan hutan hujan daratan tropis. Keistimewaan ini terletak pada substrat sedimen lumpur mangrove yang tebal dan bersifat anaerobik (minim oksigen), sehingga sisa-sisa daun dan ranting yang jatuh terkunci di dalam lumpur selama ratusan tahun tanpa membusuk menjadi gas rumah kaca karbondioksida (CO₂).

Kendati manfaat ekologisnya luar biasa, laju degradasi mangrove di Indonesia akibat konversi menjadi tambak udang intensif, sedimentasi limbah industri, dan penebangan liar masih menjadi ancaman serius bagi kelestarian garis pantai Nusantara.`,
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'stimulus-numerasi-gizi',
    judul: 'Kebutuhan Kalori Harian dan Pola Konsumsi Siswa SMP',
    domain: 'Numerasi',
    jenis_stimulus: 'Personal',
    sumber: 'Kementerian Kesehatan RI (Permenkes Standar Angka Kecukupan Gizi) & Survei Kantin Sekolah Sehat (2024)',
    media_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    media_caption: 'Tabel Angka Kecukupan Gizi (AKG) Kalori Harian Remaja dan Menu Makanan Kantin SMP',
    teks_wacana: `Masa remaja (usia 13–15 tahun) merupakan periode percepatan pertumbuhan (growth spurt) yang membutuhkan asupan nutrisi optimal. Berdasarkan Angka Kecukupan Gizi (AKG) Kementerian Kesehatan Republik Indonesia, standar kebutuhan energi harian remaja adalah sebagai berikut:
- **Remaja Laki-laki (13–15 tahun):** Rata-rata 2.400 kkal per hari.
- **Remaja Perempuan (13–15 tahun):** Rata-rata 2.050 kkal per hari.

Pakar nutrisi merekomendasikan pembagian asupan kalori harian remaja sebagai berikut:
- **Sarapan Pagi:** 25% dari total AKG harian.
- **Makan Siang:** 35% dari total AKG harian.
- **Makan Malam:** 25% dari total AKG harian.
- **Selingan/Camilan Sehat (Pagi & Sore):** 15% dari total AKG harian.

Kantin SMP Nusantara Sehat menyediakan berbagai pilihan menu makan siang beserta data kandungan gizi per porsi:

| Nama Menu Kantin | Porsi | Kandungan Energi (kkal) | Protein (gram) | Lemak (gram) | Karbohidrat (gram) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Soto Ayam + Nasi Putih** | 1 mangkok + 1 piring | 350 | 18 | 8 | 52 |
| **Nasi Goreng Telur Ceplok** | 1 piring | 420 | 12 | 16 | 58 |
| **Mie Ayam Bakso** | 1 mangkok | 380 | 14 | 12 | 54 |
| **Gado-Gado + Lontong** | 1 piring | 310 | 10 | 9 | 48 |
| **Pisang Goreng Tepung** | 1 buah | 140 | 1,5 | 6 | 20 |
| **Tempe Goreng Tepung** | 1 buah | 90 | 4 | 5 | 7 |
| **Es Teh Manis Gula Pasir** | 1 gelas (250 ml) | 90 | 0 | 0 | 23 |
| **Jus Jeruk Murni (Gula Sedikit)**| 1 gelas (250 ml) | 65 | 1 | 0,2 | 15 |
| **Air Putih Mineral** | 1 botol (600 ml) | 0 | 0 | 0 | 0 |

Keseimbangan antara total kalori dan kecukupan makronutrien (terutama protein minimal 20 gram untuk makan siang remaja) sangat menentukan konsentrasi belajar siswa pada jam pelajaran setelah siang hari.`,
    created_at: '2026-01-15T08:00:00Z',
  },
];

// ==========================================
// 2. MOCK QUESTIONS (BANK SOAL AKM FASE D)
// ==========================================

export const MOCK_QUESTIONS: Soal[] = [
  // --- SOAL 1: PG (Literasi - HOTS C4 Menganalisis) ---
  {
    id: 'soal-akm-01',
    stimulus_id: 'stimulus-literasi-mangrove',
    nomor_urut: 1,
    jenis_soal: 'PG',
    tingkat_kognitif: 'C4',
    is_hots: true,
    domain: 'Literasi Membaca',
    konteks: 'Saintifik',
    fase: 'Fase D',
    bobot_soal: 15,
    pertanyaan: 'Berdasarkan wacana tentang "Ekosistem Hutan Mangrove", faktor utama apa yang menyebabkan hutan mangrove mampu menyimpan karbon (Blue Carbon) hingga 4–5 kali lebih efektif dan lama dibandingkan hutan hujan daratan tropis?',
    opsi_jawaban: [
      {
        id: 'A',
        label: 'A',
        text: 'Kanopi daun pohon mangrove jauh lebih rimbun sehingga proses fotosintesis tetap aktif siang dan malam secara berkesinambungan.',
      },
      {
        id: 'B',
        label: 'B',
        text: 'Sedimen lumpur mangrove yang tebal dan bersifat anaerobik (minim oksigen) mengunci sisa bahan organik selama ratusan tahun tanpa membusuk menjadi gas CO₂.',
      },
      {
        id: 'C',
        label: 'C',
        text: 'Akar napas pneumatofora menyerap gas karbondioksida langsung dari dalam air laut dalam volume yang tidak terbatas.',
      },
      {
        id: 'D',
        label: 'D',
        text: 'Tingginya salinitas air laut bereaksi langsung dengan kayu bakau sehingga menghasilkan senyawa karbon kristal permanen.',
      },
    ],
    kunci_jawaban: 'B',
    pembahasan: 'Berdasarkan paragraf 4 wacana, keistimewaan mangrove dalam menyimpan karbon biru terletak pada substrat sedimen lumpur yang tebal dan anaerobik (minim oksigen), sehingga sisa-sisa vegetasi terkunci di dalam lumpur selama ratusan tahun tanpa lekas terurai menjadi gas CO₂.',
    created_at: '2026-01-16T09:00:00Z',
  },

  // --- SOAL 2: PGK (Literasi - HOTS C4 Menganalisis) ---
  {
    id: 'soal-akm-02',
    stimulus_id: 'stimulus-literasi-mangrove',
    nomor_urut: 2,
    jenis_soal: 'PGK',
    tingkat_kognitif: 'C4',
    is_hots: true,
    domain: 'Literasi Membaca',
    konteks: 'Saintifik',
    fase: 'Fase D',
    bobot_soal: 15,
    pertanyaan: 'Seorang aktivis lingkungan pesisir mengamati bahwa laju abrasi pantai meningkat drastis setelah zona pohon bakau kurap (*Rhizophora*) ditebang untuk proyek dermaga perahu. Berdasarkan informasi dalam wacana, pernyataan manakah yang BENAR mengenai fungsi morfologi mangrove dalam memproteksi garis pantai? (Pilihlah lebih dari satu jawaban yang benar!)',
    opsi_jawaban: [
      {
        id: 'A',
        label: 'A',
        text: 'Anyaman rapat sistem perakaran tunjang (stilt root) pada genus Rhizophora terbukti mampu meredam energi hempasan ombak laut hingga 66%.',
      },
      {
        id: 'B',
        label: 'B',
        text: 'Akar napas Avicennia di zona terdepan berfungsi utama mencengkeram tanah daratan kering agar tidak terkikis banjir bandang.',
      },
      {
        id: 'C',
        label: 'C',
        text: 'Jalinan perakaran mangrove berfungsi efektif menjebak partikel sedimen lumpur sehingga membantu proses akresi pembentukan daratan pesisir baru.',
      },
      {
        id: 'D',
        label: 'D',
        text: 'Penebangan Rhizophora tidak memengaruhi kestabilan pantai karena jenis Bruguiera di zona belakang otomatis maju menggantikan pertahanan depan.',
      },
    ],
    kunci_jawaban: ['A', 'C'],
    pembahasan: 'Pilihan A benar karena dinyatakan pada wacana bahwa akar tunjang Rhizophora mereduksi energi gelombang ombak hingga 66%. Pilihan C benar karena jalinan akar memerangkap sedimen pembentuk daratan baru. Pilihan B salah (akar napas Avicennia ada di zona laut berlumpur, bukan tanah daratan kering). Pilihan D salah secara fakta ekologis zonasi.',
    created_at: '2026-01-16T09:05:00Z',
  },

  // --- SOAL 3: Menjodohkan (Literasi - MOTS C3 Mengidentifikasi & Menerapkan) ---
  {
    id: 'soal-akm-03',
    stimulus_id: 'stimulus-literasi-mangrove',
    nomor_urut: 3,
    jenis_soal: 'Menjodohkan',
    tingkat_kognitif: 'C3',
    is_hots: false,
    domain: 'Literasi Membaca',
    konteks: 'Saintifik',
    fase: 'Fase D',
    bobot_soal: 20,
    pertanyaan: 'Pasangkanlah genus/spesies pohon mangrove pada Kolom Premis (Kiri) dengan karakteristik adaptasi morfologi akarnya yang tepat pada Kolom Respon (Kanan) berdasarkan wacana!',
    pasangan_menjodohkan: {
      premis: [
        { id: 'P1', text: 'Avicennia (Api-api) di Zona Depan' },
        { id: 'P2', text: 'Rhizophora (Bakau Kurap) di Zona Tengah' },
        { id: 'P3', text: 'Bruguiera (Tanjang/Lindur) di Zona Belakang' },
      ],
      respon: [
        { id: 'R1', text: 'Akar napas (pneumatofora) mencuat vertikal ke atas permukaan lumpur untuk menghirup oksigen' },
        { id: 'R2', text: 'Akar tunjang melengkung rapat (stilt root) yang mencengkeram substrat lumpur labil' },
        { id: 'R3', text: 'Akar lutut (knee root) atau akar papan, hidup di area frekuensi pasang laut lebih jarang' },
        { id: 'R4', text: 'Akar tunggang lurus ke dalam tanah kering tanpa kontak dengan air asin' },
      ],
    },
    kunci_jawaban: {
      P1: 'R1',
      P2: 'R2',
      P3: 'R3',
    },
    pembahasan: 'Pasangan yang tepat: P1 (Avicennia) berakar napas (R1); P2 (Rhizophora) berakar tunjang (R2); P3 (Bruguiera) berakar lutut di zona belakang (R3). R4 merupakan pengecoh.',
    created_at: '2026-01-16T09:10:00Z',
  },

  // --- SOAL 4: Uraian (Literasi - HOTS C5 & C6 Mengevaluasi / Mengkreasi) ---
  {
    id: 'soal-akm-04',
    stimulus_id: 'stimulus-literasi-mangrove',
    nomor_urut: 4,
    jenis_soal: 'Uraian',
    tingkat_kognitif: 'C5',
    is_hots: true,
    domain: 'Literasi Membaca',
    konteks: 'Sosial Budaya',
    fase: 'Fase D',
    bobot_soal: 15,
    pertanyaan: 'Sebuah desa pesisir berencana melakukan rehabilitasi kawasan hutan mangrovenya yang rusak akibat bekas tambak udang terbengkalai. Buatlah 2 (dua) langkah strategis konservasi terpadu yang dapat dijalankan masyarakat desa dengan mempertimbangkan prinsip zonasi ekologis serta pemberdayaan ekonomi berkelanjutan (misalnya silvofishery atau ekowisata)!',
    rubrik: {
      total_skor: 15,
      kriteria: [
        {
          kriteria: 'Prinsip Zonasi Ekologis Bibit Mangrove',
          skor_maksimal: 7,
          panduan_penskoran: 'Memberikan skor 7 jika menyebutkan pemilihan jenis bibit disesuaikan dengan zona habitat aslinya (contoh: menanam Avicennia/Sonneratia di garis terdepan pantai berombak, dan menanam Rhizophora di zona tengah berakar tunjang). Memberikan skor 3-4 jika hanya menyebutkan penanaman kembali secara umum tanpa mengaitkan zonasi.',
        },
        {
          kriteria: 'Pemberdayaan Ekonomi Berkelanjutan',
          skor_maksimal: 8,
          panduan_penskoran: 'Memberikan skor 8 jika menguraikan program pemanfaatan ekonomi yang ramah lingkungan tanpa menebang mangrove, seperti silvofishery (tambak terintegrasi mangrove) atau ekowisata edukasi pesisir. Memberikan skor 3-4 jika gagasannya belum ramah lingkungan atau kurang realistis.',
        },
      ],
    },
    kunci_jawaban: 'Langkah strategis mencakup: 1) Pemilihan dan penanaman bibit sesuai zonasi alami (Avicennia di zona laut terdepan untuk pelindung awal, Rhizophora di zona tengah untuk menahan sedimen); 2) Penerapan model silvofishery ramah lingkungan atau rintisan ekowisata edukatif mangrove agar masyarakat memperoleh penghasilan tanpa merusak ekosistem.',
    pembahasan: 'Jawaban yang komprehensif mengaitkan ketepatan zonasi botani mangrove dan solusi sosio-ekonomi penduduk lokal.',
    created_at: '2026-01-16T09:15:00Z',
  },

  // --- SOAL 5: PG (Numerasi - HOTS C5 Mengevaluasi Data Perhitungan) ---
  {
    id: 'soal-akm-05',
    stimulus_id: 'stimulus-numerasi-gizi',
    nomor_urut: 5,
    jenis_soal: 'PG',
    tingkat_kognitif: 'C5',
    is_hots: true,
    domain: 'Numerasi',
    konteks: 'Personal',
    fase: 'Fase D',
    bobot_soal: 15,
    pertanyaan: 'Bayu adalah siswa SMP kelas VIII (usia 14 tahun, laki-laki) dengan kebutuhan kalori harian 2.400 kkal. Menurut panduan ahli gizi pada stimulus, porsi makan siang yang ideal sebaiknya memenuhi tepat 35% dari total AKG harian. Bayu memesan makan siang di kantin: 1 porsi Soto Ayam + Nasi Putih, 2 buah Pisang Goreng Tepung, dan 1 gelas Es Teh Manis. Apakah pilihan makan siang Bayu sudah memenuhi anjuran target kalori makan siang tersebut?',
    opsi_jawaban: [
      {
        id: 'A',
        label: 'A',
        text: 'Belum memenuhi, karena total energi yang dikonsumsi Bayu adalah 720 kkal, sementara target makan siang 35% adalah 840 kkal (kurang 120 kkal).',
      },
      {
        id: 'B',
        label: 'B',
        text: 'Sudah memenuhi dengan tepat, karena total asupan energi makan siang Bayu tepat 840 kkal.',
      },
      {
        id: 'C',
        label: 'C',
        text: 'Melebihi batas anjuran, karena total energi makan siang Bayu mencapai 960 kkal (surplus 120 kkal).',
      },
      {
        id: 'D',
        label: 'D',
        text: 'Belum memenuhi, karena target energi makan siang remaja adalah 1.200 kkal (50% dari AKG harian).',
      },
    ],
    kunci_jawaban: 'A',
    pembahasan: 'Perhitungan: Target energi makan siang = 35% × 2.400 kkal = 840 kkal. Konsumsi Bayu: Soto Ayam + Nasi (350 kkal) + 2 Pisang Goreng (2 × 140 = 280 kkal) + Es Teh Manis (90 kkal) = 350 + 280 + 90 = 720 kkal. Selisih = 840 kkal - 720 kkal = kurang 120 kkal. Maka pilihan A tepat.',
    created_at: '2026-01-16T09:20:00Z',
  },

  // --- SOAL 6: PGK (Numerasi - HOTS C4 Menganalisis Multi-Kriteria) ---
  {
    id: 'soal-akm-06',
    stimulus_id: 'stimulus-numerasi-gizi',
    nomor_urut: 6,
    jenis_soal: 'PGK',
    tingkat_kognitif: 'C4',
    is_hots: true,
    domain: 'Numerasi',
    konteks: 'Personal',
    fase: 'Fase D',
    bobot_soal: 20,
    pertanyaan: 'Dina (siswi kelas VIII, perempuan, AKG harian 2.050 kkal) ingin memesan menu makan siang di kantin dengan dua syarat ketat:\n1. Total kalori tidak boleh melebihi target 35% AKG hariannya (maksimal 717,5 kkal).\n2. Total asupan protein makan siang minimal 20 gram.\n\nManakah dari kombinasi paket menu kantin berikut yang MEMENUHI KEDUA SYARAT Dina tersebut? (Pilihlah lebih dari satu jawaban yang benar!)',
    opsi_jawaban: [
      {
        id: 'A',
        label: 'A',
        text: 'Paket 1: 1 porsi Soto Ayam + Nasi (350 kkal, 18g protein) + 1 buah Tempe Goreng (90 kkal, 4g protein) + 1 botol Air Putih Mineral (0 kkal, 0g protein).',
      },
      {
        id: 'B',
        label: 'B',
        text: 'Paket 2: 1 porsi Mie Ayam Bakso (380 kkal, 14g protein) + 1 piring Gado-Gado + Lontong (310 kkal, 10g protein) + 1 gelas Es Teh Manis (90 kkal, 0g protein).',
      },
      {
        id: 'C',
        label: 'C',
        text: 'Paket 3: 1 porsi Nasi Goreng Telur Ceplok (420 kkal, 12g protein) + 2 buah Tempe Goreng (180 kkal, 8g protein) + 1 gelas Jus Jeruk Murni (65 kkal, 1g protein).',
      },
      {
        id: 'D',
        label: 'D',
        text: 'Paket 4: 1 piring Gado-Gado + Lontong (310 kkal, 10g protein) + 2 buah Pisang Goreng (280 kkal, 3g protein) + 1 gelas Es Teh Manis (90 kkal, 0g protein).',
      },
    ],
    kunci_jawaban: ['A', 'C'],
    pembahasan: 'Syarat: Kalori <= 717,5 kkal DAN Protein >= 20 gram.\n- Paket A: Kalori = 350 + 90 + 0 = 440 kkal (<= 717,5). Protein = 18 + 4 + 0 = 22 gram (>= 20). (MEMENUHI KEDUA SYARAT)\n- Paket B: Kalori = 380 + 310 + 90 = 780 kkal (> 717,5 kkal). (TIDAK MEMENUHI)\n- Paket C: Kalori = 420 + 180 + 65 = 665 kkal (<= 717,5). Protein = 12 + 8 + 1 = 21 gram (>= 20). (MEMENUHI KEDUA SYARAT)\n- Paket D: Kalori = 310 + 280 + 90 = 680 kkal. Protein = 10 + 3 + 0 = 13 gram (< 20 gram). (TIDAK MEMENUHI). Jawaban benar adalah A dan C.',
    created_at: '2026-01-16T09:25:00Z',
  },
];

// ==========================================
// 3. MOCK STUDENTS (SISWA SMP)
// ==========================================

export const MOCK_STUDENTS: Siswa[] = [
  {
    id: 'siswa-001',
    nama: 'Ahmad Fauzan Pratama',
    nisn: '0098765432',
    kelas: 'VIII-A',
    sekolah: 'SMP Negeri 1 Nusantara',
    email: 'ahmad.fauzan@smpn1nusantara.sch.id',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    role: 'siswa',
  },
  {
    id: 'siswa-002',
    nama: 'Siti Nurhaliza Putri',
    nisn: '0098765433',
    kelas: 'VIII-A',
    sekolah: 'SMP Negeri 1 Nusantara',
    email: 'siti.nurhaliza@smpn1nusantara.sch.id',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'siswa',
  },
  {
    id: 'siswa-003',
    nama: 'Budi Santoso',
    nisn: '0098765434',
    kelas: 'VIII-B',
    sekolah: 'SMP Negeri 1 Nusantara',
    email: 'budi.santoso@smpn1nusantara.sch.id',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'siswa',
  },
  {
    id: 'siswa-004',
    nama: 'Dewi Lestari Anjani',
    nisn: '0098765435',
    kelas: 'VIII-A',
    sekolah: 'SMP Negeri 1 Nusantara',
    email: 'dewi.lestari@smpn1nusantara.sch.id',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    role: 'siswa',
  },
  {
    id: 'siswa-005',
    nama: 'Rizky Kurniawan',
    nisn: '0098765436',
    kelas: 'VIII-B',
    sekolah: 'SMP Negeri 1 Nusantara',
    email: 'rizky.kurniawan@smpn1nusantara.sch.id',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    role: 'siswa',
  },
];

// ==========================================
// 4. MOCK EXAM SCHEDULES (JADWAL UJIAN)
// ==========================================

export const MOCK_SCHEDULES: JadwalUjian[] = [
  {
    id: 'jadwal-akm-fase-d-2026',
    judul: 'Asesmen Kompetensi Minimum (AKM) Literasi & Numerasi - Fase D (Kelas VIII)',
    deskripsi: 'Asesmen Nasional Berbasis Komputer tingkat SMP Fase D mengukur kompetensi literasi membaca teks saintifik dan penalaran numerasi gizi remaja.',
    mata_pelajaran: 'AKM Terpadu (Literasi & Numerasi)',
    fase: 'Fase D',
    tingkat_kelas: 'Kelas VIII (Delapan)',
    tanggal_mulai: '2026-03-01T07:30:00Z',
    tanggal_selesai: '2026-12-31T16:00:00Z',
    durasi_menit: 60,
    token: 'AKM2026',
    status: 'aktif',
    soal_ids: [
      'soal-akm-01',
      'soal-akm-02',
      'soal-akm-03',
      'soal-akm-04',
      'soal-akm-05',
      'soal-akm-06',
    ],
    acak_soal: false,
    acak_opsi: false,
    tampilkan_hasil_ke_siswa: true,
    total_soal: 6,
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'jadwal-simulasi-akm-02',
    judul: 'Simulasi Mandiri AKM Literasi Membaca - SMP Fase D',
    deskripsi: 'Simulasi latihan mandiri literasi membaca untuk persiapan Asesmen Nasional.',
    mata_pelajaran: 'Literasi Membaca',
    fase: 'Fase D',
    tingkat_kelas: 'Kelas VIII',
    tanggal_mulai: '2026-02-01T08:00:00Z',
    tanggal_selesai: '2026-12-31T17:00:00Z',
    durasi_menit: 45,
    token: 'SIMULASI1',
    status: 'aktif',
    soal_ids: ['soal-akm-01', 'soal-akm-02', 'soal-akm-03', 'soal-akm-04'],
    acak_soal: true,
    acak_opsi: true,
    tampilkan_hasil_ke_siswa: true,
    total_soal: 4,
    created_at: '2026-01-22T08:00:00Z',
  },
];

// ==========================================
// 5. MOCK STUDENT SUBMISSIONS (HASIL UJIAN)
// ==========================================

export const MOCK_RESULTS: HasilUjian[] = [
  {
    id: 'hasil-001',
    jadwal_id: 'jadwal-akm-fase-d-2026',
    siswa_id: 'siswa-001',
    siswa: MOCK_STUDENTS[0],
    status: 'selesai',
    waktu_mulai: '2026-03-02T08:00:00Z',
    waktu_selesai: '2026-03-02T08:48:15Z',
    sisa_waktu_detik: 705,
    jawaban_siswa: {
      'soal-akm-01': 'B',
      'soal-akm-02': ['A', 'C'],
      'soal-akm-03': { P1: 'R1', P2: 'R2', P3: 'R3' },
      'soal-akm-04': '1) Menanam kembali bibit mangrove sesuai zonasi: jenis Avicennia di zona terdepan penahan ombak dan Rhizophora di zona tengah. 2) Mengembangkan silvofishery ramah lingkungan dan rute ekowisata perahu edukasi bagi turis agar warga lokal memperoleh penghasilan.',
      'soal-akm-05': 'A',
      'soal-akm-06': ['A', 'C'],
    },
    ragu_ragu: {
      'soal-akm-04': false,
      'soal-akm-06': false,
    },
    nilai_akhir: 98,
    detail_skor: {
      finalScore: 98,
      rawScore: 98,
      maxScore: 100,
      breakdown: [
        {
          soalId: 'soal-akm-01',
          nomorUrut: 1,
          jenisSoal: 'PG',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 15,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: 'B',
          correctAnswer: 'B',
          feedback: 'Sempurna. Mampu menganalisis mekanisme anaerobik sedimen mangrove.',
        },
        {
          soalId: 'soal-akm-02',
          nomorUrut: 2,
          jenisSoal: 'PGK',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 15,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: ['A', 'C'],
          correctAnswer: ['A', 'C'],
          feedback: 'Sangat baik. Memilih semua opsi peredam ombak dan perangkap sedimen.',
        },
        {
          soalId: 'soal-akm-03',
          nomorUrut: 3,
          jenisSoal: 'Menjodohkan',
          tingkatKognitif: 'C3',
          isHots: false,
          domain: 'Literasi Membaca',
          bobot: 20,
          pointsEarned: 20,
          maxPoints: 20,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: { P1: 'R1', P2: 'R2', P3: 'R3' },
          correctAnswer: { P1: 'R1', P2: 'R2', P3: 'R3' },
          feedback: 'Tepat sekali. Semua pasangan genus dan bentuk akar terpasang akurat.',
        },
        {
          soalId: 'soal-akm-04',
          nomorUrut: 4,
          jenisSoal: 'Uraian',
          tingkatKognitif: 'C5',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 13,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: true,
          studentAnswer: '1) Menanam kembali bibit mangrove sesuai zonasi: jenis Avicennia di zona terdepan penahan ombak dan Rhizophora di zona tengah. 2) Mengembangkan silvofishery ramah lingkungan dan rute ekowisata perahu edukasi bagi turis agar warga lokal memperoleh penghasilan.',
          correctAnswer: 'Prinsip zonasi botani + ide sosio-ekonomi berkelanjutan.',
          rubrikEvaluation: 'Memenuhi kedua rubrik secara mendalam dengan contoh konkret.',
          feedback: 'Analisis zonasi dan konsep ekowisata sangat matang.',
        },
        {
          soalId: 'soal-akm-05',
          nomorUrut: 5,
          jenisSoal: 'PG',
          tingkatKognitif: 'C5',
          isHots: true,
          domain: 'Numerasi',
          bobot: 15,
          pointsEarned: 15,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: 'A',
          correctAnswer: 'A',
          feedback: 'Penghitungan kalori akurat (720 kkal vs target 840 kkal).',
        },
        {
          soalId: 'soal-akm-06',
          nomorUrut: 6,
          jenisSoal: 'PGK',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Numerasi',
          bobot: 20,
          pointsEarned: 20,
          maxPoints: 20,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: ['A', 'C'],
          correctAnswer: ['A', 'C'],
          feedback: 'Tepat. Mengidentifikasi Paket 1 dan Paket 3 yang lolos uji batas kalori & protein.',
        },
      ],
      categoryBreakdown: {
        pgScore: { earned: 30, max: 30, count: 2 },
        pgkScore: { earned: 35, max: 35, count: 2 },
        menjodohkanScore: { earned: 20, max: 20, count: 1 },
        uraianScore: { earned: 13, max: 15, count: 1 },
        benarSalahScore: { earned: 0, max: 0, count: 0 },
      },
      domainBreakdown: {
        literasi: { earned: 63, max: 65, percentage: 96.9 },
        numerasi: { earned: 35, max: 35, percentage: 100 },
      },
      hotsMasteryRate: 96,
      hotsEarned: 78,
      hotsTotal: 80,
      needsTeacherGrading: false,
      completedAt: '2026-03-02T08:48:15Z',
    },
    last_sync_at: '2026-03-02T08:48:15Z',
  },
  {
    id: 'hasil-002',
    jadwal_id: 'jadwal-akm-fase-d-2026',
    siswa_id: 'siswa-002',
    siswa: MOCK_STUDENTS[1],
    status: 'selesai',
    waktu_mulai: '2026-03-02T08:00:00Z',
    waktu_selesai: '2026-03-02T08:52:10Z',
    sisa_waktu_detik: 470,
    jawaban_siswa: {
      'soal-akm-01': 'B',
      'soal-akm-02': ['A'], // Parsial (hanya memilih A, lupa C)
      'soal-akm-03': { P1: 'R1', P2: 'R2', P3: 'R3' },
      'soal-akm-04': 'Melakukan reboisasi hutan pantai dan mengajak pemuda desa menjaga pohon agar tidak ditebang.',
      'soal-akm-05': 'B', // Salah hitung
      'soal-akm-06': ['A', 'C'],
    },
    ragu_ragu: {},
    nilai_akhir: 68,
    detail_skor: {
      finalScore: 68,
      rawScore: 68,
      maxScore: 100,
      breakdown: [
        {
          soalId: 'soal-akm-01',
          nomorUrut: 1,
          jenisSoal: 'PG',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 15,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: 'B',
          correctAnswer: 'B',
        },
        {
          soalId: 'soal-akm-02',
          nomorUrut: 2,
          jenisSoal: 'PGK',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 7.5,
          maxPoints: 15,
          isCorrect: false,
          isPartiallyCorrect: true,
          studentAnswer: ['A'],
          correctAnswer: ['A', 'C'],
          feedback: 'Kredit proporsional: 1 dari 2 opsi benar terpilih.',
        },
        {
          soalId: 'soal-akm-03',
          nomorUrut: 3,
          jenisSoal: 'Menjodohkan',
          tingkatKognitif: 'C3',
          isHots: false,
          domain: 'Literasi Membaca',
          bobot: 20,
          pointsEarned: 20,
          maxPoints: 20,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: { P1: 'R1', P2: 'R2', P3: 'R3' },
          correctAnswer: { P1: 'R1', P2: 'R2', P3: 'R3' },
        },
        {
          soalId: 'soal-akm-04',
          nomorUrut: 4,
          jenisSoal: 'Uraian',
          tingkatKognitif: 'C5',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 5.5,
          maxPoints: 15,
          isCorrect: false,
          isPartiallyCorrect: true,
          studentAnswer: 'Melakukan reboisasi hutan pantai dan mengajak pemuda desa menjaga pohon agar tidak ditebang.',
          correctAnswer: 'Prinsip zonasi botani + ide sosio-ekonomi berkelanjutan.',
          rubrikEvaluation: 'Menyebutkan reboisasi secara umum namun belum mengaitkan zonasi dan pemberdayaan ekonomi.',
        },
        {
          soalId: 'soal-akm-05',
          nomorUrut: 5,
          jenisSoal: 'PG',
          tingkatKognitif: 'C5',
          isHots: true,
          domain: 'Numerasi',
          bobot: 15,
          pointsEarned: 0,
          maxPoints: 15,
          isCorrect: false,
          isPartiallyCorrect: false,
          studentAnswer: 'B',
          correctAnswer: 'A',
          feedback: 'Keliru menghitung total energi konsumsi makan siang.',
        },
        {
          soalId: 'soal-akm-06',
          nomorUrut: 6,
          jenisSoal: 'PGK',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Numerasi',
          bobot: 20,
          pointsEarned: 20,
          maxPoints: 20,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: ['A', 'C'],
          correctAnswer: ['A', 'C'],
        },
      ],
      categoryBreakdown: {
        pgScore: { earned: 15, max: 30, count: 2 },
        pgkScore: { earned: 27.5, max: 35, count: 2 },
        menjodohkanScore: { earned: 20, max: 20, count: 1 },
        uraianScore: { earned: 5.5, max: 15, count: 1 },
        benarSalahScore: { earned: 0, max: 0, count: 0 },
      },
      domainBreakdown: {
        literasi: { earned: 47.5, max: 65, percentage: 73.1 },
        numerasi: { earned: 20, max: 35, percentage: 57.1 },
      },
      hotsMasteryRate: 60,
      hotsEarned: 48,
      hotsTotal: 80,
      needsTeacherGrading: false,
      completedAt: '2026-03-02T08:52:10Z',
    },
    last_sync_at: '2026-03-02T08:52:10Z',
  },
  {
    id: 'hasil-003',
    jadwal_id: 'jadwal-akm-fase-d-2026',
    siswa_id: 'siswa-003',
    siswa: MOCK_STUDENTS[2],
    status: 'selesai',
    waktu_mulai: '2026-03-02T08:00:00Z',
    waktu_selesai: '2026-03-02T08:55:40Z',
    sisa_waktu_detik: 260,
    jawaban_siswa: {
      'soal-akm-01': 'B',
      'soal-akm-02': ['A', 'B'], // Memilih A (benar) dan B (salah)
      'soal-akm-03': { P1: 'R1', P2: 'R3', P3: 'R2' }, // 1 benar, 2 terbalik
      'soal-akm-04': 'Membuat pagar di laut dan menanam bibit pohon apa saja yang ada di pasar.',
      'soal-akm-05': 'A',
      'soal-akm-06': ['A'], // Parsial
    },
    ragu_ragu: {},
    nilai_akhir: 47,
    detail_skor: {
      finalScore: 47,
      rawScore: 47,
      maxScore: 100,
      breakdown: [
        {
          soalId: 'soal-akm-01',
          nomorUrut: 1,
          jenisSoal: 'PG',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 15,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: 'B',
          correctAnswer: 'B',
        },
        {
          soalId: 'soal-akm-02',
          nomorUrut: 2,
          jenisSoal: 'PGK',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 3.75, // Formula penalti
          maxPoints: 15,
          isCorrect: false,
          isPartiallyCorrect: true,
          studentAnswer: ['A', 'B'],
          correctAnswer: ['A', 'C'],
        },
        {
          soalId: 'soal-akm-03',
          nomorUrut: 3,
          jenisSoal: 'Menjodohkan',
          tingkatKognitif: 'C3',
          isHots: false,
          domain: 'Literasi Membaca',
          bobot: 20,
          pointsEarned: 6.67, // 1 dari 3 pasang benar
          maxPoints: 20,
          isCorrect: false,
          isPartiallyCorrect: true,
          studentAnswer: { P1: 'R1', P2: 'R3', P3: 'R2' },
          correctAnswer: { P1: 'R1', P2: 'R2', P3: 'R3' },
        },
        {
          soalId: 'soal-akm-04',
          nomorUrut: 4,
          jenisSoal: 'Uraian',
          tingkatKognitif: 'C5',
          isHots: true,
          domain: 'Literasi Membaca',
          bobot: 15,
          pointsEarned: 2,
          maxPoints: 15,
          isCorrect: false,
          isPartiallyCorrect: false,
          studentAnswer: 'Membuat pagar di laut dan menanam bibit pohon apa saja yang ada di pasar.',
          correctAnswer: 'Prinsip zonasi botani + ide sosio-ekonomi berkelanjutan.',
        },
        {
          soalId: 'soal-akm-05',
          nomorUrut: 5,
          jenisSoal: 'PG',
          tingkatKognitif: 'C5',
          isHots: true,
          domain: 'Numerasi',
          bobot: 15,
          pointsEarned: 15,
          maxPoints: 15,
          isCorrect: true,
          isPartiallyCorrect: false,
          studentAnswer: 'A',
          correctAnswer: 'A',
        },
        {
          soalId: 'soal-akm-06',
          nomorUrut: 6,
          jenisSoal: 'PGK',
          tingkatKognitif: 'C4',
          isHots: true,
          domain: 'Numerasi',
          bobot: 20,
          pointsEarned: 10,
          maxPoints: 20,
          isCorrect: false,
          isPartiallyCorrect: true,
          studentAnswer: ['A'],
          correctAnswer: ['A', 'C'],
        },
      ],
      categoryBreakdown: {
        pgScore: { earned: 30, max: 30, count: 2 },
        pgkScore: { earned: 13.75, max: 35, count: 2 },
        menjodohkanScore: { earned: 6.67, max: 20, count: 1 },
        uraianScore: { earned: 2, max: 15, count: 1 },
        benarSalahScore: { earned: 0, max: 0, count: 0 },
      },
      domainBreakdown: {
        literasi: { earned: 27.42, max: 65, percentage: 42.2 },
        numerasi: { earned: 25, max: 35, percentage: 71.4 },
      },
      hotsMasteryRate: 45,
      hotsEarned: 35.75,
      hotsTotal: 80,
      needsTeacherGrading: false,
      completedAt: '2026-03-02T08:55:40Z',
    },
    last_sync_at: '2026-03-02T08:55:40Z',
  },
];

/**
 * Helper to get the full exam object with questions and stimuli populated
 */
export const getMockExamWithDetails = (scheduleId: string = 'jadwal-akm-fase-d-2026'): ExamWithDetails => {
  const schedule = MOCK_SCHEDULES.find((s) => s.id === scheduleId) || MOCK_SCHEDULES[0];
  
  const questionMap = new Map<string, Soal>();
  MOCK_QUESTIONS.forEach((q) => questionMap.set(q.id, q));

  const stimulusMap = new Map<string, Stimulus>();
  MOCK_STIMULI.forEach((s) => stimulusMap.set(s.id, s));

  const questionsWithStimulus = schedule.soal_ids
    .map((qid) => questionMap.get(qid))
    .filter((q): q is Soal => Boolean(q))
    .map((q) => {
      const stimulus = q.stimulus_id ? stimulusMap.get(q.stimulus_id) : undefined;
      return {
        ...q,
        stimulus,
      };
    });

  return {
    ...schedule,
    soal_list: questionsWithStimulus,
    stimuli_list: MOCK_STIMULI,
  };
};

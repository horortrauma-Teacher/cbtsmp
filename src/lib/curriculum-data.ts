/**
 * Katalog Kurikulum Nasional & Kurikulum Merdeka
 * Mata Pelajaran dan Topik Materi Lengkap untuk Jenjang SMP (Fase D) dan SMA (Fase E/F)
 * Dikelola oleh: El Fath (Database Architect)
 */

export type JenjangPendidikan = 'SMP' | 'SMA';

export interface TopikMateri {
  id: string;
  nama: string;
  deskripsi: string;
  kataKunci?: string[];
  levelRekomendasi?: string;
}

export interface MataPelajaranDetail {
  id: string;
  nama: string;
  kategori: 'Wajib' | 'Pilihan MIPA' | 'Pilihan IPS' | 'Pilihan Bahasa' | 'Vokasi/Muatan Lokal';
  ikon?: string;
  topik: TopikMateri[];
}

export interface KurikulumJenjang {
  fase: string[];
  kelas: string[];
  mataPelajaran: MataPelajaranDetail[];
}

export const KURIKULUM_DATA: Record<JenjangPendidikan, KurikulumJenjang> = {
  SMP: {
    fase: ['Fase D (SMP)'],
    kelas: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
    mataPelajaran: [
      {
        id: 'smp-bindo',
        nama: 'Bahasa Indonesia (Literasi)',
        kategori: 'Wajib',
        topik: [
          { id: 'bi-smp-01', nama: 'Teks Deskripsi & Objek Budaya Nusantara', deskripsi: 'Mengidentifikasi informasi rinci, struktur, dan kebahasaan teks deskripsi' },
          { id: 'bi-smp-02', nama: 'Puisi Rakyat & Pantun Tradisional', deskripsi: 'Memahami rima, bait, makna kata kias, dan nilai kearifan lokal' },
          { id: 'bi-smp-03', nama: 'Teks Prosedur & Wacana Kritis', deskripsi: 'Tahapan sistematis, konjungsi temporal, dan kalimat imperatif' },
          { id: 'bi-smp-04', nama: 'Teks Cerita Pendek (Cerpen) & Resensi', deskripsi: 'Unsur intrinsik, pesan moral, amanat, dan alur dramatik' },
          { id: 'bi-smp-05', nama: 'Teks Berita & Literasi Informasi Digital', deskripsi: 'Unsur 5W+1H (Adiksimba), verifikasi hoaks, dan fakta vs opini' },
          { id: 'bi-smp-06', nama: 'Teks Diskusi & Argumentasi Dua Arah', deskripsi: 'Sudut pandang pro-kontra dan penalaran logis solutif' },
          { id: 'bi-smp-07', nama: 'Wacana AKM Literasi Membaca Kontekstual', deskripsi: 'Analisis stimulus wacana sosial, saintifik, dan evaluasi isi' }
        ]
      },
      {
        id: 'smp-mat',
        nama: 'Matematika (Numerasi)',
        kategori: 'Wajib',
        topik: [
          { id: 'mat-smp-01', nama: 'Bilangan Bulat, Pecahan & Rasional', deskripsi: 'Operasi hitung campuran, representasi garis bilangan, dan aplikasi kehidupan' },
          { id: 'mat-smp-02', nama: 'Aljabar & Persamaan Linear Satu Variabel (PLSV)', deskripsi: 'Suku sejenis, pemodelan matematika, dan penyelesaian masalah kontekstual' },
          { id: 'mat-smp-03', nama: 'Aritmetika Sosial & Rasio Proporsi', deskripsi: 'Diskon, pajak, untung-rugi, bunga tunggal, skala peta, dan perbandingan' },
          { id: 'mat-smp-04', nama: 'Geometri & Bangun Datar (Segi Empat & Segitiga)', deskripsi: 'Keliling, luas, teorema Pythagoras, dan sudut dalam bangun datar' },
          { id: 'mat-smp-05', nama: 'Bangun Ruang Sisi Datar (Kubus, Balok, Prisma, Limas)', deskripsi: 'Luas permukaan, volume, jaring-jaring, dan diagonal ruang' },
          { id: 'mat-smp-06', nama: 'Statistika & Analisis Data Diagram', deskripsi: 'Mean, median, modus, kuartil, interpretasi tabel dan grafik batang/lingkaran' },
          { id: 'mat-smp-07', nama: 'Peluang Teoretik & Peluang Empirik', deskripsi: 'Ruang sampel, titik sampel, dan frekuensi harapan dalam simulasi' },
          { id: 'mat-smp-08', nama: 'Pola Bilangan, Barisan & Pola Konfigurasi Objek', deskripsi: 'Barisan aritmetika dasar, barisan bertingkat, dan generalisasi rumus ke-n' }
        ]
      },
      {
        id: 'smp-ipa',
        nama: 'Ilmu Pengetahuan Alam (IPA)',
        kategori: 'Wajib',
        topik: [
          { id: 'ipa-smp-01', nama: 'Hakikat Sains, Pengukuran & Metode Ilmiah', deskripsi: 'Besaran pokok, turunan, ketelitian alat ukur, dan variabel eksperimen' },
          { id: 'ipa-smp-02', nama: 'Klasifikasi Makhluk Hidup & Interaksi Ekosistem', deskripsi: 'Rantai makanan, jaring-jaring, simbiosis, piramida ekologi, dan daur materi' },
          { id: 'ipa-smp-03', nama: 'Zat, Sifat, Wujud & Perubahannya', deskripsi: 'Perubahan fisika, kimia, pemisahan campuran, asam-basa, dan indikator' },
          { id: 'ipa-smp-04', nama: 'Energi, Suhu, Kalor & Dinamika Gerak Benda', deskripsi: 'Konversi suhu, perpindahan kalor, Hukum Newton I, II, III, dan GLB/GLBB' },
          { id: 'ipa-smp-05', nama: 'Sistem Organ Manusia (Pencernaan, Pernapasan, Peredaran Darah)', deskripsi: 'Struktur jaringan, enzim, mekanisme pertukaran gas, dan kelainan organ' },
          { id: 'ipa-smp-06', nama: 'Tekanan Zat (Padat, Cair, Gas) & Hukum Archimedes', deskripsi: 'Tekanan hidrostatis, bejana berhubungan, hukum Pascal, dan gaya apung' },
          { id: 'ipa-smp-07', nama: 'Gelombang, Bunyi, Cahaya & Alat Optik', deskripsi: 'Frekuensi, cepat rambat, pembiasan cahaya, lensa cembung/cekung, dan mata' },
          { id: 'ipa-smp-08', nama: 'Tata Surya, Struktur Bumi, Lapisan Atmosfer & Mitigasi Gempa', deskripsi: 'Rotasi/revolusi bumi, gerhana, lempeng tektonik, dan mitigasi bencana' }
        ]
      },
      {
        id: 'smp-ips',
        nama: 'Ilmu Pengetahuan Sosial (IPS)',
        kategori: 'Wajib',
        topik: [
          { id: 'ips-smp-01', nama: 'Kondisi Geografis & Keragaman Alam Indonesia', deskripsi: 'Letak astronomis/geologis, iklim tropis, flora-fauna Garis Wallace/Weber' },
          { id: 'ips-smp-02', nama: 'Interaksi Sosial, Lembaga Sosial & Dinamika Penduduk', deskripsi: 'Bentuk asosiatif/disosiatif, piramida penduduk, urbanisasi, dan mobilitas' },
          { id: 'ips-smp-03', nama: 'Aktivitas Ekonomi, Kelangkaan & Terbentuknya Pasar', deskripsi: 'Kebutuhan manusia, permintaan-penawaran, harga keseimbangan, dan distribusi' },
          { id: 'ips-smp-04', nama: 'Masa Praaksara, Kerajaan Hindu-Buddha & Islam', deskripsi: 'Peninggalan artefak, jalur perdagangan maritim kuno, dan akulturasi budaya' },
          { id: 'ips-smp-05', nama: 'Masa Penjajahan Bangsa Barat & Pergerakan Nasional', deskripsi: 'VOC, tanam paksa, politik etis, Budi Utomo, dan Sumpah Pemuda 1928' },
          { id: 'ips-smp-06', nama: 'Kerjasama Kawasan Regional ASEAN & Globalisasi', deskripsi: 'Pilar kerjasama ASEAN ekonomi, politik, sosial-budaya dan tantangan era digital' },
          { id: 'ips-smp-07', nama: 'Pemberdayaan Masyarakat & Ekonomi Maritim Indonesia', deskripsi: 'Potensi kelautan, agrikultur, ekonomi kreatif, dan pemerataan kesejahteraan' }
        ]
      },
      {
        id: 'smp-bing',
        nama: 'Bahasa Inggris',
        kategori: 'Wajib',
        topik: [
          { id: 'bing-smp-01', nama: 'Descriptive Text (People, Animals, Famous Landmarks)', deskripsi: 'Identification, description characteristics, adjectives, and simple present' },
          { id: 'bing-smp-02', nama: 'Recount Text (Personal Experience & Historical Events)', deskripsi: 'Orientation, events sequence, re-orientation, past tense, and conjunctions' },
          { id: 'bing-smp-03', nama: 'Narrative Text (Fables, Folktales & Legends)', deskripsi: 'Complication, resolution, moral value, direct speech, and character traits' },
          { id: 'bing-smp-04', nama: 'Procedure Text (Recipes, Manuals & Life Hacks)', deskripsi: 'Goal, materials, step-by-step imperative sentences, and adverbs of sequence' },
          { id: 'bing-smp-05', nama: 'Notice, Announcement & Short Functional Texts', deskripsi: 'Short messages, public notices, cautions, greeting cards, and invitations' },
          { id: 'bing-smp-06', nama: 'Transactional Dialogues (Agreement, Opinions & Intentions)', deskripsi: 'Expressing hope, wish, complimenting, making requests, and everyday spoken' }
        ]
      },
      {
        id: 'smp-ppkn',
        nama: 'Pendidikan Pancasila (PPKn)',
        kategori: 'Wajib',
        topik: [
          { id: 'ppkn-smp-01', nama: 'Kelahiran, Perumusan & Penetapan Pancasila sebagai Dasar Negara', deskripsi: 'Sidang BPUPKI, Piagam Jakarta, Panitia Sembilan, dan komitmen para pendiri' },
          { id: 'ppkn-smp-02', nama: 'Norma Sosial, Keadilan & Tata Hukum Nasional', deskripsi: 'Norma agama, kesusilaan, kesopanan, hukum, serta kesadaran hukum masyarakat' },
          { id: 'ppkn-smp-03', nama: 'Keberagaman SARA & Bhinneka Tunggal Ika', deskripsi: 'Persatuan dalam keragaman suku, agama, ras, dan antargolongan' },
          { id: 'ppkn-smp-04', nama: 'UUD NRI Tahun 1945 & Hak-Kewajiban Warga Negara', deskripsi: 'Hierarki perundang-undangan di Indonesia dan perlindungan hak asasi manusia' },
          { id: 'ppkn-smp-05', nama: 'Semangat Sumpah Pemuda & Bela Negara Kesatuan RI', deskripsi: 'Wawasan kebangsaan, kedaulatan wilayah NKRI, dan peran pemuda' }
        ]
      },
      {
        id: 'smp-inf',
        nama: 'Informatika',
        kategori: 'Wajib',
        topik: [
          { id: 'inf-smp-01', nama: 'Berpikir Komputasional (Decomposisi, Pola, Abstraksi, Algoritma)', deskripsi: 'Pemecahan masalah logis, diagram alir, dan logika struktur keputusan' },
          { id: 'inf-smp-02', nama: 'Teknologi Informasi & Komunikasi (Aplikasi Perkantoran)', deskripsi: 'Integrasi dokumen teks, lembar kerja spreadsheet, dan presentasi multimedia' },
          { id: 'inf-smp-03', nama: 'Sistem Komputer (Hardware, Software & Brainware)', deskripsi: 'Interaksi komponen CPU, RAM, memori penyimpanan, dan sistem operasi' },
          { id: 'inf-smp-04', nama: 'Jaringan Komputer, Topologi & Keamanan Internet', deskripsi: 'Internet vs intranet, enkripsi, bahaya phishing, malware, dan etika digital' },
          { id: 'inf-smp-05', nama: 'Analisis Data & Visualisasi Lembar Kerja', deskripsi: 'Penggunaan rumus SUM, AVERAGE, IF, VLOOKUP, dan grafik tren data' },
          { id: 'inf-smp-06', nama: 'Algoritma Pemrograman Visual (Scratch / Block-based)', deskripsi: 'Struktur sekuensial, perulangan (loop), kondisi logika if-else, dan variabel' },
          { id: 'inf-smp-07', nama: 'Membedakan Fakta dan Opini', deskripsi: 'Literasi informasi digital, verifikasi kebenaran berita, identifikasi disinformasi/hoaks, dan berpikir kritis di ruang siber' },
          { id: 'inf-smp-08', nama: 'Ekosistem Media Pers Digital', deskripsi: 'Jurnalistik siber, etika media digital, peran pers resmi vs media sosial, algoritma kurasi berita, dan Undang-Undang ITE' }
        ]
      },
      {
        id: 'smp-pai',
        nama: 'Pendidikan Agama Islam (PAI)',
        kategori: 'Wajib',
        topik: [
          { id: 'pai-smp-01', nama: 'Al-Qur\'an & Hadis: Hukum Bacaan Tajwid dan Nilai Akhlak', deskripsi: 'Nun mati/tanwin, mim mati, mad, serta tafsir ayat toleransi dan etos belajar' },
          { id: 'pai-smp-02', nama: 'Akidah & Rukun Iman (Iman kepada Kitab & Rasul Allah)', deskripsi: 'Meneladani sifat wajib/mustahil rasul dan mukjizat para nabi' },
          { id: 'pai-smp-03', nama: 'Akhlak Terpuji (Jujur, Amanah, Menghargai Orang Tua & Guru)', deskripsi: 'Penerapan adab keseharian dan menjaga lisan di media sosial' },
          { id: 'pai-smp-04', nama: 'Fikih Ibadah: Shalat Sunnah, Zakat, Puasa & Sujud Syukur', deskripsi: 'Ketentuan syarat rukun, hikmah pembersihan harta, dan tata cara sujud sahwi/tilawah' },
          { id: 'pai-smp-05', nama: 'Sejarah Peradaban Islam: Khulafaur Rasyidin & Daulah Islamiah', deskripsi: 'Kepemimpinan Abu Bakar, Umar, Utsman, Ali dan perkembangan ilmu pengetahuan' }
        ]
      },
      {
        id: 'smp-pjok',
        nama: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
        kategori: 'Wajib',
        topik: [
          { id: 'pjok-smp-01', nama: 'Permainan Bola Besar (Sepak Bola, Bola Voli, Bola Basket)', deskripsi: 'Teknik dasar passing, dribbling, shooting, dan peraturan pertandingan' },
          { id: 'pjok-smp-02', nama: 'Permainan Bola Kecil & Atletik (Lari Jarak Pendek, Lompat Jauh)', deskripsi: 'Teknik start jongkok, tolakan lompat, bulu tangkis, dan tenis meja' },
          { id: 'pjok-smp-03', nama: 'Kebugaran Jasmani & Latihan Daya Tahan Jantung-Paru', deskripsi: 'Push-up, sit-up, shuttle run, pengukuran denyut nadi, dan kelenturan' },
          { id: 'pjok-smp-04', nama: 'Senam Lantai & Gerak Berirama', deskripsi: 'Guling depan, guling belakang, sikap lilin, dan kombinasi langkah senam ritmik' },
          { id: 'pjok-smp-05', nama: 'Pola Hidup Sehat, Gizi Seimbang & Pencegahan NAPZA', deskripsi: 'Nutrisi makro-mikro, dampak buruk rokok/minuman keras, dan P3K luka ringan' }
        ]
      },
      {
        id: 'smp-seni',
        nama: 'Seni Budaya & Prakarya',
        kategori: 'Wajib',
        topik: [
          { id: 'seni-smp-01', nama: 'Seni Rupa: Menggambar Flora, Fauna, Alam Benda & Ragam Hias', deskripsi: 'Proporsi, komposisi, gelap terang, dan motif ornamen tradisional' },
          { id: 'seni-smp-02', nama: 'Seni Musik: Bernyanyi Unisono & Musik Ansambel Tradisional', deskripsi: 'Tangga nada diatonis/pentatonis, teknik vokal pernapasan diafragma, dan alat musik daerah' },
          { id: 'seni-smp-03', nama: 'Seni Tari: Level dan Pola Lantai Gerak Tari Nusantara', deskripsi: 'Wiraga, wirama, wirasa, tata rias, dan properti tari tradisional' },
          { id: 'seni-smp-04', nama: 'Seni Teater: Dasar Pemeranan & Olah Tubuh/Suara', deskripsi: 'Konsentrasi, imajinasi karakter, dialog naskah monolog dan drama pendek' },
          { id: 'seni-smp-05', nama: 'Prakarya: Rekayasa Alat Sederhana & Kerajinan Bahan Lunak/Keras', deskripsi: 'Pemanfaatan limbah kertas/plastik/kayu, teknik cetak, dan nilai ekonomis produk' }
        ]
      }
    ]
  },
  SMA: {
    fase: ['Fase E (SMA 10)', 'Fase F (SMA 11-12)'],
    kelas: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
    mataPelajaran: [
      {
        id: 'sma-mat-umum',
        nama: 'Matematika (Umum)',
        kategori: 'Wajib',
        topik: [
          { id: 'mat-sma-01', nama: 'Eksponen, Logaritma & Bentuk Akar', deskripsi: 'Sifat-sifat eksponen, grafik fungsi pertumbuhan/peluruhan, dan aplikasi bunga majemuk' },
          { id: 'mat-sma-02', nama: 'Barisan & Deret (Aritmetika, Geometri & Deret Tak Hingga)', deskripsi: 'Beda, rasio, rumus suku ke-n, jumlah n suku pertama, dan konvergensi deret' },
          { id: 'mat-sma-03', nama: 'Sistem Persamaan & Pertidaksamaan Linear Tiga Variabel (SPLTV)', deskripsi: 'Metode eliminasi-substitusi, determinan matriks, dan model matematika ekonomi' },
          { id: 'mat-sma-04', nama: 'Fungsi Kuadrat, Komposisi Fungsi & Fungsi Invers', deskripsi: 'Domain, kodomain, fungsi f(g(x)), sifat surjektif/injektif/bijektif' },
          { id: 'mat-sma-05', nama: 'Trigonometri Dasar & Aturan Sinus-Cosinus', deskripsi: 'Perbandingan sudut istimewa, kuadran I-IV, identitas trigonometri, dan luas segitiga' },
          { id: 'mat-sma-06', nama: 'Geometri Dimensi Tiga (Jarak Titik, Garis & Bidang)', deskripsi: 'Proyeksi ortogonal, sudut antar bidang, dan jarak titik ke garis pada kubus/limas' },
          { id: 'mat-sma-07', nama: 'Statistika Data Berkelompok & Ukuran Penyebaran', deskripsi: 'Histogram, ogive, mean data kelompok, ragam, dan standar deviasi' },
          { id: 'mat-sma-08', nama: 'Kaidah Pencacahan, Permutasi, Kombinasi & Peluang Majemuk', deskripsi: 'Aturan perkalian, permutasi siklis, kombinasi nCr, dan kejadian saling bebas/lepas' }
        ]
      },
      {
        id: 'sma-mat-lanjut',
        nama: 'Matematika Tingkat Lanjut',
        kategori: 'Pilihan MIPA',
        topik: [
          { id: 'matlan-sma-01', nama: 'Polinomial & Teorema Sisa / Faktor', deskripsi: 'Pembagian Horner, akar-akar rasional, dan kesamaan suku banyak' },
          { id: 'matlan-sma-02', nama: 'Matriks & Transformasi Geometri Analitik', deskripsi: 'Operasi matriks, invers ordo 2x2 dan 3x3, translasi, rotasi, refleksi, dilatasi' },
          { id: 'matlan-sma-03', nama: 'Vektor pada Ruang Dimensi Dua (R2) dan Dimensi Tiga (R3)', deskripsi: 'Panjang vektor, perkalian titik (dot product), perkalian silang (cross product)' },
          { id: 'matlan-sma-04', nama: 'Persamaan Trigonometri Lanjut & Rumus Jumlah/Selisih Sudut', deskripsi: 'Sin (A±B), Cos (A±B), sudut rangkap, dan persamaan bentuk a cos x + b sin x = c' },
          { id: 'matlan-sma-05', nama: 'Kalkulus Differensial: Limit Fungsi Aljabar/Trigonometri & Turunan', deskripsi: 'Dalil L\'Hopital, turunan fungsi trigonometri, aturan rantai, dan garis singgung kurva' },
          { id: 'matlan-sma-06', nama: 'Kalkulus Integral: Integral Tak Tentu, Tertentu & Volume Benda Putar', deskripsi: 'Metode substitusi, parsial, luas daerah di bawah kurva, dan metode cakram' }
        ]
      },
      {
        id: 'sma-bindo',
        nama: 'Bahasa Indonesia',
        kategori: 'Wajib',
        topik: [
          { id: 'bi-sma-01', nama: 'Teks Laporan Hasil Observasi (LHO) Saintifik', deskripsi: 'Struktur klasifikasi umum, deskripsi bagian/manfaat, verba relasional, dan objektivitas' },
          { id: 'bi-sma-02', nama: 'Teks Anekdot & Kritik Sosial Kritis', deskripsi: 'Sindiran humoris, struktur abstraksi hingga koda, dan konjungsi kausalitas' },
          { id: 'bi-sma-03', nama: 'Teks Negosiasi & Debat Ilmiah Argumentatif', deskripsi: 'Strategi tawar-menawar win-win solution, argumen mosi, bukti empiris, dan bantahan' },
          { id: 'bi-sma-04', nama: 'Teks Eksplanasi Fenomena Alam & Sosial', deskripsi: 'Kausalitas kronologis sebab-akibat, istilah teknis, dan interpretasi penutup' },
          { id: 'bi-sma-05', nama: 'Artikel Opini Ilmiah Populer & Teks Editorial', deskripsi: 'Fakta penunjang, opini redaksi, solusi rekomendasi, dan gaya bahasa persuasif' },
          { id: 'bi-sma-06', nama: 'Karya Ilmiah & Proposal Kegiatan/Penelitian', deskripsi: 'Latar belakang masalah, rumusan masalah, metodologi penelitian, dan daftar pustaka APA' },
          { id: 'bi-sma-07', nama: 'Kritik Sastra & Esai Apresiasi Budaya', deskripsi: 'Pendekatan objektif/struktural karya sastra, perbandingan novel, dan penilaian estetika' }
        ]
      },
      {
        id: 'sma-bing',
        nama: 'Bahasa Inggris',
        kategori: 'Wajib',
        topik: [
          { id: 'bing-sma-01', nama: 'Analytical Exposition Text & Critical Arguments', deskripsi: 'Thesis statement, elaborative arguments, reiteration, and emotive language' },
          { id: 'bing-sma-02', nama: 'Hortatory Exposition Text & Policy Recommendations', deskripsi: 'Persuasive reasoning, passive voice, modal auxiliaries, and recommending actions' },
          { id: 'bing-sma-03', nama: 'Discussion Text & Contemporary Social Issues', deskripsi: 'Contrasting viewpoints (pros & cons), connectors of contrast, and balanced conclusion' },
          { id: 'bing-sma-04', nama: 'News Item Text & Press Conference Reporting', deskripsi: 'Newsworthy event, background context, quotes from official sources, and headline' },
          { id: 'bing-sma-05', nama: 'Application Letters, CV & Formal Inquiries', deskripsi: 'Salutation, professional qualifications, portfolio summary, and formal tone' },
          { id: 'bing-sma-06', nama: 'English for AKM: Complex Scientific & Literary Reading', deskripsi: 'Inferencing, synthesizing multiple texts, fact checking, and vocabulary in context' }
        ]
      },
      {
        id: 'sma-fisika',
        nama: 'Fisika',
        kategori: 'Pilihan MIPA',
        topik: [
          { id: 'fis-sma-01', nama: 'Kinematika & Dinamika Partikel (Hukum Gerak Newton)', deskripsi: 'Gerak parabola, gerak melingkar beraturan, gaya gesek, tegangan tali, dan diagram benda bebas' },
          { id: 'fis-sma-02', nama: 'Hukum Gravitasi Newton & Hukum Kepler', deskripsi: 'Kuat medan gravitasi, energi potensial gravitasi, kecepatan orbit satelit, dan periode planet' },
          { id: 'fis-sma-03', nama: 'Usaha, Energi & Hukum Kekekalan Energi Mekanik', deskripsi: 'Teorema usaha-energi kinetik, gaya konservatif, daya, dan efisiensi mesin' },
          { id: 'fis-sma-04', nama: 'Momentum, Impuls & Tumbukan (Lenting & Tak Lenting)', deskripsi: 'Hukum kekekalan momentum linier, koefisien restitusi, dan tumbukan dua dimensi' },
          { id: 'fis-sma-05', nama: 'Dinamika Rotasi & Kesetimbangan Benda Tegar', deskripsi: 'Momen inersia, torsi, momentum sudut, gerak menggelinding, dan pusat massa' },
          { id: 'fis-sma-06', nama: 'Fluida Statis & Dinamis (Hukum Bernoulli & Torricelli)', deskripsi: 'Tekanan hidrostatis, tegangan permukaan, debit aliran, kontinuitas, dan tabung venturi' },
          { id: 'fis-sma-07', nama: 'Termodinamika, Teori Kinetik Gas & Siklus Carnot', deskripsi: 'Hukum I dan II Termodinamika, proses isobarik/isokhorik/isotermal, dan efisiensi mesin kalor' },
          { id: 'fis-sma-08', nama: 'Listrik Dinamis, Induksi Elektromagnetik & Fisika Modern', deskripsi: 'Hukum Kirchhoff, GGL induksi Faraday, transformator, efek fotolistrik, dan relativitas khusus' }
        ]
      },
      {
        id: 'sma-kimia',
        nama: 'Kimia',
        kategori: 'Pilihan MIPA',
        topik: [
          { id: 'kim-sma-01', nama: 'Struktur Atom, Konfigurasi Elektron & Tabel Periodik', deskripsi: 'Nomor atom, massa atom, bilangan kuantum, jari-jari atom, energi ionisasi, dan elektronegativitas' },
          { id: 'kim-sma-02', nama: 'Ikatan Kimia, Bentuk Molekul (VSEPR) & Kepolaran', deskripsi: 'Ikatan ionik, kovalen koordinasi, gaya antarmolekul London/ikatan hidrogen' },
          { id: 'kim-sma-03', nama: 'Stoikiometri & Hukum Dasar Kimia (Lavoisier, Proust, Dalton)', deskripsi: 'Konsep mol, massa molar, pereaksi pembatas, rumus empiris, dan kadar unsur dalam senyawa' },
          { id: 'kim-sma-04', nama: 'Larutan Elektrolit, Asam-Basa & Derajat Keasaman (pH)', deskripsi: 'Teori Arrhenius, Bronsted-Lowry, Lewis, titrasi asam-basa, dan indikator universal' },
          { id: 'kim-sma-05', nama: 'Termokimia & Entalpi Reaksi (Hukum Hess)', deskripsi: 'Reaksi eksoterm/endoterm, kalorimetri, energi ikatan rata-rata, dan entalpi pembentukan standar' },
          { id: 'kim-sma-06', nama: 'Laju Reaksi & Kesetimbangan Kimia (Le Chatelier)', deskripsi: 'Teori tumbukan, orde reaksi, faktor suhu/konsentrasi/katalis, Kc dan Kp' },
          { id: 'kim-sma-07', nama: 'Larutan Penyangga (Buffer) & Hidrolisis Garam', deskripsi: 'Sistem penyangga biologis darah, pH garam terhidrolisis total/sebagian, dan Ksp kelarutan' },
          { id: 'kim-sma-08', nama: 'Senyawa Hidrokarbon, Minyak Bumi & Makromolekul (Polimer)', deskripsi: 'Alkana, alkena, alkuna, isomer fungsi gugus karbonil/alkohol, dan polimerisasi' }
        ]
      },
      {
        id: 'sma-biologi',
        nama: 'Biologi',
        kategori: 'Pilihan MIPA',
        topik: [
          { id: 'bio-sma-01', nama: 'Keanekaragaman Hayati, Virus & Monera/Protista', deskripsi: 'Tingkat gen-spesies-ekosistem, replikasi litik/lisogenik virus, dan bakteri gram positif/negatif' },
          { id: 'bio-sma-02', nama: 'Struktur Sel, Organel & Mekanisme Transpor Membran', deskripsi: 'Difusi sederhana, difusi terfasilitasi, osmosis, pompa ion Na+/K+, endositosis/eksositosis' },
          { id: 'bio-sma-03', nama: 'Struktur & Fungsi Jaringan Tumbuhan dan Hewan', deskripsi: 'Meristem, xilem/floem, jaringan epitel, jaringan ikat, otot, dan saraf' },
          { id: 'bio-sma-04', nama: 'Metabolisme Sel: Enzim, Respirasi Seluler & Fotosintesis', deskripsi: 'Glikolisis, dekarboksilasi oksidatif, siklus Krebs, fosforilasi transfer elektron, reaksi terang/gelap' },
          { id: 'bio-sma-05', nama: 'Genetika: Struktur DNA, RNA & Sintesis Protein', deskripsi: 'Kode genetik kodon-antikodon, transkripsi, translasi ribosom, dan replikasi semikonservatif' },
          { id: 'bio-sma-06', nama: 'Pembelahan Sel (Mitosis, Meiosis) & Gametogenesis', deskripsi: 'Fase profase-metafase-anafase-telofase, spermatogenesis, oogenesis, dan crossing over' },
          { id: 'bio-sma-07', nama: 'Hereditas: Hukum Mendel & Penyimpangan Semu', deskripsi: 'Monohibrid, dihibrid, atavisme, kriptomeri, polimeri, tautan seks, dan golongan darah ABO/Rh' },
          { id: 'bio-sma-08', nama: 'Evolusi, Teori Seleksi Alam & Bioteknologi Konvensional/Modern', deskripsi: 'Fosil, homologi organ, rekayasa genetika plasmid, kloning, kultur jaringan, dan CRISPR' }
        ]
      },
      {
        id: 'sma-ekonomi',
        nama: 'Ekonomi',
        kategori: 'Pilihan IPS',
        topik: [
          { id: 'eko-sma-01', nama: 'Konsep Dasar Ilmu Ekonomi, Kelangkaan & Skala Prioritas', deskripsi: 'Biaya peluang (opportunity cost), literasi keuangan, dan motif ekonomi' },
          { id: 'eko-sma-02', nama: 'Pelaku Ekonomi (Circular Flow Diagram) & Perilaku Konsumen-Produsen', deskripsi: 'Rumah tangga konsumen, produsen, pemerintah, luar negeri, kurva indiferensi' },
          { id: 'eko-sma-03', nama: 'Keseimbangan Pasar & Elastisitas Permintaan / Penawaran', deskripsi: 'Fungsi permintaan Pd = f(Qd), pergeseran kurva, elastisitas harga/pendapatan, dan subsidi/pajak' },
          { id: 'eko-sma-04', nama: 'Uang, Bank Sentral, Lembaga Keuangan & OJK', deskripsi: 'Kebijakan moneter BI (diskonto, operasi pasar terbuka, cadangan kas), dan fintech' },
          { id: 'eko-sma-05', nama: 'Pendapatan Nasional (PDB, PNB, NNI) & Pertumbuhan Ekonomi', deskripsi: 'Pendekatan produksi/pengeluaran/pendapatan, inflasi IHK, indeks Gini, dan pengangguran' },
          { id: 'eko-sma-06', nama: 'APBN, APBD, Kebijakan Fiskal & Perpajakan', deskripsi: 'Sumber penerimaan negara, tarif pajak progresif/proporsional, dan stimulus fiskal' },
          { id: 'eko-sma-07', nama: 'Akuntansi Dasar: Persamaan Dasar, Jurnal Umum & Buku Besar', deskripsi: 'Aktiva = Kewajiban + Modal, debit-kredit transaksi usaha jasa, neraca saldo, dan laporan laba-rugi' }
        ]
      },
      {
        id: 'sma-sosiologi',
        nama: 'Sosiologi',
        kategori: 'Pilihan IPS',
        topik: [
          { id: 'sos-sma-01', nama: 'Fungsi Sosiologi Mengkaji Gejala Sosial dalam Masyarakat', deskripsi: 'Ciri sosiologi kumulatif, empiris, teoretis, non-etis, dan imajinasi sosiologis' },
          { id: 'sos-sma-02', nama: 'Identitas Diri, Sosialisasi & Pembentukan Kepribadian', deskripsi: 'Agen sosialisasi primer/sekunder, norma sosial, dan penyimpangan sosial (labeling theory)' },
          { id: 'sos-sma-03', nama: 'Struktur Sosial: Diferensiasi & Stratifikasi Sosial', deskripsi: 'Kriteria ascribed/achieved status, kelas sosial, kasta, dan konsolidasi sosial' },
          { id: 'sos-sma-04', nama: 'Konflik Sosial, Kekerasan & Resolusi Perdamaian', deskripsi: 'Bentuk mediasi, arbitrase, konsiliasi, rekonsiliasi, dan integrasi sosial pascakonflik' },
          { id: 'sos-sma-05', nama: 'Perubahan Sosial, Modernisasi & Dampak Globalisasi', deskripsi: 'Teori siklus/linier perubahan sosial, westernisasi, kesenjangan budaya (cultural lag)' },
          { id: 'sos-sma-06', nama: 'Metodologi Penelitian Sosial: Kuantitatif & Kualitatif', deskripsi: 'Rumusan masalah, kuesioner, wawancara mendalam, triangulasi data, dan etika penelitian' }
        ]
      },
      {
        id: 'sma-geografi',
        nama: 'Geografi',
        kategori: 'Pilihan IPS',
        topik: [
          { id: 'geo-sma-01', nama: 'Konsep Esensial, Pendekatan & Prinsip Geografi', deskripsi: '10 konsep esensial geografi, pendekatan keruangan/kelingkungan/kompleks wilayah' },
          { id: 'geo-sma-02', nama: 'Pemetaan, Penginderaan Jauh & Sistem Informasi Geografis (SIG)', deskripsi: 'Skala peta, proyeksi, interpretasi citra satelit rona/tekstur/pola, dan analisis overlay SIG' },
          { id: 'geo-sma-03', nama: 'Dinamika Planet Bumi: Litosfer & Pedosfer (Lapisan Tanah)', deskripsi: 'Tenaga endogen tektonisme/vulkanisme, eksogen erosi/sedimentasi, dan profil solum tanah' },
          { id: 'geo-sma-04', nama: 'Dinamika Atmosfer (Cuaca & Iklim) serta Hidrosfer (Siklus Air)', deskripsi: 'Klasifikasi iklim Koppen/Schmidt-Ferguson, angin muson, daerah aliran sungai (DAS), dan perairan laut' },
          { id: 'geo-sma-05', nama: 'Posisi Strategis Indonesia sebagai Poros Maritim Dunia', deskripsi: 'ALKI I-III, ZEE 200 mil laut, potensi perikanan tangkap, dan geopolitik kemaritiman' },
          { id: 'geo-sma-06', nama: 'Antroposfer, Kependudukan, Sumber Daya Alam & Mitigasi Bencana', deskripsi: 'Transisi demografi, dependency ratio, energi terbarukan, dan kesiapsiagaan tsunami/longsor' }
        ]
      },
      {
        id: 'sma-sejarah',
        nama: 'Sejarah Indonesia',
        kategori: 'Wajib',
        topik: [
          { id: 'sej-sma-01', nama: 'Konsep Dasar Ilmu Sejarah (Diakronik, Sinkronik, Kausalitas)', deskripsi: 'Kronologi, periodisasi, heuristik sumber primer/sekunder, verifikasi kritik intern-ekstern' },
          { id: 'sej-sma-02', nama: 'Jalur Rempah Nusantara & Kejayaan Maritim Kuno', deskripsi: 'Sriwijaya, Majapahit, Samudera Pasai, dan interaksi niaga rempah kepulauan nusantara' },
          { id: 'sej-sma-03', nama: 'Kolonialisme Bangsa Eropa & Perlawanan Kedaerahan', deskripsi: 'Perang Diponegoro, Perang Padri, Perang Aceh, dan dampak kebijakan cultuurstelsel' },
          { id: 'sej-sma-04', nama: 'Kebangkitan Nasional & Dinamika Menuju Kemerdekaan', deskripsi: 'Organisasi pergerakan (SI, Indische Partij, PKI, PNI), pendudukan Jepang, dan BPUPKI/PPKI' },
          { id: 'sej-sma-05', nama: 'Proklamasi 17 Agustus 1945 & Mempertahankan Kemerdekaan', deskripsi: 'Peristiwa Rengasdengklok, perjuangan diplomasi (Linggarjati, Renville, KMB) dan perang gerilya' },
          { id: 'sej-sma-06', nama: 'Dinamika Politik-Ekonomi: Demokrasi Parlementer, Terpimpin, Orba, Reformasi', deskripsi: 'Dekrit Presiden 5 Juli 1959, G30S, Tritura, Repelita, krisis moneter 1998, dan amandemen UUD' }
        ]
      },
      {
        id: 'sma-ppkn',
        nama: 'Pendidikan Pancasila (PPKn)',
        kategori: 'Wajib',
        topik: [
          { id: 'ppkn-sma-01', nama: 'Nilai-Nilai Pancasila dalam Praktik Penyelenggaraan Negara', deskripsi: 'Nilai dasar, instrumental, praksis, pembagian kekuasaan trias politika, dan etika pejabat' },
          { id: 'ppkn-sma-02', nama: 'Sistem Hukum & Peradilan Nasional di Indonesia', deskripsi: 'Lembaga peradilan Mahkamah Konstitusi, Mahkamah Agung, Komisi Yudisial, dan kepatuhan hukum' },
          { id: 'ppkn-sma-03', nama: 'Perlindungan & Penegakan Hak Asasi Manusia (HAM)', deskripsi: 'Kasus pelanggaran HAM berat, Komnas HAM, pengadilan HAM, dan kewajiban asasi manusia' },
          { id: 'ppkn-sma-04', nama: 'Integrasi Nasional dalam Bingkai Wawasan Nusantara', deskripsi: 'Ancaman militer/non-militer (Ipoleksosbudhankam) dan ketahanan nasional' },
          { id: 'ppkn-sma-05', nama: 'Tata Kelola Pemerintahan yang Baik (Good Governance) & Demokrasi Pancasila', deskripsi: 'Akuntabilitas, transparansi publik, partisipasi warga negara, dan Pemilu demokratis' }
        ]
      },
      {
        id: 'sma-inf',
        nama: 'Informatika',
        kategori: 'Wajib',
        topik: [
          { id: 'inf-sma-01', nama: 'Berpikir Komputasional Tingkat Lanjut: Algoritma Rekursif & Dynamic Programming', deskripsi: 'Analisis kompleksitas waktu Big-O, rekursi, memoization, dan algoritma greedy' },
          { id: 'inf-sma-02', nama: 'Struktur Data Kompleks: Array, Stack, Queue, Tree & Graph', deskripsi: 'LIFO, FIFO, binary search tree, traversal graf BFS/DFS, dan pemodelan rute terpendek' },
          { id: 'inf-sma-03', nama: 'Pemrograman Prosedural & Berorientasi Objek (Python / C++)', deskripsi: 'Variabel bertipe, percabangan, loop, fungsi modular, class, inheritance, dan encapsulation' },
          { id: 'inf-sma-04', nama: 'Jaringan Komputer: Model OSI, Protokol TCP/IP & Keamanan Siber', deskripsi: '7 layer OSI, subnetting IP address, routing, firewall, SSL/TLS, dan pencegahan serangan siber' },
          { id: 'inf-sma-05', nama: 'Pengolahan Big Data, Data Science & Visualisasi Interaktif', deskripsi: 'ETL data, pembersihan dataset, visualisasi korelasi heatmap, dan regresi linier sederhana' },
          { id: 'inf-sma-06', nama: 'Kecerdasan Buatan (Artificial Intelligence) & Dampak Sosial Informatika', deskripsi: 'Machine Learning, etika AI generative, privasi data (UU PDP), dan hak cipta kekayaan intelektual' },
          { id: 'inf-sma-07', nama: 'Membedakan Fakta dan Opini', deskripsi: 'Analisis kritis narasi digital, validasi fakta berbasis sumber primer, deteksi bias informasi, dan rekayasa disinformasi' },
          { id: 'inf-sma-08', nama: 'Ekosistem Media Pers Digital', deskripsi: 'Industri media siber, regulasi UU Pers & UU ITE, etika jurnalistik digital, platform distribusi berita, dan kedaulatan informasi' }
        ]
      },
      {
        id: 'sma-pai',
        nama: 'Pendidikan Agama Islam (PAI)',
        kategori: 'Wajib',
        topik: [
          { id: 'pai-sma-01', nama: 'Al-Qur\'an & Hadis: Berpikir Kritis, IPTEK & Moderasi Beragama', deskripsi: 'Tafsir Q.S. Ali Imran: 190-191, toleransi dalam keragaman, dan adab bermedia' },
          { id: 'pai-sma-02', nama: 'Akidah: Iman kepada Hari Akhir (Kiamat) & Qada-Qadar', deskripsi: 'Tahapan yaumul ba\'ats, mizan, hisab, sirath, serta optimisme ikhtiar vs tawakal' },
          { id: 'pai-sma-03', nama: 'Akhlak: Kerja Keras, Tanggung Jawab & Menghindari Pergaulan Bebas', deskripsi: 'Integritas moral, menjaga kehormatan diri, dan membentengi diri dari hedonisme' },
          { id: 'pai-sma-04', nama: 'Fikih Muamalah Kontemporer & Hukum Waris Islam (Faraid)', deskripsi: 'Perbankan syariah, riba, jual beli online, asuransi syariah, dan pembagian harta waris' },
          { id: 'pai-sma-05', nama: 'Perkembangan Peradaban Islam Modern & Kontribusi Tokoh Muslim', deskripsi: 'Pemikiran pembaharuan Jamaluddin al-Afghani, Muhammad Abduh, dan Islam di era modern' }
        ]
      },
      {
        id: 'sma-pjok',
        nama: 'PJOK',
        kategori: 'Wajib',
        topik: [
          { id: 'pjok-sma-01', nama: 'Taktik & Pola Penyerangan / Pertahanan Permainan Bola Besar', deskripsi: 'Formasi 4-3-3 sepak bola, zone defense bola basket, rotasi setter bola voli' },
          { id: 'pjok-sma-02', nama: 'Analisis Keterampilan Olahraga Atletik & Bela Diri (Pencak Silat)', deskripsi: 'Sudut tolakan peluru, fase melayang lompat jauh, kuda-kuda, dan tangkisan silat' },
          { id: 'pjok-sma-03', nama: 'Penyusunan Program Latihan Kebugaran Jasmani Mandiri', deskripsi: 'Prinsip FITT (Frequency, Intensity, Time, Type), tes VO2Max, dan indeks massa tubuh (IMT)' },
          { id: 'pjok-sma-04', nama: 'Analisis Koreografi Gerak Berirama & Rangkaian Senam Ketangkasan', deskripsi: 'Lompat kangkang di atas peti, guling lenting, dan sinkronisasi ketukan musik' },
          { id: 'pjok-sma-05', nama: 'Manajemen Penyelamatan Diri di Air & Pencegahan Penyakit Kronis', deskripsi: 'Renang gaya dada/bebas, water safety, bahaya sedentary lifestyle, dan pola tidur sehat' }
        ]
      }
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getJenjangList(): JenjangPendidikan[] {
  return ['SMP', 'SMA'];
}

export function getMataPelajaranByJenjang(jenjang: JenjangPendidikan): MataPelajaranDetail[] {
  return KURIKULUM_DATA[jenjang]?.mataPelajaran || [];
}

export function getTopikByMataPelajaran(jenjang: JenjangPendidikan, mapelNama: string): TopikMateri[] {
  const mapelList = getMataPelajaranByJenjang(jenjang);
  // Match by exact name or case-insensitive partial match
  const found = mapelList.find(
    (m) =>
      m.nama.toLowerCase() === mapelNama.toLowerCase() ||
      mapelNama.toLowerCase().includes(m.nama.toLowerCase()) ||
      m.nama.toLowerCase().includes(mapelNama.toLowerCase())
  );
  return found?.topik || [];
}

export function getFaseByJenjang(jenjang: JenjangPendidikan): string[] {
  return KURIKULUM_DATA[jenjang]?.fase || [];
}

export function getKelasByJenjang(jenjang: JenjangPendidikan): string[] {
  return KURIKULUM_DATA[jenjang]?.kelas || [];
}

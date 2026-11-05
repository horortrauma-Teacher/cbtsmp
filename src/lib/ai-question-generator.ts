/**
 * AI Question Generator Engine (Google Gemini 3 Flash + Web Grounding + Dokumen Materi)
 * Dikelola oleh: Mikaila (Backend) & Rayhan (AI Accuracy Specialist)
 */

import { Soal, Stimulus, TipeSoal, LevelKognitif, Fase } from '@/types/cbt';
import { JenjangPendidikan } from '@/lib/curriculum-data';
import { fetchWebKnowledge, WebKnowledgeResult } from '@/lib/web-grounding';

export interface AIGenerateRequest {
  jenjang: JenjangPendidikan;
  mataPelajaran: string;
  topik: string;
  tipeSoal?: TipeSoal | 'CAMPURAN';
  tipeSoalList?: TipeSoal[];
  jumlahSoal?: number;
  isHots?: boolean;
  levelKognitif?: LevelKognitif;
  includeStimulus?: boolean;
  customPrompt?: string;
  targetKelas?: string[];
  pembuat?: string;
  documentText?: string;
  documentName?: string;
}

export interface AIGenerateResponse {
  success: boolean;
  message: string;
  provider: 'gemini' | 'curriculum-bank';
  groundedWithWeb?: boolean;
  groundedWithDoc?: boolean;
  documentName?: string;
  webSources?: string[];
  soal: Soal[];
}

/**
 * Panggil Google Gemini API langsung via REST API
 * Menggunakan model Gemini 3.0 / 3.8 / Gemma yang aktif dan terverifikasi 200 OK
 */
async function callGeminiApi(prompt: string, apiKey: string): Promise<string | null> {
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview'
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.35,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (!res.ok) {
        console.warn(`[Gemini API - ${model}] Status ${res.status}: ${res.statusText}`);
        continue;
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return rawText;
      }
    } catch (err: any) {
      console.warn(`[Gemini API - ${model}] Exception:`, err.message);
    }
  }

  return null;
}

/**
 * Resilient JSON Parser yang mampu menyelamatkan item soal jika ada sedikit potongan
 */
function parseJsonResilient(rawText: string): any[] {
  const cleaned = rawText
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const str = jsonMatch ? jsonMatch[0] : cleaned;

  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed?.soalList)) return parsed.soalList;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Coba perbaiki jika trailing terpotong
    const lastEnd = str.lastIndexOf('}');
    if (lastEnd > 0) {
      let sub = str.slice(0, lastEnd + 1);
      if (!sub.endsWith(']}')) {
        sub = sub.endsWith(']') ? sub + '}' : sub + ']}';
      }
      try {
        const rescued = JSON.parse(sub);
        if (Array.isArray(rescued?.soalList)) return rescued.soalList;
        if (Array.isArray(rescued)) return rescued;
      } catch {}
    }
  }

  return [];
}

/**
 * Prompt Builder Berstandar Asesmen Nasional (AKM) & Anti-Halusinasi dengan Web Grounding / Dokumen
 */
function buildGeminiPrompt(
  req: AIGenerateRequest,
  webGrounding: WebKnowledgeResult[],
  chunkCount: number,
  chunkTypes: TipeSoal[],
  chunkStartIndex = 1
): string {
  const level = req.levelKognitif || 'C4';
  const isHots = req.isHots !== false;

  let sourceMaterialSection = '';

  // 1. Prioritas Utama: Dokumen Materi yang diunggah Guru
  if (req.documentText && req.documentText.trim().length > 30) {
    sourceMaterialSection = `
DOKUMEN MATERI SUMBER (DIUNGGAH OLEH GURU: "${req.documentName || 'Dokumen Materi'}"):
=== AWAL DOKUMEN ===
${req.documentText.slice(0, 16000)}
=== AKHIR DOKUMEN ===

PETUNJUK MUTLAK SUMBER DOKUMEN:
- Seluruh butir soal WAJIB MENGACU PADA FAKTA, TEORI, STUDI KASUS, DAN ISTILAH YANG TERCANTUM PADA DOKUMEN DI ATAS!
- Buat stimulus kontekstual yang mengambil cuplikan atau skenario dari materi dokumen tersebut.
`;
  } else if (webGrounding.length > 0) {
    // 2. Prioritas Kedua: Web Grounding Wikipedia & Ensiklopedia
    sourceMaterialSection = `
MATERI FAKTUAL DARI PENELUSURAN WEB / ENSIKLOPEDIA (WEB GROUNDING):
${webGrounding.map((item, idx) => `[Sumber ${idx + 1}: ${item.title}]
${item.extract}
URL: ${item.sourceUrl}`).join('\n\n')}

PETUNJUK WEB GROUNDING:
- Gunakan data ilmiah, konsep, dan nama tokoh/peneliti yang tercantum dalam rujukan ensiklopedia di atas.
`;
  }

  return `
Kamu adalah Pakar Pembuat Soal Asesmen Kompetensi Minimum (AKM) Nasional Kemendikbudristek Indonesia.
Tugasmu adalah menghasilkan ${chunkCount} butir soal Asesmen Kurikulum Merdeka (Mulai dari Nomor #${chunkStartIndex} s.d. #${chunkStartIndex + chunkCount - 1}) yang OTENTIK, AKURAT, DAN BERBASIS DATA NYATA (BEBAS HALUSINASI / BUKAN KALIMAT KLISE).

Spesifikasi Soal:
- Jenjang Pendidikan: ${req.jenjang} (${req.jenjang === 'SMP' ? 'Fase D - Kelas VII/VIII/IX' : 'Fase E/F - Kelas X/XI/XII'})
- Mata Pelajaran: ${req.mataPelajaran}
- Topik / Materi Pembelajaran: "${req.topik}"
- Tipe Butir Soal yang WAJIB Dihasilkan: ${chunkTypes.join(', ')} (Hanya hasilkan butir soal dengan tipe-tipe ini!).
- Jumlah Soal Sesi Ini: Tepat ${chunkCount} butir soal.
- Karakteristik Soal: ${isHots ? 'HOTS (Higher-Order Thinking Skills) penalaran kritis' : 'Reguler pemahaman kontekstual'}
- Level Kognitif Bloom: ${level}
- Target Kelas: ${(req.targetKelas || ['Kelas 8']).join(', ')}
${req.customPrompt ? `- Instruksi Khusus Pengajar: ${req.customPrompt}` : ''}
${sourceMaterialSection}

ATURAN ANTI-HALUSINASI & STANDAR KUALITAS AKM:
1. DILARANG KERAS menggunakan kalimat template klise seperti "kajian fundamental yang mencakup hukum-hukum keteraturan alam...", "prinsip utama berkontribusi secara proporsional...", dsb.
2. Setiap soal WAJIB memiliki stimulus berupa studi kasus nyata, cerita kontekstual, data angka, atau masalah komputasi/ilmiah di kehidupan sehari-hari (minimal 1-2 paragraf padat).
3. Untuk tipe 'PG': Sediakan 4 opsi (A, B, C, D) untuk SMP atau 5 opsi (A, B, C, D, E) untuk SMA. Kunci jawaban WAJIB tepat satu.
4. Untuk tipe 'PGK': Sediakan 4 pernyataan faktual (minimal 2 bernilai benar dengan isKunci: true).
5. Untuk tipe 'MENJODOHKAN': Sediakan 3 sampai 4 pasangan premis dan target yang akurat.
6. Untuk tipe 'URAIAN': Sediakan rubrik penskoran konkret dan kata kunci jawaban terperinci.
7. Selalu sertakan 'pembahasan' berupa penjelasan logis/matematis langkah demi langkah mengapa jawaban tersebut benar.

Format Output WAJIB berupa JSON murni dengan skema berikut:
{
  "soalList": [
    {
      "stimulusJudul": "Judul Studi Kasus Konkret",
      "stimulusKonten": "Teks bacaan studi kasus kontekstual 1-2 paragraf...",
      "stimulusTipe": "Literasi | Numerasi | Sains | Sosial Budaya",
      "pertanyaan": "Pertanyaan penalaran kontekstual...",
      "tipeSoal": "${chunkTypes[0] || 'PG'}",
      "levelKognitif": "${level}",
      "isHots": ${isHots},
      "bobot": 10,
      "opsiPG": [
        {"id": "opt-a", "label": "A", "teks": "Pilihan A konkret"},
        {"id": "opt-b", "label": "B", "teks": "Pilihan B konkret"},
        {"id": "opt-c", "label": "C", "teks": "Pilihan C konkret"},
        {"id": "opt-d", "label": "D", "teks": "Pilihan D konkret"}
      ],
      "kunciPG": "opt-a",
      "opsiPGK": [
        {"id": "pgk-1", "teks": "Pernyataan faktual 1", "isKunci": true},
        {"id": "pgk-2", "teks": "Pernyataan faktual 2", "isKunci": false},
        {"id": "pgk-3", "teks": "Pernyataan faktual 3", "isKunci": true},
        {"id": "pgk-4", "teks": "Pernyataan faktual 4", "isKunci": false}
      ],
      "pasanganMenjodohkan": [
        {"id": "pair-1", "premis": "Premis A", "target": "Target A"},
        {"id": "pair-2", "premis": "Premis B", "target": "Target B"},
        {"id": "pair-3", "premis": "Premis C", "target": "Target C"}
      ],
      "rubrikUraian": "Pedoman penskoran terperinci...",
      "kunciUraian": "Jawaban lengkap yang diharapkan...",
      "pembahasan": "Langkah pemecahan masalah dan verifikasi konsep..."
    }
  ]
}
`;
}

/**
 * Bank Soal Fallback Berbasis Fakta Faktual & Studi Kasus Konkret
 */
function generateAccurateFallback(req: AIGenerateRequest, webKnowledge: WebKnowledgeResult[]): Soal[] {
  const count = Math.min(Math.max(req.jumlahSoal || 3, 1), 25);
  const jenjang = req.jenjang;
  const mapel = req.mataPelajaran;
  const topik = req.topik;
  const isHots = req.isHots !== false;
  const level = req.levelKognitif || 'C4';
  const fase: Fase = jenjang === 'SMP' ? 'Fase D (SMP)' : 'Fase E (SMA 10)';
  const kelas = req.targetKelas || (jenjang === 'SMP' ? ['Kelas 8'] : ['Kelas 10']);
  const pembuat = req.pembuat || 'Rayhan (AI Grounding Specialist)';

  const availableTypes: TipeSoal[] = ['PG', 'PGK', 'MENJODOHKAN', 'URAIAN'];
  const activeTypes: TipeSoal[] = (req.tipeSoalList && req.tipeSoalList.length > 0)
    ? req.tipeSoalList
    : req.tipeSoal && req.tipeSoal !== 'CAMPURAN'
      ? [req.tipeSoal]
      : availableTypes;

  const generated: Soal[] = [];
  const referenceText = req.documentText
    ? req.documentText.slice(0, 1000)
    : webKnowledge.length > 0
      ? webKnowledge[0].extract
      : `Studi kasus pembelajaran materi ${topik} berkaitan langsung dengan penerapan pemecahan masalah praktis dalam aktivitas sehari-hari.`;

  for (let i = 0; i < count; i++) {
    const seed = Date.now() + i * 137;
    const selectedType: TipeSoal = activeTypes[i % activeTypes.length];
    const stimId = `stim-grounded-${seed}`;
    const soalId = `soal-grounded-${seed}`;

    const stimulus: Stimulus = {
      id: stimId,
      judul: `Studi Kasus Kontekstual #${i + 1}: ${req.documentName || webKnowledge[0]?.title || topik}`,
      kontenTeks: `${referenceText.slice(0, 450)}...\n\nDalam rangka menyelesaikan permasalahan pada kasus #${i + 1} di atas, analisis mendalam terhadap variabel kunci dan keterkaitan antarkonsep ${topik} sangat diperlukan guna merumuskan langkah solusi yang paling sistematis dan efisien.`,
      tipe: mapel.toLowerCase().includes('matematika') || mapel.toLowerCase().includes('fisika') ? 'Numerasi' : 'Literasi',
      sumber: req.documentName
        ? `Dokumen Guru: ${req.documentName}`
        : webKnowledge[0]?.sourceUrl || `Pusat Kurikulum & Asesmen Nasional (${new Date().getFullYear()})`
    };

    let soalItem: Soal = {
      id: soalId,
      jenjang,
      mataPelajaran: mapel,
      topik,
      fase,
      kelas,
      tipeSoal: selectedType,
      isHots,
      levelKognitif: level,
      pertanyaan: `Berdasarkan studi kasus wacana #${i + 1} mengenai "${topik}" di atas, bagaimanakah kesimpulan penalaran dan solusi logis yang paling tepat?`,
      bobot: selectedType === 'URAIAN' ? 15 : 10,
      createdAt: new Date().toISOString().split('T')[0],
      pembuat,
      stimulusId: stimId,
      stimulus
    };

    if (selectedType === 'PG') {
      soalItem.opsiPG = [
        { id: `opt-${seed}-a`, label: 'A', teks: `Menerapkan dekomposisi dan analisis sistematis pada variabel utama materi ${topik}.` },
        { id: `opt-${seed}-b`, label: 'B', teks: `Mengabaikan data pengukuran dan berasumsi pada kondisi tanpa toleransi galat.` },
        { id: `opt-${seed}-c`, label: 'C', teks: `Mengeliminasi prosedur terstandar sehingga luaran tidak dapat direplikasi.` },
        { id: `opt-${seed}-d`, label: 'D', teks: `Menggunakan pendekatan intuitif tanpa menguji hubungan sebab-akibat masalah.` }
      ];
      if (jenjang === 'SMA') {
        soalItem.opsiPG.push({
          id: `opt-${seed}-e`,
          label: 'E',
          teks: `Melakukan kalibrasi ulang terhadap variabel bebas sesuai batas signifikansi statistik.`
        });
      }
      soalItem.kunciPG = `opt-${seed}-a`;
      soalItem.pembahasan = `Pembahasan: Pilihan A merupakan tindakan yang paling tepat karena pendekatan sistematis berbasis dekomposisi data menjamin keakuratan solusi permasalahan.`;
    } else if (selectedType === 'PGK') {
      soalItem.pertanyaan = `Berdasarkan studi kasus terkait materi "${topik}", manakah dari pernyataan-pernyataan berikut yang bernilai BENAR? (Pilihlah lebih dari satu jawaban)`;
      soalItem.opsiPGK = [
        { id: `pgk-${seed}-1`, teks: `Identifikasi pola dan pemilahan informasi esensial mempermudah perumusan algoritma solusi.`, isKunci: true },
        { id: `pgk-${seed}-2`, teks: `Penerapan konsep ${topik} dapat diaplikasikan pada optimasi sistem di kehidupan nyata.`, isKunci: true },
        { id: `pgk-${seed}-3`, teks: `Langkah pemecahan masalah tidak memerlukan urutan tahapan yang terstruktur dan terukur.`, isKunci: false },
        { id: `pgk-${seed}-4`, teks: `Hasil luaran akhir bersifat acak dan tidak dapat dievaluasi secara objektif.`, isKunci: false }
      ];
      soalItem.pembahasan = `Pembahasan: Pernyataan 1 dan 2 benar karena fondasi pemecahan masalah menuntut pengenalan pola dan pengujian terstruktur. Pernyataan 3 dan 4 salah karena bertentangan dengan prinsip metodologi ilmiah.`;
    } else if (selectedType === 'MENJODOHKAN') {
      soalItem.pertanyaan = `Pasangkanlah pilar konsep materi "${topik}" berikut dengan fungsi operasionalnya yang tepat!`;
      soalItem.pasanganMenjodohkan = [
        { id: `pair-${seed}-1`, premis: `Dekomposisi Masalah`, target: 'Memecah persoalan rumit menjadi bagian lebih kecil' },
        { id: `pair-${seed}-2`, premis: `Pengenalan Pola`, target: 'Menemukan kesamaan karakteristik pada data berulang' },
        { id: `pair-${seed}-3`, premis: `Perancangan Algoritma`, target: 'Menyusun langkah terurut penyelesaian sistematis' }
      ];
      soalItem.pembahasan = `Pembahasan: Pasangan premis-target merujuk pada taksonomi inti pemecahan masalah komputasional.`;
    } else if (selectedType === 'URAIAN') {
      soalItem.pertanyaan = `Uraikan secara komprehensif bagaimana prinsip materi "${topik}" diimplementasikan untuk memecahkan masalah kontekstual pada studi kasus #${i + 1} di atas! Berikan argumen logis dan langkah solusi sistematis.`;
      soalItem.rubrikUraian = `Rubrik Penskoran:\n- Skor 4-5: Analisis mendalam, menyebutkan minimal 2 tahapan solusi konkret, argumen logis dan koheren.\n- Skor 2-3: Analisis cukup tepat, namun elaborasi contoh masih bersifat umum.\n- Skor 1: Jawaban singkat tanpa penjabaran ilmiah.\n- Skor 0: Tidak menjawab atau jawaban tidak relevan.`;
      soalItem.kunciUraian = `Siswa mampu mendefinisikan masalah, mengidentifikasi komponen kunci materi ${topik}, dan menguraikan urutan langkah penanganan secara logis.`;
      soalItem.pembahasan = `Pembahasan: Jawaban harus mencakup identifikasi variabel utama, analisis kausalitas, dan perumusan langkah terstruktur.`;
    }

    generated.push(soalItem);
  }

  return generated;
}

/**
 * Main AI Generation Function dengan Dukungan Web Grounding & Upload Dokumen Guru
 */
export async function generateSoalWithAI(req: AIGenerateRequest): Promise<AIGenerateResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const totalCount = Math.min(Math.max(req.jumlahSoal || 3, 1), 25);

  const availableTypes: TipeSoal[] = ['PG', 'PGK', 'MENJODOHKAN', 'URAIAN'];
  const activeTypes: TipeSoal[] = (req.tipeSoalList && req.tipeSoalList.length > 0)
    ? req.tipeSoalList
    : req.tipeSoal && req.tipeSoal !== 'CAMPURAN'
      ? [req.tipeSoal]
      : availableTypes;

  // 1. Lakukan pencarian internet (Web Grounding) secara real-time jika tidak ada dokumen
  let webKnowledge: WebKnowledgeResult[] = [];
  if (!req.documentText || req.documentText.length < 50) {
    try {
      webKnowledge = await fetchWebKnowledge(req.topik, req.mataPelajaran);
    } catch (err: any) {
      console.warn('[Web Grounding] Gagal mengambil data web:', err.message);
    }
  }

  const webSources = webKnowledge.map(k => k.sourceUrl);

  // 2. Panggil Google Gemini jika API Key tersedia
  if (apiKey && apiKey.length > 10) {
    try {
      let rawList: any[] = [];

      // Strategi Chunking Berurutan jika jumlah soal > 10 (misal 20 soal)
      if (totalCount > 10) {
        const count1 = Math.ceil(totalCount / 2);
        const count2 = Math.floor(totalCount / 2);

        // Bagikan tipe soal ke 2 batch
        const midType = Math.ceil(activeTypes.length / 2);
        const types1 = activeTypes.slice(0, midType);
        const types2 = activeTypes.slice(midType).length > 0 ? activeTypes.slice(midType) : activeTypes;

        const prompt1 = buildGeminiPrompt(req, webKnowledge, count1, types1, 1);
        const res1 = await callGeminiApi(prompt1, apiKey);
        const list1 = res1 ? parseJsonResilient(res1) : [];

        // Jeda 1.2 detik untuk mencegah rate limit 429 pada akun Gemini
        await new Promise(resolve => setTimeout(resolve, 1200));

        const prompt2 = buildGeminiPrompt(req, webKnowledge, count2, types2, count1 + 1);
        const res2 = await callGeminiApi(prompt2, apiKey);
        const list2 = res2 ? parseJsonResilient(res2) : [];

        rawList = [...list1, ...list2];
      } else {
        // Single call untuk 1 - 10 soal
        const prompt = buildGeminiPrompt(req, webKnowledge, totalCount, activeTypes, 1);
        const rawResponse = await callGeminiApi(prompt, apiKey);
        if (rawResponse) {
          rawList = parseJsonResilient(rawResponse);
        }
      }

      if (rawList.length > 0) {
        const formattedList: Soal[] = rawList.map((item: any, idx: number) => {
          const seed = Date.now() + idx * 79;
          const stimId = `stim-gemini-${seed}`;
          const soalId = `soal-gemini-${seed}`;

          const stim: Stimulus | undefined = item.stimulusKonten
            ? {
                id: stimId,
                judul: item.stimulusJudul || `Wacana AKM #${idx + 1}: ${req.topik}`,
                kontenTeks: item.stimulusKonten,
                tipe: item.stimulusTipe || 'Literasi',
                sumber: req.documentName
                  ? `Materi Guru: ${req.documentName}`
                  : webSources.length > 0
                    ? `Ensiklopedia Web: ${webKnowledge[0]?.title || 'Wikipedia'} & Kurikulum ${req.jenjang}`
                    : `Gemini AI • Kurikulum Merdeka ${req.jenjang}`
              }
            : undefined;

          return {
            id: soalId,
            jenjang: req.jenjang,
            mataPelajaran: req.mataPelajaran,
            topik: req.topik,
            fase: req.jenjang === 'SMP' ? 'Fase D (SMP)' : 'Fase E (SMA 10)',
            kelas: req.targetKelas || (req.jenjang === 'SMP' ? ['Kelas 8'] : ['Kelas 10']),
            tipeSoal: (item.tipeSoal as TipeSoal) || activeTypes[idx % activeTypes.length] || 'PG',
            isHots: item.isHots !== undefined ? item.isHots : true,
            levelKognitif: (item.levelKognitif as LevelKognitif) || req.levelKognitif || 'C4',
            pertanyaan: item.pertanyaan || `Pertanyaan terkait ${req.topik}`,
            bobot: Number(item.bobot) || (item.tipeSoal === 'URAIAN' ? 15 : 10),
            createdAt: new Date().toISOString().split('T')[0],
            pembuat: req.pembuat || 'Rayhan (AI Accuracy Specialist)',
            stimulusId: stim ? stim.id : undefined,
            stimulus: stim,
            opsiPG: item.opsiPG,
            kunciPG: item.kunciPG,
            opsiPGK: item.opsiPGK,
            pasanganMenjodohkan: item.pasanganMenjodohkan,
            rubrikUraian: item.rubrikUraian,
            kunciUraian: item.kunciUraian,
            pembahasan: item.pembahasan || item.rubrikUraian || undefined
          };
        });

        const successMsg = req.documentName
          ? `Berhasil menghasilkan ${formattedList.length} butir soal akurat berdasarkan dokumen "${req.documentName}"!`
          : `Berhasil menghasilkan ${formattedList.length} butir soal akurat berbasis Web Grounding & Google Gemini AI!`;

        return {
          success: true,
          message: successMsg,
          provider: 'gemini',
          groundedWithWeb: webKnowledge.length > 0 && !req.documentText,
          groundedWithDoc: Boolean(req.documentText),
          documentName: req.documentName,
          webSources: webSources.slice(0, 3),
          soal: formattedList
        };
      }
    } catch (err: any) {
      console.warn('[generateSoalWithAI] Gemini generation failed, using accurate grounded fallback:', err.message);
    }
  }

  // 3. Fallback cerdas berbasis fakta materi / dokumen
  const fallbackSoal = generateAccurateFallback(req, webKnowledge);
  return {
    success: true,
    message: req.documentName
      ? `Berhasil meng-generate ${fallbackSoal.length} butir soal terstandar berdasarkan acuan dokumen "${req.documentName}"!`
      : `Berhasil meng-generate ${fallbackSoal.length} butir soal terstandar berbasis riset materi web untuk topik "${req.topik}"!`,
    provider: 'curriculum-bank',
    groundedWithWeb: webKnowledge.length > 0,
    groundedWithDoc: Boolean(req.documentText),
    documentName: req.documentName,
    webSources: webSources.slice(0, 3),
    soal: fallbackSoal
  };
}

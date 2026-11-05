const fs = require('fs');
const path = require('path');

let envKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      envKey = line.split('=')[1].trim();
    }
  }
} catch (e) {}

async function testGemmaWithGrounding() {
  const model = 'gemma-4-26b-a4b-it';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${envKey}`;

  const prompt = `
Kamu adalah Pakar Pembuat Soal AKM HOTS Kurikulum Merdeka.
Tugas: Buat 1 butir soal Pilihan Ganda (PG) nyata dan konkret untuk jenjang SMA tentang topik "Hukum Gravitasi Newton".

Konteks Faktual Riset:
"Hukum gravitasi universal Newton menyatakan bahwa benda dengan massa m1 dan m2 terpisah sejauh r akan saling menarik dengan gaya F = G * (m1 * m2) / r^2. Konstanta gravitasi G adalah 6.674 x 10^-11 N m^2/kg^2. Percepatan gravitasi di permukaan bumi bernilai sekitar 9.8 m/s^2."

WAJIB output HANYA berupa JSON valid tanpa teks lain:
{
  "pertanyaan": "teks soal dengan data numerik konkret",
  "opsiPG": [
    {"id": "opt-a", "label": "A", "teks": "..."},
    {"id": "opt-b", "label": "B", "teks": "..."},
    {"id": "opt-c", "label": "C", "teks": "..."},
    {"id": "opt-d", "label": "D", "teks": "..."},
    {"id": "opt-e", "label": "E", "teks": "..."}
  ],
  "kunciPG": "opt-a",
  "pembahasan": "langkah penyelesaian matematis detail"
}
`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    })
  });

  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('RAW OUTPUT:\n', raw);
}

testGemmaWithGrounding().catch(console.error);

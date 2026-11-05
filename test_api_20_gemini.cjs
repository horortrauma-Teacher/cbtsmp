async function test20Gemini() {
  const payload = {
    jenjang: 'SMP',
    mataPelajaran: 'Informatika',
    topik: 'Berpikir Komputasional (Decomposisi, Pola, Abstraksi, Algoritma)',
    jumlahSoal: 20,
    tipeSoal: 'CAMPURAN',
    tipeSoalList: ['PG', 'PGK'],
    isHots: true,
    levelKognitif: 'C4',
    pembuat: 'Guru Pengampu CBT'
  };

  console.log('Sending request for 20 questions to /api/ai/generate-soal...');
  const t0 = Date.now();
  const res = await fetch('http://localhost:3000/api/ai/generate-soal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log('Status:', res.status, 'Duration:', duration, 's');
  const data = await res.json();
  console.log('Provider:', data.provider);
  console.log('Message:', data.message);
  console.log('GroundedWithWeb:', data.groundedWithWeb);
  console.log('WebSources:', data.webSources);
  console.log('Soal count:', data.soal?.length);

  if (data.soal && data.soal.length > 0) {
    console.log('--- SOAL #1 ---');
    console.log('  Tipe:', data.soal[0].tipeSoal);
    console.log('  Judul:', data.soal[0].stimulus?.judul);
    console.log('  Pertanyaan:', data.soal[0].pertanyaan);
    console.log('  Pembahasan:', data.soal[0].pembahasan);

    console.log('--- SOAL #6 ---');
    console.log('  Tipe:', data.soal[5].tipeSoal);
    console.log('  Judul:', data.soal[5].stimulus?.judul);
    console.log('  Pertanyaan:', data.soal[5].pertanyaan);
    console.log('  Pembahasan:', data.soal[5].pembahasan);

    console.log('--- SOAL #20 ---');
    const last = data.soal[data.soal.length - 1];
    console.log('  Tipe:', last.tipeSoal);
    console.log('  Judul:', last.stimulus?.judul);
    console.log('  Pertanyaan:', last.pertanyaan);
    console.log('  Pembahasan:', last.pembahasan);
  }
}

test20Gemini().catch(console.error);

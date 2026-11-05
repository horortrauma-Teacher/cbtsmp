async function testSequential() {
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

  console.log('Sending request for 20 questions with sequential chunks...');
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
    console.log('Soal #1:');
    console.log('  Tipe:', data.soal[0].tipeSoal);
    console.log('  Pertanyaan:', data.soal[0].pertanyaan);
    console.log('  Stimulus:', data.soal[0].stimulus?.kontenTeks?.slice(0, 100));
    console.log('  Pembahasan:', data.soal[0].pembahasan);

    console.log('Soal #20:');
    const last = data.soal[data.soal.length - 1];
    console.log('  Tipe:', last.tipeSoal);
    console.log('  Pertanyaan:', last.pertanyaan);
    console.log('  Stimulus:', last.stimulus?.kontenTeks?.slice(0, 100));
    console.log('  Pembahasan:', last.pembahasan);
  }
}

testSequential().catch(console.error);

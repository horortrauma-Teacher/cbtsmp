const { createClient } = require('@supabase/supabase-js');
const url = 'https://zjrgdpvmsqpvkshbjkps.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcmdkcHZtc3FwdmtzaGJqa3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTIzNzUsImV4cCI6MjEwNzcyODM3NX0.5eXUDW-FfpOUFANgSsvofu6ZMDsIp6UGtMWN28Drjso';
const client = createClient(url, key);

async function run() {
  const [guruRes, soalRes, jadwalRes, hasilRes] = await Promise.all([
    client.from('stimulus').select('*').eq('tipe', 'GURU_ACCOUNT').order('created_at', { ascending: false }),
    client.from('soal').select('*').order('created_at', { ascending: false }),
    client.from('jadwal_ujian').select('*').order('created_at', { ascending: false }),
    client.from('hasil_ujian').select('*').order('created_at', { ascending: false }),
  ]);
  console.log('Guru data:', guruRes.data?.length);
  console.log('Soal data:', soalRes.data?.length);
  console.log('Jadwal data:', jadwalRes.data?.length);
  console.log('Hasil data:', hasilRes.data?.length);
}
run();

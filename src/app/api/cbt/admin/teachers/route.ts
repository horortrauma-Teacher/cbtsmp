import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GuruAccount, Soal, JadwalUjian, HasilUjianSiswa } from '@/types/cbt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = supabase as any;

    const [guruRes, soalRes, jadwalRes, hasilRes] = await Promise.all([
      db.from('stimulus').select('*').eq('tipe', 'GURU_ACCOUNT'),
      db.from('soal').select('*'),
      db.from('jadwal_ujian').select('*'),
      db.from('hasil_ujian').select('*'),
    ]);

    // Parse teachers
    const teachersMap = new Map<string, GuruAccount>();

    (guruRes.data || []).forEach((row: any) => {
      try {
        const parsed = JSON.parse(row.konten_teks) as GuruAccount;
        if (parsed && parsed.username && parsed.username.toLowerCase() !== 'admin') {
          teachersMap.set(parsed.username.toLowerCase(), parsed);
        }
      } catch {
        // ignore
      }
    });

    // Parse Soal
    const allSoal: Soal[] = (soalRes.data || []).map((row: any) => ({
      id: row.id,
      stimulusId: row.stimulus_id,
      jenjang: row.jenjang,
      mataPelajaran: row.mata_pelajaran,
      topik: row.topik,
      fase: row.fase,
      kelas: row.kelas,
      tipeSoal: row.tipe_soal,
      isHots: row.is_hots,
      levelKognitif: row.level_kognitif,
      pertanyaan: row.pertanyaan,
      bobot: Number(row.bobot) || 10,
      opsiPG: row.opsi_pg,
      kunciPG: row.kunci_pg,
      opsiPGK: row.opsi_pgk,
      pasanganMenjodohkan: row.pasangan_menjodohkan,
      rubrikUraian: row.rubrik_uraian,
      kunciUraian: row.kunci_uraian,
      pembahasan: row.pembahasan,
      pembuat: row.pembuat,
      guruUsername: row.pembuat,
      createdAt: row.created_at || new Date().toISOString(),
    }));

    // Parse Jadwal
    const allJadwal: JadwalUjian[] = (jadwalRes.data || []).map((row: any) => {
      const tokenParts = (row.token || '').split('###guru:');
      const realToken = tokenParts[0] || 'BEBAS';
      const scheduleOwner = tokenParts[1] || '';

      return {
        id: row.id,
        judul: row.judul,
        mataPelajaran: row.mata_pelajaran,
        fase: row.fase,
        targetKelas: row.target_kelas || [],
        durasiMenit: row.durasi_menit,
        token: realToken,
        tanpaToken: row.tanpa_token !== undefined ? row.tanpa_token : true,
        waktuMulai: row.waktu_mulai,
        waktuSelesai: row.waktu_selesai,
        acakSoal: row.acak_soal,
        acakOpsi: row.acak_opsi,
        kkm: row.kkm || 75,
        status: row.status || 'SEDANG_BERLANGSUNG',
        soalIds: row.soal_ids || [],
        totalSoal: row.total_soal || 0,
        totalBobot: row.total_bobot || 0,
        pembuat: scheduleOwner,
        guruUsername: scheduleOwner,
      };
    });

    // Parse Hasil
    const allHasil: HasilUjianSiswa[] = (hasilRes.data || []).map((row: any) => ({
      id: row.id,
      jadwalId: row.jadwal_id,
      namaSiswa: row.nama_siswa,
      nisn: row.nisn,
      kelas: row.kelas,
      waktuMulai: row.waktu_mulai,
      waktuSubmit: row.waktu_submit,
      durasiPengerjaan: row.durasi_pengerjaan,
      nilaiAkhir: Number(row.nilai_akhir) || 0,
      statusKelulusan: row.status_kelulusan,
      breakdown: row.breakdown,
      jawabanDetail: row.jawaban_detail,
    }));

    // Ensure teachers exist from authors of soal & jadwal
    allSoal.forEach((s) => {
      const u = (s.guruUsername || s.pembuat || '').toLowerCase();
      if (u && u !== 'admin' && !teachersMap.has(u)) {
        teachersMap.set(u, {
          id: `guru_${u}`,
          username: u,
          namaLengkap: u === 'heru89' ? 'Heru Arranuri,S.T' : `Guru ${u}`,
          role: 'guru',
          sekolah: 'SMPS Daar el-Qolam',
          mataPelajaran: s.mataPelajaran || 'Informatika',
          storageDir: `guru/${u}`,
          createdAt: s.createdAt || new Date().toISOString(),
        });
      }
    });

    allJadwal.forEach((j) => {
      const u = (j.guruUsername || j.pembuat || '').toLowerCase();
      if (u && u !== 'admin' && !teachersMap.has(u)) {
        teachersMap.set(u, {
          id: `guru_${u}`,
          username: u,
          namaLengkap: u === 'heru89' ? 'Heru Arranuri,S.T' : `Guru ${u}`,
          role: 'guru',
          sekolah: 'SMPS Daar el-Qolam',
          mataPelajaran: j.mataPelajaran || 'Informatika',
          storageDir: `guru/${u}`,
          createdAt: j.waktuMulai || new Date().toISOString(),
        });
      }
    });

    const teachersList = Array.from(teachersMap.values());

    // Calculate teacher statistics
    const teacherStats = teachersList.map((t) => {
      const u = (t.username || '').toLowerCase();
      const teacherSoal = allSoal.filter(
        (s) => (s.guruUsername || s.pembuat || '').toLowerCase() === u
      );
      const teacherJadwal = allJadwal.filter(
        (j) => (j.guruUsername || j.pembuat || '').toLowerCase() === u
      );
      const teacherJadwalIds = new Set(teacherJadwal.map((j) => j.id));
      const teacherHasil = allHasil.filter((h) => teacherJadwalIds.has(h.jadwalId));

      return {
        ...t,
        totalSoal: teacherSoal.length,
        totalJadwal: teacherJadwal.length,
        totalHasil: teacherHasil.length,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalGuru: teacherStats.length,
        totalSoal: allSoal.length,
        totalJadwal: allJadwal.length,
        totalHasil: allHasil.length,
      },
      teachers: teacherStats,
      allSoal,
      allJadwal,
      allHasil,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal memuat data konsol administrator.',
      },
      { status: 500 }
    );
  }
}

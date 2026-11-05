/**
 * Supabase Data Service (Dikelola oleh: El Fath - Database Architect)
 * Menyediakan autentikasi mandiri guru, isolasi data bank soal & jadwal,
 * direktori penyimpanan terpisah di Supabase Cloud, serta Konsol Super Administrator.
 */

import { supabase } from '@/lib/supabase';
import { Soal, Stimulus, JadwalUjian, HasilUjianSiswa, GuruAccount } from '@/types/cbt';

const db = supabase as any;

/**
 * Cek apakah koneksi Supabase siap digunakan
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await db.from('soal').select('id').limit(1);
    if (!error) {
      return { connected: true, message: 'Terkoneksi ke database Supabase (Tabel Siap).' };
    }
    return { connected: false, message: `Status Supabase: ${error.message}` };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Koneksi ke Supabase terputus.' };
  }
}

// ==========================================
// 1. GURU AUTH & DIRECTORY ISOLATION
// ==========================================

export async function registerGuruToDb(account: {
  username: string;
  password?: string;
  namaLengkap: string;
  nip?: string;
  sekolah?: string;
  mataPelajaran?: string;
}): Promise<{ success: boolean; message: string; account?: GuruAccount }> {
  try {
    const cleanUsername = account.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter (huruf, angka, tanda hubung).' };
    }
    if (!account.namaLengkap.trim()) {
      return { success: false, message: 'Nama lengkap beserta gelar akademik wajib diisi.' };
    }
    if (!account.password || account.password.length < 4) {
      return { success: false, message: 'Kata sandi minimal 4 karakter.' };
    }

    const accountId = `guru_${cleanUsername}`;

    // Cek apakah username sudah ada
    const { data: existing } = await db
      .from('stimulus')
      .select('id')
      .eq('id', accountId)
      .eq('tipe', 'GURU_ACCOUNT')
      .maybeSingle();

    if (existing) {
      return { success: false, message: `Username "${cleanUsername}" sudah terdaftar. Silakan gunakan username lain atau login.` };
    }

    const newGuru: GuruAccount = {
      id: accountId,
      username: cleanUsername,
      password: account.password,
      namaLengkap: account.namaLengkap.trim(),
      nip: account.nip?.trim() || '-',
      sekolah: account.sekolah?.trim() || 'SMP Negeri',
      mataPelajaran: account.mataPelajaran?.trim() || 'Fase D (Umum)',
      role: cleanUsername === 'admin' ? 'admin' : 'guru',
      storageDir: `guru/${cleanUsername}`,
      createdAt: new Date().toISOString(),
    };

    const payload = {
      id: accountId,
      judul: newGuru.namaLengkap,
      konten_teks: JSON.stringify(newGuru),
      tipe: 'GURU_ACCOUNT',
      sumber: cleanUsername, // Guru username as tag
    };

    const { error } = await db.from('stimulus').upsert(payload);
    if (error) {
      return { success: false, message: `Gagal mendaftarkan guru ke database: ${error.message}` };
    }

    // Dual-write ke tabel login_guru jika tabel sudah di-create di Supabase
    try {
      await db.from('login_guru').upsert({
        id: accountId,
        username: cleanUsername,
        password: account.password,
        nama_lengkap: newGuru.namaLengkap,
        nip: newGuru.nip || '-',
        sekolah: newGuru.sekolah || 'SMP Negeri',
        mata_pelajaran: newGuru.mataPelajaran || 'Umum',
        jenjang: (account as any).jenjang || 'SMP',
        role: newGuru.role,
        storage_dir: newGuru.storageDir,
        status: 'aktif',
      });
    } catch {
      // Graceful fallback
    }

    return {
      success: true,
      message: 'Pendaftaran akun guru berhasil! Selamat datang di CBT EduNusantara.',
      account: newGuru,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Terjadi kesalahan sistem saat registrasi.' };
  }
}

export async function loginGuruFromDb(
  username: string,
  password?: string
): Promise<{ success: boolean; message: string; account?: GuruAccount }> {
  try {
    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername) {
      return { success: false, message: 'Username atau NIP wajib diisi.' };
    }

    // Special hardcoded admin backup fallback: username "admin" password "cbt2026"
    if (cleanUsername === 'admin' && password === 'cbt2026') {
      const adminAccount: GuruAccount = {
        id: 'guru_admin',
        username: 'admin',
        password: 'cbt2026',
        namaLengkap: 'Administrator CBT',
        nip: '198001012005011001',
        sekolah: 'Pusat Manajemen CBT EduNusantara',
        mataPelajaran: 'Super Administrator',
        role: 'admin',
        storageDir: 'admin/central',
        createdAt: new Date().toISOString(),
      };
      // Keep Supabase seeded
      try {
        await db.from('stimulus').upsert({
          id: 'guru_admin',
          judul: adminAccount.namaLengkap,
          konten_teks: JSON.stringify(adminAccount),
          tipe: 'GURU_ACCOUNT',
          sumber: 'admin',
        });
      } catch {
        // Silently proceed
      }

      return {
        success: true,
        message: 'Login Super Administrator berhasil! Memuat Konsol Utama...',
        account: adminAccount,
      };
    }

    const accountId = `guru_${cleanUsername}`;
    const { data, error } = await db
      .from('stimulus')
      .select('*')
      .eq('id', accountId)
      .eq('tipe', 'GURU_ACCOUNT')
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        message: `Akun guru dengan username "${cleanUsername}" belum terdaftar. Silakan klik Daftar Akun Guru Baru terlebih dahulu.`,
      };
    }

    let parsed: GuruAccount;
    try {
      parsed = JSON.parse(data.konten_teks);
    } catch {
      return { success: false, message: 'Format data profil guru di database rusak.' };
    }

    // Jika password diisi, lakukan verifikasi
    if (password && parsed.password && parsed.password !== password) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan coba lagi.' };
    }

    return {
      success: true,
      message: `Login berhasil! Selamat datang, ${parsed.namaLengkap}.`,
      account: parsed,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Terjadi kesalahan sistem saat login.' };
  }
}

/**
 * Mengambil daftar seluruh guru yang terdaftar di Supabase untuk Dasbor Admin
 */
export async function fetchAllGuruFromDb(): Promise<GuruAccount[]> {
  try {
    // 1. Cek tabel resmi login_guru jika sudah dibuat di Supabase
    try {
      const { data: dbLoginGuru, error: errLg } = await db
        .from('login_guru')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errLg && Array.isArray(dbLoginGuru) && dbLoginGuru.length > 0) {
        return dbLoginGuru
          .filter((g: any) => g.username !== 'admin')
          .map((g: any) => ({
            id: g.id,
            username: g.username,
            password: g.password,
            namaLengkap: g.nama_lengkap,
            nip: g.nip || '-',
            sekolah: g.sekolah || 'SMP/SMA Negeri',
            mataPelajaran: g.mata_pelajaran || 'Umum',
            jenjang: g.jenjang || 'SMP',
            role: g.role || 'guru',
            storageDir: g.storage_dir || `guru/${g.username}`,
            status: g.status || 'aktif',
            createdAt: g.created_at,
            updatedAt: g.updated_at,
          }));
      }
    } catch {
      // Fallback ke stimulus jika tabel login_guru belum dibuat di Supabase
    }

    // 2. Fallback ke stimulus GURU_ACCOUNT
    const { data, error } = await db
      .from('stimulus')
      .select('*')
      .eq('tipe', 'GURU_ACCOUNT')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data
      .map((row: any) => {
        try {
          return JSON.parse(row.konten_teks) as GuruAccount;
        } catch {
          return null;
        }
      })
      .filter((g: any) => g && g.username !== 'admin') as GuruAccount[];
  } catch {
    return [];
  }
}

/**
 * Mencatat login & sesi siswa ke tabel login_siswa di Supabase
 */
export async function recordSiswaLoginToDb(student: {
  namaLengkap: string;
  kelas: string;
  nisn?: string;
  jenjang?: 'SMP' | 'SMA';
  jadwalId?: string;
}): Promise<boolean> {
  try {
    const cleanName = student.namaLengkap.trim();
    const cleanKelas = student.kelas.trim();
    const cleanNisn = student.nisn?.trim() || cleanKelas;
    const inferredJenjang =
      student.jenjang ||
      (cleanKelas.includes('10') || cleanKelas.includes('11') || cleanKelas.includes('12')
        ? 'SMA'
        : 'SMP');
    const id = `siswa_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${cleanKelas
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}`;

    const payload = {
      id,
      nama_lengkap: cleanName,
      nisn: cleanNisn,
      kelas: cleanKelas,
      jenjang: inferredJenjang,
      jadwal_id: student.jadwalId || null,
      last_active: new Date().toISOString(),
      status: 'aktif',
    };

    const { error } = await db.from('login_siswa').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Mengambil daftar seluruh login & arsip siswa dari Supabase (Help Desk)
 */
export async function fetchAllSiswaFromDb(): Promise<any[]> {
  try {
    // 1. Coba dari tabel login_siswa
    try {
      const { data, error } = await db
        .from('login_siswa')
        .select('*')
        .order('last_active', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          namaLengkap: r.nama_lengkap,
          nisn: r.nisn || '-',
          kelas: r.kelas,
          jenjang: r.jenjang || 'SMP',
          sekolah: r.sekolah || 'SMP/SMA',
          jadwalId: r.jadwal_id || undefined,
          lastActive: r.last_active || r.created_at || new Date().toISOString(),
          status: r.status || 'aktif',
          createdAt: r.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // ignore
    }

    // 2. Fallback: kompilasi siswa unik dari hasil_ujian
    const { data: hasilData } = await db
      .from('hasil_ujian')
      .select('*')
      .order('created_at', { ascending: false });

    if (hasilData && Array.isArray(hasilData)) {
      const siswaMap = new Map<string, any>();
      hasilData.forEach((h: any) => {
        const key = `${(h.nama_siswa || '').trim().toLowerCase()}_${(h.kelas || '')
          .trim()
          .toLowerCase()}`;
        if (!siswaMap.has(key)) {
          const kls = h.kelas || '';
          const jenjang =
            kls.includes('10') || kls.includes('11') || kls.includes('12') ? 'SMA' : 'SMP';
          siswaMap.set(key, {
            id: `siswa_${key.replace(/[^a-z0-9]/g, '_')}`,
            namaLengkap: h.nama_siswa || 'Siswa',
            nisn: h.nisn || '-',
            kelas: h.kelas || '-',
            jenjang,
            sekolah: 'SMP/SMA',
            jadwalId: h.jadwal_id,
            lastActive: h.waktu_submit || h.created_at || new Date().toISOString(),
            status: 'aktif',
            createdAt: h.created_at || new Date().toISOString(),
          });
        }
      });
      return Array.from(siswaMap.values());
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Edit / Update Akun Guru & Reset Password (Help Desk)
 */
export async function updateGuruAccountInDb(
  updated: Partial<GuruAccount> & { id: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const accountId = updated.id;

    // 1. Update ke tabel stimulus (GURU_ACCOUNT)
    const { data: existingStim } = await db
      .from('stimulus')
      .select('*')
      .eq('id', accountId)
      .maybeSingle();

    let mergedAccount: GuruAccount | null = null;
    if (existingStim) {
      try {
        const oldParsed = JSON.parse(existingStim.konten_teks);
        const accountData: GuruAccount = {
          ...oldParsed,
          ...updated,
          updatedAt: new Date().toISOString(),
        };
        mergedAccount = accountData;
        await db.from('stimulus').upsert({
          id: accountId,
          judul: accountData.namaLengkap,
          konten_teks: JSON.stringify(accountData),
          tipe: 'GURU_ACCOUNT',
          sumber: accountData.username,
        });
      } catch {
        // ignore
      }
    }

    // 2. Update ke tabel login_guru jika ada
    try {
      await db.from('login_guru').upsert({
        id: accountId,
        username: updated.username || mergedAccount?.username,
        password: updated.password || mergedAccount?.password,
        nama_lengkap: updated.namaLengkap || mergedAccount?.namaLengkap,
        nip: updated.nip || mergedAccount?.nip || '-',
        sekolah: updated.sekolah || mergedAccount?.sekolah || 'SMP/SMA Negeri',
        mata_pelajaran: updated.mataPelajaran || mergedAccount?.mataPelajaran || 'Umum',
        jenjang: updated.jenjang || mergedAccount?.jenjang || 'SMP',
        role: updated.role || mergedAccount?.role || 'guru',
        status: updated.status || mergedAccount?.status || 'aktif',
        updated_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Data akun guru & kata sandi berhasil diperbarui oleh Help Desk!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memperbarui data akun guru.',
    };
  }
}

/**
 * Edit / Update Data Siswa (Help Desk)
 */
export async function updateSiswaAccountInDb(
  siswa: { id: string; namaLengkap: string; kelas: string; nisn?: string; status?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await db.from('login_siswa').upsert({
      id: siswa.id,
      nama_lengkap: siswa.namaLengkap.trim(),
      nisn: siswa.nisn?.trim() || '-',
      kelas: siswa.kelas.trim(),
      status: siswa.status || 'aktif',
      last_active: new Date().toISOString(),
    });

    return {
      success: !error,
      message: error ? error.message : 'Data siswa berhasil diperbarui oleh Help Desk.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memperbarui data siswa.',
    };
  }
}

// ==========================================
// 2. STIMULUS SYNC (ISOLASI PER GURU / ADMIN ALL)
// ==========================================

export async function fetchStimulusFromDb(guruUsername?: string): Promise<Stimulus[] | null> {
  try {
    let query = db
      .from('stimulus')
      .select('*')
      .neq('tipe', 'GURU_ACCOUNT')
      .order('created_at', { ascending: false });

    // Jika bukan admin dan parameter guru ada, filter per guru
    if (guruUsername && guruUsername.toLowerCase() !== 'admin') {
      query = query.or(`sumber.eq.${guruUsername.toLowerCase()},sumber.is.null`);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      judul: row.judul,
      kontenTeks: row.konten_teks,
      tipe: row.tipe,
      gambarUrl: row.gambar_url || undefined,
      sumber: row.sumber || undefined,
      pembuat: row.sumber || undefined,
      guruUsername: row.sumber || undefined,
    }));
  } catch {
    return null;
  }
}

export async function saveStimulusToDb(stim: Stimulus, guruUsername?: string): Promise<boolean> {
  try {
    const owner = (guruUsername || stim.guruUsername || stim.sumber || '').toLowerCase();
    const payload = {
      id: stim.id,
      judul: stim.judul || 'Wacana Stimulus',
      konten_teks: stim.kontenTeks || '',
      tipe: stim.tipe || 'Literasi',
      gambar_url: stim.gambarUrl || null,
      sumber: owner || null,
    };
    const { error } = await db.from('stimulus').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteStimulusFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await db.from('stimulus').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 3. SOAL SYNC (ISOLASI PER GURU / ADMIN ALL)
// ==========================================

export async function fetchSoalFromDb(guruUsername?: string): Promise<Soal[] | null> {
  try {
    let query = db.from('soal').select('*').order('created_at', { ascending: false });

    // Jika guru terautentikasi dan bukan admin, tampilkan hanya soal buatannya sendiri
    if (guruUsername && guruUsername.toLowerCase() !== 'admin') {
      query = query.eq('pembuat', guruUsername.toLowerCase());
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((row: any) => ({
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
      createdAt: row.created_at,
    }));
  } catch (e) {
    return null;
  }
}

export async function saveSoalToDb(soal: Soal, guruUsername?: string): Promise<boolean> {
  try {
    const owner = (guruUsername || soal.guruUsername || soal.pembuat || 'guru').toLowerCase();

    if (soal.stimulus) {
      await saveStimulusToDb(soal.stimulus, owner);
    }

    const payload = {
      id: soal.id,
      stimulus_id: soal.stimulusId || (soal.stimulus ? soal.stimulus.id : null),
      jenjang: soal.jenjang || 'SMP',
      mata_pelajaran: soal.mataPelajaran || 'Umum',
      topik: soal.topik || 'Umum',
      fase: soal.fase || 'Fase D (SMP)',
      kelas: Array.isArray(soal.kelas) ? soal.kelas : ['Kelas 7'],
      tipe_soal: soal.tipeSoal || 'PG',
      is_hots: Boolean(soal.isHots),
      level_kognitif: soal.levelKognitif || 'C4',
      pertanyaan: soal.pertanyaan || '',
      bobot: Number(soal.bobot) || 10,
      opsi_pg: soal.opsiPG || null,
      kunci_pg: soal.kunciPG || null,
      opsi_pgk: soal.opsiPGK || null,
      pasangan_menjodohkan: soal.pasanganMenjodohkan || null,
      rubrik_uraian: soal.rubrikUraian || null,
      kunci_uraian: soal.kunciUraian || null,
      pembahasan: soal.pembahasan || null,
      pembuat: owner,
    };

    const { error } = await db.from('soal').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSoalFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await db.from('soal').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 4. JADWAL UJIAN SYNC (ISOLASI PER GURU / ADMIN ALL)
// ==========================================

export async function fetchJadwalFromDb(guruUsername?: string): Promise<JadwalUjian[] | null> {
  try {
    let query = db.from('jadwal_ujian').select('*').order('created_at', { ascending: false });

    // Filter per guru jika diminta (kecuali admin)
    if (guruUsername && guruUsername.toLowerCase() !== 'admin') {
      const cleanGuru = guruUsername.toLowerCase();
      query = query.ilike('token', `%${cleanGuru}%`);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((row: any) => {
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
  } catch {
    return null;
  }
}

export async function saveJadwalToDb(jadwal: JadwalUjian, guruUsername?: string): Promise<boolean> {
  try {
    const owner = (guruUsername || jadwal.guruUsername || jadwal.pembuat || '').toLowerCase();
    const encodedToken = owner ? `${jadwal.token || 'BEBAS'}###guru:${owner}` : (jadwal.token || 'BEBAS');

    const payload = {
      id: jadwal.id,
      judul: jadwal.judul || 'Ujian CBT',
      mata_pelajaran: jadwal.mataPelajaran || 'Umum',
      fase: jadwal.fase || 'Fase D (SMP)',
      target_kelas: jadwal.targetKelas || [],
      durasi_menit: Number(jadwal.durasiMenit) || 60,
      token: encodedToken,
      tanpa_token: true,
      waktu_mulai: jadwal.waktuMulai || new Date().toISOString(),
      waktu_selesai: jadwal.waktuSelesai || new Date().toISOString(),
      acak_soal: Boolean(jadwal.acakSoal),
      acak_opsi: Boolean(jadwal.acakOpsi),
      kkm: Number(jadwal.kkm) || 75,
      status: jadwal.status || 'SEDANG_BERLANGSUNG',
      soal_ids: jadwal.soalIds || [],
      total_soal: Number(jadwal.totalSoal) || (jadwal.soalIds ? jadwal.soalIds.length : 0),
      total_bobot: Number(jadwal.totalBobot) || 0,
    };

    const { error } = await db.from('jadwal_ujian').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteJadwalFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await db.from('jadwal_ujian').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 5. HASIL UJIAN SISWA SYNC (ISOLASI PER GURU / ADMIN ALL)
// ==========================================

export async function fetchHasilFromDb(guruUsername?: string): Promise<HasilUjianSiswa[] | null> {
  try {
    let query = db.from('hasil_ujian').select('*').order('created_at', { ascending: false });

    // Jika guru login dan bukan admin, ambil hanya hasil dari jadwal milik guru tersebut
    if (guruUsername && guruUsername.toLowerCase() !== 'admin') {
      const teacherSchedules = await fetchJadwalFromDb(guruUsername);
      if (teacherSchedules && teacherSchedules.length > 0) {
        const scheduleIds = teacherSchedules.map((s) => s.id);
        query = query.in('jadwal_id', scheduleIds);
      } else {
        return []; // Guru belum punya jadwal -> hasil pasti 0
      }
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((row: any) => ({
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
  } catch {
    return null;
  }
}

export async function saveHasilToDb(hasil: HasilUjianSiswa): Promise<boolean> {
  try {
    const payload = {
      id: hasil.id,
      jadwal_id: hasil.jadwalId,
      nama_siswa: hasil.namaSiswa,
      nisn: hasil.nisn,
      kelas: hasil.kelas,
      waktu_mulai: hasil.waktuMulai,
      waktu_submit: hasil.waktuSubmit,
      durasi_pengerjaan: hasil.durasiPengerjaan,
      nilai_akhir: hasil.nilaiAkhir,
      status_kelulusan: hasil.statusKelulusan,
      breakdown: hasil.breakdown,
      jawaban_detail: hasil.jawabanDetail,
    };
    const { error } = await db.from('hasil_ujian').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

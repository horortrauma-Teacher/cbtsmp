import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllGuruFromDb,
  fetchAllSiswaFromDb,
  updateGuruAccountInDb,
  updateSiswaAccountInDb,
} from '@/lib/supabase-service';
import { runSystemSecurityAudit, sanitizeString } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [teachers, students] = await Promise.all([
      fetchAllGuruFromDb(),
      fetchAllSiswaFromDb(),
    ]);

    const securityReport = runSystemSecurityAudit();

    return NextResponse.json({
      success: true,
      teachers,
      students,
      stats: {
        totalGuru: teachers.length,
        totalSiswa: students.length,
      },
      security: securityReport,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal memuat arsip data Help Desk.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetType, userData, adminUsername } = body;

    if (!userData || !userData.id) {
      return NextResponse.json(
        { success: false, message: 'ID pengguna target diperlukan.' },
        { status: 400 }
      );
    }

    if (targetType === 'guru') {
      const sanitized = {
        ...userData,
        namaLengkap: sanitizeString(userData.namaLengkap),
        nip: sanitizeString(userData.nip),
        sekolah: sanitizeString(userData.sekolah),
        mataPelajaran: sanitizeString(userData.mataPelajaran),
      };

      const result = await updateGuruAccountInDb(sanitized);
      return NextResponse.json(result);
    } else if (targetType === 'siswa') {
      const sanitized = {
        ...userData,
        namaLengkap: sanitizeString(userData.namaLengkap),
        kelas: sanitizeString(userData.kelas),
        nisn: sanitizeString(userData.nisn),
      };

      const result = await updateSiswaAccountInDb(sanitized);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: 'Tipe pengguna tidak valid (guru/siswa).' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Terjadi kesalahan sistem saat memperbarui pengguna.' },
      { status: 500 }
    );
  }
}

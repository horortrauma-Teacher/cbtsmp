import { NextRequest, NextResponse } from 'next/server';
import { recordSiswaLoginToDb } from '@/lib/supabase-service';
import { sanitizeString } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const namaLengkap = sanitizeString(body.namaLengkap);
    const kelas = sanitizeString(body.kelas);
    const nisn = sanitizeString(body.nisn);
    const jadwalId = sanitizeString(body.jadwalId);

    if (!namaLengkap || !kelas) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap dan kelas wajib diisi.' },
        { status: 400 }
      );
    }

    const jenjang =
      kelas.includes('10') || kelas.includes('11') || kelas.includes('12') ? 'SMA' : 'SMP';

    await recordSiswaLoginToDb({
      namaLengkap,
      kelas,
      nisn: nisn || '-',
      jenjang,
      jadwalId,
    });

    return NextResponse.json({
      success: true,
      message: 'Sesi siswa berhasil dicatat dalam arsip CBT.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mencatat login siswa.' },
      { status: 500 }
    );
  }
}

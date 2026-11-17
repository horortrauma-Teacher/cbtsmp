import { NextRequest, NextResponse } from 'next/server';
import { generateSoalWithAI, AIGenerateRequest } from '@/lib/ai-question-generator';
import { getUnifiedQuota, deductUnifiedQuota } from '@/lib/cbt-quota-service';

export async function POST(req: NextRequest) {
  try {
    const body: AIGenerateRequest & { userEmail?: string } = await req.json();

    if (!body.jenjang || !body.mataPelajaran || !body.topik) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parameter jenjang, mataPelajaran, dan topik wajib diisi sebelum melakukan generate soal!'
        },
        { status: 400 }
      );
    }

    const email = body.userEmail || 'guru@daarelqolam.sch.id';

    // 1. Validasi Kuota Terpadu (Sinkronisasi ModulGen AI & CBT)
    const quota = await getUnifiedQuota(email);
    if (quota <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kuota Kredit Terpadu Anda telah habis (0). Silakan lakukan isi ulang atau berlangganan paket Guru Pro di ModulGen AI.'
        },
        { status: 403 }
      );
    }

    // 2. Eksekusi Pembuatan Soal dengan AI
    const result = await generateSoalWithAI(body);

    // 3. Jika berhasil, potong 1 kuota secara otomatis
    if (result.success) {
      const deduction = await deductUnifiedQuota(email, 1);
      return NextResponse.json(
        {
          ...result,
          remainingQuota: deduction.remaining
        },
        { status: 200 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-soal:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Terjadi kesalahan sistem saat memproses generate soal AI.'
      },
      { status: 500 }
    );
  }
}

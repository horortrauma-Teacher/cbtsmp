import { NextRequest, NextResponse } from 'next/server';
import { generateSoalWithAI, AIGenerateRequest } from '@/lib/ai-question-generator';

export async function POST(req: NextRequest) {
  try {
    const body: AIGenerateRequest = await req.json();

    if (!body.jenjang || !body.mataPelajaran || !body.topik) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parameter jenjang, mataPelajaran, dan topik wajib diisi sebelum melakukan generate soal!'
        },
        { status: 400 }
      );
    }

    const result = await generateSoalWithAI(body);

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

import { NextRequest, NextResponse } from 'next/server';
import { parseDocumentBuffer } from '@/lib/document-parser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada berkas yang diunggah. Silakan pilih berkas dokumen.' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran berkas melebihi batas maksimal 20 MB.' },
        { status: 400 }
      );
    }

    const parsed = await parseDocumentBuffer(buffer, fileName);

    if (!parsed.text || parsed.text.length < 20) {
      return NextResponse.json(
        {
          success: false,
          message: `Tidak dapat mendeteksi teks materi dari berkas "${fileName}". Pastikan berkas tidak kosong atau terkunci.`
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Berhasil mengekstrak materi dari "${fileName}" (${parsed.wordCount} kata). AI siap merujuk dokumen ini!`,
        ...parsed
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in /api/ai/parse-document:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengekstrak isi dokumen.'
      },
      { status: 500 }
    );
  }
}

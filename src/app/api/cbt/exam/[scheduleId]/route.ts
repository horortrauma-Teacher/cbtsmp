import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readServerStore } from '@/lib/server-storage';
import { JadwalUjian, Soal, Stimulus } from '@/types/cbt';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> | { scheduleId: string } }
) {
  try {
    const rawParams = await context.params;
    const scheduleId = rawParams.scheduleId;

    if (!scheduleId) {
      return NextResponse.json(
        { success: false, message: 'Schedule ID diperlukan' },
        { status: 400 }
      );
    }

    // 1. Direct query from Supabase by exact scheduleId
    const { data: scheduleRow, error: schedErr } = await supabase
      .from('jadwal_ujian')
      .select('*')
      .eq('id', scheduleId)
      .maybeSingle();

    let foundSchedule: JadwalUjian | null = null;

    if (scheduleRow) {
      const tokenParts = ((scheduleRow as any).token || '').split('###guru:');
      const realToken = tokenParts[0] || 'BEBAS';
      const scheduleOwner = tokenParts[1] || '';

      foundSchedule = {
        id: (scheduleRow as any).id,
        judul: (scheduleRow as any).judul,
        mataPelajaran: (scheduleRow as any).mata_pelajaran,
        fase: (scheduleRow as any).fase,
        targetKelas: (scheduleRow as any).target_kelas || [],
        durasiMenit: (scheduleRow as any).durasi_menit,
        token: realToken,
        tanpaToken: (scheduleRow as any).tanpa_token !== undefined ? (scheduleRow as any).tanpa_token : true,
        waktuMulai: (scheduleRow as any).waktu_mulai,
        waktuSelesai: (scheduleRow as any).waktu_selesai,
        acakSoal: (scheduleRow as any).acak_soal,
        acakOpsi: (scheduleRow as any).acak_opsi,
        kkm: (scheduleRow as any).kkm || 75,
        status: (scheduleRow as any).status || 'SEDANG_BERLANGSUNG',
        soalIds: (scheduleRow as any).soal_ids || [],
        totalSoal: (scheduleRow as any).total_soal || 0,
        totalBobot: (scheduleRow as any).total_bobot || 0,
        pembuat: scheduleOwner,
        guruUsername: scheduleOwner,
      };
    } else {
      // Fallback to local store or demo
      const localStore = readServerStore();
      const localFound = localStore.jadwalList.find((j) => j.id === scheduleId);
      if (localFound) {
        foundSchedule = localFound;
      }
    }

    if (!foundSchedule) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          message: `Jadwal ujian dengan ID "${scheduleId}" tidak ditemukan pada server CBT.`,
          debugError: schedErr?.message || null,
        },
        { status: 404 }
      );
    }

    // 2. Fetch questions for this schedule directly from Supabase
    let matchedQuestions: Soal[] = [];
    const questionIds = foundSchedule.soalIds || [];

    if (questionIds.length > 0) {
      const { data: soalRows } = await supabase
        .from('soal')
        .select('*')
        .in('id', questionIds);

      if (soalRows && soalRows.length > 0) {
        // Collect stimulus IDs if any
        const stimulusIds = soalRows
          .map((r: any) => r.stimulus_id)
          .filter(Boolean);

        const stimMap = new Map<string, Stimulus>();
        if (stimulusIds.length > 0) {
          const { data: stimRows } = await supabase
            .from('stimulus')
            .select('*')
            .in('id', stimulusIds);

          (stimRows || []).forEach((st: any) => {
            stimMap.set(st.id, {
              id: st.id,
              judul: st.judul,
              kontenTeks: st.konten_teks,
              tipe: st.tipe,
              gambarUrl: st.gambar_url || undefined,
              sumber: st.sumber || undefined,
            });
          });
        }

        matchedQuestions = soalRows.map((row: any) => ({
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
          stimulus: row.stimulus_id ? stimMap.get(row.stimulus_id) : undefined,
        }));
      }
    }

    // 3. Fallback: if no questions found by ID from Supabase, try local store
    if (matchedQuestions.length === 0) {
      const localStore = readServerStore();
      const localMatched = localStore.soalList.filter((s) =>
        foundSchedule!.soalIds.includes(s.id)
      );
      if (localMatched.length > 0) {
        matchedQuestions = localMatched;
      }
    }

    return NextResponse.json({
      success: true,
      schedule: foundSchedule,
      questions: matchedQuestions,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Terjadi gangguan saat mengambil sesi ujian.',
      },
      { status: 500 }
    );
  }
}

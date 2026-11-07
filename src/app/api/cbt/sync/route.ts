import { NextRequest, NextResponse } from 'next/server';
import { readServerStore, mergeAndPersist } from '@/lib/server-storage';
import { fetchStimulusFromDb, fetchSoalFromDb, fetchJadwalFromDb, fetchHasilFromDb } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const guruParam = req.nextUrl.searchParams.get('guru');
    const localStore = readServerStore();

    if (guruParam) {
      const cleanGuru = guruParam.trim().toLowerCase();

      // Ambil data spesifik milik guru ini dari Supabase
      const dbSoal = await fetchSoalFromDb(cleanGuru).catch(() => null);
      const dbJadwal = await fetchJadwalFromDb(cleanGuru).catch(() => null);
      const dbStimulus = await fetchStimulusFromDb(cleanGuru).catch(() => null);
      const dbHasil = await fetchHasilFromDb(cleanGuru).catch(() => null);

      // Filter local store jika bukan admin
      const filteredLocalSoal = cleanGuru === 'admin' 
        ? localStore.soalList 
        : localStore.soalList.filter((s) => (s.guruUsername || s.pembuat || '').toLowerCase() === cleanGuru);
      
      const filteredLocalJadwal = cleanGuru === 'admin'
        ? localStore.jadwalList
        : localStore.jadwalList.filter((j) => (j.guruUsername || j.pembuat || '').toLowerCase() === cleanGuru);
      
      const filteredLocalStim = cleanGuru === 'admin'
        ? localStore.stimulusList
        : localStore.stimulusList.filter((st) => (st.guruUsername || st.sumber || '').toLowerCase() === cleanGuru);

      const effectiveSoal =
        dbSoal && dbSoal.length > 0
          ? dbSoal
          : filteredLocalSoal.length > 0
          ? filteredLocalSoal
          : localStore.soalList;
      const effectiveJadwal =
        dbJadwal && dbJadwal.length > 0
          ? dbJadwal
          : filteredLocalJadwal.length > 0
          ? filteredLocalJadwal
          : localStore.jadwalList;
      const effectiveStim =
        dbStimulus && dbStimulus.length > 0
          ? dbStimulus
          : filteredLocalStim.length > 0
          ? filteredLocalStim
          : localStore.stimulusList;
      const effectiveHasil =
        dbHasil && dbHasil.length > 0 ? dbHasil : localStore.hasilList || [];

      return NextResponse.json({
        success: true,
        soalList: effectiveSoal,
        stimulusList: effectiveStim,
        jadwalList: effectiveJadwal,
        hasilList: effectiveHasil,
        guru: cleanGuru,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Default tanpa parameter guru (untuk siswa / public)
    const dbSoal = await fetchSoalFromDb().catch(() => null);
    const dbJadwal = await fetchJadwalFromDb().catch(() => null);
    const dbStimulus = await fetchStimulusFromDb().catch(() => null);
    const dbHasil = await fetchHasilFromDb().catch(() => null);

    const merged = await mergeAndPersist({
      soalList: dbSoal && dbSoal.length > 0 ? dbSoal : localStore.soalList,
      jadwalList: dbJadwal && dbJadwal.length > 0 ? dbJadwal : localStore.jadwalList,
      stimulusList: dbStimulus && dbStimulus.length > 0 ? dbStimulus : localStore.stimulusList,
      hasilList: dbHasil && dbHasil.length > 0 ? dbHasil : localStore.hasilList,
    });

    return NextResponse.json({
      success: true,
      soalList: merged.soalList,
      stimulusList: merged.stimulusList,
      jadwalList: merged.jadwalList,
      hasilList: merged.hasilList,
      lastUpdated: merged.lastUpdated,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message || 'Gagal sinkronisasi data',
      soalList: [],
      stimulusList: [],
      jadwalList: [],
      hasilList: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { soalList, stimulusList, jadwalList, hasilList, guruUsername } = body;

    const merged = await mergeAndPersist({
      soalList: Array.isArray(soalList) ? soalList : undefined,
      stimulusList: Array.isArray(stimulusList) ? stimulusList : undefined,
      jadwalList: Array.isArray(jadwalList) ? jadwalList : undefined,
      hasilList: Array.isArray(hasilList) ? hasilList : undefined,
    });

    if (guruUsername) {
      const cleanGuru = guruUsername.trim().toLowerCase();
      return NextResponse.json({
        success: true,
        soalList: merged.soalList.filter(
          (s) => (s.guruUsername || s.pembuat || '').toLowerCase() === cleanGuru
        ),
        stimulusList: merged.stimulusList.filter(
          (st) => (st.guruUsername || st.sumber || '').toLowerCase() === cleanGuru
        ),
        jadwalList: merged.jadwalList.filter(
          (j) => (j.guruUsername || j.pembuat || '').toLowerCase() === cleanGuru
        ),
        hasilList: merged.hasilList,
        lastUpdated: merged.lastUpdated,
      });
    }

    return NextResponse.json({
      success: true,
      soalList: merged.soalList,
      stimulusList: merged.stimulusList,
      jadwalList: merged.jadwalList,
      hasilList: merged.hasilList,
      lastUpdated: merged.lastUpdated,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Gagal menyinkronkan data CBT',
      },
      { status: 500 }
    );
  }
}

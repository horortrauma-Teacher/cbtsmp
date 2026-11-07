import fs from 'fs';
import path from 'path';
import { Soal, Stimulus, JadwalUjian, HasilUjianSiswa } from '@/types/cbt';
import {
  saveStimulusToDb,
  saveSoalToDb,
  saveJadwalToDb,
  saveHasilToDb,
  fetchStimulusFromDb,
  fetchSoalFromDb,
  fetchJadwalFromDb,
  fetchHasilFromDb,
} from './supabase-service';

export interface CBTServerStore {
  soalList: Soal[];
  stimulusList: Stimulus[];
  jadwalList: JadwalUjian[];
  hasilList: HasilUjianSiswa[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cbt-local-db.json');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function ensureDataDir(): void {
  if (isServerless) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // ignore
  }
}

export function readServerStore(): CBTServerStore {
  if (!isServerless) {
    ensureDataDir();
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        soalList: Array.isArray(parsed.soalList) ? parsed.soalList : [],
        stimulusList: Array.isArray(parsed.stimulusList) ? parsed.stimulusList : [],
        jadwalList: Array.isArray(parsed.jadwalList) ? parsed.jadwalList : [],
        hasilList: Array.isArray(parsed.hasilList) ? parsed.hasilList : [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    // fallback to empty
  }

  return {
    soalList: [],
    stimulusList: [],
    jadwalList: [],
    hasilList: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function writeServerStore(store: CBTServerStore): void {
  if (isServerless) return;
  ensureDataDir();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    // ignore
  }
}

export function deleteHasilFromServerStore(id: string): void {
  const current = readServerStore();
  const updatedStore: CBTServerStore = {
    ...current,
    hasilList: current.hasilList.filter((h) => h.id !== id),
    lastUpdated: new Date().toISOString(),
  };
  writeServerStore(updatedStore);
}

/**
 * Merges incoming items by ID with existing server items, preserving uniqueness
 */
export async function mergeAndPersist(incoming: {
  soalList?: Soal[];
  stimulusList?: Stimulus[];
  jadwalList?: JadwalUjian[];
  hasilList?: HasilUjianSiswa[];
}): Promise<CBTServerStore> {
  const current = readServerStore();

  // Merge Stimuli
  const stimMap = new Map<string, Stimulus>();
  current.stimulusList.forEach((s) => stimMap.set(s.id, s));
  if (Array.isArray(incoming.stimulusList)) {
    incoming.stimulusList.forEach((s) => stimMap.set(s.id, { ...(stimMap.get(s.id) || {}), ...s }));
  }
  const mergedStimulus = Array.from(stimMap.values());

  // Merge Soal
  const soalMap = new Map<string, Soal>();
  current.soalList.forEach((s) => soalMap.set(s.id, s));
  if (Array.isArray(incoming.soalList)) {
    incoming.soalList.forEach((s) => soalMap.set(s.id, { ...(soalMap.get(s.id) || {}), ...s }));
  }
  const mergedSoal = Array.from(soalMap.values());

  // Merge Jadwal
  const jadwalMap = new Map<string, JadwalUjian>();
  current.jadwalList.forEach((j) => jadwalMap.set(j.id, j));
  if (Array.isArray(incoming.jadwalList)) {
    incoming.jadwalList.forEach((j) => jadwalMap.set(j.id, { ...(jadwalMap.get(j.id) || {}), ...j }));
  }
  const mergedJadwal = Array.from(jadwalMap.values());

  // Merge Hasil
  const hasilMap = new Map<string, HasilUjianSiswa>();
  current.hasilList.forEach((h) => hasilMap.set(h.id, h));
  if (Array.isArray(incoming.hasilList)) {
    incoming.hasilList.forEach((h) => hasilMap.set(h.id, { ...(hasilMap.get(h.id) || {}), ...h }));
  }
  const mergedHasil = Array.from(hasilMap.values());

  const updatedStore: CBTServerStore = {
    soalList: mergedSoal,
    stimulusList: mergedStimulus,
    jadwalList: mergedJadwal,
    hasilList: mergedHasil,
    lastUpdated: new Date().toISOString(),
  };

  writeServerStore(updatedStore);

  // Background sync to Supabase (fire-and-forget for resilience)
  (async () => {
    try {
      if (Array.isArray(incoming.stimulusList)) {
        for (const st of incoming.stimulusList) {
          await saveStimulusToDb(st).catch(() => {});
        }
      }
      if (Array.isArray(incoming.soalList)) {
        for (const s of incoming.soalList) {
          await saveSoalToDb(s).catch(() => {});
        }
      }
      if (Array.isArray(incoming.jadwalList)) {
        for (const j of incoming.jadwalList) {
          await saveJadwalToDb(j).catch(() => {});
        }
      }
      if (Array.isArray(incoming.hasilList)) {
        for (const h of incoming.hasilList) {
          await saveHasilToDb(h).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[ServerStorage] Background Supabase sync warning:', e);
    }
  })();

  return updatedStore;
}

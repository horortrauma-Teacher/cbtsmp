'use client';

import { useState, useEffect, useMemo } from 'react';
import { Soal, Stimulus, JadwalUjian, HasilUjianSiswa } from '@/types/cbt';
import { getGuruProfile, GuruProfile } from './guru-auth';
import {
  saveStimulusToDb,
  deleteStimulusFromDb,
  saveSoalToDb,
  deleteSoalFromDb,
  saveJadwalToDb,
  deleteJadwalFromDb,
  saveHasilToDb,
} from './supabase-service';
import { autoHealHasilList } from './auto-heal-results';

const STORAGE_KEYS = {
  SOAL: 'cbt_guru_soal_v3',
  STIMULUS: 'cbt_guru_stimulus_v3',
  JADWAL: 'cbt_guru_jadwal_v3',
  HASIL: 'cbt_guru_hasil_v3',
};

/**
 * Memastikan item hanya dimiliki oleh guru yang sedang aktif login
 */
export function isItemOwnedByGuru(
  item: { guruUsername?: string; pembuat?: string } | null | undefined,
  activeGuru: GuruProfile | null
): boolean {
  if (!activeGuru || !activeGuru.username) return false;
  if (!item) return false;

  // Super Administrator memiliki akses ke seluruh data guru
  if (activeGuru.role === 'admin' || activeGuru.username.trim().toLowerCase() === 'admin') {
    return true;
  }

  const activeUsername = activeGuru.username.trim().toLowerCase();
  const itemUsername = (item.guruUsername || '').trim().toLowerCase();

  if (itemUsername && itemUsername === activeUsername) return true;

  const itemPembuat = (item.pembuat || '').trim().toLowerCase();
  if (itemPembuat && itemPembuat === activeUsername) return true;

  // Fallback nama lengkap jika ada
  const activeNama = (activeGuru.namaLengkap || '').trim().toLowerCase();
  if (itemPembuat && activeNama && itemPembuat === activeNama) return true;

  return false;
}

export function useCBTData() {
  const [rawSoalList, setRawSoalList] = useState<Soal[]>([]);
  const [rawStimulusList, setRawStimulusList] = useState<Stimulus[]>([]);
  const [rawJadwalList, setRawJadwalList] = useState<JadwalUjian[]>([]);
  const [rawHasilList, setRawHasilList] = useState<HasilUjianSiswa[]>([]);
  const [activeGuru, setActiveGuru] = useState<GuruProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync active guru profile
  useEffect(() => {
    const prof = getGuruProfile();
    setActiveGuru(prof);

    const handleAuth = () => {
      const updated = getGuruProfile();
      setActiveGuru(updated);
    };

    window.addEventListener('guru-auth-changed', handleAuth);
    window.addEventListener('guru-auth-change', handleAuth);
    window.addEventListener('storage', handleAuth);

    return () => {
      window.removeEventListener('guru-auth-changed', handleAuth);
      window.removeEventListener('guru-auth-change', handleAuth);
      window.removeEventListener('storage', handleAuth);
    };
  }, []);

  // Fetch data sesuai guru yang aktif login
  useEffect(() => {
    const prof = activeGuru || getGuruProfile();

    if (!prof || !prof.username) {
      setRawSoalList([]);
      setRawStimulusList([]);
      setRawJadwalList([]);
      setRawHasilList([]);
      setIsLoaded(true);
      return;
    }

    const guruKey = prof.username.toLowerCase();
    const syncUrl = `/api/cbt/sync?guru=${encodeURIComponent(guruKey)}`;

    fetch(syncUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRawSoalList(Array.isArray(data.soalList) ? data.soalList : []);
          setRawStimulusList(Array.isArray(data.stimulusList) ? data.stimulusList : []);
          setRawJadwalList(Array.isArray(data.jadwalList) ? data.jadwalList : []);

          const rawHasil = Array.isArray(data.hasilList) ? data.hasilList : [];
          // Otomatis deteksi & pulihkan hasil ujian lama (Menjodohkan / raw JSON)
          const { list: healedHasil, fixedCount } = autoHealHasilList(rawHasil);
          setRawHasilList(healedHasil);

          if (fixedCount > 0) {
            healedHasil.forEach((h) => {
              saveHasilToDb(h).catch(() => {});
            });
            fetch('/api/cbt/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hasilList: healedHasil }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoaded(true);
      });
  }, [activeGuru]);

  // Filtered lists khusus guru aktif
  const soalList = useMemo(() => {
    if (!activeGuru) return [];
    return rawSoalList.filter((s) => isItemOwnedByGuru(s, activeGuru));
  }, [rawSoalList, activeGuru]);

  const stimulusList = useMemo(() => {
    if (!activeGuru) return [];
    return rawStimulusList.filter((st) => isItemOwnedByGuru(st, activeGuru));
  }, [rawStimulusList, activeGuru]);

  const jadwalList = useMemo(() => {
    if (!activeGuru) return [];
    return rawJadwalList.filter((j) => isItemOwnedByGuru(j, activeGuru));
  }, [rawJadwalList, activeGuru]);

  const hasilList = useMemo(() => {
    if (!activeGuru) return [];
    const teacherJadwalIds = new Set(
      rawJadwalList.filter((j) => isItemOwnedByGuru(j, activeGuru)).map((j) => j.id)
    );
    if (teacherJadwalIds.size === 0) return [];
    return rawHasilList.filter((h) => teacherJadwalIds.has(h.jadwalId));
  }, [rawHasilList, rawJadwalList, activeGuru]);

  // Save to LocalStorage, Supabase & Server Sync
  const addSoal = (newSoal: Soal) => {
    const prof = activeGuru || getGuruProfile();
    const owner = (prof?.username || 'guru').toLowerCase();

    const taggedSoal: Soal = {
      ...newSoal,
      guruUsername: owner,
      pembuat: owner,
    };

    setRawSoalList((prev) => [taggedSoal, ...prev.filter((s) => s.id !== taggedSoal.id)]);

    // Background sync to Supabase & Server
    saveSoalToDb(taggedSoal, owner).catch(() => {});
    fetch('/api/cbt/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soalList: [taggedSoal], guruUsername: owner }),
    }).catch(() => {});
  };

  const deleteSoal = (id: string) => {
    setRawSoalList((prev) => prev.filter((s) => s.id !== id));
    deleteSoalFromDb(id).catch(() => {});
  };

  const addStimulus = (newStim: Stimulus) => {
    const prof = activeGuru || getGuruProfile();
    const owner = (prof?.username || 'guru').toLowerCase();

    const taggedStim: Stimulus = {
      ...newStim,
      guruUsername: owner,
      pembuat: owner,
      sumber: owner,
    };

    setRawStimulusList((prev) => [taggedStim, ...prev.filter((s) => s.id !== taggedStim.id)]);

    saveStimulusToDb(taggedStim, owner).catch(() => {});
    fetch('/api/cbt/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stimulusList: [taggedStim], guruUsername: owner }),
    }).catch(() => {});
  };

  const deleteStimulus = (id: string) => {
    setRawStimulusList((prev) => prev.filter((s) => s.id !== id));
    deleteStimulusFromDb(id).catch(() => {});
  };

  const addJadwal = (newJadwal: JadwalUjian) => {
    const prof = activeGuru || getGuruProfile();
    const owner = (prof?.username || 'guru').toLowerCase();

    const taggedJadwal: JadwalUjian = {
      ...newJadwal,
      guruUsername: owner,
      pembuat: owner,
    };

    setRawJadwalList((prev) => [taggedJadwal, ...prev.filter((j) => j.id !== taggedJadwal.id)]);

    saveJadwalToDb(taggedJadwal, owner).catch(() => {});
    fetch('/api/cbt/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jadwalList: [taggedJadwal], guruUsername: owner }),
    }).catch(() => {});
  };

  const updateJadwalStatus = (id: string, status: JadwalUjian['status']) => {
    setRawJadwalList((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
  };

  const deleteJadwal = (id: string) => {
    setRawJadwalList((prev) => prev.filter((j) => j.id !== id));
    deleteJadwalFromDb(id).catch(() => {});
  };

  const addHasilUjian = (newHasil: HasilUjianSiswa) => {
    setRawHasilList((prev) => [newHasil, ...prev.filter((h) => h.id !== newHasil.id)]);
    saveHasilToDb(newHasil).catch(() => {});
    fetch('/api/cbt/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasilList: [newHasil] }),
    }).catch(() => {});
  };

  return {
    soalList,
    allSoalList: rawSoalList,
    stimulusList,
    allStimulusList: rawStimulusList,
    jadwalList,
    allJadwalList: rawJadwalList,
    hasilList,
    allHasilList: rawHasilList,
    isLoaded,
    addSoal,
    deleteSoal,
    addStimulus,
    deleteStimulus,
    addJadwal,
    updateJadwalStatus,
    deleteJadwal,
    addHasilUjian,
    activeGuru,
  };
}

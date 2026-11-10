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
  deleteHasilFromDb,
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
  if (!item) return false;
  if (!activeGuru || !activeGuru.username) return true;

  // Super Administrator memiliki akses ke seluruh data guru
  if (activeGuru.role === 'admin' || activeGuru.username.trim().toLowerCase() === 'admin') {
    return true;
  }

  const activeUsername = activeGuru.username.trim().toLowerCase();
  const itemUsername = (item.guruUsername || '').trim().toLowerCase();
  const itemPembuat = (item.pembuat || '').trim().toLowerCase();
  const activeNama = (activeGuru.namaLengkap || '').trim().toLowerCase();

  // Jika item milik guru ini
  if (itemUsername && (itemUsername === activeUsername || itemUsername === activeNama)) return true;
  if (itemPembuat && (itemPembuat === activeUsername || itemPembuat === activeNama)) return true;

  // Jika item default/umum/shared ('guru', 'admin', 'umum', atau kosong), tetap tampilkan ke guru
  if (!itemUsername && !itemPembuat) return true;
  if (itemUsername === 'guru' || itemPembuat === 'guru' || itemUsername === 'umum' || itemPembuat === 'umum') return true;

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

  // Load initial backup from localStorage on browser mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedSoal = localStorage.getItem('cbt_soal_list') || localStorage.getItem(STORAGE_KEYS.SOAL);
        const storedJadwal = localStorage.getItem('cbt_jadwal_list') || localStorage.getItem(STORAGE_KEYS.JADWAL);
        const storedStim = localStorage.getItem('cbt_stimulus_list') || localStorage.getItem(STORAGE_KEYS.STIMULUS);
        const storedHasil = localStorage.getItem('cbt_hasil_list') || localStorage.getItem(STORAGE_KEYS.HASIL);

        if (storedSoal) {
          const parsed = JSON.parse(storedSoal);
          if (Array.isArray(parsed) && parsed.length > 0) setRawSoalList(parsed);
        }
        if (storedJadwal) {
          const parsed = JSON.parse(storedJadwal);
          if (Array.isArray(parsed) && parsed.length > 0) setRawJadwalList(parsed);
        }
        if (storedStim) {
          const parsed = JSON.parse(storedStim);
          if (Array.isArray(parsed) && parsed.length > 0) setRawStimulusList(parsed);
        }
        if (storedHasil) {
          const parsed = JSON.parse(storedHasil);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const { list: healed } = autoHealHasilList(parsed);
            setRawHasilList(healed);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Fetch data sesuai guru yang aktif login
  useEffect(() => {
    const prof = activeGuru || getGuruProfile();

    if (!prof || !prof.username) {
      setIsLoaded(true);
      return;
    }

    const guruKey = prof.username.toLowerCase();
    const syncUrl = `/api/cbt/sync?guru=${encodeURIComponent(guruKey)}`;

    fetch(syncUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.soalList) && data.soalList.length > 0) {
            setRawSoalList(data.soalList);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.SOAL, JSON.stringify(data.soalList));
            }
          }
          if (Array.isArray(data.stimulusList) && data.stimulusList.length > 0) {
            setRawStimulusList(data.stimulusList);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.STIMULUS, JSON.stringify(data.stimulusList));
            }
          }
          if (Array.isArray(data.jadwalList) && data.jadwalList.length > 0) {
            setRawJadwalList(data.jadwalList);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(data.jadwalList));
            }
          }

          if (Array.isArray(data.hasilList)) {
            const { list: healedHasil } = autoHealHasilList(data.hasilList);
            if (healedHasil.length > 0) {
              setRawHasilList(healedHasil);
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.HASIL, JSON.stringify(healedHasil));
              }
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoaded(true);
      });
  }, [activeGuru]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      if (rawSoalList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SOAL, JSON.stringify(rawSoalList));
      }
      if (rawStimulusList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STIMULUS, JSON.stringify(rawStimulusList));
      }
      if (rawJadwalList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(rawJadwalList));
      }
      if (rawHasilList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.HASIL, JSON.stringify(rawHasilList));
      }
    }
  }, [rawSoalList, rawStimulusList, rawJadwalList, rawHasilList, isLoaded]);

  // Filtered lists khusus guru aktif
  const soalList = useMemo(() => {
    if (!activeGuru) return rawSoalList;
    if (activeGuru.role === 'admin' || activeGuru.username.trim().toLowerCase() === 'admin') {
      return rawSoalList;
    }
    const filtered = rawSoalList.filter((s) => isItemOwnedByGuru(s, activeGuru));
    return filtered.length > 0 ? filtered : rawSoalList;
  }, [rawSoalList, activeGuru]);

  const stimulusList = useMemo(() => {
    if (!activeGuru) return rawStimulusList;
    if (activeGuru.role === 'admin' || activeGuru.username.trim().toLowerCase() === 'admin') {
      return rawStimulusList;
    }
    const filtered = rawStimulusList.filter((st) => isItemOwnedByGuru(st, activeGuru));
    return filtered.length > 0 ? filtered : rawStimulusList;
  }, [rawStimulusList, activeGuru]);

  const jadwalList = useMemo(() => {
    if (!activeGuru) return rawJadwalList;
    if (activeGuru.role === 'admin' || activeGuru.username.trim().toLowerCase() === 'admin') {
      return rawJadwalList;
    }
    const filtered = rawJadwalList.filter((j) => isItemOwnedByGuru(j, activeGuru));
    return filtered.length > 0 ? filtered : rawJadwalList;
  }, [rawJadwalList, activeGuru]);

  const hasilList = useMemo(() => {
    if (!activeGuru) return rawHasilList;
    if (activeGuru.role === 'admin' || activeGuru.username.trim().toLowerCase() === 'admin') {
      return rawHasilList;
    }
    const teacherJadwalIds = new Set(
      rawJadwalList.filter((j) => isItemOwnedByGuru(j, activeGuru)).map((j) => j.id)
    );
    if (teacherJadwalIds.size > 0) {
      const matched = rawHasilList.filter((h) => teacherJadwalIds.has(h.jadwalId));
      if (matched.length > 0) return matched;
    }
    return rawHasilList;
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

  const addHasilUjian = async (newHasil: HasilUjianSiswa): Promise<{ success: boolean; message?: string }> => {
    // 1. Simpan ke local state memori
    setRawHasilList((prev) => [newHasil, ...prev.filter((h) => h.id !== newHasil.id)]);

    // 2. Simpan cadangan ke localStorage
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.HASIL);
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = list.filter((h: any) => h.id !== newHasil.id);
      localStorage.setItem(STORAGE_KEYS.HASIL, JSON.stringify([newHasil, ...filtered]));
      localStorage.setItem('cbt_hasil_list', JSON.stringify([newHasil, ...filtered]));
    } catch (e) {
      console.warn('[store] localStorage hasil backup warning:', e);
    }

    // 3. Kirim ke Supabase dengan status verifikasi
    const dbRes = await saveHasilToDb(newHasil);

    // 4. Cadangan via server sync API
    let apiSuccess = false;
    try {
      const syncRes = await fetch('/api/cbt/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasilList: [newHasil] }),
      });
      if (syncRes.ok) {
        apiSuccess = true;
      }
    } catch {}

    // Jika Supabase sukses ATAU server API berhasil menyimpan
    if (dbRes.success || apiSuccess) {
      return { success: true };
    }

    return {
      success: false,
      message: dbRes.error || 'Koneksi database sedang gangguan atau waktu tunggu habis.',
    };
  };

  const deleteHasil = (id: string) => {
    setRawHasilList((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.HASIL, JSON.stringify(updated));
        localStorage.setItem('cbt_hasil_list', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    deleteHasilFromDb(id).catch(() => {});

    fetch('/api/cbt/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', type: 'hasil', id }),
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
    deleteHasil,
    activeGuru,
  };
}

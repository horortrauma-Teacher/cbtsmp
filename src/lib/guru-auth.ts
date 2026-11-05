'use client';

import { useState, useEffect } from 'react';
import { registerGuruToDb, loginGuruFromDb } from './supabase-service';
import { GuruAccount } from '@/types/cbt';

export interface GuruSession {
  username: string;
  namaLengkap: string;
  nip: string;
  sekolah: string;
  mataPelajaran?: string;
  role: 'guru' | 'admin' | 'proktor';
  avatarInitials: string;
  loginAt: string;
  isLoggedIn: boolean;
  storageDir?: string;
}

export const EMPTY_GURU_SESSION: GuruSession = {
  username: '',
  namaLengkap: 'Bapak/Ibu Guru',
  nip: '-',
  sekolah: 'SMP Negeri',
  mataPelajaran: 'Umum',
  role: 'guru',
  avatarInitials: 'GR',
  loginAt: '',
  isLoggedIn: false,
  storageDir: 'guru/default',
};

const STORAGE_KEY = 'cbt_guru_session';
const COOKIE_KEY = 'cbt_guru_session';
const AUTH_EVENT_NAME = 'guru-auth-changed';

/**
 * Ekstrak inisial 2 huruf dari nama lengkap
 */
export const extractInitials = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') return 'GR';

  const cleaned = fullName
    .replace(/(Drs\.|Dra\.|Ir\.|Dr\.|H\.|Hj\.|Pak|Ibu|Prof\.)/gi, '')
    .replace(/,\s*(S\.Pd|M\.Pd|M\.Si|S\.Kom|M\.T|S\.T|S\.Si|M\.Ed|Ph\.D|Llc|B\.A)/gi, '')
    .replace(/[.,]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return 'GR';
};

/**
 * Membaca sesi guru yang tersimpan di localStorage / cookie
 */
export const getGuruSession = (): GuruSession => {
  if (typeof window === 'undefined') {
    return EMPTY_GURU_SESSION;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.isLoggedIn) {
        return parsed as GuruSession;
      }
    }
  } catch (err) {
    console.warn('[GuruAuth] Error reading session from localStorage:', err);
  }

  return EMPTY_GURU_SESSION;
};

/**
 * Mengecek apakah guru saat ini dalam status aktif login
 */
export const isGuruLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.username && parsed.isLoggedIn);
  } catch {
    return false;
  }
};

/**
 * Menyimpan sesi login ke localStorage & cookie
 */
export const setGuruSession = (session: GuruSession): void => {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(
      serialized
    )}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

    window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: session }));
    window.dispatchEvent(new CustomEvent('guru-auth-change', { detail: session }));
  } catch (err) {
    console.warn('[GuruAuth] Error saving session:', err);
  }
};

/**
 * Registrasi akun guru baru langsung ke Supabase Cloud
 */
export const registerGuru = async (params: {
  username: string;
  password?: string;
  namaLengkap: string;
  nip?: string;
  sekolah?: string;
  mataPelajaran?: string;
}): Promise<{ success: boolean; message: string; session?: GuruSession }> => {
  const result = await registerGuruToDb(params);

  if (!result.success || !result.account) {
    return { success: false, message: result.message };
  }

  const account = result.account;
  const initials = extractInitials(account.namaLengkap);

  const session: GuruSession = {
    username: account.username,
    namaLengkap: account.namaLengkap,
    nip: account.nip || '-',
    sekolah: account.sekolah || 'SMP Negeri',
    mataPelajaran: account.mataPelajaran || 'Umum',
    role: account.role || 'guru',
    avatarInitials: initials,
    loginAt: new Date().toISOString(),
    isLoggedIn: true,
    storageDir: account.storageDir || `guru/${account.username}`,
  };

  setGuruSession(session);
  return { success: true, message: result.message, session };
};

/**
 * Login akun guru memvalidasi kredensial ke Supabase Cloud
 */
export const loginGuru = async (params: {
  username: string;
  password?: string;
}): Promise<{ success: boolean; message: string; session?: GuruSession }> => {
  const result = await loginGuruFromDb(params.username, params.password);

  if (!result.success || !result.account) {
    return { success: false, message: result.message };
  }

  const account = result.account;
  const initials = extractInitials(account.namaLengkap);

  const session: GuruSession = {
    username: account.username,
    namaLengkap: account.namaLengkap,
    nip: account.nip || '-',
    sekolah: account.sekolah || 'SMP Negeri',
    mataPelajaran: account.mataPelajaran || 'Umum',
    role: account.role || 'guru',
    avatarInitials: initials,
    loginAt: new Date().toISOString(),
    isLoggedIn: true,
    storageDir: account.storageDir || `guru/${account.username}`,
  };

  setGuruSession(session);
  return { success: true, message: result.message, session };
};

/**
 * Logout dan hapus sesi aktif
 */
export const logoutGuru = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: null }));
    window.dispatchEvent(new CustomEvent('guru-auth-change', { detail: null }));
  } catch (err) {
    console.warn('[GuruAuth] Error during logout:', err);
  }
};

/**
 * React hook sesi guru reaktif
 */
export const useGuruSession = () => {
  const [session, setSession] = useState<GuruSession>(EMPTY_GURU_SESSION);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSession(getGuruSession());
    setIsLoaded(true);

    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<GuruSession | null>;
      if (customEvent.detail && customEvent.detail.isLoggedIn) {
        setSession(customEvent.detail);
      } else {
        setSession(EMPTY_GURU_SESSION);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSession(getGuruSession());
      }
    };

    window.addEventListener(AUTH_EVENT_NAME, handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    session,
    isLoaded,
    isLoggedIn: session.isLoggedIn,
    logout: logoutGuru,
    updateSession: setGuruSession,
  };
};

export type GuruProfile = GuruSession;
export const getGuruProfile = (): GuruProfile | null => {
  if (typeof window === 'undefined') return null;
  const s = getGuruSession();
  return s.isLoggedIn ? s : null;
};
export const setGuruProfile = (profile: any): void => {
  setGuruSession(profile);
};
export const isAuthenticatedGuru = isGuruLoggedIn;
export const DEFAULT_GURU_SESSION = EMPTY_GURU_SESSION;

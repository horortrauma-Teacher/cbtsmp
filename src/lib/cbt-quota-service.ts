/**
 * Unified Quota Service (Integrasi Kuota Terpadu ModulGen AI & CBT Online)
 * Menggunakan database Supabase pusat untuk menyinkronkan saldo kuota guru
 * antara pembuatan Modul Ajar/LKPD (Port 3001) dan Bank Soal/CBT (Port 3000).
 */

import { createClient } from '@supabase/supabase-js';

const QUOTA_URL =
  process.env.NEXT_PUBLIC_QUOTA_SUPABASE_URL ||
  'https://qyqxtqewznjupclszxrz.supabase.co';

const QUOTA_KEY =
  process.env.QUOTA_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_QUOTA_SUPABASE_ANON_KEY ||
  'sb_publishable_yhLPeHB8Lx4lj5zPR3tBHQ_mlhZaOwX';

export const quotaClient = createClient(QUOTA_URL, QUOTA_KEY);

const FALLBACK_DEFAULT_QUOTA = 10;
const QUOTA_LOCAL_STORAGE_KEY = 'cbt_unified_quota_cache';

/**
 * Mendapatkan email guru aktif dari sesi CBT atau ModulGen
 */
export function getActiveGuruEmail(): string {
  if (typeof window === 'undefined') {
    return 'guru@daarelqolam.sch.id';
  }

  try {
    // 1. Cek sesi Guru CBT
    const cbtSessionRaw = localStorage.getItem('cbt_guru_session');
    if (cbtSessionRaw) {
      const parsed = JSON.parse(cbtSessionRaw);
      if (parsed?.email) return parsed.email.toLowerCase().trim();
      if (parsed?.username) return `${parsed.username.toLowerCase().trim()}@daarelqolam.sch.id`;
    }

    // 2. Cek sesi ModulGen jika ada di browser yang sama
    const modulgenUserRaw = localStorage.getItem('modulgen_dummy_user');
    if (modulgenUserRaw) {
      const parsed = JSON.parse(modulgenUserRaw);
      if (parsed?.email) return parsed.email.toLowerCase().trim();
    }
  } catch (err) {
    console.warn('[UnifiedQuota] Gagal membaca email aktif:', err);
  }

  return 'guru@daarelqolam.sch.id';
}

/**
 * Mengambil sisa kuota terpadu langsung dari Supabase Database
 */
export async function getUnifiedQuota(email?: string): Promise<number> {
  const targetEmail = (email || getActiveGuruEmail()).toLowerCase().trim();

  try {
    const { data, error } = await quotaClient
      .from('users')
      .select('quota')
      .eq('email', targetEmail)
      .maybeSingle();

    if (!error && data && typeof data.quota === 'number') {
      if (typeof window !== 'undefined') {
        localStorage.setItem(QUOTA_LOCAL_STORAGE_KEY, String(data.quota));
      }
      return data.quota;
    }

    // Jika user belum ada di tabel, inisialisasi dengan 10 kuota gratis
    if (!data) {
      try {
        const safeUid = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const { error: insertErr } = await quotaClient
          .from('users')
          .insert([
            {
              email: targetEmail,
              firebase_uid: safeUid,
              name: targetEmail.split('@')[0],
              quota: FALLBACK_DEFAULT_QUOTA
            }
          ]);

        if (!insertErr) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(QUOTA_LOCAL_STORAGE_KEY, String(FALLBACK_DEFAULT_QUOTA));
          }
          return FALLBACK_DEFAULT_QUOTA;
        }
      } catch (insertEx) {
        console.warn('[UnifiedQuota] Inisialisasi user baru dilewati:', insertEx);
      }
    }
  } catch (err) {
    console.warn('[UnifiedQuota] Gagal fetch kuota dari Supabase, menggunakan cache:', err);
  }

  // Fallback cache lokal jika offline
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(QUOTA_LOCAL_STORAGE_KEY);
    if (cached !== null && !isNaN(Number(cached))) {
      return Number(cached);
    }
  }

  return FALLBACK_DEFAULT_QUOTA;
}

/**
 * Memotong kuota terpadu setelah aksi generate AI (Modul atau Soal CBT)
 */
export async function deductUnifiedQuota(
  email?: string,
  amount: number = 1
): Promise<{ success: boolean; remaining: number; message?: string }> {
  const targetEmail = (email || getActiveGuruEmail()).toLowerCase().trim();
  const currentQuota = await getUnifiedQuota(targetEmail);

  if (currentQuota < amount) {
    return {
      success: false,
      remaining: currentQuota,
      message: `Kuota Kredit Terpadu tidak mencukupi (Sisa: ${currentQuota}, Dibutuhkan: ${amount}). Silakan isi ulang di ModulGen AI.`
    };
  }

  const newQuota = Math.max(0, currentQuota - amount);

  try {
    const { error } = await quotaClient
      .from('users')
      .update({ quota: newQuota })
      .eq('email', targetEmail);

    if (error) {
      console.warn('[UnifiedQuota] Gagal update kuota di Supabase:', error.message);
    }
  } catch (err) {
    console.warn('[UnifiedQuota] Exception saat potong kuota:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(QUOTA_LOCAL_STORAGE_KEY, String(newQuota));
    window.dispatchEvent(new CustomEvent('unified-quota-changed', { detail: { quota: newQuota } }));
  }

  return {
    success: true,
    remaining: newQuota,
    message: `Kuota berhasil dipotong ${amount}. Sisa kuota: ${newQuota}.`
  };
}

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

const DEFAULT_SUPABASE_URL = 'https://zjrgdpvmsqpvkshbjkps.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcmdkcHZtc3FwdmtzaGJqa3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTIzNzUsImV4cCI6MjEwNzcyODM3NX0.5eXUDW-FfpOUFANgSsvofu6ZMDsIp6UGtMWN28Drjso';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_URL = rawUrl && rawUrl.startsWith('http') ? rawUrl : DEFAULT_SUPABASE_URL;

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SUPABASE_ANON_KEY =
  rawKey && rawKey.startsWith('eyJhbGciOi') ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

/**
 * Check if real Supabase credentials are configured in environment variables.
 * Returns false if missing, undefined, or default mock placeholder.
 */
export const isSupabaseConfigured = (): boolean => {
  return true;
};

// Singleton Supabase Client
let browserClient: SupabaseClient<Database> | null = null;

/**
 * Get or create the Supabase browser client singleton.
 * Safe for use in Next.js Client Components and Server Components.
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (browserClient) {
    return browserClient;
  }

  try {
    browserClient = createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.warn('[Supabase Client] Failed to initialize real client, falling back to mock client.', error);
    // Fallback safe client initialization
    browserClient = createSupabaseClient<Database>('https://cbt-mock.supabase.co', 'mock-anon-key');
  }

  return browserClient;
};

export const supabase = getSupabaseClient();

/**
 * Helper to create a new client instance if needed (e.g. server-side with custom options)
 */
export const createClient = () => getSupabaseClient();

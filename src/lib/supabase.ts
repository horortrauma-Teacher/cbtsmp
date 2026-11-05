import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const DEFAULT_SUPABASE_URL = 'https://zjrgdpvmsqpvkshbjkps.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcmdkcHZtc3FwdmtzaGJqa3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTIzNzUsImV4cCI6MjEwNzcyODM3NX0.5eXUDW-FfpOUFANgSsvofu6ZMDsIp6UGtMWN28Drjso';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : DEFAULT_SUPABASE_URL;

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseAnonKey =
  rawKey && rawKey.startsWith('eyJhbGciOi') ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
  },
});

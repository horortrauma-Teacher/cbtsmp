const { createClient } = require('@supabase/supabase-js');
const url = 'https://zjrgdpvmsqpvkshbjkps.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcmdkcHZtc3FwdmtzaGJqa3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTIzNzUsImV4cCI6MjEwNzcyODM3NX0.5eXUDW-FfpOUFANgSsvofu6ZMDsIp6UGtMWN28Drjso';
const client = createClient(url, key);

async function check() {
  const tables = ['login_guru', 'login_siswa', 'guru', 'siswa', 'users_guru', 'users_siswa'];
  for (const t of tables) {
    const res = await client.from(t).select('*').limit(1);
    console.log(t, res.error ? res.error.message : 'EXISTS');
  }
}
check();

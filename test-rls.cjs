const { createClient } = require('@supabase/supabase-js');
const url = 'https://zjrgdpvmsqpvkshbjkps.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcmdkcHZtc3FwdmtzaGJqa3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTIzNzUsImV4cCI6MjEwNzcyODM3NX0.5eXUDW-FfpOUFANgSsvofu6ZMDsIp6UGtMWN28Drjso';
const client = createClient(url, key);

async function test() {
  const { data, error } = await client.rpc('get_rls_status').catch(() => ({ data: null, error: 'no rpc' }));
  console.log('RPC:', data, error);
}
test();

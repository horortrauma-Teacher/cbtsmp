import { NextRequest, NextResponse } from 'next/server';
import { quotaClient } from '@/lib/cbt-quota-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || 'guru@daarelqolam.sch.id').toLowerCase().trim();

    const { data, error } = await quotaClient
      .from('users')
      .select('quota')
      .eq('email', email)
      .maybeSingle();

    if (!error && data && typeof data.quota === 'number') {
      return NextResponse.json({ quota: data.quota });
    }

    // Auto-create user with 10 free quota if not found
    const safeUid = email.replace(/[^a-zA-Z0-9]/g, '_');
    const { data: created, error: insertErr } = await quotaClient
      .from('users')
      .insert([
        {
          email,
          firebase_uid: safeUid,
          name: email.split('@')[0],
          quota: 10
        }
      ])
      .select('quota')
      .maybeSingle();

    if (!insertErr && created && typeof created.quota === 'number') {
      return NextResponse.json({ quota: created.quota });
    }

    return NextResponse.json({ quota: 10 });
  } catch (err: any) {
    console.warn('[API Quota] Error fetching quota on server:', err);
    return NextResponse.json({ quota: 10 });
  }
}

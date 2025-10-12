import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { search, status, sort = 'created_at', order = 'desc' } = req.query;

  try {
    let query = supabase
      .from('manuscripts')
      .select('*, chapters(count)')
      .eq('org_id', u.orgId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sort as string, { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ ok: true, manuscripts: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

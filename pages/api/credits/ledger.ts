import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { listLedger } from '@/lib/credits';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limit = Number(req.query.limit || 100);

  try {
    const ledger = await listLedger(u.orgId, limit);
    res.json({ ledger });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

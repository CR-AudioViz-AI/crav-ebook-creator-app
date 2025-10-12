import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { getBalance } from '@/lib/credits';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orgId = u.orgId;

  try {
    const balance = await getBalance(orgId);
    res.json({ balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgId, returnTo } = req.body || {};

  if (!orgId) {
    return res.status(400).json({ error: 'Missing orgId' });
  }

  const secret = process.env.SHARED_DASHBOARD_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Dashboard integration not configured' });
  }

  try {
    const token = jwt.sign({ mode: 'shared', orgId }, secret, { expiresIn: '10m' });

    res.json({
      token,
      appUrl: `${process.env.APP_PUBLIC_URL || 'http://localhost:3000'}/studio`,
      returnTo: returnTo || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

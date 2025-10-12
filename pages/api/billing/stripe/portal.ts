import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const { customerId } = req.body || {};

  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url:
        process.env.STRIPE_PORTAL_RETURN_URL || `${req.headers.origin}/billing`,
    });

    res.json({ url: portal.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

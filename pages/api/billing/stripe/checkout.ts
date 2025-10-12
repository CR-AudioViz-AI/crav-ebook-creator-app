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

  const { priceId, email } = req.body || {};

  if (!priceId || !email) {
    return res.status(400).json({ error: 'Missing priceId or email' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${req.headers.origin}/billing?success=1`,
      cancel_url: `${req.headers.origin}/billing?canceled=1`,
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

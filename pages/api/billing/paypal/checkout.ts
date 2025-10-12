import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from 'paypal-rest-sdk';

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID || '',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || '',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    credits = 1000,
    returnUrl = `${process.env.NEXTAUTH_URL}/billing`,
    cancelUrl = `${process.env.NEXTAUTH_URL}/billing`,
  } = req.body || {};

  const payment: any = {
    intent: 'sale',
    payer: { payment_method: 'paypal' },
    redirect_urls: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
    transactions: [
      {
        amount: {
          total: '10.00',
          currency: 'USD',
        },
        description: `CRAV credits ${credits}`,
      },
    ],
  };

  paypal.payment.create(payment, (err, payment) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err });
    }
    const approval = payment.links?.find((l) => l.rel === 'approval_url')?.href;
    res.json({ ok: true, url: approval });
  });
}

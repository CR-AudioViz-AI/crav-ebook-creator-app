import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const event = req.body;

    if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
      const sale = event.resource;
      const orgId = sale.custom || 'resolve-from-metadata';
      const amount = parseFloat(sale.amount?.total || '0');

      const creditsMap: Record<string, number> = {
        '10.00': 1000,
        '25.00': 3000,
        '50.00': 7000,
      };

      const credits = creditsMap[amount.toFixed(2)] || 1000;

      const { data: wallet } = await supabase
        .from('credit_balances')
        .select('balance')
        .eq('org_id', orgId)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from('credit_balances')
          .update({ balance: wallet.balance + credits })
          .eq('org_id', orgId);

        await supabase.from('credit_ledger').insert({
          org_id: orgId,
          user_id: null,
          type: 'TOPUP',
          amount: credits,
          reason: 'PAYPAL_PURCHASE',
          meta: { sale_id: sale.id, amount: sale.amount?.total },
        });
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}

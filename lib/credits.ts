import { supabase } from './supabase';
import { adminBypassEnabled } from './auth-helpers/admin';

const FREE_MONTHLY_CREDITS = Number(process.env.FREE_MONTHLY_CREDITS || 10000);

export const METERS = {
  OUTLINE: Number(process.env.EBOOK_OUTLINE_CREDITS || 1000),
  CHAPTER: Number(process.env.EBOOK_CHAPTER_CREDITS || 500),
  EXPORT_PDF: Number(process.env.EXPORT_PDF_CREDITS || 50),
  EXPORT_EPUB: Number(process.env.EXPORT_EPUB_CREDITS || 50),
  EXPORT_DOCX: Number(process.env.EXPORT_DOCX_CREDITS || 50),
} as const;

export async function getBalance(orgId: string): Promise<number> {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) throw error;
  return data?.balance ?? 0;
}

export async function setBalance(orgId: string, balance: number): Promise<void> {
  const { error } = await supabase
    .from('credit_balances')
    .upsert({ org_id: orgId, balance, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function listLedger(orgId: string, limit = 100) {
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function appendLedger(entry: {
  org_id: string;
  user_id: string;
  type: 'GRANT' | 'TOPUP' | 'SPEND' | 'REFUND';
  amount: number;
  reason: string;
  meta?: any;
  idempotency_key?: string;
}) {
  const { data, error } = await supabase
    .from('credit_ledger')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function grantMonthly(
  orgId: string,
  userId: string,
  reason = 'MONTHLY_FREE'
): Promise<void> {
  const balance = await getBalance(orgId);
  await setBalance(orgId, balance + FREE_MONTHLY_CREDITS);
  await appendLedger({
    org_id: orgId,
    user_id: userId,
    type: 'GRANT',
    amount: FREE_MONTHLY_CREDITS,
    reason,
  });

  await supabase
    .from('credit_balances')
    .update({ last_grant_at: new Date().toISOString() })
    .eq('org_id', orgId);
}

export async function spend(
  orgId: string,
  userId: string,
  amount: number,
  reason: string,
  meta?: any,
  idempotencyKey?: string
): Promise<any> {
  if (amount <= 0) throw new Error('Amount must be positive');

  const adminFree = adminBypassEnabled() && meta?.adminEmailBypass === true;

  if (adminFree) {
    return appendLedger({
      org_id: orgId,
      user_id: userId,
      type: 'SPEND',
      amount: 0,
      reason: `${reason}_ADMIN_BYPASS`,
      meta,
      idempotency_key: idempotencyKey,
    });
  }

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('credit_ledger')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return existing;
    }
  }

  const balance = await getBalance(orgId);
  if (balance < amount) {
    throw new Error('INSUFFICIENT_CREDITS');
  }

  await setBalance(orgId, balance - amount);

  return await appendLedger({
    org_id: orgId,
    user_id: userId,
    type: 'SPEND',
    amount: -amount,
    reason,
    meta,
    idempotency_key: idempotencyKey,
  });
}

export async function topup(
  orgId: string,
  userId: string,
  amount: number,
  reason = 'TOPUP',
  meta?: any
): Promise<void> {
  const balance = await getBalance(orgId);
  await setBalance(orgId, balance + amount);
  await appendLedger({
    org_id: orgId,
    user_id: userId,
    type: 'TOPUP',
    amount,
    reason,
    meta,
  });
}

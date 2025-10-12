import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { METERS, spend } from '@/lib/credits';
import { supabase } from '@/lib/supabase';
import { SnippetSchema } from '@/lib/ebooks/schemas';
import { useIdempotency, rateLimit, getClientIp } from '@/lib/ebooks/safety';
import { textSnippets } from '@/lib/ebooks/ai-providers';

const SNIPPET_COST = 50;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await rateLimit(getClientIp(req));
  } catch (error: any) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const idk = useIdempotency(req.headers['idempotency-key'] as string);
  if (idk.hit) {
    return res.json(idk.data);
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parse = SnippetSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_INPUT',
      issues: parse.error.format(),
    });
  }

  const { topic, tone, type, variants } = parse.data;

  try {
    await spend(u.orgId, u.userId, SNIPPET_COST, 'SNIPPET', {
      topic,
      type,
      variants,
      adminEmailBypass: u.isAdmin,
    });

    const snippets = await textSnippets({ topic, tone, type, variants });

    await supabase.from('snippet_jobs').insert({
      org_id: u.orgId,
      user_id: u.userId,
      topic,
      tone,
      type,
      variants,
      result: snippets,
    });

    const payload = { ok: true, topic, tone, type, snippets };
    idk.set?.(payload);
    res.json(payload);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    console.error('Snippet generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { METERS, spend } from '@/lib/credits';
import { supabase } from '@/lib/supabase';
import { OutlineSchema } from '@/lib/ebooks/schemas';
import { useIdempotency, rateLimit, getClientIp } from '@/lib/ebooks/safety';
import { textOutline } from '@/lib/ebooks/ai-providers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const parse = OutlineSchema.safeParse(req.body?.brief || req.body);
  if (!parse.success) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_INPUT',
      issues: parse.error.format(),
    });
  }

  const {
    topic,
    chapters,
    audience,
    tone,
    goals,
    wordsPerChapter,
    citations,
  } = parse.data;

  try {
    await spend(u.orgId, u.userId, METERS.OUTLINE, 'OUTLINE', {
      topic,
      chapters,
      adminEmailBypass: u.isAdmin,
    });

    const outline = await textOutline({
      topic,
      chapters,
      audience,
      tone,
      goals,
    });

    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .insert({
        org_id: u.orgId,
        user_id: u.userId,
        title: topic,
        subtitle: audience ? `For ${audience}` : null,
        status: 'OUTLINE',
        brief: {
          topic,
          audience,
          goals,
          tone,
          chapters,
          wordsPerChapter,
          citations,
        },
      })
      .select()
      .single();

    if (manuscriptError || !manuscript) {
      throw new Error('Failed to create manuscript');
    }

    for (let i = 0; i < outline.chapters.length; i++) {
      await supabase.from('chapters').insert({
        manuscript_id: manuscript.id,
        title: outline.chapters[i].title,
        position: i + 1,
        content_html: '',
      });
    }

    const payload = { ok: true, manuscriptId: manuscript.id, outline };
    idk.set?.(payload);
    res.json(payload);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    console.error('Outline generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

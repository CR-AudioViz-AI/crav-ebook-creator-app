import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { METERS, spend } from '@/lib/credits';
import { supabase } from '@/lib/supabase';
import { ChapterSchema } from '@/lib/ebooks/schemas';
import { useIdempotency, rateLimit, getClientIp } from '@/lib/ebooks/safety';
import { textChapter } from '@/lib/ebooks/ai-providers';

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

  const parse = ChapterSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_INPUT',
      issues: parse.error.format(),
    });
  }

  const { chapterId, words, brief, tone } = parse.data;

  try {
    const { data: chapter } = await supabase
      .from('chapters')
      .select('title, manuscript_id')
      .eq('id', chapterId)
      .maybeSingle();

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    await spend(u.orgId, u.userId, METERS.CHAPTER, 'CHAPTER', {
      chapterId,
      title: chapter.title,
      adminEmailBypass: u.isAdmin,
    });

    const contentHtml = await textChapter({
      title: chapter.title,
      words,
      brief,
      tone,
    });

    await supabase
      .from('chapters')
      .update({ content_html: contentHtml, updated_at: new Date().toISOString() })
      .eq('id', chapterId);

    const payload = { ok: true, chapterId, contentMd: contentHtml, contentHtml };
    idk.set?.(payload);
    res.json(payload);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    console.error('Chapter generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

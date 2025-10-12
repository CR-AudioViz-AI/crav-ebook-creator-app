import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { supabase } from '@/lib/supabase';
import { spend } from '@/lib/credits';
import { ImageSchema } from '@/lib/ebooks/schemas';
import { useIdempotency, rateLimit, getClientIp } from '@/lib/ebooks/safety';
import { imageGen } from '@/lib/ebooks/ai-providers';

const IMAGE_COST = 200;

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

  const parse = ImageSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_INPUT',
      issues: parse.error.format(),
    });
  }

  const { manuscriptId, prompt, style, width, height } = parse.data;

  try {
    await spend(u.orgId, u.userId, IMAGE_COST, 'IMAGE_GENERATION', {
      manuscriptId,
      prompt,
      style,
      adminEmailBypass: u.isAdmin,
    });

    const { url: imageUrl } = await imageGen({ prompt, style, width, height });

    const { data: asset } = await supabase
      .from('media_assets')
      .insert({
        org_id: u.orgId,
        manuscript_id: manuscriptId || null,
        user_id: u.userId,
        kind: 'image',
        url: imageUrl,
        alt: prompt,
        meta: { prompt, style, width, height },
      })
      .select()
      .single();

    if (manuscriptId && asset) {
      const { data: manuscript } = await supabase
        .from('manuscripts')
        .select('brief')
        .eq('id', manuscriptId)
        .maybeSingle();

      const updatedBrief = {
        ...(manuscript?.brief || {}),
        coverImage: imageUrl,
        coverPrompt: prompt,
        coverAssetId: asset.id,
      };

      await supabase
        .from('manuscripts')
        .update({ brief: updatedBrief })
        .eq('id', manuscriptId);
    }

    const payload = {
      ok: true,
      url: imageUrl,
      assetId: asset?.id,
      prompt,
      style,
      dimensions: { width, height },
    };
    idk.set?.(payload);
    res.json(payload);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

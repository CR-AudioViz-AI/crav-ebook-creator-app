import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { supabase } from '@/lib/supabase';
import { spend } from '@/lib/credits';

const IMAGE_COST = 200;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    manuscriptId,
    prompt,
    style = 'photorealistic',
    width = 1024,
    height = 1024,
  } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    await spend(u.orgId, u.userId, IMAGE_COST, 'IMAGE_GENERATION', {
      manuscriptId,
      prompt,
      style,
      width,
      height,
      adminEmailBypass: u.isAdmin,
    });

    const imageUrl = '/placeholder-cover.png';

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

    res.json({
      ok: true,
      url: imageUrl,
      assetId: asset?.id,
      prompt,
      style,
      dimensions: { width, height },
    });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    res.status(500).json({ error: error.message });
  }
}

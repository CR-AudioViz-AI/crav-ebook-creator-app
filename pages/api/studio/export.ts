import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { toPDF, toEPUB, toDOCX } from '@/lib/exporters';
import { METERS, spend } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { manuscriptId, format } = req.body || {};

  if (!manuscriptId || !format) {
    return res.status(400).json({ error: 'manuscriptId and format are required' });
  }

  const { data: manuscript } = await supabase
    .from('manuscripts')
    .select('*')
    .eq('id', manuscriptId)
    .maybeSingle();

  if (!manuscript) {
    return res.status(404).json({ error: 'Manuscript not found' });
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('manuscript_id', manuscriptId)
    .order('position', { ascending: true });

  const manuscriptWithChapters = {
    ...manuscript,
    chapters: chapters || [],
  };

  try {
    let cost = 0;
    let contentType = '';
    let bytes: Buffer | Uint8Array;

    if (format === 'pdf') {
      cost = METERS.EXPORT_PDF;
      contentType = 'application/pdf';
      bytes = await toPDF(manuscriptWithChapters);
    } else if (format === 'epub') {
      cost = METERS.EXPORT_EPUB;
      contentType = 'application/epub+zip';
      bytes = await toEPUB(manuscriptWithChapters);
    } else if (format === 'docx') {
      cost = METERS.EXPORT_DOCX;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      bytes = await toDOCX(manuscriptWithChapters);
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }

    await spend(u.orgId, u.userId, cost, 'EXPORT', {
      format,
      manuscriptId,
      adminEmailBypass: u.isAdmin,
    });

    await supabase.from('ebook_exports').insert({
      manuscript_id: manuscriptId,
      org_id: u.orgId,
      user_id: u.userId,
      format,
      status: 'READY',
      meta: { chapters: chapters?.length || 0 },
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(manuscript?.title || 'ebook').replace(/\W+/g, '_')}.${format}"`
    );
    res.send(Buffer.from(bytes as any));
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    res.status(500).json({ error: error.message });
  }
}

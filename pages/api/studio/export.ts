import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { toPDF, toEPUB, toDOCX } from '@/lib/exporters';
import { METERS, spend } from '@/lib/credits';
import { supabase } from '@/lib/supabase';
import { ExportSchema } from '@/lib/ebooks/schemas';
import { useIdempotency, rateLimit, getClientIp } from '@/lib/ebooks/safety';
import { saveFileHTML } from '@/lib/ebooks/storage';

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

  const parse = ExportSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_INPUT',
      issues: parse.error.format(),
    });
  }

  const { manuscriptId, format } = parse.data;

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

    await spend(u.orgId, u.userId, METERS.EXPORT_PDF, 'EXPORT', {
      format,
      manuscriptId,
      adminEmailBypass: u.isAdmin,
    });

    if (format === 'html') {
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${manuscript.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; }
    h2 { font-size: 2em; margin-top: 1.5em; margin-bottom: 0.5em; }
    h3 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
  </style>
</head>
<body>
  <h1>${manuscript.title}</h1>
  ${manuscript.subtitle ? `<p><em>${manuscript.subtitle}</em></p>` : ''}
  ${chapters?.map((c: any) => `
    <h2>${c.title}</h2>
    <div>${c.content_html || ''}</div>
  `).join('\n')}
</body>
</html>`;

      const url = await saveFileHTML(html, 'exports');
      await supabase.from('ebook_exports').insert({
        manuscript_id: manuscriptId,
        org_id: u.orgId,
        user_id: u.userId,
        format,
        url,
        status: 'READY',
        meta: { chapters: chapters?.length || 0 },
      });

      const payload = { ok: true, url, format };
      idk.set?.(payload);
      return res.json(payload);
    }

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
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
}

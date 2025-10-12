import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { llm } from '@/lib/llm';
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

  const { brief } = req.body || {};

  if (!brief || !brief.topic) {
    return res.status(400).json({ error: 'Brief with topic is required' });
  }

  try {
    await spend(u.orgId, u.userId, METERS.OUTLINE, 'OUTLINE', {
      brief,
      adminEmailBypass: u.isAdmin,
    });

    const prompt = `Create a detailed e-book outline for the following brief:

Topic: ${brief.topic}
Audience: ${brief.audience}
Goals: ${brief.goals}
Tone: ${brief.tone}
Number of Chapters: ${brief.chapters}
Words per Chapter: ${brief.wordsPerChapter}
Citations Required: ${brief.citations ? 'Yes' : 'No'}

Return a numbered list of chapters with bullet points for each chapter covering the key topics to be discussed.`;

    const outline = await llm(
      'You are a senior editor helping to structure professional non-fiction books.',
      prompt,
      0.5,
      3000
    );

    const { data: manuscript, error: manuscriptError } = await supabase
      .from('manuscripts')
      .insert({
        org_id: u.orgId,
        user_id: u.userId,
        title: brief.topic,
        subtitle: brief.audience ? `For ${brief.audience}` : null,
        status: 'OUTLINE',
        brief: brief,
      })
      .select()
      .single();

    if (manuscriptError || !manuscript) {
      throw new Error('Failed to create manuscript');
    }

    const chapterMatches = outline.match(/(?:^|\n)\d+\.\s*(.+?)(?=\n|$)/g) || [];
    const chapterTitles = chapterMatches.map((match: string) =>
      match.replace(/^\d+\.\s*/, '').trim()
    );

    for (let i = 0; i < Math.min(chapterTitles.length, brief.chapters); i++) {
      await supabase.from('chapters').insert({
        manuscript_id: manuscript.id,
        title: chapterTitles[i] || `Chapter ${i + 1}`,
        position: i + 1,
        content_html: '',
      });
    }

    res.json({ outline, manuscriptId: manuscript.id });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    res.status(500).json({ error: error.message });
  }
}

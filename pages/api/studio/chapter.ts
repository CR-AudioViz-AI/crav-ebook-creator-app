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

  const { chapterId, title, bullets, wordsPerChapter, citations, tone } = req.body || {};

  let chapterTitle = title;
  if (chapterId) {
    const { data: chapter } = await supabase
      .from('chapters')
      .select('title')
      .eq('id', chapterId)
      .maybeSingle();

    if (chapter) {
      chapterTitle = chapter.title;
    }
  }

  try {
    await spend(u.orgId, u.userId, METERS.CHAPTER, 'CHAPTER', {
      title: chapterTitle,
      chapterId,
      adminEmailBypass: u.isAdmin,
    });

    const prompt = `Write a full chapter in HTML format for a professional e-book.

Chapter Title: ${chapterTitle}
Tone: ${tone || 'professional'}
Target Word Count: ${wordsPerChapter || 1800}
Citations Required: ${citations ? 'Yes, include references' : 'No'}

${bullets && bullets.length > 0 ? `Key Points to Cover:\n${(bullets || []).map((b: string) => `- ${b}`).join('\n')}` : ''}

Write engaging, informative content that educates the reader while maintaining a ${tone || 'professional'} tone. Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <ol> tags as appropriate. Do NOT include <html>, <head>, or <body> tags - just the content.`;

    const contentHtml = await llm(
      'You are a meticulous non-fiction writer creating high-quality educational content.',
      prompt,
      0.7,
      4000
    );

    if (chapterId) {
      await supabase
        .from('chapters')
        .update({ content_html: contentHtml })
        .eq('id', chapterId);
    }

    res.json({ contentMd: contentHtml, contentHtml });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    res.status(500).json({ error: error.message });
  }
}

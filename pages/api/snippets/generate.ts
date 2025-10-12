import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/session-api';
import { llm } from '@/lib/llm';
import { METERS, spend } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

const SNIPPET_COST = 50;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const u = await requireUser(req);
  if (!u) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { topic, tone = 'persuasive', variants = 5, type = 'social' } = req.body || {};

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    await spend(u.orgId, u.userId, SNIPPET_COST, 'SNIPPET', {
      topic,
      tone,
      variants,
      type,
      adminEmailBypass: u.isAdmin,
    });

    const typePrompts: Record<string, string> = {
      social: 'social media posts',
      email: 'email subject lines and preview text',
      ad: 'advertisement copy',
      blog: 'blog post titles and introductions',
    };

    const prompt = `Generate ${variants} ${typePrompts[type] || 'marketing snippets'} for: "${topic}"

Tone: ${tone}
Style: Professional, engaging, and compelling
Format: Return a JSON array of objects with "text" and "context" fields

Each snippet should be:
- Attention-grabbing and relevant
- Optimized for ${type} content
- ${tone} in tone
- Ready to use

Example format:
[
  {"text": "Your snippet here", "context": "Best for morning posts"},
  {"text": "Another snippet", "context": "Great for email campaigns"}
]`;

    const result = await llm(
      'You are an expert marketing copywriter specializing in high-converting content.',
      prompt,
      0.8,
      1500
    );

    let snippets: Array<{ text: string; context: string }> = [];

    try {
      const parsed = JSON.parse(result);
      snippets = Array.isArray(parsed) ? parsed : [];
    } catch {
      const lines = result.split('\n').filter(l => l.trim().length > 10);
      snippets = lines.slice(0, variants).map((text, i) => ({
        text: text.replace(/^[-*\d.]\s*/, '').trim(),
        context: `Variant ${i + 1}`,
      }));
    }

    const finalSnippets = snippets.slice(0, variants);

    await supabase.from('snippet_jobs').insert({
      org_id: u.orgId,
      user_id: u.userId,
      topic,
      tone,
      type,
      variants,
      result: finalSnippets,
    });

    res.json({
      ok: true,
      topic,
      tone,
      type,
      snippets: finalSnippets,
    });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({ error: 'Insufficient credits' });
    }
    res.status(500).json({ error: error.message });
  }
}

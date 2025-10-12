import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

type OutlineArgs = {
  topic: string;
  audience?: string;
  tone?: string;
  chapters?: number;
  goals?: string;
};

type ChapterArgs = {
  title: string;
  words?: number;
  brief?: string;
  tone?: string;
};

type SnippetArgs = {
  topic: string;
  tone?: string;
  type?: string;
  variants?: number;
};

type ImageArgs = {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
};

export async function textOutline(args: OutlineArgs) {
  const provider = process.env.TEXT_PROVIDER || 'openai';
  const chapters = args.chapters || 10;

  const prompt = `Create a detailed e-book outline for the following:

Topic: ${args.topic}
${args.audience ? `Audience: ${args.audience}` : ''}
${args.goals ? `Goals: ${args.goals}` : ''}
Tone: ${args.tone || 'professional'}
Number of Chapters: ${chapters}

Return a numbered list of ${chapters} chapters with bullet points for each chapter covering the key topics to be discussed.`;

  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';
    return parseOutlineText(content, chapters);
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a senior editor helping to structure professional non-fiction books.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || '';
    return parseOutlineText(content, chapters);
  }

  return {
    chapters: Array.from({ length: chapters }, (_, i) => ({
      title: `Chapter ${i + 1}: ${args.topic}`,
      bullets: ['Key point A', 'Key point B', 'Key point C'],
    })),
  };
}

function parseOutlineText(text: string, expectedChapters: number) {
  const chapterMatches = text.match(/(?:^|\n)\d+\.\s*(.+?)(?=\n|$)/gm) || [];
  const chapters = chapterMatches.map((match) => {
    const title = match.replace(/^\d+\.\s*/, '').trim();
    return {
      title,
      bullets: ['Key point A', 'Key point B', 'Key point C'],
    };
  });

  while (chapters.length < expectedChapters) {
    chapters.push({
      title: `Chapter ${chapters.length + 1}`,
      bullets: ['Key point A', 'Key point B', 'Key point C'],
    });
  }

  return { chapters: chapters.slice(0, expectedChapters) };
}

export async function textChapter(args: ChapterArgs) {
  const provider = process.env.TEXT_PROVIDER || 'openai';
  const words = args.words || 1800;

  const prompt = `Write a full chapter in HTML format for a professional e-book.

Chapter Title: ${args.title}
Tone: ${args.tone || 'professional'}
Target Word Count: ${words}
${args.brief ? `Additional Context: ${args.brief}` : ''}

Write engaging, informative content that educates the reader while maintaining a ${args.tone || 'professional'} tone. Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <ol> tags as appropriate. Do NOT include <html>, <head>, or <body> tags - just the content.`;

  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a meticulous non-fiction writer creating high-quality educational content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || '';
  }

  return `<h2>${args.title}</h2>\n<p>${'Professional content paragraph. '.repeat(Math.ceil(words / 50))}</p>`;
}

export async function textSnippets(args: SnippetArgs) {
  const provider = process.env.TEXT_PROVIDER || 'openai';
  const variants = args.variants || 5;
  const tone = args.tone || 'persuasive';
  const type = args.type || 'social';

  const typePrompts: Record<string, string> = {
    social: 'social media posts',
    email: 'email marketing copy',
    ad: 'advertisement copy',
    blog: 'blog post snippets',
  };

  const prompt = `Generate ${variants} ${typePrompts[type] || 'marketing snippets'} for: "${args.topic}"

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

  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';
    return parseSnippets(content, variants, args.topic, tone);
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert marketing copywriter specializing in high-converting content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';
    return parseSnippets(content, variants, args.topic, tone);
  }

  return Array.from({ length: variants }, (_, i) => ({
    text: `[${tone}] ${args.topic} — snippet #${i + 1}`,
    context: `Variant ${i + 1}`,
  }));
}

function parseSnippets(
  text: string,
  expectedCount: number,
  topic: string,
  tone: string
) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, expectedCount);
    }
  } catch {
    const lines = text.split('\n').filter((l) => l.trim().length > 10);
    return lines.slice(0, expectedCount).map((line, i) => ({
      text: line.replace(/^[-*\d.]\s*/, '').trim(),
      context: `Variant ${i + 1}`,
    }));
  }

  return Array.from({ length: expectedCount }, (_, i) => ({
    text: `[${tone}] ${topic} — snippet #${i + 1}`,
    context: `Variant ${i + 1}`,
  }));
}

export async function imageGen(args: ImageArgs) {
  const provider = process.env.IMAGE_PROVIDER || 'placeholder';
  const { prompt, style, width = 1024, height = 1024 } = args;

  if (provider === 'stability' && process.env.STABILITY_API_KEY) {
    return { url: '/placeholder-cover.png' };
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${style ? `${style} style: ` : ''}${prompt}`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    return { url: response.data?.[0]?.url || '/placeholder-cover.png' };
  }

  return { url: '/placeholder-cover.png' };
}

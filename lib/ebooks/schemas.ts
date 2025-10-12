import { z } from 'zod';

export const OutlineSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  chapters: z.number().int().min(4).max(40).default(10),
  audience: z.string().optional(),
  tone: z.string().optional(),
  goals: z.string().optional(),
  wordsPerChapter: z.number().int().min(300).max(5000).default(1800),
  citations: z.boolean().default(false),
});

export const ChapterSchema = z.object({
  chapterId: z.string().uuid('Invalid chapter ID'),
  words: z.number().int().min(300).max(5000).default(1800),
  brief: z.string().optional(),
  tone: z.string().optional(),
});

export const SnippetSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  tone: z.string().default('persuasive'),
  type: z.enum(['social', 'email', 'ad', 'blog']).default('social'),
  variants: z.number().int().min(1).max(20).default(5),
});

export const ImageSchema = z.object({
  manuscriptId: z.string().optional(),
  prompt: z.string().min(3, 'Prompt must be at least 3 characters'),
  style: z.string().optional(),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
});

export const ExportSchema = z.object({
  manuscriptId: z.string().uuid('Invalid manuscript ID'),
  format: z.enum(['html', 'epub', 'pdf', 'docx']).default('html'),
});

export type OutlineInput = z.infer<typeof OutlineSchema>;
export type ChapterInput = z.infer<typeof ChapterSchema>;
export type SnippetInput = z.infer<typeof SnippetSchema>;
export type ImageInput = z.infer<typeof ImageSchema>;
export type ExportInput = z.infer<typeof ExportSchema>;

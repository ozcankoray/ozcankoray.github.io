import { z } from 'astro/zod';

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(140),
  year: z.number().int().min(2020).max(2100),
  stack: z.array(z.string().min(1)).min(1),
  status: z.enum(['live', 'complete']),
  order: z.number().int(),
  flow: z.array(z.string().min(1).max(28)).min(2).max(6),
  links: z
    .object({
      appStore: z.url().optional(),
      site: z.url().optional(),
      repo: z.url().optional(),
    })
    .default({}),
});

export const postSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
});

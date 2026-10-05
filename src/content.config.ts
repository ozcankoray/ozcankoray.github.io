import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema, projectSchema } from './content/schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: postSchema,
});

export const collections = { projects, blog };

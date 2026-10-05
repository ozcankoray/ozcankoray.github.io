import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export type Lang = 'tr' | 'en';

export function publishedSlugs(collection: 'projects' | 'blog', lang: Lang): readonly string[] {
  const dir = join('src', 'content', collection, lang);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => {
      const data: Record<string, unknown> = matter(readFileSync(join(dir, file), 'utf8')).data;
      return data.draft !== true;
    })
    .map((file) => file.replace(/\.md$/, ''))
    .sort();
}

import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { entryLang } from './entries';

export type Project = CollectionEntry<'projects'>;
export type Post = CollectionEntry<'blog'>;

export async function getProjects(lang: Lang, kind?: Project['data']['kind']): Promise<readonly Project[]> {
  const all = await getCollection(
    'projects',
    (entry) => entryLang(entry.id) === lang && (kind === undefined || entry.data.kind === kind),
  );
  return [...all].sort((a, b) => a.data.order - b.data.order);
}

export async function getPosts(lang: Lang): Promise<readonly Post[]> {
  const all = await getCollection('blog', (entry) => entryLang(entry.id) === lang && !entry.data.draft);
  return [...all].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

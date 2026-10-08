import { LANGS } from '../i18n/ui';
import { getProjects } from './content';
import { entrySlug } from './entries';
import type { ProjectDoc } from './llms';

export async function llmsProjects(): Promise<readonly ProjectDoc[]> {
  const perLang = await Promise.all(
    LANGS.map(async (lang) =>
      (await getProjects(lang)).map(
        (p): ProjectDoc => ({
          lang,
          slug: entrySlug(p.id),
          title: p.data.title,
          summary: p.data.summary,
          year: p.data.year,
          stack: p.data.stack,
          body: p.body ?? '',
        }),
      ),
    ),
  );
  return perLang.flat();
}

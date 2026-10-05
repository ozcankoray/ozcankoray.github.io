import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { postSchema, projectSchema } from '../../src/content/schemas';
import { entryLang, entrySlug } from '../../src/lib/entries';
import { LANGS, type Lang } from '../../src/i18n/ui';

const ROOT = join(process.cwd(), 'src', 'content');

const filesIn = (collection: string, lang: Lang): readonly string[] => {
  const dir = join(ROOT, collection, lang);
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
};

const frontmatter = (collection: string, lang: Lang, file: string): Record<string, unknown> =>
  matter(readFileSync(join(ROOT, collection, lang, file), 'utf8')).data;

describe.each([
  ['projects', projectSchema],
  ['blog', postSchema],
] as const)('%s collection', (collection, schema) => {
  it('has the same files in tr and en', () => {
    expect(filesIn(collection, 'tr')).toEqual(filesIn(collection, 'en'));
  });

  it('every file matches the schema', () => {
    for (const lang of LANGS) {
      for (const file of filesIn(collection, lang)) {
        const result = schema.safeParse(frontmatter(collection, lang, file));
        expect(result.success, `${lang}/${file}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    }
  });

  it('file names are url-safe slugs', () => {
    for (const lang of LANGS) {
      for (const file of filesIn(collection, lang)) expect(file).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.md$/);
    }
  });
});

describe('projects', () => {
  it('features exactly the three agreed projects', () => {
    expect(filesIn('projects', 'tr')).toEqual(['food-inflation-tracker.md', 'kap-fund-analytics.md', 'nerdi.md']);
  });

  it('marks only Nerdi as a mobile app, in both languages', () => {
    for (const lang of LANGS) {
      const apps = filesIn('projects', lang).filter((f) => frontmatter('projects', lang, f).kind === 'app');
      expect(apps).toEqual(['nerdi.md']);
    }
  });

  it('has unique order values per language', () => {
    for (const lang of LANGS) {
      const orders = filesIn('projects', lang).map((f) => frontmatter('projects', lang, f).order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  it('never links to a GitHub repo (featured repos are private)', () => {
    for (const lang of LANGS) {
      for (const file of filesIn('projects', lang)) {
        const raw = readFileSync(join(ROOT, 'projects', lang, file), 'utf8');
        expect(raw).not.toMatch(/github\.com\/ozcankoray\//);
      }
    }
  });
});

describe('entries', () => {
  it('splits ids into language and slug', () => {
    expect(entryLang('tr/nerdi')).toBe('tr');
    expect(entryLang('en/kap-fund-analytics')).toBe('en');
    expect(entrySlug('en/kap-fund-analytics')).toBe('kap-fund-analytics');
  });

  it('throws on unknown language folders', () => {
    expect(() => entryLang('de/nerdi')).toThrow();
    expect(() => entryLang('nerdi')).toThrow();
  });
});

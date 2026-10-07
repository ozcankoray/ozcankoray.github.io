import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';

const hasPosts = (lang) => {
  const dir = `src/content/blog/${lang}`;
  return (
    existsSync(dir) &&
    readdirSync(dir).some((f) => f.endsWith('.md') && matter(readFileSync(`${dir}/${f}`, 'utf8')).data.draft !== true)
  );
};

const WRITING_INDEX = { 'https://korayozcan.me/yazilar/': 'tr', 'https://korayozcan.me/en/writing/': 'en' };

export default defineConfig({
  site: 'https://korayozcan.me',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  i18n: {
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ filter: (page) => !(page in WRITING_INDEX) || hasPosts(WRITING_INDEX[page]) })],
});

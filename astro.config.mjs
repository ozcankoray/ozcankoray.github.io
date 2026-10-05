import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://korayozcan.me',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  i18n: {
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
});

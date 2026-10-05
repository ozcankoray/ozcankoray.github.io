import { publishedSlugs, type Lang } from './content-files';

export interface PageRoute {
  readonly path: string;
  readonly lang: Lang;
}

const STATIC: readonly PageRoute[] = [
  { path: '/', lang: 'tr' },
  { path: '/en/', lang: 'en' },
  { path: '/cv/', lang: 'tr' },
  { path: '/en/cv/', lang: 'en' },
  { path: '/yazilar/', lang: 'tr' },
  { path: '/en/writing/', lang: 'en' },
];

const PROJECT_BASE: Readonly<Record<Lang, string>> = { tr: '/projeler/', en: '/en/projects/' };
const POST_BASE: Readonly<Record<Lang, string>> = { tr: '/yazilar/', en: '/en/writing/' };

const dynamic = (lang: Lang): readonly PageRoute[] => [
  ...publishedSlugs('projects', lang).map((slug) => ({ path: `${PROJECT_BASE[lang]}${slug}/`, lang })),
  ...publishedSlugs('blog', lang).map((slug) => ({ path: `${POST_BASE[lang]}${slug}/`, lang })),
];

export const ROUTES: readonly PageRoute[] = [...STATIC, ...dynamic('tr'), ...dynamic('en')];

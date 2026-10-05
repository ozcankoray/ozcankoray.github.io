import type { Lang } from './ui';

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'cv' }
  | { readonly name: 'writing' }
  | { readonly name: 'project'; readonly slug: string }
  | { readonly name: 'post'; readonly slug: string };

const SEGMENTS = {
  tr: { cv: 'cv', writing: 'yazilar', project: 'projeler' },
  en: { cv: 'cv', writing: 'writing', project: 'projects' },
} as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertSlug(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid slug: "${slug}"`);
  return slug;
}

const prefix = (lang: Lang): string => (lang === 'tr' ? '' : '/en');

export function localizedPath(lang: Lang, route: Route): string {
  const s = SEGMENTS[lang];
  const p = prefix(lang);
  switch (route.name) {
    case 'home':
      return `${p}/`;
    case 'cv':
      return `${p}/${s.cv}/`;
    case 'writing':
      return `${p}/${s.writing}/`;
    case 'project':
      return `${p}/${s.project}/${assertSlug(route.slug)}/`;
    case 'post':
      return `${p}/${s.writing}/${assertSlug(route.slug)}/`;
  }
}

export function routeKey(route: Route): string {
  return route.name === 'project' || route.name === 'post'
    ? `${route.name}-${assertSlug(route.slug)}`
    : route.name;
}

export const ogImagePath = (lang: Lang, route: Route): string => `/og/${lang}/${routeKey(route)}.png`;
export const cvPdfPath = (lang: Lang): string => `/cv/koray-ozcan-cv-${lang}.pdf`;
export const rssPath = (lang: Lang): string => `${prefix(lang)}/rss.xml`;

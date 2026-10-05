import { profile } from '../data/profile';
import { routeKey } from '../i18n/routes';
import { LANGS, t, type Lang } from '../i18n/ui';
import { getPosts, getProjects } from './content';
import { entrySlug } from './entries';
import type { OgInput } from './og';

export interface OgEntry extends OgInput {
  readonly lang: Lang;
  readonly key: string;
}

const KICKER = 'korayozcan.me';

async function entriesFor(lang: Lang): Promise<readonly OgEntry[]> {
  const base: readonly OgEntry[] = [
    { lang, key: routeKey({ name: 'home' }), kicker: KICKER, title: profile.name, subtitle: profile.intro[lang] },
    { lang, key: routeKey({ name: 'cv' }), kicker: KICKER, title: t(lang, 'cv.title'), subtitle: profile.name },
    { lang, key: routeKey({ name: 'writing' }), kicker: KICKER, title: t(lang, 'writing.title'), subtitle: profile.name },
  ];
  const projects = (await getProjects(lang)).map((p) => ({
    lang,
    key: routeKey({ name: 'project', slug: entrySlug(p.id) }),
    kicker: KICKER,
    title: p.data.title,
    subtitle: p.data.summary,
  }));
  const posts = (await getPosts(lang)).map((p) => ({
    lang,
    key: routeKey({ name: 'post', slug: entrySlug(p.id) }),
    kicker: KICKER,
    title: p.data.title,
    subtitle: p.data.description,
  }));
  return [...base, ...projects, ...posts];
}

export async function ogEntries(): Promise<readonly OgEntry[]> {
  return (await Promise.all(LANGS.map(entriesFor))).flat();
}

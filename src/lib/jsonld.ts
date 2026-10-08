import { experience, skills } from '../data/cv';
import { profile } from '../data/profile';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

export interface ProjectLd {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly year: number;
  readonly stack: readonly string[];
  readonly kind: 'project' | 'app';
  readonly links: { readonly appStore?: string };
}

const PERSON_ID = `${profile.site}/#person`;

const serialize = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');
const abs = (path: string): string => new URL(path, profile.site).toString();

function person(lang: Lang): Record<string, unknown> {
  const current = experience.find((x) => x.end === null);
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    url: profile.site,
    jobTitle: current?.role[lang] ?? t(lang, 'role'),
    ...(current === undefined ? {} : { worksFor: { '@type': 'Organization', name: current.company } }),
    knowsAbout: skills,
    email: `mailto:${profile.email}`,
    sameAs: [profile.github, profile.linkedin],
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bahçeşehir University' },
  };
}

export function homeJsonLd(lang: Lang): string {
  return serialize({
    '@context': 'https://schema.org',
    '@graph': [
      person(lang),
      { '@type': 'WebSite', name: profile.name, url: profile.site, inLanguage: lang },
      {
        '@type': 'ProfilePage',
        url: abs(localizedPath(lang, { name: 'home' })),
        inLanguage: lang,
        mainEntity: { '@id': PERSON_ID },
      },
    ],
  });
}

export function projectJsonLd(lang: Lang, project: ProjectLd): string {
  const base = {
    '@context': 'https://schema.org',
    name: project.title,
    description: project.summary,
    url: abs(localizedPath(lang, { name: 'project', slug: project.slug })),
    inLanguage: lang,
    author: { '@id': PERSON_ID },
  };
  return serialize(
    project.kind === 'app'
      ? {
          ...base,
          '@type': 'MobileApplication',
          operatingSystem: 'iOS',
          ...(project.links.appStore === undefined ? {} : { downloadUrl: project.links.appStore }),
        }
      : { ...base, '@type': 'CreativeWork', keywords: project.stack.join(', '), dateCreated: String(project.year) },
  );
}

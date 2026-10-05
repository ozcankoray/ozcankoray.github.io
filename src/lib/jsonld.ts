import { profile } from '../data/profile';
import { t, type Lang } from '../i18n/ui';

export function personJsonLd(lang: Lang): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: profile.site,
    jobTitle: t(lang, 'role'),
    email: `mailto:${profile.email}`,
    sameAs: [profile.github, profile.linkedin],
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bahçeşehir University' },
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

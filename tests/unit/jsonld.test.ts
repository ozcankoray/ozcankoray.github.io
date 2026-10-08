import { describe, it, expect } from 'vitest';
import { homeJsonLd, projectJsonLd, type ProjectLd } from '../../src/lib/jsonld';
import { skills } from '../../src/data/cv';

type Node = Record<string, unknown>;

const graph = (lang: 'tr' | 'en'): readonly Node[] => {
  const data: { '@graph': readonly Node[] } = JSON.parse(homeJsonLd(lang));
  return data['@graph'];
};
const byType = (nodes: readonly Node[], type: string): Node | undefined => nodes.find((n) => n['@type'] === type);

const APP: ProjectLd = {
  slug: 'demo-app',
  title: 'Demo App',
  summary: 'An app for demos.',
  year: 2026,
  stack: ['iOS', 'Swift'],
  kind: 'app',
  links: { appStore: 'https://apps.apple.com/us/app/demo/id1' },
};
const PROJECT: ProjectLd = { ...APP, slug: 'demo-pipeline', kind: 'project', links: {} };

describe('homeJsonLd', () => {
  it('describes the person: current role, employer, skills, profiles, no address', () => {
    const person = byType(graph('en'), 'Person');
    expect(person?.['@id']).toBe('https://korayozcan.me/#person');
    expect(person?.name).toBe('Koray Özcan');
    expect(person?.jobTitle).toBe('Junior Software Test Automation & Quality Engineer');
    expect(person?.worksFor).toEqual({ '@type': 'Organization', name: 'Sompo Sigorta' });
    expect(person?.knowsAbout).toEqual(skills);
    expect(person?.sameAs).toEqual(['https://github.com/ozcankoray', 'https://www.linkedin.com/in/koray%C3%B6zcan/']);
    expect(person).not.toHaveProperty('address');
    expect(person).not.toHaveProperty('telephone');
  });

  it('localizes the job title', () => {
    expect(byType(graph('tr'), 'Person')?.jobTitle).toBe('Junior Yazılım Test Otomasyonu ve Kalite Mühendisi');
  });

  it('adds a WebSite and a ProfilePage that points at the person', () => {
    const nodes = graph('en');
    expect(byType(nodes, 'WebSite')).toMatchObject({ name: 'Koray Özcan', url: 'https://korayozcan.me', inLanguage: 'en' });
    expect(byType(nodes, 'ProfilePage')).toMatchObject({
      url: 'https://korayozcan.me/en/',
      inLanguage: 'en',
      mainEntity: { '@id': 'https://korayozcan.me/#person' },
    });
  });

  it('cannot break out of a script tag', () => {
    expect(homeJsonLd('tr')).not.toContain('<');
  });
});

describe('projectJsonLd', () => {
  const parse = (lang: 'tr' | 'en', project: ProjectLd): Node => JSON.parse(projectJsonLd(lang, project));

  it('describes an app as a MobileApplication with its App Store link', () => {
    expect(parse('en', APP)).toMatchObject({
      '@type': 'MobileApplication',
      name: 'Demo App',
      description: 'An app for demos.',
      operatingSystem: 'iOS',
      downloadUrl: 'https://apps.apple.com/us/app/demo/id1',
      url: 'https://korayozcan.me/en/projects/demo-app/',
      inLanguage: 'en',
      author: { '@id': 'https://korayozcan.me/#person' },
    });
  });

  it('describes any other project as a CreativeWork with its stack as keywords', () => {
    const data = parse('tr', PROJECT);
    expect(data).toMatchObject({
      '@type': 'CreativeWork',
      name: 'Demo App',
      url: 'https://korayozcan.me/projeler/demo-pipeline/',
      keywords: 'iOS, Swift',
      dateCreated: '2026',
      inLanguage: 'tr',
    });
    expect(data).not.toHaveProperty('downloadUrl');
  });

  it('cannot break out of a script tag', () => {
    expect(projectJsonLd('en', { ...APP, title: '</script><b>' })).not.toContain('<');
  });
});

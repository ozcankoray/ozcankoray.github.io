import { describe, it, expect } from 'vitest';
import { buildLlmsFull, buildLlmsIndex, type ProjectDoc } from '../../src/lib/llms';
import { education, experience } from '../../src/data/cv';
import { profile } from '../../src/data/profile';
import { containsHashed, SECRETS } from '../forbidden';

const PROJECTS: readonly ProjectDoc[] = [
  { lang: 'en', slug: 'demo-app', title: 'Demo App', summary: 'An app for demos.', year: 2026, stack: ['iOS', 'Swift'], body: '## Problem\n\nEnglish case study body.' },
  { lang: 'tr', slug: 'demo-app', title: 'Demo Uygulama', summary: 'Demo için bir uygulama.', year: 2026, stack: ['iOS', 'Swift'], body: '## Problem\n\nTürkçe vaka çalışması.' },
];

describe('buildLlmsIndex', () => {
  const text = buildLlmsIndex(PROJECTS);

  it('follows the llms.txt shape: title, summary quote, link sections', () => {
    const lines = text.split('\n');
    expect(lines[0]).toBe(`# ${profile.name}`);
    expect(lines.find((l) => l.startsWith('> '))).toBe(`> ${profile.intro.en}`);
    expect(lines.filter((l) => l.startsWith('## ')).length).toBeGreaterThanOrEqual(3);
  });

  it('links both language versions of the pages, CVs and every project with absolute URLs', () => {
    for (const url of [
      'https://korayozcan.me/',
      'https://korayozcan.me/en/',
      'https://korayozcan.me/cv/',
      'https://korayozcan.me/en/cv/',
      'https://korayozcan.me/cv/koray-ozcan-cv-en.pdf',
      'https://korayozcan.me/cv/koray-ozcan-cv-tr.pdf',
      'https://korayozcan.me/en/projects/demo-app/',
      'https://korayozcan.me/projeler/demo-app/',
      'https://korayozcan.me/llms-full.txt',
    ]) {
      expect(text, url).toContain(`](${url})`);
    }
  });

  it('lists public contact channels and summaries', () => {
    for (const s of [profile.email, profile.github, profile.linkedin, 'An app for demos.', 'Demo için bir uygulama.']) {
      expect(text, s).toContain(s);
    }
  });

  it('contains no private contact data', () => {
    expect(containsHashed(text, SECRETS)).toBe(false);
  });
});

describe('buildLlmsFull', () => {
  const text = buildLlmsFull(PROJECTS);

  it('includes every role, company, bullet and degree in both languages', () => {
    const expected = [
      ...experience.flatMap((x) => [x.role.en, x.role.tr, x.company, ...x.bullets.flatMap((b) => [b.en, b.tr])]),
      ...education.flatMap((x) => [x.degree.en, x.degree.tr, x.school.en]),
    ];
    expect(expected.filter((s) => !text.includes(s))).toEqual([]);
  });

  it('includes the about text and the project case studies', () => {
    for (const s of [profile.about[0]?.en, profile.about[0]?.tr, 'English case study body.', 'Türkçe vaka çalışması.']) {
      expect(text, s).toContain(s);
    }
  });

  it('contains no private contact data', () => {
    expect(containsHashed(text, SECRETS)).toBe(false);
  });
});

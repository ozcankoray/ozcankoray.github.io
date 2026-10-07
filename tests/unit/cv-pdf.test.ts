import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { education, experience } from '../../src/data/cv';
import { containsHashed, SECRETS } from '../forbidden';

type Lang = 'tr' | 'en';
const LANGS: readonly Lang[] = ['tr', 'en'];

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim();

const pdfText = (lang: Lang): string =>
  squash(execFileSync('pdftotext', ['-enc', 'UTF-8', `public/cv/koray-ozcan-cv-${lang}.pdf`, '-'], { encoding: 'utf8' }));

const expected = (lang: Lang): readonly string[] => [
  ...experience.flatMap((x) => [x.role[lang], x.company, ...x.bullets.map((b) => b[lang])]),
  ...education.flatMap((x) => [x.degree[lang], x.school[lang]]),
];

describe.each(LANGS)('cv pdf (%s)', (lang) => {
  const text = pdfText(lang);

  it('contains no private contact data', () => {
    expect(containsHashed(text, SECRETS)).toBe(false);
  });

  it('is up to date with the cv data', () => {
    const missing = expected(lang).filter((s) => !text.includes(squash(s)));
    expect(missing).toEqual([]);
  });
});

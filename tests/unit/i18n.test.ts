import { describe, it, expect } from 'vitest';
import { LANGS, OTHER, t, ui } from '../../src/i18n/ui';
import { cvPdfPath, localizedPath, ogImagePath, routeKey, rssPath, type Route } from '../../src/i18n/routes';

describe('ui strings', () => {
  it('has identical keys and no empty strings in every language', () => {
    const trKeys = Object.keys(ui.tr).sort();
    for (const lang of LANGS) {
      expect(Object.keys(ui[lang]).sort()).toEqual(trKeys);
      for (const value of Object.values(ui[lang])) expect(value.trim()).not.toBe('');
    }
  });

  it('t returns the string for the language', () => {
    expect(t('tr', 'nav.projects')).toBe('projeler');
    expect(t('en', 'nav.projects')).toBe('projects');
  });

  it('OTHER swaps languages', () => {
    expect(OTHER.tr).toBe('en');
    expect(OTHER.en).toBe('tr');
  });
});

describe('localizedPath', () => {
  const cases: ReadonlyArray<readonly [Route, string, string]> = [
    [{ name: 'home' }, '/', '/en/'],
    [{ name: 'cv' }, '/cv/', '/en/cv/'],
    [{ name: 'writing' }, '/yazilar/', '/en/writing/'],
    [{ name: 'project', slug: 'nerdi' }, '/projeler/nerdi/', '/en/projects/nerdi/'],
    [{ name: 'post', slug: 'hello' }, '/yazilar/hello/', '/en/writing/hello/'],
  ];

  it.each(cases)('maps %o to %s and %s', (route, tr, en) => {
    expect(localizedPath('tr', route)).toBe(tr);
    expect(localizedPath('en', route)).toBe(en);
  });

  it('rejects unsafe or empty slugs', () => {
    expect(() => localizedPath('tr', { name: 'project', slug: '../x' })).toThrow();
    expect(() => localizedPath('tr', { name: 'post', slug: '' })).toThrow();
    expect(() => localizedPath('en', { name: 'post', slug: 'Bad Slug' })).toThrow();
  });
});

describe('derived paths', () => {
  it('routeKey is unique per route', () => {
    expect(routeKey({ name: 'home' })).toBe('home');
    expect(routeKey({ name: 'project', slug: 'nerdi' })).toBe('project-nerdi');
    expect(routeKey({ name: 'post', slug: 'nerdi' })).toBe('post-nerdi');
  });

  it('builds og, cv pdf and rss paths', () => {
    expect(ogImagePath('en', { name: 'cv' })).toBe('/og/en/cv.png');
    expect(cvPdfPath('tr')).toBe('/cv/koray-ozcan-cv-tr.pdf');
    expect(rssPath('tr')).toBe('/rss.xml');
    expect(rssPath('en')).toBe('/en/rss.xml');
  });
});

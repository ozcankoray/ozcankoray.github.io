# korayozcan.me Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a bilingual (TR/EN) personal site at `https://korayozcan.me` with three featured projects, a web + PDF CV and a writing section, then tidy the GitHub profile.

**Architecture:** Astro 7 static site with no UI framework. Content lives in Astro content collections (`projects`, `blog`) split by language folder. The CV is typed data in `src/data/cv.ts`. A small route table (`src/i18n/routes.ts`) maps every page to its TR and EN URL. Pages are thin wrappers around shared "view" components that take `lang`. GitHub Actions builds, tests and deploys to GitHub Pages from the existing `ozcankoray.github.io` repo.

**Tech Stack:** Node 22, Astro ^7.3, TypeScript strict, plain CSS tokens, @fontsource (Inter, JetBrains Mono), @astrojs/sitemap, @astrojs/rss, satori + @resvg/resvg-js (OG images), Vitest, Playwright + @axe-core/playwright, gray-matter (tests only).

**Spec:** `docs/superpowers/specs/2026-10-05-portfolio-site-design.md`

## Global Constraints

- Node 22, `astro@^7.3.5`, TypeScript `strict` (via `astro/tsconfigs/strict`). Never use `any`; use `unknown` and narrow.
- `trailingSlash: 'always'`: every internal page link ends with `/`. File links (`.pdf`, `.png`, `.xml`) do not.
- TR is the default language at `/`; EN lives under `/en/`. Path segments: `projeler`↔`projects`, `yazilar`↔`writing`, `cv`↔`cv`. Content slugs are identical in both languages.
- The phone number (`0000000000`, any formatting) and home address (`REDACTED`) must never appear in `src/`, `public/`, `github/`, or `dist/`. Contact is email `korayozcan33@gmail.com` and LinkedIn only.
- Nerdi's privacy policy lives at `https://nerdi.pages.dev/privacy.html` (the URL used on its App Store listing). The `nerdio` repo is a different, inactive app and is not featured, linked or pinned.
- Exactly three projects: `kap-fund-analytics`, `nerdi`, `food-inflation-tracker`. No GitHub links to private repos.
- Color tokens are fixed exactly as written in Task 5. Fonts are Inter + JetBrains Mono from @fontsource only.
- No analytics and no third-party runtime scripts.
- Code style (from CLAUDE.md): immutable patterns (spread, no mutation of shared data); files 200–400 lines (800 max); functions ≤ 50 lines; no leftover `console.log`.
- Commits: conventional commits in English, each ending with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (passed as a second `-m`). Never use `--no-verify`.
- **Never** `git push`, change GitHub repo or Pages settings, or edit the GitHub profile without Koray's explicit approval in chat for that specific action.

## Review Focus

1. **Private contact data leaks:** phone or home address ending up in source, built HTML, or the GitHub README. Expect it never to be published. Pinned by `tests/unit/privacy.test.ts` (Task 3) and the `dist` scan in `tests/e2e/site.spec.ts` (Task 11).
2. **Language parity:** a project or post that exists in only one language makes the language switch 404. Expect every page to have its twin. Pinned by the parity test in `tests/unit/content.test.ts` (Task 4) and the hreflang link crawl (Task 11).
3. **Turkish glyphs (ı ğ ş İ):** missing from OG images, which are rendered with subset fonts. Expect real outlines, not tofu. Pinned by `tests/unit/og.test.ts` (Task 10).
4. **Storage blocked or JS disabled:** the theme still follows the OS, content is fully readable, and nothing throws. Pinned by `tests/e2e/layout.spec.ts` (Task 5).
5. **Switching Pages from legacy to Actions loses the custom domain or HTTPS:** expect `https://korayozcan.me/` to return 200 and plain HTTP to redirect. Pinned by `public/CNAME` in the build plus the post-deploy check in Task 12.

---

## File Structure

```
astro.config.mjs                 site, i18n, trailingSlash, sitemap
package.json / tsconfig.json
vitest.config.ts / playwright.config.ts
public/CNAME, robots.txt, favicon.svg, cv/koray-ozcan-cv-{tr,en}.pdf
scripts/export-cv-pdf.mjs        builds the CV PDFs from /cv/ with print CSS
src/i18n/ui.ts                   Lang, LANGS, OTHER, OG_LOCALE, UI strings, t()
src/i18n/localized.ts            Localized type
src/i18n/routes.ts               Route union, localizedPath, routeKey, ogImagePath, cvPdfPath, rssPath
src/data/profile.ts              name, links, intro, about paragraphs
src/data/cv.ts                   experience, education, programs, skills, languages
src/lib/format.ts                formatYearMonth, formatPeriod, formatDate
src/lib/entries.ts               entryLang, entrySlug (pure, testable)
src/lib/content.ts               getProjects, getPosts (astro:content)
src/lib/rss.ts                   feed(lang, site)
src/lib/og.ts                    buildOgSvg, renderOg
src/lib/og-entries.ts            ogEntries()
src/lib/jsonld.ts                personJsonLd(lang)
src/content.config.ts            collections
src/content/schemas.ts           zod schemas (shared with tests)
src/content/projects/{tr,en}/*.md
src/content/blog/{tr,en}/        (empty at launch, .gitkeep)
src/styles/tokens.css, global.css, print.css
src/layouts/Base.astro           <html>, head, theme bootstrap, skip link
src/layouts/Split.astro          sticky intro column + main
src/components/Seo.astro, Intro.astro, LangSwitch.astro, ThemeToggle.astro,
               SectionNav.astro, ExperienceList.astro, ProjectCard.astro,
               PostList.astro, FlowDiagram.astro
src/views/HomeView.astro, ProjectView.astro, CvView.astro,
          WritingIndexView.astro, PostView.astro
src/pages/index.astro, cv.astro, 404.astro, rss.xml.ts
src/pages/projeler/[slug].astro, yazilar/index.astro, yazilar/[slug].astro
src/pages/en/index.astro, en/cv.astro, en/rss.xml.ts
src/pages/en/projects/[slug].astro, en/writing/index.astro, en/writing/[slug].astro
src/pages/og/[lang]/[key].png.ts
tests/unit/*.test.ts             Vitest
tests/e2e/*.spec.ts              Playwright (against astro preview)
tests/e2e/content-files.ts       reads published slugs from src/content
.github/workflows/deploy.yml
github/profile/README.md         source for the ozcankoray/ozcankoray profile repo
```

---

### Task 1: Scaffold Astro project and test tooling

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `public/CNAME`, `public/robots.txt`, `src/pages/index.astro` (temporary), `tests/e2e/smoke.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `test:e2e`, `cv:pdf`; Playwright `baseURL` `http://localhost:4321`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "korayozcan-me",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview --port 4321",
    "test": "vitest run",
    "test:e2e": "npm run build && playwright test",
    "cv:pdf": "npm run build && node scripts/export-cv-pdf.mjs"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install astro@^7.3.5 @astrojs/sitemap @astrojs/rss @fontsource/inter @fontsource/jetbrains-mono satori @resvg/resvg-js
npm install -D typescript @astrojs/check vitest @playwright/test @axe-core/playwright gray-matter
npx playwright install chromium
```
Expected: installs complete with no errors; `package-lock.json` is created.

- [ ] **Step 3: Write config files**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://korayozcan.me',
  trailingSlash: 'always',
  i18n: {
    locales: ['tr', 'en'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
  },
});
```

`public/CNAME`:
```
korayozcan.me
```

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://korayozcan.me/sitemap-index.xml
```

Append to `.gitignore`:
```
test-results/
playwright-report/
```

- [ ] **Step 4: Write the failing smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home page responds in Turkish', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL. The build fails or `/` returns 404 because no page exists yet.

- [ ] **Step 6: Add the temporary home page**

`src/pages/index.astro`:
```astro
---
---
<html lang="tr">
  <head><meta charset="utf-8" /><title>Koray Özcan</title></head>
  <body><h1>Koray Özcan</h1></body>
</html>
```

- [ ] **Step 7: Run it to verify it passes**

Run: `npm run test:e2e`
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts public .gitignore src tests
git commit -m "chore: scaffold Astro site with Vitest and Playwright" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: i18n strings and route table

**Files:**
- Create: `src/i18n/ui.ts`, `src/i18n/localized.ts`, `src/i18n/routes.ts`
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'tr' | 'en'`, `LANGS: readonly Lang[]`, `OTHER: Record<Lang, Lang>`, `OG_LOCALE: Record<Lang, string>`
  - `type UiKey`, `ui: Record<Lang, Record<UiKey, string>>`, `t(lang: Lang, key: UiKey): string`
  - `interface Localized { readonly tr: string; readonly en: string }`
  - `type Route = {name:'home'} | {name:'cv'} | {name:'writing'} | {name:'project'; slug} | {name:'post'; slug}`
  - `localizedPath(lang, route): string`, `routeKey(route): string`, `ogImagePath(lang, route): string`, `cvPdfPath(lang): string`, `rssPath(lang): string`

- [ ] **Step 1: Write the failing tests**

`tests/unit/i18n.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL with "Failed to resolve import ../../src/i18n/ui".

- [ ] **Step 3: Implement**

`src/i18n/localized.ts`:
```ts
export interface Localized {
  readonly tr: string;
  readonly en: string;
}
```

`src/i18n/ui.ts`:
```ts
export const LANGS = ['tr', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const OTHER: Readonly<Record<Lang, Lang>> = { tr: 'en', en: 'tr' };
export const OG_LOCALE: Readonly<Record<Lang, string>> = { tr: 'tr_TR', en: 'en_US' };

const tr = {
  role: 'Bilgisayar Mühendisi',
  skip: 'İçeriğe geç',
  'nav.label': 'Bölümler',
  'nav.about': 'hakkında',
  'nav.experience': 'deneyim',
  'nav.projects': 'projeler',
  'nav.writing': 'yazılar',
  'links.email': 'E-posta',
  'lang.label': 'Dil',
  'lang.switch': 'English version',
  'theme.toggle': 'Temayı değiştir',
  'cv.title': 'Özgeçmiş',
  'cv.description': 'Koray Özcan’ın deneyimi, eğitimi ve yetkinlikleri.',
  'cv.full': '→ tam özgeçmiş',
  'cv.download': 'CV.pdf ↓',
  'cv.print': 'Yazdır',
  'cv.experience': 'deneyim',
  'cv.education': 'eğitim',
  'cv.programs': 'program ve seminerler',
  'cv.skills': 'yetkinlikler',
  'cv.languages': 'diller',
  'period.now': 'şimdi',
  'project.live': 'YAYINDA · APP STORE',
  'project.back': '← tüm projeler',
  'project.architecture': 'mimari',
  'project.links': 'bağlantılar',
  'writing.title': 'Yazılar',
  'writing.description': 'Yazılım, veri ve finans üzerine notlar.',
  'writing.empty': 'Henüz yazı yok.',
  'writing.all': '→ tüm yazılar',
  'writing.back': '← tüm yazılar',
} as const;

export type UiKey = keyof typeof tr;

const en: Readonly<Record<UiKey, string>> = {
  role: 'Computer Engineer',
  skip: 'Skip to content',
  'nav.label': 'Sections',
  'nav.about': 'about',
  'nav.experience': 'experience',
  'nav.projects': 'projects',
  'nav.writing': 'writing',
  'links.email': 'Email',
  'lang.label': 'Language',
  'lang.switch': 'Türkçe sürüm',
  'theme.toggle': 'Toggle theme',
  'cv.title': 'Résumé',
  'cv.description': 'Experience, education and skills of Koray Özcan.',
  'cv.full': '→ full résumé',
  'cv.download': 'CV.pdf ↓',
  'cv.print': 'Print',
  'cv.experience': 'experience',
  'cv.education': 'education',
  'cv.programs': 'programs & seminars',
  'cv.skills': 'skills',
  'cv.languages': 'languages',
  'period.now': 'now',
  'project.live': 'LIVE · APP STORE',
  'project.back': '← all projects',
  'project.architecture': 'architecture',
  'project.links': 'links',
  'writing.title': 'Writing',
  'writing.description': 'Notes on software, data and finance.',
  'writing.empty': 'No posts yet.',
  'writing.all': '→ all posts',
  'writing.back': '← all posts',
};

export const ui: Readonly<Record<Lang, Readonly<Record<UiKey, string>>>> = { tr, en };

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key];
}
```

`src/i18n/routes.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/i18n tests/unit/i18n.test.ts
git commit -m "feat: add i18n strings and bilingual route table" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Profile and CV data

**Files:**
- Create: `src/data/profile.ts`, `src/data/cv.ts`, `src/lib/format.ts`
- Test: `tests/unit/cv.test.ts`, `tests/unit/privacy.test.ts`

**Interfaces:**
- Consumes: `Lang`, `t` (Task 2), `Localized` (Task 2)
- Produces:
  - `profile: Profile` with `name, email, site, github, linkedin, roleMono: Localized, intro: Localized, about: readonly Localized[]`
  - `interface Experience { id; role: Localized; company: string; kind: 'full-time'|'internship'|'part-time'; start: 'YYYY-MM'; end: 'YYYY-MM' | null; bullets: readonly Localized[]; tags: readonly string[] }`
  - `experience: readonly Experience[]` (newest first), `education: readonly Education[]`, `programs: readonly Localized[]`, `skills: readonly string[]`, `languages: readonly SpokenLanguage[]`, `KIND_LABEL: Record<Experience['kind'], Localized>`
  - `formatYearMonth(ym: string): string` → `'2026.08'`; `formatPeriod(start, end, lang): string` → `'2026.08 → şimdi'`; `formatDate(d: Date): string` → `'2026.10.05'`

- [ ] **Step 1: Write the failing tests**

`tests/unit/cv.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { education, experience, languages, programs, KIND_LABEL } from '../../src/data/cv';
import { profile } from '../../src/data/profile';
import { formatDate, formatPeriod, formatYearMonth } from '../../src/lib/format';

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

const isLocalized = (v: unknown): v is { tr: unknown; en: unknown } =>
  typeof v === 'object' && v !== null && 'tr' in v && 'en' in v;

const collectLocalized = (v: unknown): ReadonlyArray<{ tr: unknown; en: unknown }> =>
  isLocalized(v)
    ? [v]
    : Array.isArray(v)
      ? v.flatMap(collectLocalized)
      : typeof v === 'object' && v !== null
        ? Object.values(v).flatMap(collectLocalized)
        : [];

describe('cv data', () => {
  it('every localized string is non-empty in both languages', () => {
    const all = collectLocalized({ experience, education, programs, languages, KIND_LABEL, profile });
    expect(all.length).toBeGreaterThan(20);
    for (const item of all) {
      expect(typeof item.tr === 'string' && item.tr.trim().length > 0, JSON.stringify(item)).toBe(true);
      expect(typeof item.en === 'string' && item.en.trim().length > 0, JSON.stringify(item)).toBe(true);
    }
  });

  it('experience dates are valid, ordered newest first, and end after start', () => {
    for (const x of experience) {
      expect(x.start).toMatch(YM);
      if (x.end !== null) {
        expect(x.end).toMatch(YM);
        expect(x.end >= x.start, x.id).toBe(true);
      }
    }
    const starts = experience.map((x) => x.start);
    expect(starts).toEqual([...starts].sort().reverse());
  });

  it('the current role is first and is Sompo Sigorta', () => {
    expect(experience[0]?.end).toBeNull();
    expect(experience[0]?.company).toBe('Sompo Sigorta');
    expect(experience.filter((x) => x.end === null)).toHaveLength(1);
  });

  it('ids are unique', () => {
    const ids = experience.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('format', () => {
  it('formats year-month', () => {
    expect(formatYearMonth('2026-08')).toBe('2026.08');
  });

  it('formats open and closed periods per language', () => {
    expect(formatPeriod('2026-08', null, 'tr')).toBe('2026.08 → şimdi');
    expect(formatPeriod('2026-08', null, 'en')).toBe('2026.08 → now');
    expect(formatPeriod('2025-04', '2025-08', 'en')).toBe('2025.04 → 2025.08');
  });

  it('formats dates in UTC', () => {
    expect(formatDate(new Date('2026-10-05T23:30:00Z'))).toBe('2026.10.05');
  });

  it('rejects malformed year-month', () => {
    expect(() => formatYearMonth('2026-13')).toThrow();
  });
});
```

`tests/unit/privacy.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = [/0000000000/, /506\s*102\s*77\s*57/, /REDACTED/i];
const TEXT = /\.(astro|ts|mjs|js|md|mdx|css|json|txt|svg|html|xml)$/;

const walk = (dir: string): readonly string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
      )
    : [];

describe('privacy', () => {
  it('no phone number or home address in publishable sources', () => {
    const files = ['src', 'public', 'github'].flatMap(walk).filter((f) => TEXT.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) expect(pattern.test(text), `${pattern} in ${file}`).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/cv.test.ts tests/unit/privacy.test.ts`
Expected: `cv.test.ts` FAILS with an unresolved import of `src/data/cv`. `privacy.test.ts` passes (only `public/` and `src/pages` exist so far). That's expected: it is a guard, not a feature test.

- [ ] **Step 3: Implement**

`src/lib/format.ts`:
```ts
import { t, type Lang } from '../i18n/ui';

const YM = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function formatYearMonth(ym: string): string {
  const match = YM.exec(ym);
  if (!match) throw new Error(`Invalid year-month: "${ym}"`);
  return `${match[1]}.${match[2]}`;
}

export function formatPeriod(start: string, end: string | null, lang: Lang): string {
  const to = end === null ? t(lang, 'period.now') : formatYearMonth(end);
  return `${formatYearMonth(start)} → ${to}`;
}

export function formatDate(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}.${mm}.${dd}`;
}
```

`src/data/profile.ts`:
```ts
import type { Localized } from '../i18n/localized';

export interface Profile {
  readonly name: string;
  readonly email: string;
  readonly site: string;
  readonly github: string;
  readonly linkedin: string;
  readonly roleMono: Localized;
  readonly intro: Localized;
  readonly about: readonly Localized[];
}

export const profile: Profile = {
  name: 'Koray Özcan',
  email: 'korayozcan33@gmail.com',
  site: 'https://korayozcan.me',
  github: 'https://github.com/ozcankoray',
  linkedin: 'https://www.linkedin.com/in/koray%C3%B6zcan/',
  roleMono: { tr: 'bilgisayar_mühendisi / istanbul', en: 'computer_engineer / istanbul' },
  intro: {
    tr: 'Sompo Sigorta’da test otomasyonu ve kalite mühendisi. Veri, finans ve iOS üzerine projeler geliştiriyorum.',
    en: 'Test automation & QA engineer at Sompo Sigorta. I build things around data, finance and iOS.',
  },
  about: [
    {
      tr: 'Bahçeşehir Üniversitesi’nde İngilizce Bilgisayar Mühendisliği okudum ve Ekonomi yan dalını tamamladım. Bugün Sompo Sigorta’da yazılım test otomasyonu ve kalite mühendisliği yapıyorum.',
      en: 'I studied Computer Engineering (in English) at Bahçeşehir University with a minor in Economics. Today I work on software test automation and quality engineering at Sompo Sigorta.',
    },
    {
      tr: 'En çok yazılımın finans ve veriyle kesiştiği yerde çalışmayı seviyorum: KAP fon raporlarını yapılandırılmış veriye çeviren bir pipeline, market fiyatlarından gıda enflasyonu hesaplayan bir veri projesi ve App Store’da yayında olan bir iOS uygulaması bu ilginin ürünleri.',
      en: 'I enjoy work where software meets finance and data. A pipeline that turns KAP fund reports into structured data, a project that measures food inflation from supermarket prices, and an iOS app live on the App Store all came out of that.',
    },
    {
      tr: 'Daha önce iş analizi, proje ve hizmet yönetimi, IoT ve makine öğrenmesi üzerine stajlar yaptım; BFRC’de ekonomi bülteni için yazılar yazdım.',
      en: 'Before that I interned across business analysis, project and service management, IoT and machine learning, and wrote for the economic bulletin at BFRC.',
    },
  ],
};
```

`src/data/cv.ts`:
```ts
import type { Localized } from '../i18n/localized';

export interface Experience {
  readonly id: string;
  readonly role: Localized;
  readonly company: string;
  readonly kind: 'full-time' | 'internship' | 'part-time';
  readonly start: string;
  readonly end: string | null;
  readonly bullets: readonly Localized[];
  readonly tags: readonly string[];
}

export interface Education {
  readonly degree: Localized;
  readonly school: Localized;
  readonly start: string;
  readonly end: string;
  readonly gpa: string;
}

export interface SpokenLanguage {
  readonly name: Localized;
  readonly level: Localized;
}

export const KIND_LABEL: Readonly<Record<Experience['kind'], Localized>> = {
  'full-time': { tr: 'Tam zamanlı', en: 'Full-time' },
  internship: { tr: 'Staj', en: 'Internship' },
  'part-time': { tr: 'Yarı zamanlı', en: 'Part-time' },
};

export const experience: readonly Experience[] = [
  {
    id: 'sompo-qa',
    role: { tr: 'Junior Yazılım Test Otomasyonu ve Kalite Mühendisi', en: 'Junior Software Test Automation & Quality Engineer' },
    company: 'Sompo Sigorta',
    kind: 'full-time',
    start: '2026-08',
    end: null,
    bullets: [],
    tags: ['test automation', 'quality engineering'],
  },
  {
    id: 'odeal-ba',
    role: { tr: 'İş Analisti', en: 'Business Analyst' },
    company: 'Ödeal',
    kind: 'internship',
    start: '2026-04',
    end: '2026-07',
    bullets: [
      {
        tr: 'Odoo ERP özelleştirmeleri dahil süreç iyileştirme projeleri için İş Gereksinim Dokümanları (BRD) hazırladım ve gözden geçirdim.',
        en: 'Prepared and reviewed Business Requirements Documents (BRDs) for process improvement initiatives, including Odoo ERP customizations.',
      },
      {
        tr: 'UAT senaryolarını yönettim, kullanıcı geri bildirimlerini değerlendirdim ve iç/dış uygulamaların doğrulanmasına destek oldum.',
        en: 'Managed UAT scenarios, evaluated user feedback and supported validation of internal/external applications.',
      },
      {
        tr: 'Departman bazında ihtiyaç analizleri yaptım, dijital iş akışı iyileştirmeleri için fonksiyonel taslaklar hazırladım.',
        en: 'Conducted departmental needs analysis and prepared functional drafts for digital workflow optimization.',
      },
      {
        tr: 'Agile bir ortamda iş ve teknik ekiplerle çalıştım; gereksinim takibi ve dokümantasyon için Jira ve Confluence kullandım.',
        en: 'Worked with business and technical teams in an Agile environment using Jira and Confluence for requirement tracking and documentation.',
      },
    ],
    tags: ['business analysis', 'uat', 'odoo', 'jira'],
  },
  {
    id: 'kontrolmatik-swe',
    role: { tr: 'Yazılım Mühendisi', en: 'Software Engineer' },
    company: 'Kontrolmatik Technologies',
    kind: 'internship',
    start: '2025-09',
    end: '2025-12',
    bullets: [
      {
        tr: 'ThingsBoard ile kritik sensör verilerini gösteren gerçek zamanlı bir IoT panosunun geliştirilmesinde yer aldım.',
        en: 'Co-engineered a real-time IoT dashboard using ThingsBoard to visualize critical sensor data.',
      },
      {
        tr: 'Flutter ile UI/UX ilkelerini ön planda tutan duyarlı bir mobil uygulama arayüzü prototipledim.',
        en: 'Prototyped a responsive mobile app interface with Flutter, prioritizing UI/UX best practices.',
      },
      {
        tr: 'Yapay zekâ tabanlı bir kamera tanıma sisteminin ML iş akışlarını iyileştirerek veri işleme verimliliğini artırdım.',
        en: 'Optimized ML workflows for an AI-based camera recognition system, boosting data processing efficiency.',
      },
      {
        tr: 'Roboflow’da 4.000+ görsellik bir veri setini derleyip etiketledim; bu, model doğruluğunu doğrudan artırdı.',
        en: 'Curated and annotated a 4,000+ image dataset in Roboflow, directly improving model accuracy.',
      },
    ],
    tags: ['thingsboard', 'flutter', 'machine learning', 'roboflow'],
  },
  {
    id: 'eclit-psm',
    role: { tr: 'Proje ve Hizmet Yönetimi', en: 'Project & Service Management' },
    company: 'Eclit',
    kind: 'internship',
    start: '2025-04',
    end: '2025-08',
    bullets: [
      {
        tr: '30+ kurumsal müşterinin hizmet teslimini SLA’lara bağlı kalarak koordine ettim.',
        en: 'Coordinated service delivery for 30+ corporate clients, strictly adhering to SLAs and ensuring satisfaction.',
      },
      {
        tr: 'Görev takibini iyileştirip yönetim dokümantasyonunu standartlaştırarak proje süreçlerini sadeleştirdim.',
        en: 'Streamlined project lifecycles by optimizing task tracking and standardizing documentation for management.',
      },
      {
        tr: 'İş süreçlerini analiz ederek darboğazları belirledim ve operasyonel akışı iyileştirdim.',
        en: 'Analyzed business processes to identify bottlenecks and enhance operational workflow.',
      },
      {
        tr: 'ConnectWise üzerinden olay çözümlerini yönettim, proje kayıtlarında veri doğruluğunu sağladım.',
        en: 'Managed incident resolution via ConnectWise, ensuring high data accuracy in project ticketing.',
      },
    ],
    tags: ['project management', 'itsm', 'connectwise'],
  },
  {
    id: 'bfrc-ra',
    role: { tr: 'Öğrenci Araştırma Asistanı', en: 'Student Research Assistant' },
    company: 'BFRC — Bahçeşehir University Financial Research Center',
    kind: 'part-time',
    start: '2025-01',
    end: '2026-06',
    bullets: [
      {
        tr: 'Dönemsel ekonomi bülteni için ekonomik beklentiler ve piyasa eğilimleri üzerine veriye dayalı yazılar yazdım.',
        en: 'Authored data-driven articles on economic expectations and market trends for the periodic economic bulletin.',
      },
      {
        tr: 'Öğretim üyelerinin yürüttüğü araştırma projelerinde çalıştım; karmaşık makroekonomik verileri uygulanabilir içgörülere dönüştürdüm.',
        en: 'Collaborated on faculty-led research projects, translating complex macroeconomic data into actionable insights.',
      },
    ],
    tags: ['financial analysis', 'macroeconomics'],
  },
  {
    id: 'sompo-itgov',
    role: { tr: 'BT Yönetişimi', en: 'IT Governance' },
    company: 'Sompo Sigorta',
    kind: 'internship',
    start: '2024-09',
    end: '2024-10',
    bullets: [
      {
        tr: 'BT yönetişimi çerçevesinde kurumsal ölçekli yapay zekâ projelerinin fizibilite analizlerine katkı verdim.',
        en: 'Contributed to feasibility analysis of enterprise-level AI projects within the IT governance framework.',
      },
      {
        tr: 'Departmanların dijital dönüşüm süreçlerine uyumu için toplantıları yürüttüm.',
        en: 'Facilitated meetings to align departments with digital transformation protocols.',
      },
      {
        tr: 'Yapay zekâ teknolojileri üzerine araştırma yapıp BT ekip liderlerine uygulanabilir öneriler sundum.',
        en: 'Conducted research on Artificial Intelligence technologies and presented actionable insights to IT team leaders.',
      },
    ],
    tags: ['ai', 'it governance'],
  },
];
```

Note: experience is ordered by `start` descending, as the test requires. BFRC (2025-01) therefore sits after Eclit (2025-04).

Append to `src/data/cv.ts`:
```ts
export const education: readonly Education[] = [
  {
    degree: { tr: 'Bilgisayar Mühendisliği (İngilizce), Lisans', en: 'B.Sc. Computer Engineering (English)' },
    school: { tr: 'Bahçeşehir Üniversitesi', en: 'Bahçeşehir University' },
    start: '2022',
    end: '2026',
    gpa: '3.27',
  },
  {
    degree: { tr: 'Ekonomi (İngilizce), Yan Dal', en: 'Minor in Economics (English)' },
    school: { tr: 'Bahçeşehir Üniversitesi', en: 'Bahçeşehir University' },
    start: '2024',
    end: '2026',
    gpa: '3.50',
  },
];

export const programs: readonly Localized[] = [
  { tr: 'YÖK Veri Analizi Okulu — Yapay Zekâ Bölümü', en: 'YÖK Data Analysis School — Artificial Intelligence Department' },
  { tr: 'TÖDEB & Marmara Üniversitesi “Fintek Çırağı” Programı', en: 'TÖDEB & Marmara University “Fintech Apprentice” Program' },
];

export const skills: readonly string[] = [
  'Python', 'C++', 'SQL', 'Test Automation', 'Deep Learning', 'Agile', 'Jira', 'Confluence', 'Documentation',
];

export const languages: readonly SpokenLanguage[] = [
  { name: { tr: 'Türkçe', en: 'Turkish' }, level: { tr: 'Anadil', en: 'Native' } },
  { name: { tr: 'İngilizce', en: 'English' }, level: { tr: 'C1', en: 'C1' } },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS (i18n, cv, privacy).

- [ ] **Step 5: Commit**

```bash
git add src/data src/lib/format.ts tests/unit/cv.test.ts tests/unit/privacy.test.ts
git commit -m "feat: add profile and bilingual CV data" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Content collections and project entries

**Files:**
- Create: `src/content/schemas.ts`, `src/content.config.ts`, `src/lib/entries.ts`, `src/lib/content.ts`
- Create: `src/content/projects/{tr,en}/{kap-fund-analytics,nerdi,food-inflation-tracker}.md`
- Create: `src/content/blog/tr/.gitkeep`, `src/content/blog/en/.gitkeep`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: `Lang`, `LANGS` (Task 2)
- Produces:
  - `projectSchema`, `postSchema` (zod)
  - `entryLang(id: string): Lang` (throws on an unknown prefix), `entrySlug(id: string): string`
  - `type Project = CollectionEntry<'projects'>`, `type Post = CollectionEntry<'blog'>`
  - `getProjects(lang): Promise<readonly Project[]>` (sorted by `order`), `getPosts(lang): Promise<readonly Post[]>` (non-draft, newest first)
  - Project frontmatter: `title, summary (≤140), year, stack[], status 'live'|'complete', order, flow[] (2–6 items, ≤28 chars each), links { appStore?, site?, repo? }`

- [ ] **Step 1: Write the failing tests**

`tests/unit/content.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { postSchema, projectSchema } from '../../src/content/schemas';
import { entryLang, entrySlug } from '../../src/lib/entries';
import { LANGS, type Lang } from '../../src/i18n/ui';

const ROOT = join(process.cwd(), 'src', 'content');

const filesIn = (collection: string, lang: Lang): readonly string[] => {
  const dir = join(ROOT, collection, lang);
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
};

const frontmatter = (collection: string, lang: Lang, file: string): Record<string, unknown> =>
  matter(readFileSync(join(ROOT, collection, lang, file), 'utf8')).data;

describe.each([
  ['projects', projectSchema],
  ['blog', postSchema],
] as const)('%s collection', (collection, schema) => {
  it('has the same files in tr and en', () => {
    expect(filesIn(collection, 'tr')).toEqual(filesIn(collection, 'en'));
  });

  it('every file matches the schema', () => {
    for (const lang of LANGS) {
      for (const file of filesIn(collection, lang)) {
        const result = schema.safeParse(frontmatter(collection, lang, file));
        expect(result.success, `${lang}/${file}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    }
  });

  it('file names are url-safe slugs', () => {
    for (const lang of LANGS) {
      for (const file of filesIn(collection, lang)) expect(file).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.md$/);
    }
  });
});

describe('projects', () => {
  it('features exactly the three agreed projects', () => {
    expect(filesIn('projects', 'tr')).toEqual(['food-inflation-tracker.md', 'kap-fund-analytics.md', 'nerdi.md']);
  });

  it('has unique order values per language', () => {
    for (const lang of LANGS) {
      const orders = filesIn('projects', lang).map((f) => frontmatter('projects', lang, f).order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  it('never links to a GitHub repo (featured repos are private)', () => {
    for (const lang of LANGS) {
      for (const file of filesIn('projects', lang)) {
        const raw = readFileSync(join(ROOT, 'projects', lang, file), 'utf8');
        expect(raw).not.toMatch(/github\.com\/ozcankoray\//);
      }
    }
  });
});

describe('entries', () => {
  it('splits ids into language and slug', () => {
    expect(entryLang('tr/nerdi')).toBe('tr');
    expect(entryLang('en/kap-fund-analytics')).toBe('en');
    expect(entrySlug('en/kap-fund-analytics')).toBe('kap-fund-analytics');
  });

  it('throws on unknown language folders', () => {
    expect(() => entryLang('de/nerdi')).toThrow();
    expect(() => entryLang('nerdi')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL with an unresolved import of `src/content/schemas`.

- [ ] **Step 3: Implement schemas, config and helpers**

`src/content/schemas.ts`:
```ts
import { z } from 'astro/zod';

export const projectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(140),
  year: z.number().int().min(2020).max(2100),
  stack: z.array(z.string().min(1)).min(1),
  status: z.enum(['live', 'complete']),
  order: z.number().int(),
  flow: z.array(z.string().min(1).max(28)).min(2).max(6),
  links: z
    .object({
      appStore: z.string().url().optional(),
      site: z.string().url().optional(),
      repo: z.string().url().optional(),
    })
    .default({}),
});

export const postSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
});
```

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema, projectSchema } from './content/schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: postSchema,
});

export const collections = { projects, blog };
```

`src/lib/entries.ts`:
```ts
import { LANGS, type Lang } from '../i18n/ui';

const isLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value);

export function entryLang(id: string): Lang {
  const [head, ...rest] = id.split('/');
  if (head === undefined || rest.length === 0 || !isLang(head)) {
    throw new Error(`Content entry "${id}" must live in a tr/ or en/ folder`);
  }
  return head;
}

export function entrySlug(id: string): string {
  entryLang(id);
  return id.split('/').slice(1).join('/');
}
```

`src/lib/content.ts`:
```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { entryLang } from './entries';

export type Project = CollectionEntry<'projects'>;
export type Post = CollectionEntry<'blog'>;

export async function getProjects(lang: Lang): Promise<readonly Project[]> {
  const all = await getCollection('projects', (entry) => entryLang(entry.id) === lang);
  return [...all].sort((a, b) => a.data.order - b.data.order);
}

export async function getPosts(lang: Lang): Promise<readonly Post[]> {
  const all = await getCollection('blog', (entry) => entryLang(entry.id) === lang && !entry.data.draft);
  return [...all].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
```

- [ ] **Step 4: Write the project content files**

`src/content/projects/en/kap-fund-analytics.md`:
```md
---
title: KAP Fund Analytics
summary: Turns fund reports published on KAP as PDFs into structured, queryable time series.
year: 2026
stack: [Python, PyMuPDF, FastAPI, SvelteKit, TimescaleDB, Docker]
status: complete
order: 1
flow: [KAP PDF reports, PyMuPDF parser, Validation & audit, TimescaleDB, FastAPI, SvelteKit UI]
links: {}
---

## Problem

Investment funds in Türkiye publish their periodic reports on KAP, the Public Disclosure Platform, as PDF files. The numbers are all there, but they sit in layouts that differ between issuers, so comparing funds over time means copying tables by hand.

## Approach

This was my capstone project at Bahçeşehir University. The current version parses the reports with a deterministic PyMuPDF pipeline instead of a learned model: explicit rules locate the tables and fields, every extracted value is validated, and each run is audited. The results are stored as time series in TimescaleDB, served by a FastAPI backend and explored through a SvelteKit interface. The whole stack runs in containers.

## What I learned

When the output feeds financial analysis, being able to explain every number matters more than squeezing out coverage. A boring, deterministic pipeline turned out to be easier to trust, test and extend than a clever one.
```

`src/content/projects/tr/kap-fund-analytics.md`:
```md
---
title: KAP Fon Analitiği
summary: KAP'ta PDF olarak yayımlanan fon raporlarını yapılandırılmış, sorgulanabilir zaman serilerine dönüştürür.
year: 2026
stack: [Python, PyMuPDF, FastAPI, SvelteKit, TimescaleDB, Docker]
status: complete
order: 1
flow: [KAP PDF raporları, PyMuPDF ayrıştırıcı, Doğrulama ve denetim, TimescaleDB, FastAPI, SvelteKit arayüz]
links: {}
---

## Problem

Türkiye'deki yatırım fonları dönemsel raporlarını Kamuyu Aydınlatma Platformu'nda (KAP) PDF olarak yayımlıyor. Rakamların hepsi orada, ama ihraççıya göre değişen düzenlerin içinde; fonları zaman içinde karşılaştırmak tabloları elle kopyalamak demek.

## Yaklaşım

Bahçeşehir Üniversitesi'ndeki bitirme projem. Güncel sürüm raporları öğrenen bir model yerine deterministik bir PyMuPDF pipeline'ı ile ayrıştırıyor: tablo ve alanları açık kurallar buluyor, çıkarılan her değer doğrulanıyor ve her çalıştırma denetim kaydı bırakıyor. Sonuçlar TimescaleDB'de zaman serisi olarak saklanıyor, FastAPI ile sunuluyor ve SvelteKit arayüzünde inceleniyor. Tüm sistem konteynerlerde çalışıyor.

## Öğrendiklerim

Çıktı finansal analizde kullanılacaksa, her rakamı açıklayabilmek kapsamı birkaç puan artırmaktan daha önemli. Sıkıcı ama deterministik bir pipeline'a güvenmek, onu test etmek ve geliştirmek, akıllı görünen bir çözümden çok daha kolay oldu.
```

`src/content/projects/en/nerdi.md`:
```md
---
title: Nerdi
summary: An iPhone app that serves a few real research papers a day — original abstracts, no AI summaries.
year: 2026
stack: [iOS, OpenAlex, In-app subscriptions]
status: live
order: 2
flow: [OpenAlex, Daily selection, Nerdi iPhone app, On-device library, Nerdi Plus sync]
links:
  appStore: https://apps.apple.com/us/app/nerdi-research-papers/id6813826387
  site: https://nerdi.pages.dev/privacy.html
---

## Problem

Keeping up with research is hard, and most paper apps replace the abstract with a generated summary. I wanted something smaller: a handful of real papers each day, exactly as their authors described them.

## Approach

Nerdi pulls papers from OpenAlex across twelve fields and shows each one with its real title, authors and original abstract, plus a link to the source — usually the PDF. It works without an account: saved papers and reading progress stay on the device. An optional Nerdi Plus subscription adds cross-device sync and an unlimited library.

## What I learned

Shipping is its own skill. App Store review, subscriptions, and privacy and support pages are as much a part of the product as the reading screen.
```

`src/content/projects/tr/nerdi.md`:
```md
---
title: Nerdi
summary: Her gün birkaç gerçek akademik makale sunan iPhone uygulaması — orijinal özetler, yapay zekâ özeti yok.
year: 2026
stack: [iOS, OpenAlex, Uygulama içi abonelik]
status: live
order: 2
flow: [OpenAlex, Günlük seçki, Nerdi iPhone uygulaması, Cihazdaki kütüphane, Nerdi Plus senkron]
links:
  appStore: https://apps.apple.com/us/app/nerdi-research-papers/id6813826387
  site: https://nerdi.pages.dev/privacy.html
---

## Problem

Araştırmaları takip etmek zor ve makale uygulamalarının çoğu özetin yerine yapay zekâ özetini koyuyor. Daha küçük bir şey istedim: her gün, yazarlarının anlattığı haliyle birkaç gerçek makale.

## Yaklaşım

Nerdi, OpenAlex'ten on iki alanda makale çekiyor ve her birini gerçek başlığı, yazarları ve orijinal özetiyle, kaynağa (çoğunlukla PDF) bağlantısıyla gösteriyor. Hesap gerektirmiyor: kaydedilen makaleler ve okuma ilerlemesi cihazda kalıyor. İsteğe bağlı Nerdi Plus aboneliği cihazlar arası senkron ve sınırsız kütüphane ekliyor.

## Öğrendiklerim

Yayına çıkmak başlı başına bir beceri: App Store incelemesi, abonelikler, gizlilik ve destek sayfaları da okuma ekranı kadar ürünün parçası.
```

`src/content/projects/en/food-inflation-tracker.md`:
```md
---
title: Food Inflation Tracker
summary: Measures food inflation from regularly collected supermarket prices, with an approach similar to TÜİK's.
year: 2026
stack: [Python, marketfiyati.org.tr API, Scheduled jobs]
status: complete
order: 3
flow: [marketfiyati.org.tr API, Scheduled collection, Price history, Basket & weights, Food inflation index]
links: {}
---

## Problem

Official food inflation is published once a month, as a single number. I wanted to see how prices actually move between releases, product by product.

## Approach

A Python job collects prices from the public marketfiyati.org.tr API on a regular schedule and builds a price history. From that history it calculates food inflation with an approach similar to TÜİK's: products are grouped into a basket, weighted, and compared with a base period.

## What I learned

Collecting the data is the easy part. The method — matching products, handling missing prices, choosing weights — decides whether the final number means anything.
```

`src/content/projects/tr/food-inflation-tracker.md`:
```md
---
title: Gıda Enflasyonu Takibi
summary: Düzenli toplanan market fiyatlarından, TÜİK yöntemine benzer şekilde gıda enflasyonu hesaplar.
year: 2026
stack: [Python, marketfiyati.org.tr API, Zamanlanmış görevler]
status: complete
order: 3
flow: [marketfiyati.org.tr API, Düzenli veri toplama, Fiyat geçmişi, Sepet ve ağırlıklar, Gıda enflasyonu endeksi]
links: {}
---

## Problem

Resmi gıda enflasyonu ayda bir kez ve tek bir sayı olarak açıklanıyor. Fiyatların açıklamalar arasında, ürün ürün nasıl hareket ettiğini görmek istedim.

## Yaklaşım

Bir Python görevi, herkese açık marketfiyati.org.tr API'sinden fiyatları düzenli aralıklarla topluyor ve bir fiyat geçmişi oluşturuyor. Bu geçmişten TÜİK'in yöntemine benzer şekilde gıda enflasyonu hesaplanıyor: ürünler bir sepette gruplanıyor, ağırlıklandırılıyor ve bir baz dönemle karşılaştırılıyor.

## Öğrendiklerim

Veriyi toplamak işin kolay kısmı. Ürün eşleştirme, eksik fiyatlar ve ağırlık seçimi gibi yöntem kararları, ortaya çıkan sayının bir anlam taşıyıp taşımadığını belirliyor.
```

Create the empty blog folders:
```bash
mkdir -p src/content/blog/tr src/content/blog/en
touch src/content/blog/tr/.gitkeep src/content/blog/en/.gitkeep
```

- [ ] **Step 5: Run unit tests and a build**

Run: `npx vitest run && npm run build`
Expected: all unit tests PASS. The build succeeds; a "No files found" warning for the `blog` collection is acceptable.

- [ ] **Step 6: Commit**

```bash
git add src/content src/content.config.ts src/lib/entries.ts src/lib/content.ts tests/unit/content.test.ts
git commit -m "feat: add content collections and featured project entries" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Design tokens, base layout, intro column, theme and language switch

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/layouts/Split.astro`
- Create: `src/components/Seo.astro`, `Intro.astro`, `LangSwitch.astro`, `ThemeToggle.astro`, `public/favicon.svg`
- Create: `src/pages/en/index.astro` (temporary)
- Modify: `src/pages/index.astro` (temporary, now uses `Split`)
- Test: `tests/e2e/layout.spec.ts`

**Interfaces:**
- Consumes: `t`, `OTHER`, `OG_LOCALE`, `Route`, `localizedPath`, `ogImagePath`, `cvPdfPath`, `rssPath`, `profile`
- Produces:
  - `<Base lang route title description>` where `route: Route | null` (null → noindex, no alternates)
  - `<Split lang route title description>` with a default slot (main content) and a `nav` slot (rendered inside the intro column)
  - CSS classes for later tasks: `.section`, `.label`, `.card`, `.is-current`, `.period`, `.title-strong`, `.tags`, `.badge`, `.page-title`, `.lead-lg`, `.prose`, `.mono`, `.more`

- [ ] **Step 1: Write the failing tests**

`tests/e2e/layout.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('theme toggle switches and persists across reloads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(247, 247, 244)');
});

test('follows the OS theme by default', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(14, 15, 15)');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content is readable and the toggle is hidden', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByText('Koray Özcan').first()).toBeVisible();
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(247, 247, 244)');
  });
});

test('works when localStorage throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('/');
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  expect(errors).toEqual([]);
});

test('language switch points to the English home and back', async ({ page }) => {
  await page.goto('/');
  await page.locator('.lang a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('.lang a[hreflang="tr"]').click();
  await expect(page).toHaveURL(/:\d+\/$/);
});

test('skip link is the first focusable element and targets main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('href', '#main');
  await expect(page.locator('main#main')).toHaveCount(1);
});

test('head has canonical and hreflang alternates', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://korayozcan.me/en/');
  await expect(page.locator('link[hreflang="tr"]')).toHaveAttribute('href', 'https://korayozcan.me/');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', 'https://korayozcan.me/');
});
```

Note: `errors.push` mutates a test-local array to collect events. That's acceptable in test code because Playwright's event API requires it.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: FAIL because `[data-theme-toggle]` is not found.

- [ ] **Step 3: Write the tokens and global styles**

`src/styles/tokens.css`:
```css
:root {
  --bg: #f7f7f4;
  --surface: #ffffff;
  --border: #dcdcd5;
  --text: #2b2d2b;
  --text-strong: #0e0f0f;
  --muted: #4f534f;
  --faint: #6a6e6a;
  --accent: #4d6b00;
  --accent-text: #4d6b00;
  --accent-ink: #f7f7f4;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #0e0f0f;
    --surface: #141615;
    --border: #2a2d2a;
    --text: #c8cbc8;
    --text-strong: #f2f4f2;
    --muted: #8a8f8a;
    --faint: #7a7f7a;
    --accent: #c6f432;
    --accent-text: #c6f432;
    --accent-ink: #0e0f0f;
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --bg: #0e0f0f;
  --surface: #141615;
  --border: #2a2d2a;
  --text: #c8cbc8;
  --text-strong: #f2f4f2;
  --muted: #8a8f8a;
  --faint: #7a7f7a;
  --accent: #c6f432;
  --accent-text: #c6f432;
  --accent-ink: #0e0f0f;
  color-scheme: dark;
}
```

`src/styles/global.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 400 1rem/1.65 var(--font-sans);
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
}
a { color: inherit; text-decoration: none; }
a:hover { color: var(--text-strong); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.mono { font-family: var(--font-mono); }

.skip-link {
  position: absolute; left: 1rem; top: -4rem; z-index: 10;
  padding: .5rem .75rem; background: var(--accent); color: var(--accent-ink);
}
.skip-link:focus { top: 1rem; }

.split { max-width: 72rem; margin: 0 auto; padding: 0 1.25rem; display: grid; grid-template-columns: minmax(0, 1fr); }
.intro { padding: 3.5rem 0 2.5rem; }
.content { padding: 0 0 5rem; outline: none; }
@media (min-width: 900px) {
  .split { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 4rem; padding: 0 3rem; }
  .intro { position: sticky; top: 0; height: 100vh; padding: 6rem 0 3rem; }
  .content { padding: 6rem 0; }
}

.section { margin-bottom: 5rem; scroll-margin-top: 6rem; }
.label { margin: 0 0 1rem; font: 400 .75rem/1.4 var(--font-mono); color: var(--faint); }
.card { display: block; border: 1px solid var(--border); padding: 1rem 1.125rem; transition: border-color .15s; }
.card:hover { border-color: var(--faint); }
.card.is-current { border-left: 2px solid var(--accent); }
.period { font: 400 .75rem/1.6 var(--font-mono); color: var(--faint); }
.title-strong { color: var(--text-strong); font-weight: 600; }
.tags { list-style: none; display: flex; flex-wrap: wrap; gap: .25rem .75rem; margin: .5rem 0 0; padding: 0; font: 400 .75rem/1.6 var(--font-mono); color: var(--muted); }
.tags li::before { content: '['; }
.tags li::after { content: ']'; }
.badge { display: inline-block; margin-left: .5rem; padding: .1rem .4rem; font: 400 .625rem/1.4 var(--font-mono); letter-spacing: .04em; background: var(--accent); color: var(--accent-ink); vertical-align: middle; }
.more { display: inline-block; margin-top: 1rem; font: 400 .8125rem/1.6 var(--font-mono); color: var(--accent-text); }
.page-title { margin: .25rem 0 .75rem; font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 800; letter-spacing: -.03em; line-height: 1.1; color: var(--text-strong); }
.lead-lg { margin: 0; font-size: 1.0625rem; color: var(--muted); max-width: 40rem; }
.prose { max-width: 68ch; }
.prose h2 { margin: 2.5rem 0 .75rem; font-size: 1rem; color: var(--text-strong); }
.prose a { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
.prose code { font-family: var(--font-mono); font-size: .875em; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; }
}
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0e0f0f"/><path d="M9 7v18M9 16l9-9M12 13l8 12" stroke="#c6f432" stroke-width="3" fill="none" stroke-linecap="square"/></svg>
```

- [ ] **Step 4: Write the layout components**

`src/components/Seo.astro`:
```astro
---
import { OG_LOCALE, OTHER, t, type Lang } from '../i18n/ui';
import { localizedPath, ogImagePath, rssPath, type Route } from '../i18n/routes';
import { profile } from '../data/profile';

interface Props {
  lang: Lang;
  route: Route | null;
  title: string;
  description: string;
}

const { lang, route, title, description } = Astro.props;
const site = Astro.site ?? new URL(profile.site);
const abs = (path: string): string => new URL(path, site).toString();
const fullTitle = title === profile.name ? title : `${title} — ${profile.name}`;
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
{route ? (
  <>
    <link rel="canonical" href={abs(localizedPath(lang, route))} />
    <link rel="alternate" hreflang="tr" href={abs(localizedPath('tr', route))} />
    <link rel="alternate" hreflang="en" href={abs(localizedPath('en', route))} />
    <link rel="alternate" hreflang="x-default" href={abs(localizedPath('tr', route))} />
    <meta property="og:url" content={abs(localizedPath(lang, route))} />
    <meta property="og:image" content={abs(ogImagePath(lang, route))} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
  </>
) : (
  <meta name="robots" content="noindex" />
)}
<meta property="og:type" content="website" />
<meta property="og:site_name" content={profile.name} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:locale" content={OG_LOCALE[lang]} />
<meta property="og:locale:alternate" content={OG_LOCALE[OTHER[lang]]} />
<meta name="twitter:card" content="summary_large_image" />
<link rel="alternate" type="application/rss+xml" title={`${profile.name} — ${t(lang, 'writing.title')}`} href={rssPath(lang)} />
```

`src/layouts/Base.astro`:
```astro
---
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/tokens.css';
import '../styles/global.css';
import Seo from '../components/Seo.astro';
import { t, type Lang } from '../i18n/ui';
import type { Route } from '../i18n/routes';

interface Props {
  lang: Lang;
  route: Route | null;
  title: string;
  description: string;
}

const { lang, route, title, description } = Astro.props;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script is:inline>
      try {
        var saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
      } catch (e) {}
    </script>
    <Seo lang={lang} route={route} title={title} description={description} />
  </head>
  <body>
    <a class="skip-link" href="#main">{t(lang, 'skip')}</a>
    <slot />
  </body>
</html>
```

`src/components/ThemeToggle.astro`:
```astro
---
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
---
<button type="button" class="theme-toggle" data-theme-toggle hidden aria-label={t(lang, 'theme.toggle')}>◐</button>

<script>
  const root = document.documentElement;

  const current = (): 'light' | 'dark' => {
    const set = root.dataset.theme;
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        // Storage unavailable (private mode, blocked): keep the in-page choice only.
      }
    });
  }
</script>

<style>
  .theme-toggle {
    background: none; border: 1px solid var(--border); color: var(--muted);
    font: inherit; padding: .1rem .5rem; cursor: pointer; min-height: 1.75rem;
  }
  .theme-toggle:hover { color: var(--text-strong); border-color: var(--faint); }
</style>
```

`src/components/LangSwitch.astro`:
```astro
---
import { OTHER, t, type Lang } from '../i18n/ui';
import { localizedPath, type Route } from '../i18n/routes';

interface Props {
  lang: Lang;
  route: Route;
}

const { lang, route } = Astro.props;
const other = OTHER[lang];
---
<nav class="lang" aria-label={t(lang, 'lang.label')}>
  <span class="current">{lang.toUpperCase()}</span>
  <span aria-hidden="true">/</span>
  <a href={localizedPath(other, route)} hreflang={other} lang={other} aria-label={t(lang, 'lang.switch')}>{other.toUpperCase()}</a>
</nav>

<style>
  .lang { display: flex; gap: .4rem; }
  .current { color: var(--text-strong); }
  a { padding: .25rem 0; }
</style>
```

`src/components/Intro.astro`:
```astro
---
import { profile } from '../data/profile';
import { t, type Lang } from '../i18n/ui';
import { cvPdfPath, localizedPath, type Route } from '../i18n/routes';
import LangSwitch from './LangSwitch.astro';
import ThemeToggle from './ThemeToggle.astro';

interface Props {
  lang: Lang;
  route: Route;
}

const { lang, route } = Astro.props;
const NameTag = route.name === 'home' ? 'h1' : 'p';
---
<div class="intro-inner">
  <NameTag class="name"><a href={localizedPath(lang, { name: 'home' })}>{profile.name}</a></NameTag>
  <p class="role mono">{profile.roleMono[lang]}</p>
  <p class="lead">{profile.intro[lang]}</p>
  <slot />
  <ul class="links mono">
    <li><a href={profile.github} rel="me">GitHub</a></li>
    <li><a href={profile.linkedin} rel="me">LinkedIn</a></li>
    <li><a href={`mailto:${profile.email}`}>{t(lang, 'links.email')}</a></li>
    <li><a href={cvPdfPath(lang)} download>{t(lang, 'cv.download')}</a></li>
  </ul>
  <div class="controls mono">
    <LangSwitch lang={lang} route={route} />
    <ThemeToggle lang={lang} />
  </div>
</div>

<style>
  .intro-inner { display: flex; flex-direction: column; height: 100%; }
  .name { margin: 0; font-size: clamp(2.25rem, 5vw, 3rem); font-weight: 800; letter-spacing: -.035em; line-height: 1.05; color: var(--text-strong); }
  .role { margin: .75rem 0 1rem; font-size: .8125rem; color: var(--accent-text); }
  .lead { margin: 0; max-width: 22rem; color: var(--muted); }
  .links { list-style: none; display: flex; flex-wrap: wrap; gap: .25rem 1.25rem; margin: 2rem 0 0; padding: 0; font-size: .8125rem; color: var(--muted); }
  .links a { display: inline-block; padding: .25rem 0; }
  .controls { display: flex; gap: 1.25rem; align-items: center; margin-top: 1rem; font-size: .75rem; color: var(--faint); }
  @media (min-width: 900px) { .links { margin-top: auto; } }
</style>
```

`src/layouts/Split.astro`:
```astro
---
import Base from './Base.astro';
import Intro from '../components/Intro.astro';
import type { Lang } from '../i18n/ui';
import type { Route } from '../i18n/routes';

interface Props {
  lang: Lang;
  route: Route;
  title: string;
  description: string;
}

const { lang, route, title, description } = Astro.props;
---
<Base lang={lang} route={route} title={title} description={description}>
  <div class="split">
    <header class="intro">
      <Intro lang={lang} route={route}><slot name="nav" /></Intro>
    </header>
    <main id="main" class="content" tabindex="-1">
      <slot />
    </main>
  </div>
</Base>
```

Temporary home pages (Task 6 replaces both):

`src/pages/index.astro`:
```astro
---
import Split from '../layouts/Split.astro';
import { profile } from '../data/profile';
---
<Split lang="tr" route={{ name: 'home' }} title={profile.name} description={profile.intro.tr}>
  <p>{profile.about[0]?.tr}</p>
</Split>
```

`src/pages/en/index.astro`:
```astro
---
import Split from '../../layouts/Split.astro';
import { profile } from '../../data/profile';
---
<Split lang="en" route={{ name: 'home' }} title={profile.name} description={profile.intro.en}>
  <p>{profile.about[0]?.en}</p>
</Split>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS (smoke + layout).

- [ ] **Step 6: Commit**

```bash
git add src/styles src/layouts src/components src/pages public/favicon.svg tests/e2e/layout.spec.ts
git commit -m "feat: add graphite+lime design tokens, split layout, theme and language switch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Home page

**Files:**
- Create: `src/views/HomeView.astro`, `src/components/SectionNav.astro`, `ExperienceList.astro`, `ProjectCard.astro`, `PostList.astro`, `tests/e2e/content-files.ts`
- Modify: `src/pages/index.astro`, `src/pages/en/index.astro` (replace their contents)
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `Split`, `getProjects`, `getPosts`, `Project`, `Post`, `entrySlug`, `experience`, `Experience`, `formatPeriod`, `formatDate`, `profile`, `t`, `localizedPath`
- Produces: `<HomeView lang>`; `<ProjectCard lang project>`; `<PostList lang posts>`; `publishedSlugs(collection, lang)` (e2e helper)

- [ ] **Step 1: Write the e2e helper and failing tests**

`tests/e2e/content-files.ts`:
```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export type Lang = 'tr' | 'en';

export function publishedSlugs(collection: 'projects' | 'blog', lang: Lang): readonly string[] {
  const dir = join('src', 'content', collection, lang);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => {
      const data: Record<string, unknown> = matter(readFileSync(join(dir, file), 'utf8')).data;
      return data.draft !== true;
    })
    .map((file) => file.replace(/\.md$/, ''))
    .sort();
}
```

`tests/e2e/home.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { publishedSlugs } from './content-files';

const HOMES = [
  { path: '/', lang: 'tr', other: '/en/' },
  { path: '/en/', lang: 'en', other: '/' },
] as const;

for (const home of HOMES) {
  test.describe(`home (${home.lang})`, () => {
    test('shows identity, current role and the three projects', async ({ page }) => {
      await page.goto(home.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Koray Özcan');
      await expect(page.locator('#experience .is-current')).toContainText('Sompo Sigorta');
      await expect(page.locator('#experience ol.xp > li')).toHaveCount(6);
      await expect(page.locator('#projects article')).toHaveCount(3);
      await expect(page.locator('#projects article').nth(1)).toContainText('Nerdi');
      await expect(page.locator('#projects .badge')).toHaveCount(1);
    });

    test('writing section matches the published posts', async ({ page }) => {
      await page.goto(home.path);
      const count = publishedSlugs('blog', home.lang).length;
      if (count === 0) {
        await expect(page.locator('#writing')).toHaveCount(0);
        await expect(page.locator('.section-nav a[href="#writing"]')).toHaveCount(0);
      } else {
        await expect(page.locator('#writing li')).toHaveCount(Math.min(count, 3));
      }
    });

    test('section nav marks the section in view', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(home.path);
      await expect(page.locator('.section-nav a[href="#about"]')).toHaveAttribute('aria-current', 'true');
      await page.locator('#projects').evaluate((el) => el.scrollIntoView());
      await expect(page.locator('.section-nav a[href="#projects"]')).toHaveAttribute('aria-current', 'true');
      await expect(page.locator('.section-nav a[aria-current="true"]')).toHaveCount(1);
    });

    test('project cards link to their pages', async ({ page }) => {
      await page.goto(home.path);
      const base = home.lang === 'tr' ? '/projeler/' : '/en/projects/';
      await expect(page.locator(`#projects a[href="${base}kap-fund-analytics/"]`)).toHaveCount(1);
    });

    test('full CV link points to the CV page', async ({ page }) => {
      await page.goto(home.path);
      const cv = home.lang === 'tr' ? '/cv/' : '/en/cv/';
      await expect(page.locator(`#experience a[href="${cv}"]`)).toHaveCount(1);
    });
  });
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`
Expected: FAIL with `#experience` not found.

- [ ] **Step 3: Implement the components**

`src/components/SectionNav.astro`:
```astro
---
import { t, type Lang } from '../i18n/ui';

type SectionId = 'about' | 'experience' | 'projects' | 'writing';

interface Props {
  lang: Lang;
  sections: readonly SectionId[];
}

const { lang, sections } = Astro.props;
---
<nav class="section-nav mono" aria-label={t(lang, 'nav.label')}>
  <ol>
    {sections.map((id, i) => (
      <li>
        <a href={`#${id}`} aria-current={i === 0 ? 'true' : undefined}>
          {String(i + 1).padStart(2, '0')} <span class="marker" aria-hidden="true">▸</span> {t(lang, `nav.${id}`)}
        </a>
      </li>
    ))}
  </ol>
</nav>

<script>
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.section-nav a')];
  const sections = links
    .map((a) => document.getElementById(a.hash.slice(1)))
    .filter((el): el is HTMLElement => el !== null);

  const activeSection = (): HTMLElement | undefined => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) return sections.at(-1);
    const line = window.innerHeight * 0.4;
    return sections.filter((s) => s.getBoundingClientRect().top <= line).at(-1) ?? sections[0];
  };

  const update = (): void => {
    const active = activeSection();
    for (const a of links) {
      if (active && a.hash === `#${active.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  let queued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    },
    { passive: true },
  );
  update();
</script>

<style>
  .section-nav { display: none; }
  @media (min-width: 900px) { .section-nav { display: block; margin-top: 3rem; } }
  ol { list-style: none; margin: 0; padding: 0; font-size: .8125rem; line-height: 2.4; }
  a { color: var(--faint); }
  a[aria-current='true'] { color: var(--text-strong); }
  .marker { display: inline-block; width: 1em; color: var(--accent-text); visibility: hidden; }
  a[aria-current='true'] .marker { visibility: visible; }
</style>
```

`src/components/ExperienceList.astro`:
```astro
---
import type { Experience } from '../data/cv';
import { formatPeriod } from '../lib/format';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  items: readonly Experience[];
}

const { lang, items } = Astro.props;
const [first, ...rest] = items;
---
<ol class="xp">
  {first && (
    <li class:list={['card', { 'is-current': first.end === null }]}>
      <p class="period">{formatPeriod(first.start, first.end, lang)}</p>
      <h3 class="title-strong">{first.role[lang]} · {first.company}</h3>
      <ul class="tags">{first.tags.map((tag) => <li>{tag}</li>)}</ul>
    </li>
  )}
  {rest.map((x) => (
    <li class="xp-row">
      <span class="period">{formatPeriod(x.start, x.end, lang)}</span>
      <span class="title-strong">{x.role[lang]} · {x.company}</span>
    </li>
  ))}
</ol>
<a class="more" href={localizedPath(lang, { name: 'cv' })}>{t(lang, 'cv.full')}</a>

<style>
  .xp { list-style: none; margin: 0; padding: 0; display: grid; gap: .25rem; }
  .xp h3 { margin: .25rem 0 0; font-size: 1rem; }
  .xp-row { display: grid; grid-template-columns: 9.5rem 1fr; gap: 1rem; padding: .6rem 1.125rem; font-size: .9375rem; }
  .xp-row .title-strong { font-weight: 500; }
  @media (max-width: 520px) { .xp-row { grid-template-columns: 1fr; gap: 0; } }
</style>
```

`src/components/ProjectCard.astro`:
```astro
---
import type { Project } from '../lib/content';
import { entrySlug } from '../lib/entries';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  project: Project;
}

const { lang, project } = Astro.props;
const { title, summary, stack, status, year } = project.data;
const href = localizedPath(lang, { name: 'project', slug: entrySlug(project.id) });
---
<article class="card project">
  <div class="thumb mono" aria-hidden="true">{year}</div>
  <div>
    <h3 class="title-strong">
      <a class="stretched" href={href}>{title}</a>
      {status === 'live' && <span class="badge">{t(lang, 'project.live')}</span>}
    </h3>
    <p class="summary">{summary}</p>
    <ul class="tags">{stack.map((s) => <li>{s.toLowerCase()}</li>)}</ul>
  </div>
</article>

<style>
  .project { position: relative; display: grid; grid-template-columns: 5.5rem 1fr; gap: 1rem; }
  .thumb { height: 3.75rem; border: 1px solid var(--border); background: var(--surface); display: grid; place-items: center; font-size: .75rem; color: var(--faint); }
  h3 { margin: 0; font-size: 1rem; }
  .stretched::after { content: ''; position: absolute; inset: 0; }
  .summary { margin: .25rem 0 0; color: var(--muted); font-size: .9375rem; }
  @media (max-width: 520px) { .project { grid-template-columns: 1fr; } .thumb { display: none; } }
</style>
```

`src/components/PostList.astro`:
```astro
---
import type { Post } from '../lib/content';
import { entrySlug } from '../lib/entries';
import { formatDate } from '../lib/format';
import { localizedPath } from '../i18n/routes';
import type { Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  posts: readonly Post[];
}

const { lang, posts } = Astro.props;
---
<ol class="posts">
  {posts.map((post) => (
    <li>
      <time class="period" datetime={post.data.date.toISOString()}>{formatDate(post.data.date)}</time>
      <a class="title-strong" href={localizedPath(lang, { name: 'post', slug: entrySlug(post.id) })}>{post.data.title}</a>
    </li>
  ))}
</ol>

<style>
  .posts { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
  li { display: grid; grid-template-columns: 6.5rem 1fr; gap: 1rem; align-items: baseline; }
  @media (max-width: 520px) { li { grid-template-columns: 1fr; gap: 0; } }
</style>
```

`src/views/HomeView.astro`:
```astro
---
import Split from '../layouts/Split.astro';
import SectionNav from '../components/SectionNav.astro';
import ExperienceList from '../components/ExperienceList.astro';
import ProjectCard from '../components/ProjectCard.astro';
import PostList from '../components/PostList.astro';
import { profile } from '../data/profile';
import { experience } from '../data/cv';
import { getPosts, getProjects } from '../lib/content';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const projects = await getProjects(lang);
const posts = (await getPosts(lang)).slice(0, 3);
const sections =
  posts.length > 0
    ? (['about', 'experience', 'projects', 'writing'] as const)
    : (['about', 'experience', 'projects'] as const);
---
<Split lang={lang} route={{ name: 'home' }} title={profile.name} description={profile.intro[lang]}>
  <SectionNav slot="nav" lang={lang} sections={sections} />

  <section id="about" class="section" aria-labelledby="about-label">
    <h2 id="about-label" class="label">01 / {t(lang, 'nav.about')}</h2>
    {profile.about.map((paragraph) => <p class="about">{paragraph[lang]}</p>)}
  </section>

  <section id="experience" class="section" aria-labelledby="experience-label">
    <h2 id="experience-label" class="label">02 / {t(lang, 'nav.experience')}</h2>
    <ExperienceList lang={lang} items={experience} />
  </section>

  <section id="projects" class="section" aria-labelledby="projects-label">
    <h2 id="projects-label" class="label">03 / {t(lang, 'nav.projects')}</h2>
    <div class="stack">{projects.map((project) => <ProjectCard lang={lang} project={project} />)}</div>
  </section>

  {posts.length > 0 && (
    <section id="writing" class="section" aria-labelledby="writing-label">
      <h2 id="writing-label" class="label">04 / {t(lang, 'nav.writing')}</h2>
      <PostList lang={lang} posts={posts} />
      <a class="more" href={localizedPath(lang, { name: 'writing' })}>{t(lang, 'writing.all')}</a>
    </section>
  )}
</Split>

<style>
  .about { margin: 0 0 1rem; color: var(--muted); max-width: 40rem; }
  .stack { display: grid; gap: .75rem; }
</style>
```

Replace `src/pages/index.astro`:
```astro
---
import HomeView from '../views/HomeView.astro';
---
<HomeView lang="tr" />
```

Replace `src/pages/en/index.astro`:
```astro
---
import HomeView from '../../views/HomeView.astro';
---
<HomeView lang="en" />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS (smoke, layout, home).

- [ ] **Step 5: Commit**

```bash
git add src/views src/components src/pages tests/e2e
git commit -m "feat: build bilingual home page with experience, projects and section nav" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Project case-study pages

**Files:**
- Create: `src/views/ProjectView.astro`, `src/components/FlowDiagram.astro`
- Create: `src/pages/projeler/[slug].astro`, `src/pages/en/projects/[slug].astro`
- Test: `tests/e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `Split`, `Project`, `getProjects`, `entrySlug`, `localizedPath`, `t`
- Produces: routes `/projeler/{slug}/` and `/en/projects/{slug}/`; `<FlowDiagram steps>`

- [ ] **Step 1: Write the failing tests**

`tests/e2e/projects.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { publishedSlugs } from './content-files';

const BASES = { tr: '/projeler/', en: '/en/projects/' } as const;

for (const lang of ['tr', 'en'] as const) {
  for (const slug of publishedSlugs('projects', lang)) {
    test(`project ${lang}/${slug} renders its case study`, async ({ page }) => {
      const res = await page.goto(`${BASES[lang]}${slug}/`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.locator('ol.flow > li').count()).toBeGreaterThanOrEqual(2);
      expect(await page.locator('.prose h2').count()).toBe(3);
      const other = lang === 'tr' ? 'en' : 'tr';
      await expect(page.locator(`.lang a[hreflang="${other}"]`)).toHaveAttribute('href', `${BASES[other]}${slug}/`);
    });
  }
}

test('Nerdi links to the App Store and its privacy policy', async ({ page }) => {
  await page.goto('/en/projects/nerdi/');
  await expect(page.locator('a[href^="https://apps.apple.com/"]')).toHaveCount(1);
  await expect(page.locator('a[href="https://nerdi.pages.dev/privacy.html"]')).toHaveCount(1);
  await expect(page.locator('.badge')).toHaveText('LIVE · APP STORE');
});

test('private projects have no GitHub links', async ({ page }) => {
  for (const slug of ['kap-fund-analytics', 'food-inflation-tracker']) {
    await page.goto(`/projeler/${slug}/`);
    await expect(page.locator('main a[href*="github.com"]')).toHaveCount(0);
  }
});

test('flow diagram stacks vertically on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/projeler/kap-fund-analytics/');
  const first = await page.locator('ol.flow > li').nth(0).boundingBox();
  const second = await page.locator('ol.flow > li').nth(1).boundingBox();
  expect(first && second && second.y > first.y + first.height).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/projects.spec.ts`
Expected: FAIL with a 404 on `/projeler/...`.

- [ ] **Step 3: Implement**

`src/components/FlowDiagram.astro`:
```astro
---
interface Props {
  steps: readonly string[];
}

const { steps } = Astro.props;
---
<ol class="flow mono">
  {steps.map((step) => <li>{step}</li>)}
</ol>

<style>
  .flow { list-style: none; margin: 0 0 3rem; padding: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 1.6rem; font-size: .8125rem; }
  li { position: relative; border: 1px solid var(--border); background: var(--surface); padding: .55rem .9rem; color: var(--text-strong); }
  li:not(:last-child)::after { content: '↓'; position: absolute; left: 1rem; bottom: -1.5rem; color: var(--accent-text); }
  li:last-child { border-color: var(--accent); }
</style>
```

`src/views/ProjectView.astro`:
```astro
---
import { render } from 'astro:content';
import Split from '../layouts/Split.astro';
import FlowDiagram from '../components/FlowDiagram.astro';
import type { Project } from '../lib/content';
import { entrySlug } from '../lib/entries';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  project: Project;
}

interface LinkItem {
  readonly href: string;
  readonly label: string;
}

const { lang, project } = Astro.props;
const { Content } = await render(project);
const { title, summary, stack, status, year, flow, links } = project.data;
const slug = entrySlug(project.id);
const supportLabel = lang === 'tr' ? 'Gizlilik politikası' : 'Privacy policy';
const linkItems: readonly LinkItem[] = [
  ...(links.appStore ? [{ href: links.appStore, label: 'App Store' }] : []),
  ...(links.site ? [{ href: links.site, label: supportLabel }] : []),
  ...(links.repo ? [{ href: links.repo, label: 'GitHub' }] : []),
];
---
<Split lang={lang} route={{ name: 'project', slug }} title={title} description={summary}>
  <article>
    <a class="more back" href={`${localizedPath(lang, { name: 'home' })}#projects`}>{t(lang, 'project.back')}</a>
    <header class="head">
      <p class="period">{year}{status === 'live' && <span class="badge">{t(lang, 'project.live')}</span>}</p>
      <h1 class="page-title">{title}</h1>
      <p class="lead-lg">{summary}</p>
      <ul class="tags">{stack.map((s) => <li>{s.toLowerCase()}</li>)}</ul>
    </header>

    <section aria-labelledby="architecture">
      <h2 id="architecture" class="label">{t(lang, 'project.architecture')}</h2>
      <FlowDiagram steps={flow} />
    </section>

    <div class="prose"><Content /></div>

    {linkItems.length > 0 && (
      <section class="links-block" aria-labelledby="links">
        <h2 id="links" class="label">{t(lang, 'project.links')}</h2>
        <ul class="link-list mono">
          {linkItems.map((link) => <li><a href={link.href} rel="noopener">{link.label} ↗</a></li>)}
        </ul>
      </section>
    )}
  </article>
</Split>

<style>
  .back { margin: 0 0 2rem; }
  .head { margin-bottom: 3rem; }
  .links-block { margin-top: 3rem; }
  .link-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; font-size: .875rem; color: var(--accent-text); }
  .link-list a { display: inline-block; padding: .25rem 0; }
</style>
```

`src/pages/projeler/[slug].astro`:
```astro
---
import ProjectView from '../../views/ProjectView.astro';
import { getProjects, type Project } from '../../lib/content';
import { entrySlug } from '../../lib/entries';

export async function getStaticPaths() {
  const projects = await getProjects('tr');
  return projects.map((project) => ({ params: { slug: entrySlug(project.id) }, props: { project } }));
}

interface Props {
  project: Project;
}

const { project } = Astro.props;
---
<ProjectView lang="tr" project={project} />
```

`src/pages/en/projects/[slug].astro`:
```astro
---
import ProjectView from '../../../views/ProjectView.astro';
import { getProjects, type Project } from '../../../lib/content';
import { entrySlug } from '../../../lib/entries';

export async function getStaticPaths() {
  const projects = await getProjects('en');
  return projects.map((project) => ({ params: { slug: entrySlug(project.id) }, props: { project } }));
}

interface Props {
  project: Project;
}

const { project } = Astro.props;
---
<ProjectView lang="en" project={project} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS (all specs so far).

- [ ] **Step 5: Commit**

```bash
git add src/views/ProjectView.astro src/components/FlowDiagram.astro src/pages tests/e2e/projects.spec.ts
git commit -m "feat: add project case-study pages with flow diagrams" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CV page, print stylesheet and PDF export

**Files:**
- Create: `src/views/CvView.astro`, `src/styles/print.css`, `src/pages/cv.astro`, `src/pages/en/cv.astro`, `scripts/export-cv-pdf.mjs`
- Create (generated): `public/cv/koray-ozcan-cv-tr.pdf`, `public/cv/koray-ozcan-cv-en.pdf`
- Modify: `src/layouts/Base.astro` (import `print.css` after `global.css`)
- Test: `tests/e2e/cv.spec.ts`

**Interfaces:**
- Consumes: `experience`, `education`, `programs`, `skills`, `languages`, `KIND_LABEL`, `formatPeriod`, `profile`, `cvPdfPath`, `t`, `Split`
- Produces: `/cv/`, `/en/cv/`, and PDFs at `cvPdfPath(lang)`

- [ ] **Step 1: Write the failing tests**

`tests/e2e/cv.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/cv/', lang: 'tr' },
  { path: '/en/cv/', lang: 'en' },
] as const;

for (const cv of PAGES) {
  test(`CV ${cv.lang} lists experience and education`, async ({ page }) => {
    const res = await page.goto(cv.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', cv.lang);
    await expect(page.locator('.cv-xp > li')).toHaveCount(6);
    await expect(page.locator('.cv-edu > li')).toHaveCount(2);
    await expect(page.locator('.cv-xp > li').first()).toContainText('Sompo Sigorta');
  });

  test(`CV ${cv.lang} PDF is downloadable`, async ({ request }) => {
    const res = await request.get(`/cv/koray-ozcan-cv-${cv.lang}.pdf`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    expect((await res.body()).subarray(0, 4).toString()).toBe('%PDF');
  });
}

test('print view hides site chrome and shows contact header', async ({ page }) => {
  await page.goto('/en/cv/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.intro')).toBeHidden();
  await expect(page.locator('.cv-actions')).toBeHidden();
  await expect(page.locator('.print-only')).toBeVisible();
  await expect(page.locator('.print-only')).toContainText('korayozcan33@gmail.com');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(255, 255, 255)');
});

test('print button appears only with JavaScript', async ({ page }) => {
  await page.goto('/cv/');
  await expect(page.locator('[data-print]')).toBeVisible();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/cv.spec.ts`
Expected: FAIL with a 404 on `/cv/`.

- [ ] **Step 3: Implement the page and print CSS**

`src/styles/print.css`:
```css
.print-only { display: none; }

@media print {
  :root,
  :root:not([data-theme='light']),
  :root[data-theme='dark'] {
    --bg: #ffffff;
    --surface: #ffffff;
    --border: #cccccc;
    --text: #111111;
    --text-strong: #000000;
    --muted: #333333;
    --faint: #555555;
    --accent: #000000;
    --accent-text: #000000;
    --accent-ink: #ffffff;
    color-scheme: light;
  }
  @page { size: A4; }
  body { font-size: 10.5pt; line-height: 1.45; }
  .intro, .skip-link, .cv-actions, [data-print], .back { display: none !important; }
  .split { display: block; max-width: none; padding: 0; }
  .content { padding: 0; }
  .print-only { display: block; }
  .cv-xp > li, .cv-edu > li { break-inside: avoid; }
}
```

Modify `src/layouts/Base.astro`: add this line after `import '../styles/global.css';`:
```ts
import '../styles/print.css';
```

`src/views/CvView.astro`:
```astro
---
import Split from '../layouts/Split.astro';
import { education, experience, KIND_LABEL, languages, programs, skills } from '../data/cv';
import { profile } from '../data/profile';
import { formatPeriod } from '../lib/format';
import { cvPdfPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
---
<Split lang={lang} route={{ name: 'cv' }} title={t(lang, 'cv.title')} description={t(lang, 'cv.description')}>
  <div class="cv">
    <header class="cv-head">
      <div class="print-only">
        <p class="print-name">{profile.name} — {t(lang, 'role')}</p>
        <p class="mono">{profile.email} · korayozcan.me · linkedin.com/in/korayözcan</p>
      </div>
      <h1 class="page-title">{t(lang, 'cv.title')}</h1>
      <div class="cv-actions mono">
        <a href={cvPdfPath(lang)} download>{t(lang, 'cv.download')}</a>
        <button type="button" data-print hidden>{t(lang, 'cv.print')}</button>
      </div>
    </header>

    <section class="block" aria-labelledby="cv-xp">
      <h2 id="cv-xp" class="label">{t(lang, 'cv.experience')}</h2>
      <ol class="cv-xp">
        {experience.map((x) => (
          <li>
            <div class="row-head">
              <h3 class="title-strong">{x.role[lang]} · {x.company}</h3>
              <span class="period">{formatPeriod(x.start, x.end, lang)}</span>
            </div>
            <p class="kind mono">{KIND_LABEL[x.kind][lang]}</p>
            {x.bullets.length > 0 && <ul class="bullets">{x.bullets.map((b) => <li>{b[lang]}</li>)}</ul>}
          </li>
        ))}
      </ol>
    </section>

    <section class="block" aria-labelledby="cv-edu">
      <h2 id="cv-edu" class="label">{t(lang, 'cv.education')}</h2>
      <ol class="cv-edu">
        {education.map((e) => (
          <li>
            <div class="row-head">
              <h3 class="title-strong">{e.degree[lang]}</h3>
              <span class="period">{e.start} → {e.end}</span>
            </div>
            <p class="kind mono">{e.school[lang]} · GPA {e.gpa}</p>
          </li>
        ))}
      </ol>
    </section>

    <section class="block" aria-labelledby="cv-programs">
      <h2 id="cv-programs" class="label">{t(lang, 'cv.programs')}</h2>
      <ul class="plain">{programs.map((p) => <li>{p[lang]}</li>)}</ul>
    </section>

    <section class="block" aria-labelledby="cv-skills">
      <h2 id="cv-skills" class="label">{t(lang, 'cv.skills')}</h2>
      <ul class="tags">{skills.map((s) => <li>{s.toLowerCase()}</li>)}</ul>
    </section>

    <section class="block" aria-labelledby="cv-langs">
      <h2 id="cv-langs" class="label">{t(lang, 'cv.languages')}</h2>
      <ul class="plain">{languages.map((l) => <li>{l.name[lang]} — {l.level[lang]}</li>)}</ul>
    </section>
  </div>
</Split>

<script>
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-print]')) {
    button.hidden = false;
    button.addEventListener('click', () => window.print());
  }
</script>

<style>
  .cv-head { margin-bottom: 3rem; }
  .print-name { font-size: 1.25rem; font-weight: 800; color: var(--text-strong); margin: 0; }
  .cv-actions { display: flex; gap: 1.25rem; align-items: center; font-size: .8125rem; color: var(--accent-text); }
  .cv-actions button { background: none; border: 1px solid var(--border); color: var(--muted); font: inherit; padding: .2rem .6rem; cursor: pointer; }
  .block { margin-bottom: 2.75rem; }
  .cv-xp, .cv-edu { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.5rem; }
  .row-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .25rem 1rem; align-items: baseline; }
  h3 { margin: 0; font-size: 1rem; }
  .kind { margin: .15rem 0 0; font-size: .75rem; color: var(--muted); }
  .bullets { margin: .5rem 0 0; padding-left: 1.1rem; color: var(--text); font-size: .9375rem; }
  .bullets li { margin-bottom: .25rem; }
  .plain { margin: 0; padding-left: 1.1rem; }
</style>
```

`src/pages/cv.astro`:
```astro
---
import CvView from '../views/CvView.astro';
---
<CvView lang="tr" />
```

`src/pages/en/cv.astro`:
```astro
---
import CvView from '../../views/CvView.astro';
---
<CvView lang="en" />
```

- [ ] **Step 4: Write the PDF export script**

`scripts/export-cv-pdf.mjs`:
```js
import { preview } from 'astro';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const PORT = 4322;
const TARGETS = [
  { lang: 'tr', path: '/cv/' },
  { lang: 'en', path: '/en/cv/' },
];

await mkdir('public/cv', { recursive: true });
const server = await preview({ root: '.', server: { port: PORT } });
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  for (const { lang, path } of TARGETS) {
    const res = await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
    if (!res?.ok()) throw new Error(`${path} returned ${res?.status()}`);
    await page.emulateMedia({ media: 'print' });
    const out = `public/cv/koray-ozcan-cv-${lang}.pdf`;
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: false,
      margin: { top: '14mm', bottom: '14mm', left: '16mm', right: '16mm' },
    });
    process.stdout.write(`wrote ${out}\n`);
  }
} finally {
  await browser.close();
  await server.stop();
}
```

- [ ] **Step 5: Generate the PDFs and run the tests**

Run: `npm run cv:pdf`
Expected: prints `wrote public/cv/koray-ozcan-cv-tr.pdf` and `wrote public/cv/koray-ozcan-cv-en.pdf`.

Open both PDFs and check by eye: each fits on 1–2 A4 pages, contains no phone number or address, and the Turkish characters render.

Run: `npm run test:e2e`
Expected: PASS (all specs).

- [ ] **Step 6: Commit**

```bash
git add src/views/CvView.astro src/styles/print.css src/layouts/Base.astro src/pages/cv.astro src/pages/en/cv.astro scripts public/cv tests/e2e/cv.spec.ts
git commit -m "feat: add web CV with print stylesheet and generated PDFs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Writing section and RSS

**Files:**
- Create: `src/views/WritingIndexView.astro`, `src/views/PostView.astro`, `src/lib/rss.ts`
- Create: `src/pages/yazilar/index.astro`, `src/pages/yazilar/[slug].astro`, `src/pages/en/writing/index.astro`, `src/pages/en/writing/[slug].astro`, `src/pages/rss.xml.ts`, `src/pages/en/rss.xml.ts`
- Test: `tests/e2e/writing.spec.ts`

**Interfaces:**
- Consumes: `getPosts`, `Post`, `PostList`, `entrySlug`, `formatDate`, `localizedPath`, `t`, `profile`
- Produces: `/yazilar/`, `/en/writing/`, post pages, `/rss.xml`, `/en/rss.xml`; `feed(lang: Lang, site: URL | undefined): Promise<Response>`

- [ ] **Step 1: Write the failing tests**

`tests/e2e/writing.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { publishedSlugs } from './content-files';

const INDEXES = [
  { path: '/yazilar/', lang: 'tr', base: '/yazilar/', rss: '/rss.xml' },
  { path: '/en/writing/', lang: 'en', base: '/en/writing/', rss: '/en/rss.xml' },
] as const;

for (const w of INDEXES) {
  test(`writing index ${w.lang} lists posts or shows the empty state`, async ({ page }) => {
    const res = await page.goto(w.path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const slugs = publishedSlugs('blog', w.lang);
    if (slugs.length === 0) await expect(page.locator('.empty')).toBeVisible();
    else await expect(page.locator('.posts > li')).toHaveCount(slugs.length);
  });

  test(`rss ${w.lang} is valid XML with one item per post`, async ({ request }) => {
    const res = await request.get(w.rss);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const body = await res.text();
    expect(body).toContain('<rss');
    expect(body.match(/<item>/g)?.length ?? 0).toBe(publishedSlugs('blog', w.lang).length);
  });

  for (const slug of publishedSlugs('blog', w.lang)) {
    test(`post ${w.lang}/${slug} renders`, async ({ page }) => {
      const res = await page.goto(`${w.base}${slug}/`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('article time')).toHaveCount(1);
    });
  }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/writing.spec.ts`
Expected: FAIL with a 404 on `/yazilar/` and `/rss.xml`.

- [ ] **Step 3: Implement**

`src/lib/rss.ts`:
```ts
import rss from '@astrojs/rss';
import { getPosts } from './content';
import { entrySlug } from './entries';
import { profile } from '../data/profile';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

export async function feed(lang: Lang, site: URL | undefined): Promise<Response> {
  const posts = await getPosts(lang);
  return rss({
    title: `${profile.name} — ${t(lang, 'writing.title')}`,
    description: t(lang, 'writing.description'),
    site: site ?? profile.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: localizedPath(lang, { name: 'post', slug: entrySlug(post.id) }),
    })),
    customData: `<language>${lang}</language>`,
  });
}
```

`src/pages/rss.xml.ts`:
```ts
import type { APIRoute } from 'astro';
import { feed } from '../lib/rss';

export const GET: APIRoute = ({ site }) => feed('tr', site);
```

`src/pages/en/rss.xml.ts`:
```ts
import type { APIRoute } from 'astro';
import { feed } from '../../lib/rss';

export const GET: APIRoute = ({ site }) => feed('en', site);
```

`src/views/WritingIndexView.astro`:
```astro
---
import Split from '../layouts/Split.astro';
import PostList from '../components/PostList.astro';
import { getPosts } from '../lib/content';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const posts = await getPosts(lang);
---
<Split lang={lang} route={{ name: 'writing' }} title={t(lang, 'writing.title')} description={t(lang, 'writing.description')}>
  <h1 class="page-title">{t(lang, 'writing.title')}</h1>
  <p class="lead-lg intro-text">{t(lang, 'writing.description')}</p>
  {posts.length > 0 ? <PostList lang={lang} posts={posts} /> : <p class="empty mono">{t(lang, 'writing.empty')}</p>}
</Split>

<style>
  .intro-text { margin-bottom: 2.5rem; }
  .empty { color: var(--faint); font-size: .875rem; }
</style>
```

`src/views/PostView.astro`:
```astro
---
import { render } from 'astro:content';
import Split from '../layouts/Split.astro';
import type { Post } from '../lib/content';
import { entrySlug } from '../lib/entries';
import { formatDate } from '../lib/format';
import { localizedPath } from '../i18n/routes';
import { t, type Lang } from '../i18n/ui';

interface Props {
  lang: Lang;
  post: Post;
}

const { lang, post } = Astro.props;
const { Content } = await render(post);
const slug = entrySlug(post.id);
---
<Split lang={lang} route={{ name: 'post', slug }} title={post.data.title} description={post.data.description}>
  <article>
    <a class="more back" href={localizedPath(lang, { name: 'writing' })}>{t(lang, 'writing.back')}</a>
    <header class="head">
      <time class="period" datetime={post.data.date.toISOString()}>{formatDate(post.data.date)}</time>
      <h1 class="page-title">{post.data.title}</h1>
    </header>
    <div class="prose"><Content /></div>
  </article>
</Split>

<style>
  .back { margin: 0 0 2rem; }
  .head { margin-bottom: 2rem; }
</style>
```

`src/pages/yazilar/index.astro`:
```astro
---
import WritingIndexView from '../../views/WritingIndexView.astro';
---
<WritingIndexView lang="tr" />
```

`src/pages/en/writing/index.astro`:
```astro
---
import WritingIndexView from '../../../views/WritingIndexView.astro';
---
<WritingIndexView lang="en" />
```

`src/pages/yazilar/[slug].astro`:
```astro
---
import PostView from '../../views/PostView.astro';
import { getPosts, type Post } from '../../lib/content';
import { entrySlug } from '../../lib/entries';

export async function getStaticPaths() {
  const posts = await getPosts('tr');
  return posts.map((post) => ({ params: { slug: entrySlug(post.id) }, props: { post } }));
}

interface Props {
  post: Post;
}

const { post } = Astro.props;
---
<PostView lang="tr" post={post} />
```

`src/pages/en/writing/[slug].astro`:
```astro
---
import PostView from '../../../views/PostView.astro';
import { getPosts, type Post } from '../../../lib/content';
import { entrySlug } from '../../../lib/entries';

export async function getStaticPaths() {
  const posts = await getPosts('en');
  return posts.map((post) => ({ params: { slug: entrySlug(post.id) }, props: { post } }));
}

interface Props {
  post: Post;
}

const { post } = Astro.props;
---
<PostView lang="en" post={post} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS (all specs).

- [ ] **Step 5: Commit**

```bash
git add src/views src/lib/rss.ts src/pages tests/e2e/writing.spec.ts
git commit -m "feat: add writing index, post pages and RSS feeds" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: OG images, JSON-LD and 404

**Files:**
- Create: `src/lib/og.ts`, `src/lib/og-entries.ts`, `src/lib/jsonld.ts`, `src/pages/og/[lang]/[key].png.ts`, `src/pages/404.astro`
- Modify: `src/views/HomeView.astro` (add the JSON-LD script)
- Test: `tests/unit/og.test.ts`, `tests/unit/jsonld.test.ts`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `profile`, `getProjects`, `getPosts`, `entrySlug`, `routeKey`, `t`, `LANGS`
- Produces:
  - `interface OgInput { title: string; subtitle: string; kicker: string }`
  - `buildOgSvg(input): Promise<string>`, `renderOg(input): Promise<Uint8Array>` (1200×630 PNG)
  - `ogEntries(): Promise<readonly OgEntry[]>` with `OgEntry = OgInput & { lang: Lang; key: string }`
  - `personJsonLd(lang): string` (`<` escaped)
  - `/og/{lang}/{routeKey}.png`, `/404.html`

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/og.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildOgSvg, renderOg } from '../../src/lib/og';

const input = { kicker: 'korayozcan.me', title: 'Gıda Enflasyonu Takibi', subtitle: 'İstanbul · ğüşıöç' };

describe('og images', () => {
  it('renders a 1200x630 PNG', async () => {
    const png = await renderOg(input);
    expect(Buffer.from(png.subarray(1, 4)).toString()).toBe('PNG');
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  }, 20_000);

  it('renders Turkish glyphs with real outlines', async () => {
    const turkish = await buildOgSvg({ ...input, title: 'ığşİ', subtitle: 'x' });
    const missing = await buildOgSvg({ ...input, title: '\u{F0000}\u{F0001}\u{F0002}\u{F0003}', subtitle: 'x' });
    expect(turkish).not.toEqual(missing);
  }, 20_000);
});
```

`tests/unit/jsonld.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { personJsonLd } from '../../src/lib/jsonld';

describe('personJsonLd', () => {
  it('describes the person with profile links and no address', () => {
    const data: Record<string, unknown> = JSON.parse(personJsonLd('en'));
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Koray Özcan');
    expect(data.jobTitle).toBe('Computer Engineer');
    expect(data.sameAs).toEqual(['https://github.com/ozcankoray', 'https://www.linkedin.com/in/koray%C3%B6zcan/']);
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('telephone');
  });

  it('cannot break out of a script tag', () => {
    expect(personJsonLd('tr')).not.toContain('<');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/og.test.ts tests/unit/jsonld.test.ts`
Expected: FAIL with unresolved imports.

- [ ] **Step 3: Implement the libraries**

`src/lib/og.ts`:
```ts
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface OgInput {
  readonly title: string;
  readonly subtitle: string;
  readonly kicker: string;
}

type SatoriFont = Parameters<typeof satori>[1]['fonts'][number];

interface OgNode {
  readonly type: 'div';
  readonly props: {
    readonly style: Readonly<Record<string, string | number>>;
    readonly children?: string | OgNode | readonly OgNode[];
  };
}

const font = (pkg: string, file: string): Buffer =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

const loadFonts = (): readonly SatoriFont[] => [
  { name: 'Inter', data: font('inter', 'inter-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Inter Ext', data: font('inter', 'inter-latin-ext-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Inter', data: font('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Inter Ext', data: font('inter', 'inter-latin-ext-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Mono', data: font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Mono Ext', data: font('jetbrains-mono', 'jetbrains-mono-latin-ext-400-normal.woff'), weight: 400, style: 'normal' },
];

const fonts = ((): (() => readonly SatoriFont[]) => {
  let cache: readonly SatoriFont[] | undefined;
  return () => (cache ??= loadFonts());
})();

const div = (style: OgNode['props']['style'], children?: OgNode['props']['children']): OgNode => ({
  type: 'div',
  props: { style, children },
});

function tree({ title, subtitle, kicker }: OgInput): OgNode {
  return div(
    { width: '100%', height: '100%', display: 'flex', background: '#0e0f0f', fontFamily: 'Inter, "Inter Ext"' },
    [
      div({ width: 12, height: '100%', background: '#c6f432' }),
      div({ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', flex: 1 }, [
        div({ fontFamily: 'Mono, "Mono Ext"', fontSize: 28, color: '#c6f432' }, kicker),
        div({ display: 'flex', flexDirection: 'column' }, [
          div({ fontSize: 76, fontWeight: 800, color: '#f2f4f2', letterSpacing: -2, lineHeight: 1.05 }, title),
          div({ marginTop: 24, fontSize: 32, fontWeight: 400, color: '#8a8f8a', lineHeight: 1.35 }, subtitle),
        ]),
        div({ fontFamily: 'Mono, "Mono Ext"', fontSize: 24, color: '#7a7f7a' }, 'Koray Özcan · computer_engineer'),
      ]),
    ],
  );
}

export async function buildOgSvg(input: OgInput): Promise<string> {
  // satori accepts plain {type, props} objects; its signature is typed for React elements.
  const element = tree(input) as unknown as Parameters<typeof satori>[0];
  return satori(element, { width: 1200, height: 630, fonts: [...fonts()] });
}

export async function renderOg(input: OgInput): Promise<Uint8Array> {
  const svg = await buildOgSvg(input);
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
```

`src/lib/og-entries.ts`:
```ts
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
```

`src/lib/jsonld.ts`:
```ts
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
```

`src/pages/og/[lang]/[key].png.ts`:
```ts
import type { APIRoute } from 'astro';
import { ogEntries, type OgEntry } from '../../../lib/og-entries';
import { renderOg } from '../../../lib/og';

export async function getStaticPaths() {
  const entries = await ogEntries();
  return entries.map((entry) => ({ params: { lang: entry.lang, key: entry.key }, props: { entry } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { readonly entry: OgEntry };
  return new Response(await renderOg(entry), { headers: { 'Content-Type': 'image/png' } });
};
```

`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base lang="tr" route={null} title="404" description="Sayfa bulunamadı / Page not found">
  <main id="main" class="not-found">
    <p class="label">404</p>
    <h1 class="page-title">Sayfa bulunamadı</h1>
    <p class="lead-lg" lang="en">Page not found.</p>
    <p class="mono links"><a href="/">← ana sayfa</a> · <a href="/en/" lang="en">← home</a></p>
  </main>
</Base>

<style>
  .not-found { max-width: 40rem; margin: 0 auto; padding: 8rem 1.25rem; }
  .links { margin-top: 2rem; font-size: .875rem; color: var(--accent-text); }
</style>
```

Modify `src/views/HomeView.astro`. Add the import:
```ts
import { personJsonLd } from '../lib/jsonld';
```
Then add this as the first child inside `<Split ...>`, before `<SectionNav ...>`:
```astro
  <script type="application/ld+json" set:html={personJsonLd(lang)} />
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `npx vitest run`
Expected: PASS (all unit tests, including og and jsonld).

- [ ] **Step 5: Write the e2e SEO tests**

`tests/e2e/seo.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('og images exist for home and a project', async ({ page, request }) => {
  for (const path of ['/', '/en/projects/nerdi/']) {
    await page.goto(path);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBeTruthy();
    const res = await request.get(new URL(og ?? '').pathname);
    expect(res.status(), og ?? '').toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test('home includes Person JSON-LD', async ({ page }) => {
  await page.goto('/en/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(raw ?? '{}')['@type']).toBe('Person');
});

test('sitemap lists both languages', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('https://korayozcan.me/en/projects/nerdi/');
  expect(sitemap).toContain('https://korayozcan.me/projeler/nerdi/');
  expect(sitemap).not.toContain('/404');
});

test('unknown pages return the bilingual 404', async ({ page }) => {
  const res = await page.goto('/olmayan-sayfa/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sayfa bulunamadı');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('robots.txt points to the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('Sitemap: https://korayozcan.me/sitemap-index.xml');
});
```

- [ ] **Step 6: Run e2e tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS (all specs). Open `dist/og/tr/project-food-inflation-tracker.png` and check it by eye: Turkish characters render correctly.

- [ ] **Step 7: Commit**

```bash
git add src/lib/og.ts src/lib/og-entries.ts src/lib/jsonld.ts src/pages/og src/pages/404.astro src/views/HomeView.astro tests/unit/og.test.ts tests/unit/jsonld.test.ts tests/e2e/seo.spec.ts
git commit -m "feat: add generated OG images, Person JSON-LD and bilingual 404" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Site-wide quality gates (links, accessibility, mobile, privacy)

**Files:**
- Create: `tests/e2e/routes.ts`, `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: `publishedSlugs` (Task 6)
- Produces: `ROUTES: readonly { path: string; lang: 'tr' | 'en' }[]` covering every HTML page

- [ ] **Step 1: Write the route list and the tests**

`tests/e2e/routes.ts`:
```ts
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
```

`tests/e2e/site.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES } from './routes';

const SITE = 'https://korayozcan.me';

const toInternalPath = (href: string): string | null => {
  if (href.startsWith('mailto:') || href.startsWith('#')) return null;
  if (href.startsWith('/')) return href.split('#')[0] ?? null;
  if (href.startsWith(`${SITE}/`)) return new URL(href).pathname;
  return null;
};

test('every page sets the right lang and has exactly one h1', async ({ page }) => {
  for (const route of ROUTES) {
    const res = await page.goto(route.path);
    expect(res?.status(), route.path).toBe(200);
    await expect(page.locator('html'), route.path).toHaveAttribute('lang', route.lang);
    await expect(page.locator('h1'), route.path).toHaveCount(1);
  }
});

test('every internal link, alternate and og image resolves', async ({ context, request }) => {
  const perPage = await Promise.all(
    ROUTES.map(async (route) => {
      const page = await context.newPage();
      await page.goto(route.path);
      const hrefs = await page.$$eval('a[href], link[rel="alternate"][href]', (els) =>
        els.map((el) => el.getAttribute('href') ?? ''),
      );
      const og = (await page.locator('meta[property="og:image"]').getAttribute('content')) ?? '';
      await page.close();
      return [...hrefs, og];
    }),
  );
  const paths = [...new Set(perPage.flat().map(toInternalPath).filter((p): p is string => p !== null && p !== ''))];
  expect(paths.length).toBeGreaterThan(20);
  for (const path of paths) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});

test('no horizontal scroll at 360px on any page', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const route of ROUTES) {
    await page.goto(route.path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, route.path).toBeLessThanOrEqual(360);
  }
});

for (const scheme of ['dark', 'light'] as const) {
  for (const path of ['/', '/en/', '/cv/', '/en/projects/nerdi/', '/yazilar/']) {
    test(`axe: no WCAG AA violations on ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
}

const walk = (dir: string): readonly string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
      )
    : [];

test('built site contains no private contact data', () => {
  const files = walk('dist').filter((f) => /\.(html|xml|txt|json)$/.test(f));
  expect(files.length).toBeGreaterThan(10);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    expect(/0000000000|506\s*102\s*77\s*57|REDACTED/i.test(text), file).toBe(false);
  }
});
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:e2e -- tests/e2e/site.spec.ts`
Expected: PASS. If axe reports `color-contrast`, fix the token in `src/styles/tokens.css`, keeping the hue and only adjusting lightness, then rerun. If a page overflows at 360px, fix the CSS of the offending element (usually a long unbroken string: add `overflow-wrap: anywhere` to that element). The test must pass without being weakened.

- [ ] **Step 3: Run the full suite**

Run: `npx vitest run && npm run test:e2e`
Expected: PASS (everything).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/routes.ts tests/e2e/site.spec.ts src/styles
git commit -m "test: add site-wide link, accessibility, mobile and privacy gates" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Deploy to GitHub Pages via Actions

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the `test`, `test:e2e` and `build` npm scripts; `public/CNAME`

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Local pre-flight**

Run: `npx vitest run && npm run test:e2e`
Expected: PASS.

Run a Lighthouse audit with the `web-perf` skill against `npm run preview` for `/`, `/en/projects/nerdi/`, `/cv/` and one post (if any). Expected: ≥ 95 in all four categories. Fix and recommit if not.

Then run `/review` on the full branch, as CLAUDE.md requires.

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build, test and deploy to GitHub Pages" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Inspect the existing Pages repo**

Run: `gh api "repos/ozcankoray/ozcankoray.github.io/git/trees/main?recursive=1" --jq '.tree[].path'`
Expected: `CNAME` (and possibly `README.md`). If anything else is there, stop and show Koray the list before continuing.

- [ ] **Step 5: Connect the local repo to the remote (no push yet)**

```bash
git remote add origin https://github.com/ozcankoray/ozcankoray.github.io.git
git fetch origin
git merge origin/main --allow-unrelated-histories -m "chore: merge existing pages repository" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git rm CNAME
git commit -m "chore: remove legacy root CNAME (now served from public/CNAME)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
If `git rm CNAME` fails because there is no root CNAME after the merge, skip that command and the commit.

- [ ] **Step 6: ⛔ Ask Koray for approval**, then switch Pages to the Actions build

Message to Koray: "Ready to switch Pages for `ozcankoray.github.io` from legacy to GitHub Actions and push `main`. The site may 404 for 1–2 minutes until the first deploy finishes. Proceed?"

Only after a clear yes:
```bash
gh api -X PUT repos/ozcankoray/ozcankoray.github.io/pages -f build_type=workflow -f cname=korayozcan.me
git push -u origin main
```

- [ ] **Step 7: Watch the deploy**

Run: `gh run watch --exit-status $(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: the `build` and `deploy` jobs succeed. If it fails, use systematic debugging on the failing step's log (`gh run view --log-failed`).

- [ ] **Step 8: Enforce HTTPS**

Run: `gh api repos/ozcankoray/ozcankoray.github.io/pages --jq '.https_certificate.state'`
Expected: `approved`. If it's not approved yet, recheck later; GitHub can take up to about an hour to issue the certificate.

Once approved:
```bash
gh api -X PUT repos/ozcankoray/ozcankoray.github.io/pages -F https_enforced=true
```

- [ ] **Step 9: Verify production**

```bash
for p in / /en/ /cv/ /en/projects/nerdi/ /cv/koray-ozcan-cv-tr.pdf /og/tr/home.png; do
  printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://korayozcan.me$p"
done
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://korayozcan.me/
```
Expected: every path returns `200`. The plain-HTTP request returns `301` to `https://korayozcan.me/`.

---

### Task 13: GitHub profile

**Files:**
- Create: `github/profile/README.md`
- Modify: `tests/e2e/site.spec.ts` (add a README link check)

**Interfaces:**
- Consumes: deployed site routes (Task 12)

- [ ] **Step 1: Write the failing link-check test**

Append to `tests/e2e/site.spec.ts`:
```ts
test('profile README links point to real pages', async ({ request }) => {
  const readme = readFileSync(join('github', 'profile', 'README.md'), 'utf8');
  const paths = [...readme.matchAll(/https:\/\/korayozcan\.me(\/[^\s)]*)/g)].map((m) => m[1] ?? '/');
  expect(paths.length).toBeGreaterThan(3);
  for (const path of paths) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});
```

Run: `npm run test:e2e -- tests/e2e/site.spec.ts -g "profile README"`
Expected: FAIL with ENOENT for `github/profile/README.md`.

- [ ] **Step 2: Write the README**

`github/profile/README.md`:
```md
### Koray Özcan

Computer engineer in Istanbul — test automation & QA at Sompo Sigorta. I build things around data, finance and iOS.

**Selected work**

- [KAP Fund Analytics](https://korayozcan.me/en/projects/kap-fund-analytics/) — fund reports published as PDFs → structured time series · FastAPI, SvelteKit, TimescaleDB
- [Nerdi](https://korayozcan.me/en/projects/nerdi/) — iPhone app: a few real research papers a day · [App Store](https://apps.apple.com/us/app/nerdi-research-papers/id6813826387)
- [Food Inflation Tracker](https://korayozcan.me/en/projects/food-inflation-tracker/) — food inflation from regularly collected supermarket prices

[korayozcan.me](https://korayozcan.me/) · [LinkedIn](https://www.linkedin.com/in/koray%C3%B6zcan/) · [CV (PDF)](https://korayozcan.me/cv/koray-ozcan-cv-en.pdf)
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run && npm run test:e2e -- tests/e2e/site.spec.ts`
Expected: PASS. The privacy unit test now also scans `github/`.

- [ ] **Step 4: Commit**

```bash
git add github/profile/README.md tests/e2e/site.spec.ts
git commit -m "docs: add GitHub profile README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: ⛔ Ask Koray for approval**, then publish the profile repo, push the site repo, and update the profile

Message to Koray: "Ready to (1) push the README commit to `ozcankoray.github.io`; (2) create the public repo `ozcankoray/ozcankoray` with this README; (3) set your GitHub bio to 'Computer engineer · test automation & QA at Sompo Sigorta · data, finance & iOS', website `https://korayozcan.me` and location Istanbul; (4) update the description and topics of `ozcankoray.github.io`. Proceed with all four, or which ones?"

For (3), the token needs the `user` scope. Ask Koray to run: `! gh auth refresh -h github.com -s user`

After approval, run only the approved parts:
```bash
git push origin main

TMP="$(mktemp -d)"
cp github/profile/README.md "$TMP/README.md"
git -C "$TMP" init -q -b main
git -C "$TMP" add README.md
git -C "$TMP" commit -q -m "docs: add profile README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
gh repo create ozcankoray/ozcankoray --public --description "Profile README" --source "$TMP" --push

gh api -X PATCH /user -f bio="Computer engineer · test automation & QA at Sompo Sigorta · data, finance & iOS" -f blog="https://korayozcan.me" -f location="Istanbul"

gh repo edit ozcankoray/ozcankoray.github.io --description "Source of korayozcan.me — bilingual personal site built with Astro" --homepage "https://korayozcan.me" --add-topic astro --add-topic portfolio --add-topic personal-website
```

- [ ] **Step 6: Verify**

```bash
gh api user --jq '{bio,blog,location}'
gh api repos/ozcankoray/ozcankoray --jq '{visibility,html_url}'
```
Expected: the new values, and `"visibility":"public"`.

- [ ] **Step 7: Pins (manual: GitHub has no API for pinning)**

Tell Koray: open https://github.com/ozcankoray → "Customize your pins" → pin `ozcankoray.github.io`, `KorayOzcan_testAutomation`, plus any other public repo he wants to show (`marketfiyatlistesi`, `tuikverisiotomasyon`).

---

## Content review checkpoint (before Task 12 Step 6)

Before the first public deploy, show Koray the TR and EN home, all three project pages and the CV at `npm run preview`. Ask him to confirm three things:
1. **About text:** it assumes he has graduated (2026).
2. **Project claims:** KAP "validated and audited runs", Food Inflation "basket, weights, base period", Nerdi feature list and stack (`iOS, OpenAlex, In-app subscriptions`).
3. **TR translations of the LinkedIn bullets.**

Apply any corrections as `fix:` commits with passing tests before deploying.

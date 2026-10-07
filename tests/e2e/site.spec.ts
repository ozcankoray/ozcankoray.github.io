import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES } from './routes';
import { containsHashed, SECRETS } from '../forbidden';

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
    expect(containsHashed(readFileSync(file, 'utf8'), SECRETS), file).toBe(false);
  }
});

test('pages have no render-blocking external stylesheets', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route.path);
    await expect(page.locator('link[rel="stylesheet"]'), route.path).toHaveCount(0);
  }
});

test('profile README links point to real pages', async ({ request }) => {
  const readme = readFileSync(join('github', 'profile', 'README.md'), 'utf8');
  const paths = [...readme.matchAll(/https:\/\/korayozcan\.me(\/[^\s)]*)/g)].map((m) => m[1] ?? '/');
  expect(paths.length).toBeGreaterThan(3);
  for (const path of paths) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});

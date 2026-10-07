import { test, expect } from '@playwright/test';
import { publishedSlugs } from './content-files';

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

test('writing shows up in the sitemap and head only when it has posts', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const w of [
    { lang: 'tr', index: '/yazilar/', home: '/' },
    { lang: 'en', index: '/en/writing/', home: '/en/' },
  ] as const) {
    const hasPosts = publishedSlugs('blog', w.lang).length > 0;
    expect(sitemap.includes(`https://korayozcan.me${w.index}`), w.index).toBe(hasPosts);
    await page.goto(w.home);
    await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(hasPosts ? 1 : 0);
  }
});

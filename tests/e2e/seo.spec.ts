import { test, expect, type Page } from '@playwright/test';
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

const jsonLd = async (page: Page): Promise<Record<string, unknown>> => {
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  return JSON.parse(raw ?? '{}');
};

test('home includes Person, WebSite and ProfilePage JSON-LD', async ({ page }) => {
  await page.goto('/en/');
  const data = await jsonLd(page);
  const types = (data['@graph'] as ReadonlyArray<{ '@type': string }>).map((n) => n['@type']);
  expect(types).toEqual(['Person', 'WebSite', 'ProfilePage']);
});

test('project pages describe themselves in JSON-LD', async ({ page }) => {
  await page.goto('/en/projects/nerdi/');
  expect(await jsonLd(page)).toMatchObject({ '@type': 'MobileApplication', operatingSystem: 'iOS' });
  await page.goto('/projeler/kap-fund-analytics/');
  expect(await jsonLd(page)).toMatchObject({ '@type': 'CreativeWork', inLanguage: 'tr' });
});

test('home titles say what the person does', async ({ page }) => {
  const titles = [
    { path: '/', title: 'Koray Özcan — Test Otomasyonu ve Kalite Mühendisi' },
    { path: '/en/', title: 'Koray Özcan — Test Automation & QA Engineer' },
  ];
  for (const { path, title } of titles) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
  }
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

test('llms.txt and llms-full.txt are plain text and every link in llms.txt resolves', async ({ request }) => {
  const full = await request.get('/llms-full.txt');
  expect(full.status()).toBe(200);
  expect(full.headers()['content-type']).toContain('text/plain');
  expect(await full.text()).toContain('Nerdi');

  const index = await request.get('/llms.txt');
  expect(index.status()).toBe(200);
  expect(index.headers()['content-type']).toContain('text/plain');
  const text = await index.text();
  expect(text.startsWith('# Koray Özcan')).toBe(true);
  const urls = [...text.matchAll(/\]\((https:\/\/korayozcan\.me[^)]*)\)/g)].map((m) => m[1] ?? '');
  expect(urls.length).toBeGreaterThan(10);
  for (const url of urls) expect((await request.get(new URL(url).pathname)).status(), url).toBe(200);
});

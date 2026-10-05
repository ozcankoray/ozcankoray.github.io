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

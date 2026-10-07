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

test('projects without public links say their source is private', async ({ page }) => {
  const cases = [
    { path: '/projeler/kap-fund-analytics/', note: 'Kaynak kod özel.' },
    { path: '/en/projects/food-inflation-tracker/', note: 'Source code is private.' },
  ];
  for (const { path, note } of cases) {
    await page.goto(path);
    await expect(page.getByText(note)).toHaveCount(1);
  }
  await page.goto('/en/projects/nerdi/');
  await expect(page.getByText('Source code is private.')).toHaveCount(0);
});

test('flow diagram stacks vertically on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/projeler/kap-fund-analytics/');
  const first = await page.locator('ol.flow > li').nth(0).boundingBox();
  const second = await page.locator('ol.flow > li').nth(1).boundingBox();
  expect(first && second && second.y > first.y + first.height).toBe(true);
});

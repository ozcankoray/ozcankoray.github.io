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

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
    await expect(page.locator('#cv-jobs-list > li')).toHaveCount(2);
    await expect(page.locator('#cv-internships-list > li')).toHaveCount(4);
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

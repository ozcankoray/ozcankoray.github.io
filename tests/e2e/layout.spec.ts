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

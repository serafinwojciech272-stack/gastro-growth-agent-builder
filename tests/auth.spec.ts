import { test, expect } from '@playwright/test';

const appRoutes = [
  '/app/onboarding', '/app/dashboard', '/app/advisor',
  '/app/website-preview', '/app/menu', '/app/actions', '/app/workspace'
];

test.describe('auth guard', () => {
  for (const route of appRoutes) {
    test(`blocks unauthenticated ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login\?next=/);
    });
  }

  test('login form exposes validation and error state', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('signup confirmation fields are present', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
  });

  test('reset page blocks missing session', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});

test.describe('public and responsive smoke', () => {
  test('public site loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('mobile Redmi-sized viewport has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 873 });
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  });
});

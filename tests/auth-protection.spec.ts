import { test, expect } from '@playwright/test';

test.describe('GA authentication protection', () => {
  test('unauthenticated users are redirected from protected routes to login', async ({ page }) => {
    const protectedRoutes = ['/app/dashboard', '/app/advisor', '/app/website-builder', '/app/actions'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login\?next=/);
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    }
  });

  test('login page exposes the account recovery path', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
  });
});

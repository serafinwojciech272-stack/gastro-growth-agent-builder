import { test, expect } from '@playwright/test';

const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

const routes = [
  { path: '/app/dashboard', marker: 'Growth Command Center' },
  { path: '/app/advisor', marker: 'What is the biggest growth problem in your business right now?' },
  { path: '/app/missions', marker: 'Mission Control' },
  { path: '/app/website-builder', marker: 'Growth Advisor Website Builder' },
  { path: '/app/menu', marker: 'Menu Intelligence' },
  { path: '/app/actions', marker: 'Actions' },
];

test.describe('GA authenticated workspace', () => {
  test.skip(!email || !password, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD for authenticated E2E.');

  test('one authenticated session can traverse the protected workspace', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/login');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/app\/(dashboard|onboarding)/, { timeout: 30_000 });

    if (page.url().includes('/app/onboarding')) {
      test.skip(true, 'Authenticated account has not completed onboarding.');
    }

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replaceAll('/', '\\/') + '$'));
      await expect(page.getByText(route.marker, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    }

    expect(errors, `Browser console/runtime errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

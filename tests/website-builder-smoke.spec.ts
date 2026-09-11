import { test, expect } from '@playwright/test';

const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe('GA Website Builder smoke', () => {
  test.skip(!email || !password, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD to run authenticated Builder smoke tests.');

  test('login, verify protected dashboard, open Builder and verify preview controls', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/login?next=%2Fapp%2Fwebsite-builder');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('**/app/website-builder', { timeout: 30_000 });

    // The authenticated user is now past ProtectedRoute. Verify the dashboard is also reachable.
    await page.goto('/app/dashboard');
    await page.waitForURL('**/app/dashboard', { timeout: 15_000 });
    await expect(page.getByText('Growth Command Center', { exact: true })).toBeVisible();

    await page.goto('/app/website-builder');
    await expect(page.getByText('Growth Advisor Website Builder', { exact: true }).first()).toBeVisible();

    await page.getByLabel('Project name').fill('Browser QA Smoke');
    await page.getByLabel('Source website').fill('https://example.com');
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page.getByText('Project', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Brand Extraction/i })).toBeVisible();

    for (const viewport of ['Desktop', 'Tablet', 'Mobile']) {
      const button = page.getByRole('button', { name: viewport });
      await expect(button).toBeVisible();
      await button.click();
    }

    await page.screenshot({ path: `test-results/builder-${test.info().project.name}.png`, fullPage: true });

    expect(errors, `Browser console/runtime errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

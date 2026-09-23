import { test, expect } from '@playwright/test';

const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe('GA Website Builder browser QA', () => {
  test('public shell loads and protected Builder redirects unauthenticated users', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await page.goto('/app/website-builder');
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    expect(errors, `Browser console/runtime errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test.skip(!email || !password, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD to run authenticated Builder smoke tests.');

  test('authenticated Builder: create project, advance to preview and verify responsive controls', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/login?next=%2Fapp%2Fwebsite-builder');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/app/website-builder', { timeout: 30_000 });

    await expect(page.getByText('Growth Advisor Website Builder', { exact: true }).first()).toBeVisible();
    await page.getByLabel('Project name').fill('Browser QA Smoke');
    await page.getByLabel('Source website').fill('https://example.com');
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page.getByText('Project', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Brand Extraction/i })).toBeVisible();

    for (const stage of ['Brand Extraction', 'Content Intelligence', 'Page Architecture', 'Visual Direction', 'AI Layout Generation', 'Component Generation', 'Responsive Renderer']) {
      const runButton = page.getByRole('button', { name: new RegExp(`Run ${stage}`, 'i') });
      await expect(runButton).toBeVisible();
      await runButton.click();
      await expect(page.getByText(stage, { exact: true }).first()).toBeVisible();
    }

    for (const viewport of ['Desktop', 'Tablet', 'Mobile']) {
      const button = page.getByRole('button', { name: viewport });
      await expect(button).toBeVisible();
      await button.click();
    }

    await expect(page.locator('main').filter({ hasText: 'Browser QA Smoke' }).first()).toBeVisible();
    await page.screenshot({ path: `test-results/builder-${test.info().project.name}.png`, fullPage: true });
    expect(errors, `Browser console/runtime errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

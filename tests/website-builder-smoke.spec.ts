import { test, expect } from '@playwright/test';

const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe('Growth Advisor Website Builder smoke', () => {
  test.skip(!email || !password, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD to run authenticated Builder smoke tests.');

  test('login, open Builder, create project and verify preview controls', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('/login?next=%2Fapp%2Fwebsite-builder');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/app/dashboard', { timeout: 30_000 });

    await page.goto('/app/website-builder');
    await expect(page.getByRole('heading', { name: /Website Builder/i })).toBeVisible();

    const sourceUrl = page.getByLabel(/website url|source url/i).first();
    if (await sourceUrl.count()) {
      await sourceUrl.fill('https://example.com');
    }

    const createButton = page.getByRole('button', { name: /create|start|build/i }).first();
    if (await createButton.count()) await createButton.click();

    await expect(page.getByText(/Brand Extraction|Project/i).first()).toBeVisible();

    for (const viewport of ['Desktop', 'Tablet', 'Mobile']) {
      const button = page.getByRole('button', { name: new RegExp(viewport, 'i') }).first();
      if (await button.count()) {
        await button.click();
        await expect(button).toBeVisible();
      }
    }

    await page.screenshot({ path: `test-results/builder-${test.info().project.name}.png`, fullPage: true });

    expect(errors, `Browser console/runtime errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

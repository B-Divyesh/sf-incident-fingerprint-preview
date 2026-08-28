import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('loads cleanly, evaluates the fixture, and exports a report', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle(/Fingerprint Preview/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  await expect(page.getByText('2', { exact: true })).toHaveCount(3);
  await expect(page.getByText('split + merge', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled();
  expect(consoleErrors).toEqual([]);
});

test('reports errors and supports the keyboard path', async ({ page }) => {
  await page.goto('/#bench');
  const events = page.getByLabel('01 Event sample');
  await events.fill('{bad');
  await events.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
  await expect(page.locator('#event-error')).toContainText('Event JSON is invalid');
  await events.fill('[]');
  await events.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
  await expect(page.getByText('The fixture is empty.')).toBeVisible();
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);
});

test('fits a 390px viewport without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test('mobile page links meet the 44px touch-target baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');

  const targets = [
    ['header home', 'header .wordmark'],
    ['source and DSL reference', '.cli-copy > a'],
    ['footer home', 'footer .wordmark'],
    ['Privacy', 'footer nav a:nth-child(1)'],
    ['Terms', 'footer nav a:nth-child(2)'],
    ['GitHub', 'footer nav a:nth-child(3)']
  ];

  for (const [name, selector] of targets) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${name} should be visible`).not.toBeNull();
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${name} height`).toBeGreaterThanOrEqual(44);
  }
});

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} has a titled main document`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Fingerprint Preview/);
  });
}

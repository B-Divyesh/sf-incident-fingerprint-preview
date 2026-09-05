import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('loads cleanly, evaluates the fixture, and exports a report', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Fingerprint Preview');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
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
  await page.goto('/demo/');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);
});

test('fits a 390px viewport without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/demo/');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test('mobile page links meet the 44px touch-target baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');

  const targets = [
    ['header home', 'header .wordmark'],
    ['header Demo', 'header nav a:nth-child(1)'],
    ['header How it works', 'header nav a:nth-child(2)'],
    ['header CLI', 'header nav a:nth-child(3)'],
    ['header Privacy', 'header nav a:nth-child(4)'],
    ['source and DSL reference', '.cli-copy > a'],
    ['footer home', 'footer .wordmark'],
    ['Privacy', 'footer nav a:nth-child(2)'],
    ['Terms', 'footer nav a:nth-child(3)'],
    ['GitHub', 'footer nav a:nth-child(4)']
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

test('desktop navigation links meet the 44px click-target baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.goto('/');
  for (const link of await page.locator('header nav a').all()) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('mobile editor and help text remain at least 16px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/demo/');
  for (const selector of ['#events-input', '#rules-input', '.input-meta', '.rule-help', '.field-error']) {
    const size = await page.locator(selector).first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    expect(size, selector).toBeGreaterThanOrEqual(16);
  }
});

for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
  test(`${path} has complete route metadata and the standard page structure`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.webp$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });

  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);
  });
}

test('reduced motion removes travel and replays the CLI recording without delays', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.locator('.primary-button').evaluate((element) => ({
    transition: getComputedStyle(element).transitionDuration,
    scroll: getComputedStyle(document.documentElement).scrollBehavior
  }));
  expect(Number.parseFloat(motion.transition)).toBeLessThanOrEqual(0.01);
  expect(motion.scroll).toBe('auto');
  await page.getByRole('button', { name: 'Replay recording' }).click();
  await expect(page.locator('#recording-screen')).toContainText('[split+merge]');
  await expect(page.getByRole('button', { name: 'Replay recording' })).toBeEnabled();
});

test('social and touch images have their declared dimensions', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(async () => {
    const load = (source) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
      image.onerror = reject;
      image.src = source;
    });
    return {
      social: await load('/social-preview.webp'),
      touch: await load('/apple-touch-icon.png')
    };
  });
  expect(dimensions).toEqual({ social: [1200, 630], touch: [180, 180] });
});

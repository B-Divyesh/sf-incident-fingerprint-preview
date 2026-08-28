import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const configUrl = new URL('../public/staticwebapp.config.json', import.meta.url);

async function readConfig() {
  return JSON.parse(await readFile(configUrl, 'utf8'));
}

function headersFor(config, route) {
  return config.routes.find((entry) => entry.route === route)?.headers ?? {};
}

test('Azure Static Web Apps configuration preserves immutable asset caching', async () => {
  const config = await readConfig();

  for (const route of ['/assets/*', '/instrument-bench.webp']) {
    assert.equal(
      headersFor(config, route)['Cache-Control'],
      'public, max-age=31536000, immutable',
      `${route} must not revalidate on repeat visits`,
    );
  }

  assert.equal(
    headersFor(config, '/sw.js')['Cache-Control'],
    'public, max-age=0, must-revalidate',
  );
  assert.equal(
    headersFor(config, '/*.html')['Cache-Control'],
    'public, max-age=0, must-revalidate',
  );
});

test('Azure Static Web Apps configuration restricts browser capabilities', async () => {
  const config = await readConfig();
  const headers = config.globalHeaders;

  assert.match(headers['Content-Security-Policy'], /default-src 'self'/);
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(headers['Content-Security-Policy'], /worker-src 'self'/);
  assert.match(headers['Permissions-Policy'], /camera=\(\)/);
  assert.match(headers['Permissions-Policy'], /microphone=\(\)/);
});

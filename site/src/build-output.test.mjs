import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const sourceConfig = new URL('../public/staticwebapp.config.json', import.meta.url);
const outputConfig = new URL('../../dist/site/staticwebapp.config.json', import.meta.url);
const demoOutput = new URL('../../dist/site/demo/index.html', import.meta.url);
const notFoundOutput = new URL('../../dist/site/404.html', import.meta.url);

test('production site includes the Azure response-policy configuration', async () => {
  const [source, output] = await Promise.all([
    readFile(sourceConfig, 'utf8'),
    readFile(outputConfig, 'utf8'),
  ]);

  assert.equal(output, source);
  const config = JSON.parse(output);
  assert.equal(
    config.routes.find((route) => route.route === '/assets/*').headers['Cache-Control'],
    'public, max-age=31536000, immutable',
  );
});

test('production output contains distinct demo and product 404 pages', async () => {
  const [demo, notFound] = await Promise.all([
    readFile(demoOutput, 'utf8'),
    readFile(notFoundOutput, 'utf8'),
  ]);
  assert.match(demo, /<title>Demo — Fingerprint Preview<\/title>/);
  assert.match(demo, /canonical" href="https:\/\/incident-fingerprint-preview\.sociobot\.in\/demo\/"/);
  assert.match(notFound, /<title>Page not found — Fingerprint Preview<\/title>/);
  assert.match(notFound, /<main[^>]+id="main"/);
  assert.match(notFound, /Return home/);
});

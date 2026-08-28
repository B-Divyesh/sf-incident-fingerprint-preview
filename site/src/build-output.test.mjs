import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const sourceConfig = new URL('../public/staticwebapp.config.json', import.meta.url);
const outputConfig = new URL('../../dist/site/staticwebapp.config.json', import.meta.url);

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

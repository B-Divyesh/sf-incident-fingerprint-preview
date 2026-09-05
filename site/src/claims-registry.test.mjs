import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const claimsUrl = new URL('../../.factory/claims.json', import.meta.url);
const testsUrl = new URL('../tests/claims.spec.js', import.meta.url);

test('every registered claim has one uniquely tagged browser outcome test', async () => {
  const claims = JSON.parse(await readFile(claimsUrl, 'utf8'));
  const tests = await readFile(testsUrl, 'utf8');
  const ids = claims.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const claim of claims) {
    assert.equal(claim.test, `npm run test:claims -- --grep "@claim:${claim.id}"`);
    assert.equal(tests.split(`@claim:${claim.id}`).length - 1, 1, claim.id);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRule, preview } from './evaluator.mjs';

const sample = JSON.stringify([
  { id: 'a', group_id: 'old', message: 'x', exception: { type: 'A' }, frames: [{ function: 'one', filename: 'a.rs', in_app: true, lineno: 9, vars: { token: 'secret' } }] },
  { id: 'b', group_id: 'old', message: 'x', exception: { type: 'B' } },
  { id: 'c', group_id: 'other', message: 'x', exception: { type: 'B' } }
]);

test('reports both split and merge', () => {
  const report = preview(sample, 'exception.type');
  assert.equal(report.summary.split_baseline_groups, 1);
  assert.equal(report.summary.merged_proposed_groups, 1);
});

test('uses fallback and supports empty fixtures', () => {
  assert.deepEqual(preview('[{"message":"fallback"}]', 'frames.in_app ?? message').groups[0].fingerprint, ['fallback']);
  assert.equal(preview('[]', 'message').summary.event_count, 0);
});

test('rejects malformed input and unknown parts', () => {
  assert.throws(() => preview('{}', 'message'), /events.*array/i);
  assert.throws(() => parseRule('request.url'), /Unknown rule part/);
});

test('does not emit source context or line numbers', () => {
  const output = JSON.stringify(preview(sample, 'message'));
  assert.equal(output.includes('secret'), false);
  assert.equal(output.includes('lineno'), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, runSyntheticPipeline } from '../demo.mjs';

test('synthetic pipeline normalizes, filters, selects and reports fixture evidence', () => {
  const result = runSyntheticPipeline();
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].url, 'https://example.org/guide');
  assert.deepEqual(result.selection.value, ['result_0_1']);
  assert.equal(result.visits.length, 1);
  assert.match(result.report, /Extracted sentence: No website was contacted\./);
  assert.match(result.mode, /SYNTHETIC/);
});

test('invalid provider replies fall back deterministically without accepting URLs', () => {
  const result = runSyntheticPipeline({ ...fixture, keywordReply: 'invalid', selectionReply: '["https://example.org/injected"]' });
  assert.ok(result.keywords.length >= 3);
  assert.equal(result.selection.fallback, true);
  assert.deepEqual(result.selection.value, ['result_0_1']);
});

test('missing fixture page cannot become claimed visit evidence', () => {
  const result = runSyntheticPipeline({ ...fixture, pages: {} });
  assert.deepEqual(result.visits, []);
  assert.equal(result.report, '');
});

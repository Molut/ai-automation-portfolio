import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractEvidenceSentences,
  extractOrganicResults,
  normalizeGoogleUrl,
} from '../search/google-extractor.mjs';

test('normalizes direct and Google redirect HTTP(S) URLs only', () => {
  assert.equal(normalizeGoogleUrl('https://Example.com/a#section'), 'https://example.com/a');
  assert.equal(normalizeGoogleUrl('/url?q=https%3A%2F%2Fexample.com%2Fa%3Fx%3D1'), 'https://example.com/a?x=1');
  assert.equal(normalizeGoogleUrl('javascript:alert(1)'), null);
  assert.equal(normalizeGoogleUrl('ftp://example.com/file'), null);
});

test('extracts only unique organic record results with generated opaque IDs', () => {
  const results = extractOrganicResults({ organicResults: [
    { title: 'Advertisement', href: 'https://ads.example/', isAd: true },
    { title: 'First title', href: '/url?url=https%3A%2F%2FExample.com%2Farticle%23top', displayUrl: 'Example.com/article', snippet: ' First  snippet. ' },
    { title: 'Duplicate', href: 'https://example.com/article' },
    { title: 'Unsafe', href: 'javascript:alert(1)' },
    { title: 'Second title', url: 'https://news.example/path', snippet: 'Second snippet' },
  ] }, { keywordIndex: 2 });

  assert.deepEqual(results, [
    {
      id: 'result_2_1', keywordIndex: 2, rank: 1, title: 'First title',
      url: 'https://example.com/article', displayUrl: 'Example.com/article', snippet: 'First snippet.',
    },
    {
      id: 'result_2_2', keywordIndex: 2, rank: 2, title: 'Second title',
      url: 'https://news.example/path', displayUrl: 'news.example/path', snippet: 'Second snippet',
    },
  ]);
  assert.ok(results.every(({ id, url }) => !id.includes(url)));
});

test('accepts DOM-like result arrays without parsing HTML', () => {
  const results = extractOrganicResults([
    { textContent: 'A title', anchor: { href: 'https://example.org/' }, description: 'A snippet' },
  ]);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'A title');
  assert.equal(results[0].url, 'https://example.org/');
});

test('extracts bounded, normalized source sentences without paraphrasing', () => {
  const evidence = extractEvidenceSentences('  First   source sentence.\nSecond source sentence! Third source sentence? ', {
    maxSentences: 2, maxChars: 46,
  });
  assert.deepEqual(evidence, ['First source sentence.', 'Second source sentence!']);
  assert.deepEqual(extractEvidenceSentences('A very long source sentence without a stop', {
    maxSentenceChars: 12,
  }), []);
});

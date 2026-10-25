import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatEvidenceReport,
  fallbackKeywordSelection,
  parseKeywordSelection,
  parseResultSelection,
} from '../search/research-contract.mjs';

test('strictly accepts only the provider-enforced 3-5 keyword object schema', () => {
  assert.deepEqual(parseKeywordSelection('{"keywords":[" Seoul cafe ", "weather", "museum"]}'), {
    ok: true, value: ['Seoul cafe', 'weather', 'museum'], error: null,
  });
  assert.deepEqual(parseKeywordSelection('```json\n{"keywords":["Seoul cafe", "weather", "museum"]}\n```'), {
    ok: true, value: ['Seoul cafe', 'weather', 'museum'], error: null,
  });
  for (const raw of ['not json', '["Seoul cafe", "weather", "museum"]', '{"keywords":["one", "two"]}', '{"keywords":["one", "one", "three"]}', '{"keywords":["one", 2, "three"]}', '{"keywords":["one", "two", "three"],"extra":true}']) {
    assert.equal(parseKeywordSelection(raw).ok, false, raw);
  }
});

test('derives 3-5 deterministic keyword fallbacks when a provider ignores the JSON contract', () => {
  const keywords = fallbackKeywordSelection({ messages: [{ role: 'user', content: 'Synthetic documentation reliability testing guide' }] });
  assert.ok(keywords.length >= 3 && keywords.length <= 5);
  assert.ok(keywords.every((keyword) => typeof keyword === 'string' && keyword.length > 0));
  assert.equal(new Set(keywords.map((keyword) => keyword.toLocaleLowerCase('und'))).size, keywords.length);
});

test('selects only allowed opaque IDs and uses a deterministic fallback on invalid output', () => {
  const allowed = ['result_0_1', 'result_0_2', 'result_1_1'];
  assert.deepEqual(parseResultSelection('["result_1_1", "result_0_1"]', allowed, { maxSelection: 2 }), {
    ok: true, value: ['result_1_1', 'result_0_1'], fallback: false,
  });
  assert.deepEqual(parseResultSelection('["https://evil.example", "result_0_1"]', allowed, { maxSelection: 2 }), {
    ok: false, value: ['result_0_1', 'result_0_2'], fallback: true,
  });
  assert.deepEqual(parseResultSelection(null, allowed, { maxSelection: 2 }), {
    ok: false, value: ['result_0_1', 'result_0_2'], fallback: true,
  });
});

test('never accepts URL-like values even when a caller incorrectly includes them as allowed IDs', () => {
  const allowed = ['https://evil.example/result_0_1', 'result_0_2'];
  assert.deepEqual(parseResultSelection('["https://evil.example/result_0_1"]', allowed), {
    ok: false, value: ['result_0_2'], fallback: true,
  });
  assert.deepEqual(parseResultSelection(null, ['https://evil.example/result_0_1']), {
    ok: false, value: [], fallback: true,
  });
});

test('formats only actual supplied visit evidence with English sample labels', () => {
  const report = formatEvidenceReport({
    keywords: ['서울 카페'],
    visits: [
      { resultId: 'result_0_1', keywordIndex: 0, visitedAt: '2026-07-22T10:00:00.000Z', title: '페이지 제목', finalUrl: 'https://example.com/a', evidenceSentences: ['원문 첫 문장.', '원문 둘째 문장.'] },
      { resultId: 'result_0_2', keywordIndex: 0, title: '열지 않은 페이지', finalUrl: 'https://example.com/b', evidenceSentences: ['없어야 함.'] },
    ],
  });
  assert.equal(report, [
    'Keyword: 서울 카페',
    'Visited: result_0_1',
    'Page title: 페이지 제목',
    'Final URL: https://example.com/a',
    'Extracted sentence: 원문 첫 문장.',
    'Extracted sentence: 원문 둘째 문장.',
  ].join('\n'));
  assert.doesNotMatch(report, /열지 않은|result_0_2/);
});

import { parseKeywordSelection, fallbackKeywordSelection, parseResultSelection, formatEvidenceReport } from './search/research-contract.mjs';
import { extractOrganicResults, extractEvidenceSentences } from './search/google-extractor.mjs';

// New portfolio-only harness. Every input below is synthetic, not a live visit.
export const fixture = {
  keywordReply: '{"keywords":["documentation","reliability","testing"]}',
  selectionReply: '["result_0_1"]',
  records: [
    { title: 'Synthetic documentation guide', href: '/url?q=https%3A%2F%2Fexample.org%2Fguide%23intro', snippet: 'Synthetic search snippet.' },
    { title: 'Duplicate', href: 'https://example.org/guide' },
    { title: 'Synthetic advertisement', href: 'https://example.org/ad', isAd: true },
    { title: 'Rejected scheme', href: 'javascript:void(0)' },
  ],
  pages: {
    'https://example.org/guide': {
      title: 'Synthetic documentation guide',
      bodyText: 'This is synthetic page text. No website was contacted.',
      visitedAt: '2026-01-01T00:00:00.000Z',
    },
  },
};

export function runSyntheticPipeline(input = fixture) {
  const parsed = parseKeywordSelection(input.keywordReply);
  const keywords = parsed.ok ? parsed.value : fallbackKeywordSelection({ context: 'Synthetic documentation reliability testing' });
  const results = extractOrganicResults(input.records, { keywordIndex: 0 });
  const selection = parseResultSelection(input.selectionReply, results.map(({ id }) => id));
  const visits = selection.value.flatMap((id) => {
    const result = results.find((entry) => entry.id === id);
    const page = input.pages[result.url];
    return page ? [{ resultId: id, keywordIndex: result.keywordIndex, title: page.title,
      finalUrl: result.url, visitedAt: page.visitedAt,
      evidenceSentences: extractEvidenceSentences(page.bodyText) }] : [];
  });
  return { mode: 'SYNTHETIC FIXTURES — no network or actual visits', keywords,
    results, selection, visits, report: formatEvidenceReport({ keywords, visits }) };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  console.log(JSON.stringify(runSyntheticPipeline(), null, 2));
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/gu, ' ').trim().slice(0, maxLength);
}

/** Normalize a direct URL or a Google /url redirect without allowing other schemes. */
export function normalizeGoogleUrl(value) {
  if (typeof value !== 'string' || value.length > 8_192) return null;
  const raw = value.trim();
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw, 'https://www.google.com');
  } catch {
    return null;
  }
  const googleHost = /(^|\.)google\.[a-z.]+$/iu.test(parsed.hostname);
  if (googleHost && (parsed.pathname === '/url' || parsed.pathname === '/imgres')) {
    const target = parsed.searchParams.get('q') ?? parsed.searchParams.get('url');
    if (!target) return null;
    try {
      parsed = new URL(target);
    } catch {
      return null;
    }
  } else if (!/^[a-z][a-z0-9+.-]*:/iu.test(raw)) {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  parsed.hash = '';
  return parsed.href;
}

function inputRecords(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.organicResults)) return input.organicResults;
  if (Array.isArray(input?.results)) return input.results;
  return [];
}

/**
 * Convert already-observed DOM-like records into safe organic result records.
 * It deliberately does not parse HTML or perform network activity.
 */
export function extractOrganicResults(input, { keywordIndex = 0, maxResults = 20 } = {}) {
  const results = [];
  const seenUrls = new Set();
  const safeKeywordIndex = Number.isInteger(keywordIndex) && keywordIndex >= 0 ? keywordIndex : 0;
  for (const record of inputRecords(input)) {
    if (!record || record.isAd === true || record.ad === true || record.type === 'ad') continue;
    const href = record.href ?? record.url ?? record.anchor?.href;
    const url = normalizeGoogleUrl(href);
    if (!url || seenUrls.has(url)) continue;
    const title = cleanText(record.title ?? record.textContent ?? record.anchor?.textContent);
    if (!title) continue;
    seenUrls.add(url);
    const displayUrl = cleanText(record.displayUrl) || `${new URL(url).hostname}${new URL(url).pathname === '/' ? '' : new URL(url).pathname}`;
    const snippet = cleanText(record.snippet ?? record.description ?? record.text);
    const rank = results.length + 1;
    results.push({
      id: `result_${safeKeywordIndex}_${rank}`,
      keywordIndex: safeKeywordIndex,
      rank,
      title,
      url,
      displayUrl,
      snippet,
    });
    if (results.length >= maxResults) break;
  }
  return results;
}

/** Return verbatim, whitespace-normalized sentences subject to deterministic bounds. */
export function extractEvidenceSentences(text, {
  maxSentences = 3,
  maxChars = 1_000,
  maxSentenceChars = 500,
} = {}) {
  if (typeof text !== 'string' || maxSentences <= 0 || maxChars <= 0 || maxSentenceChars <= 0) return [];
  const normalized = cleanText(text, Math.max(maxChars * 4, maxSentenceChars * 4));
  const candidates = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [];
  const sentences = [];
  let usedChars = 0;
  for (const candidate of candidates) {
    const sentence = cleanText(candidate, maxSentenceChars + 1);
    if (!sentence || sentence.length > maxSentenceChars) continue;
    const separator = sentences.length ? 1 : 0;
    if (usedChars + separator + sentence.length > maxChars) break;
    sentences.push(sentence);
    usedChars += separator + sentence.length;
    if (sentences.length >= maxSentences) break;
  }
  return sentences;
}

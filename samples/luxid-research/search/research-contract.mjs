function parseJsonValue(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/iu);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  try { return JSON.parse(candidate); } catch { return null; }
}

function parseJsonList(raw) {
  const value = parseJsonValue(raw);
  return Array.isArray(value) ? value : null;
}

function cleanKeyword(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/gu, ' ').trim();
  if (!cleaned || cleaned.length > 120 || /[\u0000-\u001f\u007f]/u.test(cleaned)) return null;
  return cleaned;
}

/** Strictly parse the provider-enforced {keywords:[...]} keyword-selection response. */
export function parseKeywordSelection(raw) {
  const parsed = parseJsonValue(raw);
  if (!parsed || Array.isArray(parsed) || Object.getPrototypeOf(parsed) !== Object.prototype || Object.keys(parsed).length !== 1 || !Object.hasOwn(parsed, 'keywords')) {
    return { ok: false, value: [], error: 'invalid_keyword_selection' };
  }
  const list = parsed.keywords;
  if (!Array.isArray(list) || list.length < 3 || list.length > 5) return { ok: false, value: [], error: 'invalid_keyword_selection' };
  const value = list.map(cleanKeyword);
  if (value.some((keyword) => keyword === null) || new Set(value.map((keyword) => keyword.toLocaleLowerCase('und'))).size !== value.length) {
    return { ok: false, value: [], error: 'invalid_keyword_selection' };
  }
  return { ok: true, value, error: null };
}

const FALLBACK_STOP_WORDS = new Set(['그리고', '그래서', '그런데', '하지만', '오늘', '지금', '정말', '너무', '그냥', '우리', '나는', '내가', '있어', '없어', '좋아', '같아', '하면', '하는', '해서', '에게', '으로', '에서']);

/** Deterministic last-resort keywords preserve the two-call contract when a provider ignores the JSON-only reply format. */
export function fallbackKeywordSelection(snapshot = {}) {
  const messages = Array.isArray(snapshot.messages) ? snapshot.messages : [];
  const source = messages.map((message) => message?.content).concat([snapshot.memory, snapshot.context]).filter((value) => typeof value === 'string').join(' ');
  const words = (source.match(/[A-Za-z0-9가-힣]{2,}/gu) || []).map((word) => word.trim()).filter((word) => !FALLBACK_STOP_WORDS.has(word));
  const candidates = [];
  for (let index = 0; index < words.length - 1 && candidates.length < 5; index += 1) {
    const phrase = cleanKeyword(words.slice(index, index + 3).join(' '));
    if (phrase && !candidates.some((existing) => existing.toLocaleLowerCase('und') === phrase.toLocaleLowerCase('und'))) candidates.push(phrase);
  }
  for (const fallback of ['recent conversation information', 'related updates', 'topic guidance']) {
    if (candidates.length >= 3) break;
    if (!candidates.includes(fallback)) candidates.push(fallback);
  }
  return candidates.slice(0, 5);
}

function fallbackIds(allowedIds, maxSelection) {
  return allowedIds.slice(0, maxSelection);
}

// Result IDs are extractor-owned handles, never URLs or model-provided links.
const OPAQUE_RESULT_ID = /^result_[0-9]+_[0-9]+$/u;

/**
 * Parse only IDs that were emitted by the extractor. Any malformed model output
 * falls back to the first allowed IDs in supplied deterministic order.
 */
export function parseResultSelection(raw, allowedResultIds, { maxSelection = 6 } = {}) {
  const allowed = Array.isArray(allowedResultIds)
    ? [...new Set(allowedResultIds.filter((id) => typeof id === 'string' && OPAQUE_RESULT_ID.test(id)))]
    : [];
  const cap = Number.isInteger(maxSelection) && maxSelection > 0 ? maxSelection : 6;
  const fallback = () => ({ ok: false, value: fallbackIds(allowed, cap), fallback: true });
  const list = parseJsonList(raw);
  if (!list || list.length === 0 || list.length > cap || list.some((id) => typeof id !== 'string')) return fallback();
  if (new Set(list).size !== list.length || list.some((id) => !OPAQUE_RESULT_ID.test(id) || !allowed.includes(id))) return fallback();
  return { ok: true, value: list, fallback: false };
}

function plain(value, maxLength = 2_000) {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim().slice(0, maxLength) : '';
}

/** Format stored, real visit evidence only; it never infers a visit from a result. */
export function formatEvidenceReport({ keywords = [], visits = [] } = {}) {
  const lines = [];
  for (const visit of Array.isArray(visits) ? visits : []) {
    if (!visit || !visit.visitedAt) continue;
    const keyword = plain(keywords[visit.keywordIndex], 120);
    const resultId = plain(visit.resultId, 128);
    const title = plain(visit.title, 500);
    const finalUrl = plain(visit.finalUrl, 2_000);
    if (!keyword || !resultId || !title || !/^https?:\/\//iu.test(finalUrl)) continue;
    lines.push(`Keyword: ${keyword}`);
    lines.push(`Visited: ${resultId}`);
    lines.push(`Page title: ${title}`);
    lines.push(`Final URL: ${finalUrl}`);
    for (const sentence of Array.isArray(visit.evidenceSentences) ? visit.evidenceSentences : []) {
      const evidence = plain(sentence, 500);
      if (evidence) lines.push(`Extracted sentence: ${evidence}`);
    }
  }
  return lines.join('\n');
}

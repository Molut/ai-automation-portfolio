# Luxid research: offline code sample

A small extraction from the Luxid web application showing structured model-output validation, deterministic fallbacks, organic-result normalization, opaque result selection, and bounded source-evidence formatting.

## Run

Node.js 20 or newer; no installation, packages, API keys, browser, database, or service required.

From the repository root:

```sh
cd samples/luxid-research
node --test
node demo.mjs
```

The demo uses **synthetic fixtures only**. Its page text, timestamps, result records, and model replies are authored examples. The `Visited` field represents a fixture record, not an actual web visit. The example.org URLs are identifiers and are never fetched.

## Provenance and exact adaptations

Source project: **Luxid web application**. Paths below are relative to that project's root. This package is an AI-assisted portfolio extraction, not a claim that the applicant manually authored every line. The applicant's role is AI-assisted builder/operator: integrating components, exercising workflows, and checking outcomes.

- `search/google-extractor.mjs`: copied unchanged from the same source-relative path. It consumes already-observed records, not HTML; it performs no networking.
- `search/research-contract.mjs`: extracted from the same path. Removed three project-specific persona/name tokens from `FALLBACK_STOP_WORDS`. Translated the three default fallback phrases to `recent conversation information`, `related updates`, and `topic guidance`. Translated report labels to `Keyword`, `Visited`, `Page title`, `Final URL`, and `Extracted sentence`. Other logic is unchanged. Generic Korean stop words remain part of the original implementation.
- `tests/google-extractor.test.mjs`: copied unchanged from the same path.
- `tests/research-contract.test.mjs`: extracted from the same path. Replaced the location-specific fallback input with `Synthetic documentation reliability testing guide`; updated the report-label test description and expected labels for the English sample. Other test cases and Korean non-identifying fixture text remain unchanged.
- `demo.mjs`, `tests/pipeline.test.mjs`, `package.json`, this README, and `provenance.json`: new extraction support files, not historical Luxid code. The demo composes the extracted functions; it is not the application's original orchestration module.

`provenance.json` records SHA-256 fingerprints of original and extracted module/test contents. No source checkout or private local path is needed to run this package. The application workflow was inspected but is intentionally excluded: it imports a network-session adapter and is outside this pure offline sample.

## What the checks demonstrate

Tests cover strict keyword schema validation, malformed replies, opaque-ID allowlisting, deterministic fallback, rejection of unsafe URL schemes, redirects and deduplication, advertisement filtering, bounded source sentence extraction, and exclusion of records without supplied visit evidence. Added integration tests cover the synthetic pipeline and absent fixture pages.

## Limits

This is not a browser scraper or a production research agent. It does not demonstrate live provider reliability, browser behavior, database persistence, cancellation, or network cleanup. HTTP(S) normalization is not SSRF protection. The formatter trusts supplied evidence and timestamps; it cannot independently prove a visit occurred. Sentence splitting is deliberately simple and may split abbreviations. The original implementations' edge behavior is preserved rather than presented as comprehensively hardened production validation.

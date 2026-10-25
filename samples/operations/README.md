# Lesson progress from teaching history

A small, runnable extraction of the sequence-continuity rules used by a real school daily-log automation. When a lesson plan contains reset/stale numbers or a recent log says an item was skipped, the next range comes from the nearest earlier numeric teaching record for that class—not from the plan's numbers.

This is an AI-assisted portfolio extraction of an existing operational workflow, not a claim of independently authored software or a complete school management system. All demo/test history is **synthetic fixture input**. There are no student names, credentials, workbook copies, or service identifiers.

## Run

Python 3.9+; standard library only. From the repository root:

```sh
cd samples/operations
python3 -m unittest -v
python3 demo.py
```

No installation, environment variables, network, Google Drive, or workbook access is required. Do not run the original operational module to run this example.

## Provenance and precise adaptations

Original source module: **`lincoln_daily_log.py`**, inspected directly in the private local automation scripts. The following functions were extracted from that module (original inspected line ranges):

| Function | Source lines | Adaptation |
| --- | --- | --- |
| `_progress_range` | 496–508 | Unchanged |
| `_class_meets_on` | 511–516 | Unchanged |
| `_previous_numeric_range` | 519–538 | Added explicit `history` input; replaced CSV discovery/loading with descending sort of supplied `(date, cells)` entries |
| `_replace_progress_range` | 541–576 | Added/forwarded `history`; replacement, insertion, error, and audit behavior unchanged |
| `apply_sequenced_progress_numbers` | 579–598 | Added/forwarded `history`; slot dispatch and increments unchanged |

Only `re` and `datetime.date` runtime imports are retained; `from __future__ import annotations` is added for Python 3.9 compatibility. The source's `_progress_csv_paths` sorts archive filenames newest first; this sample instead sorts provided parsed dates newest first. It does not reproduce CSV parsing, filename filtering, malformed-file skipping, sheet writes, roster matching, holiday checks, or any scheduling/document-generation code. The original module is not imported, avoiding operational import-time dependencies. No dependency on `lincoln_daily_schedule.py` is claimed.

Inherited business behavior:

- Daily 3 p.m. class: Voca600 advances by two; irregular verbs by three.
- 4 p.m. Monday/Wednesday/Friday and Tuesday/Thursday/Friday groups advance irregular verbs by six independently.
- Ignore same-day/future history and other groups' weekdays. Skip missing/non-numeric history and keep searching backward.
- Tuesday/Thursday/Friday history uses E9 on Fridays and E8 otherwise; Monday/Wednesday/Friday uses E8; daily class uses E7.
- Replace only the first matching range. If absent, insert the controlled item before a recognized Lab/native-teacher section, or append it.
- Missing usable history raises `RuntimeError` rather than trusting the plan range.

## Input and output

`apply_sequenced_progress_numbers(text, *, target_date, slot, history)` accepts lesson text, a `datetime.date`, the original class key (`3시`, `4시 월수금`, or `4시 화목금`), and a reusable list of `(date, {cell_key: text})` records. Korean strings are retained parser vocabulary/class labels, not personal names.

Returns `(updated_text, audit_dict)`. Audit entries include the previous date/range, new range, and increment. It does not mutate the supplied history or publish anything.

The demo supplies synthetic June 15 ranges 85–86 and 37–39, followed by a June 16 skipped record. For June 17 it prints **87-88** and **40-42**, with June 15 as the audit source. The fixture plan deliberately starts at 1 to demonstrate that history takes precedence.

## Tests and boundaries

Tests cover daily increments, skipped records, unsorted history, same-day/future exclusion, group-weekday separation, Friday E9 mapping, missing-line insertion, missing-history failure, first-match replacement, and parser limits.

This is a faithful narrow extraction, not a new validation layer: unknown slots return unchanged text; numeric ranges require an ASCII hyphen; reversed ranges are parsed without validation; any kind other than `voca` uses the irregular-verb parser. The daily class predicate accepts every weekday number, including weekends; operational callers normally filter non-school days outside these functions. Holidays, duplicate-date conflicts, range ceilings, and source-of-truth correction decisions are outside this sample. Do not use it to infer attendance or actual student progress.

"""Synthetic fixture only: no student, workbook, or service data."""
from datetime import date
import json
from lesson_progress import apply_sequenced_progress_numbers

# Synthetic lesson-history cells; Korean labels are parser vocabulary, not names.
HISTORY = [
    (date(2026, 6, 15), {"E7": "Voca600 1 85-86\n불규칙동사 37-39"}),
    (date(2026, 6, 16), {"E7": "Voca600 생략\n불규칙동사 생략"}),
]
PLAN = "1. Group lesson\n   - Voca600 1 1-2\n   - 불규칙동사 1-3\n2. 개인 Lab"

if __name__ == "__main__":
    text, audit = apply_sequenced_progress_numbers(
        PLAN, target_date=date(2026, 6, 17), slot="3시", history=HISTORY
    )
    print("SYNTHETIC FIXTURE — no live system access")
    print(text)
    print(json.dumps(audit, ensure_ascii=False, indent=2))

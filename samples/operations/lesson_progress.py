"""Pure extraction from lincoln_daily_log.py; see README.md for adaptations."""
from __future__ import annotations

import re
from datetime import date


def _progress_range(text: str, kind: str) -> tuple[int, int] | None:
    """Find a Voca600 or irregular-verb numeric range in one log cell."""
    if not text:
        return None
    if kind == "voca":
        pattern = re.compile(r"Voca\s*600\b[^\n]*?(\d+)\s*-\s*(\d+)", re.IGNORECASE)
    else:
        pattern = re.compile(r"불규칙\s*동사[^\n]*?(\d+)\s*-\s*(\d+)")
    for line in text.splitlines():
        match = pattern.search(line)
        if match:
            return int(match.group(1)), int(match.group(2))
    return None


def _class_meets_on(class_key: str, dow: int) -> bool:
    return (
        class_key == "3시"
        or (class_key == "4시 월수금" and dow in (0, 2, 4))
        or (class_key == "4시 화목금" and dow in (1, 3, 4))
    )


def _previous_numeric_range(target_date: date, class_key: str, row_key: str, kind: str, history) -> tuple[tuple[int, int], date] | None:
    """Find the nearest older numeric range for the same class/item.

    A prior class day with no number (for example '생략') is skipped and the
    search continues to the nearest older class day with an actual range.
    """
    for logged_date, cells in sorted(history, key=lambda entry: entry[0], reverse=True):
        if logged_date >= target_date or not _class_meets_on(class_key, logged_date.weekday()):
            continue
        source_row_key = row_key
        if class_key == "4시 화목금":
            source_row_key = "E9" if logged_date.weekday() == 4 else "E8"
        found = _progress_range(cells.get(source_row_key, ""), kind)
        if found:
            return found, logged_date
    return None


def _replace_progress_range(text: str, *, target_date: date, class_key: str, row_key: str, kind: str, increment: int, history) -> tuple[str, dict]:
    previous = _previous_numeric_range(target_date, class_key, row_key, kind, history)
    if not previous:
        raise RuntimeError(f"{class_key} {kind}의 과거 교무일지 숫자 기록을 찾지 못했습니다")
    (previous_start, previous_end), previous_date = previous
    new_start, new_end = previous_end + 1, previous_end + increment
    if kind == "voca":
        pattern = re.compile(r"(Voca\s*600\b[^\n]*?)(\d+)\s*-\s*(\d+)", re.IGNORECASE)
    else:
        pattern = re.compile(r"(불규칙\s*동사[^\n]*?)(\d+)\s*-\s*(\d+)")
    replaced = False

    def repl(match):
        nonlocal replaced
        if replaced:
            return match.group(0)
        replaced = True
        return f"{match.group(1)}{new_start}-{new_end}"

    result = pattern.sub(repl, text, count=1)
    if not replaced:
        # A plan can omit the line even though the class still advances this
        # sequence.  Add the controlled item instead of borrowing a plan number.
        item_name = "Voca600 1" if kind == "voca" else "불규칙동사"
        new_item = f"   - {item_name} {new_start}-{new_end}"
        insertion = re.search(r"\n\d+\.\s*(?:원어민|개별|개인)\s*(?:Lab|선생님 수업|수업)?", result)
        if insertion:
            result = result[:insertion.start()] + "\n" + new_item + result[insertion.start():]
        else:
            result = result.rstrip() + "\n" + new_item
    return result, {
        "previous_date": str(previous_date),
        "previous_range": f"{previous_start}-{previous_end}",
        "range": f"{new_start}-{new_end}",
        "increment": increment,
    }


def apply_sequenced_progress_numbers(text: str, *, target_date: date, slot: str, history) -> tuple[str, dict]:
    """Use prior 교무일지 numbers, never the XLSX numbers, for these items."""
    details = {}
    if slot == "3시":
        text, details["voca"] = _replace_progress_range(
            text, target_date=target_date, class_key="3시", row_key="E7", kind="voca", history=history, increment=2
        )
        text, details["irregular"] = _replace_progress_range(
            text, target_date=target_date, class_key="3시", row_key="E7", kind="irregular", history=history, increment=3
        )
    elif slot == "4시 월수금":
        text, details["irregular"] = _replace_progress_range(
            text, target_date=target_date, class_key=slot, row_key="E8", kind="irregular", history=history, increment=6
        )
    elif slot == "4시 화목금":
        row_key = "E9" if target_date.weekday() == 4 else "E8"
        text, details["irregular"] = _replace_progress_range(
            text, target_date=target_date, class_key=slot, row_key=row_key, kind="irregular", history=history, increment=6
        )
    return text, details

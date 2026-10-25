"""Tests use synthetic history only."""
from datetime import date
import unittest
from demo import HISTORY, PLAN
from lesson_progress import (
    _progress_range, _previous_numeric_range, apply_sequenced_progress_numbers,
)


class ProgressTests(unittest.TestCase):
    def test_daily_increments_and_skipped_history(self):
        text, audit = apply_sequenced_progress_numbers(
            PLAN, target_date=date(2026, 6, 17), slot="3시", history=HISTORY)
        self.assertIn("Voca600 1 87-88", text)
        self.assertIn("불규칙동사 40-42", text)
        self.assertEqual(audit["voca"]["previous_date"], "2026-06-15")
        self.assertEqual(audit["irregular"]["increment"], 3)

    def test_unsorted_history_same_day_and_future_excluded(self):
        history = [(date(2026, 6, day), {"E7": f"불규칙동사 {day}-{day+2}"})
                   for day in (17, 15, 18, 16)]
        self.assertEqual(_previous_numeric_range(
            date(2026, 6, 17), "3시", "E7", "irregular", history),
            ((16, 18), date(2026, 6, 16)))

    def test_tuesday_class_skips_monday_and_reads_friday_e9(self):
        history = [(date(2026, 6, 15), {"E8": "불규칙동사 200-205"}),
                   (date(2026, 6, 12), {"E8": "불규칙동사 100-105",
                                          "E9": "불규칙동사 7-12"})]
        text, audit = apply_sequenced_progress_numbers(
            "불규칙동사 1-6", target_date=date(2026, 6, 16),
            slot="4시 화목금", history=history)
        self.assertEqual(text, "불규칙동사 13-18")
        self.assertEqual(audit["irregular"]["previous_date"], "2026-06-12")

    def test_monday_class_skips_tuesday(self):
        history = [(date(2026, 6, 16), {"E8": "불규칙동사 200-205"}),
                   (date(2026, 6, 15), {"E8": "불규칙동사 19-24"})]
        text, _ = apply_sequenced_progress_numbers(
            "불규칙동사 1-6", target_date=date(2026, 6, 17),
            slot="4시 월수금", history=history)
        self.assertEqual(text, "불규칙동사 25-30")

    def test_missing_item_inserted_before_lab(self):
        text, _ = apply_sequenced_progress_numbers(
            "1. Group\n2. 개인 Lab", target_date=date(2026, 6, 17),
            slot="3시", history=HISTORY)
        self.assertLess(text.index("불규칙동사 40-42"), text.index("2. 개인 Lab"))
        self.assertIn("Voca600 1 87-88", text)

    def test_missing_history_fails_instead_of_using_plan(self):
        with self.assertRaises(RuntimeError):
            apply_sequenced_progress_numbers(PLAN, target_date=date(2026, 6, 17),
                                             slot="3시", history=[])

    def test_first_occurrence_only(self):
        text, _ = apply_sequenced_progress_numbers(
            "불규칙동사 1-6\n불규칙동사 90-95", target_date=date(2026, 6, 17),
            slot="4시 월수금", history=[(date(2026, 6, 15), {"E8": "불규칙동사 7-12"})])
        self.assertEqual(text, "불규칙동사 13-18\n불규칙동사 90-95")

    def test_parser_and_inherited_limits(self):
        self.assertEqual(_progress_range("vOcA 600 1 85 - 86", "voca"), (85, 86))
        for text in ("", "불규칙동사 생략", "불규칙동사 7–9"):
            self.assertIsNone(_progress_range(text, "irregular"))
        self.assertEqual(_progress_range("불규칙동사 9-7", "irregular"), (9, 7))

    def test_unknown_slot_is_unchanged(self):
        self.assertEqual(apply_sequenced_progress_numbers(
            PLAN, target_date=date(2026, 6, 17), slot="unknown", history=[]), (PLAN, {}))


if __name__ == "__main__":
    unittest.main()

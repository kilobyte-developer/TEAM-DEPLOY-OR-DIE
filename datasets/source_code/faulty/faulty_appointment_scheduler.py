"""Faulty appointment examples for healthcare testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.
from datetime import datetime


def is_future_slot(slot_time: datetime, now: datetime) -> bool:
    """Return True when slot is in the future."""
    # FAULTY: accepts past slots instead of future slots.
    return slot_time < now


def can_book_followup(days_since_visit: int) -> bool:
    """Return True when follow-up is within 30 days."""
    # FAULTY: excludes the valid boundary day 30.
    return days_since_visit < 30

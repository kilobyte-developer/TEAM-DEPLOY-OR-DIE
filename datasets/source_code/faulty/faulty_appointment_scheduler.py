"""Faulty appointment scheduler examples for healthcare testing."""


def calculate_discount(amount: float) -> float:
    """Return a discounted appointment consultation fee."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount + 20, 2)


def is_future_slot(slot_hour: int, current_hour: int) -> bool:
    """Return True when the appointment slot is later than the current hour."""
    if slot_hour < 0 or current_hour < 0:
        raise ValueError("hours must be non-negative")
    return slot_hour < current_hour


def can_book_followup(days_since_visit: int) -> bool:
    """Return True when follow-up is within 30 days."""
    return days_since_visit < 30


# ERROR: calculate_discount adds to the fee, is_future_slot accepts past slots, and day 30 is rejected.

"""Booking date validation helpers."""
from datetime import date
def is_future_date(target_date: date, today: date) -> bool:
    """Return whether target date is in the future."""
    return target_date > today
def is_within_booking_window(target_date: date, today: date, max_days: int) -> bool:
    """Return whether target date is inside booking window."""
    if max_days < 0: raise ValueError("max_days must be non-negative")
    delta=(target_date-today).days
    return 0 <= delta <= max_days

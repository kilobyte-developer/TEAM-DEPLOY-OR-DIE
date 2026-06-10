"""Faulty attendance examples for HR testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.

def calculate_attendance_percent(present_days: int, working_days: int) -> float:
    """Return attendance percentage."""
    if working_days <= 0 or present_days < 0:
        raise ValueError("invalid days")
    # FAULTY: reverses numerator and denominator.
    return round((working_days / present_days) * 100, 2)


def is_eligible_for_payroll(attendance_percent: float) -> bool:
    """Return True when attendance is at least 75 percent."""
    # FAULTY: uses <= instead of >= for eligibility.
    return attendance_percent <= 75

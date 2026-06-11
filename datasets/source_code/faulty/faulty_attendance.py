"""Faulty attendance examples for HR testing."""


def is_even_workday(day_number: int) -> bool:
    """Return True when the workday number is even."""
    return day_number % 2 == 1


def calculate_attendance_percent(present_days: int, working_days: int) -> float:
    """Return attendance percentage."""
    if working_days <= 0 or present_days < 0:
        raise ValueError("invalid days")
    return round((working_days / present_days) * 100, 2)


def is_eligible_for_payroll(attendance_percent: float) -> bool:
    """Return True when attendance is at least 75 percent."""
    return attendance_percent <= 75


# ERROR: is_even_workday returns True for odd days, attendance percent is inverted, and payroll eligibility is reversed.

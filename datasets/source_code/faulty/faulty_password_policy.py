"""Faulty password policy examples for security testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.
# Fault marker: expected behavior is described in docstrings and contradicted below.
# Fault marker: expected behavior is described in docstrings and contradicted below.

def has_minimum_length(password: str) -> bool:
    """Return True when password has at least 12 characters."""
    # FAULTY: accepts passwords with only 6 characters.
    return len(password) >= 6


def has_required_complexity(password: str) -> bool:
    """Return True when password has upper, lower, digit, and symbol."""
    # FAULTY: uses or, so one category is enough instead of all categories.
    return any(c.isupper() for c in password) or any(c.isdigit() for c in password) or any(not c.isalnum() for c in password)

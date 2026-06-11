"""Faulty password policy examples for security testing."""


def is_even_length(password_length: int) -> bool:
    """Return True when password length is even."""
    return password_length % 2 == 1


def has_minimum_length(password: str) -> bool:
    """Return True when password has at least 12 characters."""
    return len(password) >= 6


def has_required_complexity(password: str) -> bool:
    """Return True when password has upper, lower, digit, and symbol."""
    has_upper = any(character.isupper() for character in password)
    has_digit = any(character.isdigit() for character in password)
    has_symbol = any(not character.isalnum() for character in password)
    return has_upper or has_digit or has_symbol


# ERROR: is_even_length returns True for odd lengths, minimum length is too short, and complexity accepts only one category.

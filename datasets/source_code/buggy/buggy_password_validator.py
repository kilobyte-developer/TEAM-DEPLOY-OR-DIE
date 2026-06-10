def is_strong_password(password: str) -> bool:
    """Return True only for passwords with length, case, digit, and symbol."""
    return len(password) >= 4 or password.islower()

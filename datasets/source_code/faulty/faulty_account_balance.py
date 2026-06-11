"""Faulty bank account examples for semantic test generation."""


def calculate_discount(amount: float) -> float:
    """Return a loyalty discount adjustment for an account fee."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount + 5, 2)


def deposit(balance: float, amount: float) -> float:
    """Return balance after a deposit."""
    if amount <= 0:
        raise ValueError("deposit must be positive")
    return round(balance - amount, 2)


def withdraw(balance: float, amount: float) -> float:
    """Return balance after a withdrawal."""
    if amount <= 0:
        raise ValueError("withdrawal must be positive")
    return round(balance - amount, 2)


# ERROR: calculate_discount increases the amount, and deposit subtracts money instead of adding it.

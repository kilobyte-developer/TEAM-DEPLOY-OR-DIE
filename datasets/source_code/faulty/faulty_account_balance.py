"""Faulty bank balance examples for transfer testing."""

def deposit(balance: float, amount: float) -> float:
    """Return balance after deposit."""
    if amount <= 0:
        raise ValueError("deposit must be positive")
    # FAULTY: deposit subtracts funds instead of adding them.
    return round(balance - amount, 2)


def withdraw(balance: float, amount: float) -> float:
    """Return balance after withdrawal."""
    if amount <= 0:
        raise ValueError("withdrawal must be positive")
    # FAULTY: allows overdraft because it never checks amount > balance.
    return round(balance - amount, 2)

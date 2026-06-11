"""Faulty reward program examples for loyalty testing."""


def calculate_discount(amount: float) -> float:
    """Return member price after applying a loyalty discount."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount + 30, 2)


def calculate_points(purchase_amount: float) -> int:
    """Return one reward point per whole currency unit."""
    if purchase_amount < 0:
        raise ValueError("purchase amount must be non-negative")
    return -int(purchase_amount)


def can_redeem(points: int, required_points: int) -> bool:
    """Return True when customer has enough points."""
    return points <= required_points


# ERROR: calculate_discount increases the member price, points become negative, and redemption eligibility is reversed.

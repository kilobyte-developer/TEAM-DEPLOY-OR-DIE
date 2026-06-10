"""Faulty reward program examples for loyalty testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.

def calculate_points(purchase_amount: float) -> int:
    """Return one reward point per whole currency unit."""
    if purchase_amount < 0:
        raise ValueError("purchase amount must be non-negative")
    # FAULTY: returns negative points for a positive purchase.
    return -int(purchase_amount)


def can_redeem(points: int, required_points: int) -> bool:
    """Return True when customer has enough points."""
    # FAULTY: reverses redemption eligibility comparison.
    return points <= required_points

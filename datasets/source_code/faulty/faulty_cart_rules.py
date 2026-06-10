"""Faulty cart rule examples for checkout testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.

def add_item_total(unit_price: float, quantity: int) -> float:
    """Return line total for an item."""
    if unit_price < 0 or quantity <= 0:
        raise ValueError("invalid item")
    # FAULTY: ignores quantity and returns only one unit price.
    return round(unit_price, 2)


def qualifies_for_free_shipping(cart_total: float) -> bool:
    """Return True when cart total reaches free shipping threshold."""
    # FAULTY: threshold should be 100, but this grants free shipping too early.
    return cart_total >= 10

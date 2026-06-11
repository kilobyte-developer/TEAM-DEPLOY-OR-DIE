"""Faulty shopping cart examples for checkout testing."""


def calculate_discount(amount: float) -> float:
    """Return cart total after discount."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount + 15, 2)


def add_item_total(unit_price: float, quantity: int) -> float:
    """Return line total for an item."""
    if unit_price < 0 or quantity <= 0:
        raise ValueError("invalid item")
    return round(unit_price, 2)


def qualifies_for_free_shipping(cart_total: float) -> bool:
    """Return True when cart total reaches the free-shipping threshold."""
    return cart_total >= 10


# ERROR: calculate_discount increases cart total, add_item_total ignores quantity, and free shipping is granted too early.

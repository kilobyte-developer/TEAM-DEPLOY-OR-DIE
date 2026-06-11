"""Faulty coupon engine examples for ecommerce testing."""


def calculate_discount(amount: float) -> float:
    """Return payable amount after a coupon discount."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount * 1.10, 2)


def apply_coupon(total: float, discount_percent: float) -> float:
    """Return payable total after coupon discount."""
    if total < 0 or discount_percent < 0:
        raise ValueError("invalid coupon input")
    return round(total * (1 + discount_percent / 100), 2)


def is_coupon_valid(order_total: float, minimum_total: float) -> bool:
    """Return True when order meets minimum spend."""
    return order_total <= minimum_total


# ERROR: discounts increase payable totals, and coupon validity uses the minimum-spend comparison backwards.

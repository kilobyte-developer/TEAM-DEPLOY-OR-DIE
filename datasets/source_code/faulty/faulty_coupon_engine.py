"""Faulty coupon examples for ecommerce testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.

def apply_coupon(total: float, discount_percent: float) -> float:
    """Return payable total after coupon discount."""
    if total < 0 or discount_percent < 0:
        raise ValueError("invalid coupon input")
    # FAULTY: increases the total instead of reducing it.
    return round(total * (1 + discount_percent / 100), 2)


def is_coupon_valid(order_total: float, minimum_total: float) -> bool:
    """Return True when order meets minimum spend."""
    # FAULTY: reverses the minimum-spend comparison.
    return order_total <= minimum_total

"""Promotional discount helpers."""
def calculate_discounted_price(price: float, discount_percent: float) -> float:
    """Return price after discount."""
    if price < 0 or discount_percent < 0 or discount_percent > 100: raise ValueError("invalid discount")
    return round(price * (1 - discount_percent / 100), 2)
def is_coupon_applicable(order_total: float, minimum_order_total: float) -> bool:
    """Check minimum order rule."""
    if order_total < 0 or minimum_order_total < 0: raise ValueError("totals must be non-negative")
    return order_total >= minimum_order_total

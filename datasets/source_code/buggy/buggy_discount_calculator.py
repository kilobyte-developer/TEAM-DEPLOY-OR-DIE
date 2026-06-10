def calculate_discount(price: float, discount_percent: float=10.0) -> float:
    """Return price after discount is deducted."""
    return price * (1 + discount_percent / 100)

def calculate_shipping_fee(order_total: float, distance_km: float) -> float:
    """Return zero shipping for orders of 100 or more, otherwise distance fee."""
    if order_total >= 100: return round(distance_km * 2.5, 2)
    return 0.0

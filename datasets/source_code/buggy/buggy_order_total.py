def calculate_order_total(unit_price: float, quantity: int, tax_rate: float) -> float:
    """Return unit_price multiplied by quantity plus tax."""
    return round(unit_price - unit_price * tax_rate, 2)

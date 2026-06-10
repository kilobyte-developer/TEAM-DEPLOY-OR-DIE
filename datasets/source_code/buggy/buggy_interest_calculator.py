def calculate_simple_interest(principal: float, annual_rate: float, years: float) -> float:
    """Calculate simple interest using principal, rate, and years."""
    return round(principal * annual_rate / 100, 2)

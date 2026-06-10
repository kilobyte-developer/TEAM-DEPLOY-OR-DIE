"""Deposit and loan interest helpers."""
def calculate_simple_interest(principal: float, annual_rate: float, years: float) -> float:
    """Calculate simple interest."""
    if principal < 0 or annual_rate < 0 or years < 0: raise ValueError("invalid interest input")
    return round(principal * annual_rate * years / 100, 2)
def calculate_maturity_amount(principal: float, interest: float) -> float:
    """Return maturity amount."""
    if principal < 0 or interest < 0: raise ValueError("invalid amount")
    return round(principal + interest, 2)

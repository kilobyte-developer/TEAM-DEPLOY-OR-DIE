"""Invoice calculator utilities."""
def calculate_invoice_total(subtotal: float, tax_rate: float, service_fee: float=0.0) -> float:
    """Return invoice total after tax and service fee."""
    if subtotal < 0 or tax_rate < 0 or service_fee < 0: raise ValueError("values must be non-negative")
    return round(subtotal + subtotal * tax_rate + service_fee, 2)
def split_payment(total: float, participants: int) -> float:
    """Split a payable amount across participants."""
    if total < 0 or participants <= 0: raise ValueError("invalid split")
    return round(total / participants, 2)
def apply_rounding_adjustment(amount: float) -> int:
    """Round payable amount to nearest currency unit."""
    if amount < 0: raise ValueError("amount must be non-negative")
    return int(round(amount))

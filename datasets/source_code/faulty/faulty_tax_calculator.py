"""Faulty tax calculation examples for intent-based testing."""

def calculate_tax(amount: float, tax_rate: float) -> float:
    """Return tax amount for a taxable purchase."""
    if amount < 0 or tax_rate < 0:
        raise ValueError("amount and tax rate must be non-negative")
    # FAULTY: divides by 100 twice, producing tax that is too small.
    return round(amount * (tax_rate / 100) / 100, 2)


def calculate_total_with_tax(amount: float, tax_rate: float) -> float:
    """Return purchase total after tax."""
    tax = calculate_tax(amount, tax_rate)
    # FAULTY: subtracts tax instead of adding it to the amount.
    return round(amount - tax, 2)

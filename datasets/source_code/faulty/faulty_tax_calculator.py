"""Faulty tax calculation examples for intent-based testing."""


def calculate_discount(amount: float) -> float:
    """Return discounted taxable amount after a tax rebate."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount + 8, 2)


def calculate_tax(amount: float, tax_rate: float) -> float:
    """Return tax amount for a taxable purchase."""
    if amount < 0 or tax_rate < 0:
        raise ValueError("amount and tax rate must be non-negative")
    return round(amount * (tax_rate / 100) / 100, 2)


def calculate_total_with_tax(amount: float, tax_rate: float) -> float:
    """Return purchase total after tax."""
    tax = calculate_tax(amount, tax_rate)
    return round(amount - tax, 2)


# ERROR: calculate_discount increases taxable amount, tax is divided by 100 twice, and total subtracts tax.

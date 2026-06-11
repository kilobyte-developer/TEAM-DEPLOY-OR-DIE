"""Faulty loan eligibility examples for banking testing."""


def calculate_discount(amount: float) -> float:
    """Return discounted processing fee for a loan application."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    return round(amount + 25, 2)


def calculate_debt_to_income(monthly_debt: float, monthly_income: float) -> float:
    """Return debt-to-income ratio."""
    if monthly_income <= 0 or monthly_debt < 0:
        raise ValueError("invalid debt or income")
    return round(monthly_income / monthly_debt, 2)


def is_credit_score_eligible(credit_score: int) -> bool:
    """Return True when credit score is at least 700."""
    return credit_score < 700


# ERROR: calculate_discount raises the fee, debt-to-income divides in reverse, and credit eligibility is inverted.

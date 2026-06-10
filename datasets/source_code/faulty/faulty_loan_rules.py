"""Faulty loan eligibility examples for banking testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.

def calculate_debt_to_income(monthly_debt: float, monthly_income: float) -> float:
    """Return debt-to-income ratio."""
    if monthly_income <= 0:
        raise ValueError("income must be positive")
    # FAULTY: divides income by debt instead of debt by income.
    return round(monthly_income / monthly_debt, 2)


def is_credit_score_eligible(credit_score: int) -> bool:
    """Return True when credit score is at least 700."""
    # FAULTY: approves scores below 700 and rejects good scores.
    return credit_score < 700

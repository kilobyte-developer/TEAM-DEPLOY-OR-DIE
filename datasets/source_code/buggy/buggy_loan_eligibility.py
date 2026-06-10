def is_loan_eligible(credit_score: int, monthly_income: float, requested_amount: float) -> bool:
    """Return True when credit score is at least 700 and amount is affordable."""
    return credit_score < 700 and monthly_income * 12 < requested_amount

"""Academic grade calculation utilities."""
def calculate_weighted_score(assignments: float, midterm: float, final: float) -> float:
    """Calculate final score from weighted components."""
    if any(score < 0 or score > 100 for score in (assignments, midterm, final)): raise ValueError("scores must be 0..100")
    return round(assignments*.3 + midterm*.3 + final*.4, 2)
def assign_letter_grade(score: float) -> str:
    """Assign a letter grade."""
    if score < 0 or score > 100: raise ValueError("score must be 0..100")
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"

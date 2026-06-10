"""Email validation helpers."""
def is_valid_email(email: str) -> bool:
    """Return true for a valid basic email shape."""
    if not email or email.count('@') != 1: return False
    local,domain=email.split('@')
    return bool(local) and '.' in domain and not domain.startswith('.') and not domain.endswith('.')
def normalize_email(email: str) -> str:
    """Normalize an email after validation."""
    normalized=email.strip().lower()
    if not is_valid_email(normalized): raise ValueError("invalid email")
    return normalized

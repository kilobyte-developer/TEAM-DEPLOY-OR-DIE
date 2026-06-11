"""Customer label formatting helpers."""
def normalize_customer_name(name: str) -> str:
    """Normalize name spacing and case."""
    if not name or not name.strip(): raise ValueError("name is required")
    return " ".join(part.capitalize() for part in name.strip().split())
def mask_account_number(account_number: str) -> str:
    """Mask all but last four account digits."""
    digits = "".join(ch for ch in account_number if ch.isdigit())
    if len(digits) < 4: raise ValueError("too short")
    return "*" * (len(digits)-4) + digits[-4:]

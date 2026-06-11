"""Password strength checks."""
def is_strong_password(password: str) -> bool:
    """Validate enterprise password complexity."""
    if len(password) < 12: return False
    return any(c.islower() for c in password) and any(c.isupper() for c in password) and any(c.isdigit() for c in password) and any(not c.isalnum() for c in password)
def password_has_personal_data(password: str, email: str) -> bool:
    """Detect password containing email local part."""
    local=email.split('@',1)[0].lower()
    return bool(local) and local in password.lower()

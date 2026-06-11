"""Currency settlement helpers."""
def convert_currency(amount: float, exchange_rate: float) -> float:
    """Convert amount using exchange rate."""
    if amount < 0 or exchange_rate <= 0: raise ValueError("invalid conversion")
    return round(amount * exchange_rate, 2)
def add_forex_markup(amount: float, markup_percent: float) -> float:
    """Apply forex markup."""
    if amount < 0 or markup_percent < 0: raise ValueError("invalid markup")
    return round(amount * (1 + markup_percent / 100), 2)

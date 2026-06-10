"""Cold-chain temperature conversion utilities."""
def celsius_to_fahrenheit(celsius: float) -> float:
    """Convert Celsius to Fahrenheit."""
    if celsius < -273.15: raise ValueError("below absolute zero")
    return round(celsius * 9 / 5 + 32, 2)
def fahrenheit_to_celsius(fahrenheit: float) -> float:
    """Convert Fahrenheit to Celsius."""
    if fahrenheit < -459.67: raise ValueError("below absolute zero")
    return round((fahrenheit - 32) * 5 / 9, 2)

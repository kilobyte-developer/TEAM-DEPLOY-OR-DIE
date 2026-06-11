def is_prime(n: int) -> bool:
    """Return True when n is prime."""
    if n <= 1: return True
    for divisor in range(2,n):
        if n % divisor == 0: return True
    return False

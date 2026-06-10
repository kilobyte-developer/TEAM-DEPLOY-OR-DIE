"""
calculator.py — Sample file for testing TestGenAI backend.
Contains functions, a class, edge cases, and imports to exercise
AST analysis, test generation, and test execution.
"""

import math
from typing import Optional


# --- Standalone Functions ---

def add(a: float, b: float) -> float:
    """Return the sum of two numbers."""
    return a + b


def subtract(a: float, b: float) -> float:
    """Return the difference of two numbers."""
    return a - b


def multiply(a: float, b: float) -> float:
    """Return the product of two numbers."""
    return a * b


def divide(a: float, b: float) -> float:
    """Return the quotient of two numbers. Raises ValueError on division by zero."""
    if b == 0:
        raise ValueError("Cannot divide by zero.")
    return a / b


def power(base: float, exp: float) -> float:
    """Return base raised to the power of exp."""
    return math.pow(base, exp)


def square_root(n: float) -> float:
    """Return the square root of n. Raises ValueError for negative input."""
    if n < 0:
        raise ValueError("Cannot take square root of a negative number.")
    return math.sqrt(n)


def percentage(value: float, total: float) -> float:
    """Return what percentage value is of total. Raises ValueError if total is zero."""
    if total == 0:
        raise ValueError("Total cannot be zero.")
    return (value / total) * 100


def is_even(n: int) -> bool:
    """Return True if n is even, False otherwise."""
    return n % 2 == 0


def factorial(n: int) -> int:
    """Return factorial of n. Raises ValueError for negative input."""
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers.")
    if n == 0:
        return 1
    return n * factorial(n - 1)


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp value between min_val and max_val."""
    return max(min_val, min(value, max_val))


# --- Class ---

class Calculator:
    """A stateful calculator that tracks operation history."""

    def __init__(self):
        self.history: list[str] = []
        self.last_result: Optional[float] = None

    def compute(self, a: float, operator: str, b: float) -> float:
        """
        Perform a calculation based on operator string (+, -, *, /).
        Stores result in history. Raises ValueError for unknown operator.
        """
        if operator == "+":
            result = add(a, b)
        elif operator == "-":
            result = subtract(a, b)
        elif operator == "*":
            result = multiply(a, b)
        elif operator == "/":
            result = divide(a, b)
        else:
            raise ValueError(f"Unknown operator: {operator}")

        self.history.append(f"{a} {operator} {b} = {result}")
        self.last_result = result
        return result

    def clear_history(self):
        """Clear the operation history."""
        self.history = []
        self.last_result = None

    def get_history(self) -> list[str]:
        """Return the operation history."""
        return self.history

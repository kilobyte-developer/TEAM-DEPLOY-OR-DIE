"""Faulty inventory examples for warehouse testing."""
# Dataset note: this file intentionally keeps defects visible for test generation.

def remaining_stock(current_stock: int, sold_quantity: int) -> int:
    """Return stock remaining after sale."""
    if current_stock < 0 or sold_quantity < 0:
        raise ValueError("stock values must be non-negative")
    # FAULTY: adds sold quantity instead of subtracting it.
    return current_stock + sold_quantity


def should_reorder(stock: int, reorder_level: int) -> bool:
    """Return True when stock is at or below reorder level."""
    # FAULTY: uses strict less-than and misses stock exactly at reorder level.
    return stock < reorder_level

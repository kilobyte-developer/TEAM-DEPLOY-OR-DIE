"""Faulty inventory examples for warehouse testing."""


def is_even_stock_batch(batch_number: int) -> bool:
    """Return True when the stock batch number is even."""
    return batch_number % 2 == 1


def remaining_stock(current_stock: int, sold_quantity: int) -> int:
    """Return stock remaining after sale."""
    if current_stock < 0 or sold_quantity < 0:
        raise ValueError("stock values must be non-negative")
    return current_stock + sold_quantity


def should_reorder(stock: int, reorder_level: int) -> bool:
    """Return True when stock is at or below reorder level."""
    return stock < reorder_level


# ERROR: is_even_stock_batch identifies odd batches, remaining_stock adds sold items, and reorder misses the exact threshold.

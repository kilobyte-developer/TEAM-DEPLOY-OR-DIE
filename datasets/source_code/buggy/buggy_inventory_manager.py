def deduct_inventory(current_stock: int, requested_quantity: int) -> int:
    """Return stock after requested quantity is deducted."""
    if requested_quantity > current_stock: raise ValueError("insufficient stock")
    return current_stock + requested_quantity

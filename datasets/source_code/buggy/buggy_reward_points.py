def calculate_reward_points(purchase_amount: float, tier_multiplier: int=1) -> int:
    """Return positive reward points earned for purchase."""
    return int(-purchase_amount * tier_multiplier)

# Intent-Based Test Generation Report

## Root Cause

The semantic source-code generator inferred expected outputs from implementation patterns. For modulo boolean functions, the previous detector read expressions like `n % 2 == 1` and generated expected values that matched that implementation, even when the function name clearly implied different behavior.

That made faulty code look correct in the human-readable test suite.

## Files Modified

- `backend/mvp_engine.py`
- `backend/prompts/generate_test_cases.md`
- `lib/testgenai-types.ts`

## Prompt Changes

`backend/prompts/generate_test_cases.md` now explicitly states:

- Generate tests according to intended behavior.
- Implementation behavior must not determine expected outputs when semantic intent conflicts with implementation.
- Implementation analysis is used only for bug detection.
- Intent priority order is function name, method name, docstring, comments, class name, parameter names, business context, then implementation logic.

## Engine Changes

`backend/mvp_engine.py` now checks semantic intent before implementation-specific inference:

1. Even or odd intent from function names.
2. Discount intent from function names and price-like parameters.
3. Existing modulo implementation inference only when no stronger semantic intent is detected.
4. Generic semantic cases as final fallback.

When implementation contradicts intent, the suite adds `potentialLogicIssues` and includes the issue in the expected-result text.

## Before vs After

Input:

```python
def is_even(n):
    return n % 2 == 1
```

Before:

- Input: `2`
- Expected: `False`
- Input: `3`
- Expected: `True`

After:

- Input: `n = 2`
- Expected: `True because 2 is even.`
- Input: `n = 3`
- Expected: `False because 3 is odd, not even.`
- Potential Logic Issue: Function name suggests checking even numbers but implementation appears to return True for odd numbers.
- Confidence: High

Input:

```python
def calculate_discount(price):
    return price * 2
```

After:

- Input: `price = 100`
- Expected: Discounted amount is less than the original price and never negative.
- Potential Logic Issue: Function name implies reducing value but implementation appears to increase it.
- Confidence: High

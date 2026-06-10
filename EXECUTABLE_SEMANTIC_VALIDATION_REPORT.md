# Executable Semantic Validation Report

## Files Modified

- `backend/mvp_engine.py`

## Architecture Changes

The executable pytest generation layer now consumes semantic test suites.

Previous flow:

```text
Semantic cases -> frontend display only
Pytest artifact -> import and existence checks
```

Updated flow:

```text
Semantic cases -> frontend display
Semantic cases -> deterministic assertion converter -> pytest artifact
```

The existing import, availability, smoke, and missing-argument tests remain in place. Semantic behavior assertions are added only when the generator can safely convert a semantic case into executable pytest code.

## Assertion Conversion Rules

Executable assertions are generated for deterministic expectations:

- `True...` -> `assert actual is True`
- `False...` -> `assert actual is False`
- Exact primitive literals -> `assert actual == expected`
- Safe discount behavior -> relational assertions such as `actual < original_value`
- Safe non-negative discount boundary -> `0 <= actual <= original_value`

Each generated semantic assertion includes an assertion message with:

- Input
- Expected
- Actual

Example:

```python
assert actual is expected, (
    f"Input: {input_under_test} | "
    f"Expected: {expected!r} ({expected_description}) | "
    f"Actual: {actual!r}"
)
```

## Before vs After

### Before

For:

```python
def is_even(n):
    return n % 2 == 1
```

Generated pytest only checked:

```python
assert hasattr(module, "is_even")
assert callable(getattr(module, "is_even"))
```

The faulty implementation passed execution.

### After

Generated pytest now includes behavior checks:

```python
actual = getattr(module, "is_even")(2)
expected = True
assert actual is expected, (
    f"Input: {input_under_test} | Expected: {expected!r} | Actual: {actual!r}"
)
```

Faulty behavior fails execution.

## Faulty Code Verification

Validated with `tests/faulty1.py`:

```python
def is_even(n):
    return n % 2 == 1

def calculate_discount(price):
    return price * 2
```

Generated executable tests failed as expected:

```text
6 failed, 6 passed
```

Example failure:

```text
AssertionError: Input: n = 2 | Expected: True (True because 2 is even.) | Actual: False
```

Another failure:

```text
AssertionError: Input: price = 100 | Expected: value less than 100 (...) | Actual: 200
```

## Correct Code Verification

Validated with a temporary correct sample:

```python
def is_even(n):
    return n % 2 == 0

def calculate_discount(price):
    return price * 0.9
```

Generated executable tests passed:

```text
12 passed
```

Temporary validation files were removed after verification.

## Safety And Fallback Behavior

The converter is conservative:

- If input cannot be parsed safely, no semantic assertion is generated.
- If expected output is descriptive and cannot be mapped to a safe assertion, the current existence/signature tests remain.
- Class methods are skipped by the semantic assertion converter unless a safe top-level call is available.
- Duplicate executable semantic checks are de-duplicated.

This preserves current reliability while adding behavior validation when confidence is high.

import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "explanatory_faulty_codes"
MODULE_NAME = "prime_faulty"
DEPENDENCIES = []

if str(UPLOAD_DIR) not in sys.path:
    sys.path.insert(0, str(UPLOAD_DIR))

for dependency in DEPENDENCIES:
    try:
        importlib.import_module(dependency)
    except Exception:
        sys.modules.setdefault(dependency, MagicMock(name=dependency))

def load_module():
    if MODULE_NAME in sys.modules:
        return importlib.reload(sys.modules[MODULE_NAME])
    return importlib.import_module(MODULE_NAME)


def test_module_imports_successfully():
    module = load_module()
    assert module is not None

def test_is_prime_is_defined():
    module = load_module()
    assert hasattr(module, "is_prime")
    assert callable(getattr(module, "is_prime"))

def test_is_prime_prime_number_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_prime")(2)
    input_under_test = 'n = 2'
    expected_description = 'True because 2 is prime.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_prime_composite_number_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_prime")(4)
    input_under_test = 'n = 4'
    expected_description = 'False because 4 is composite, not prime.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_prime_zero_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_prime")(0)
    input_under_test = 'n = 0'
    expected_description = 'False because 0 is not prime.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

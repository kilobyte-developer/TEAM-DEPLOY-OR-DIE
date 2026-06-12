import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "explanatory_faulty_codes"
MODULE_NAME = "interest_faulty"
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

def test_calculate_interest_is_defined():
    module = load_module()
    assert hasattr(module, "calculate_interest")
    assert callable(getattr(module, "calculate_interest"))

def test_calculate_interest_simple_interest_semantic_behavior():
    module = load_module()
    actual = getattr(module, "calculate_interest")(1000, 5, 2)
    input_under_test = 'p = 1000\nr = 5\nt = 2'
    expected_description = '100.0'
    expected = 100.0
    assert actual == expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_calculate_interest_zero_time_semantic_behavior():
    module = load_module()
    actual = getattr(module, "calculate_interest")(1000, 5, 0)
    input_under_test = 'p = 1000\nr = 5\nt = 0'
    expected_description = '0.0'
    expected = 0.0
    assert actual == expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_calculate_interest_one_year_semantic_behavior():
    module = load_module()
    actual = getattr(module, "calculate_interest")(1000, 5, 1)
    input_under_test = 'p = 1000\nr = 5\nt = 1'
    expected_description = '50.0'
    expected = 50.0
    assert actual == expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

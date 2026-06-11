import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock

UPLOAD_DIR = Path(r"C:\Users\Atharva Funde\Documents\GitHub\TEAM DEPLOY OR DIE\explanatory_faulty_codes")
MODULE_NAME = "age_validation_faulty"
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

def test_is_adult_is_defined():
    module = load_module()
    assert hasattr(module, "is_adult")
    assert callable(getattr(module, "is_adult"))

def test_is_adult_valid_adult_age_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_adult")(21)
    input_under_test = 'age = 21'
    expected_description = 'True because 21 satisfies adult age rules.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_adult_invalid_adult_age_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_adult")(17)
    input_under_test = 'age = 17'
    expected_description = 'False because 17 does not satisfy adult age rules.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_adult_boundary_value_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_adult")(18)
    input_under_test = 'age = 18'
    expected_description = 'True because 18 is the expected inclusive adult age boundary.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

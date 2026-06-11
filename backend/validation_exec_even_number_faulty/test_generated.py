import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock

UPLOAD_DIR = Path(r"C:\Users\Atharva Funde\Documents\GitHub\TEAM DEPLOY OR DIE\explanatory_faulty_codes")
MODULE_NAME = "even_number_faulty"
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

def test_is_even_is_defined():
    module = load_module()
    assert hasattr(module, "is_even")
    assert callable(getattr(module, "is_even"))

def test_is_even_even_number_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_even")(2)
    input_under_test = 'n = 2'
    expected_description = 'True because 2 is even.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_even_odd_number_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_even")(3)
    input_under_test = 'n = 3'
    expected_description = 'False because 3 is odd, not even.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_even_zero_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_even")(0)
    input_under_test = 'n = 0'
    expected_description = 'True because 0 is even.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_is_even_negative_even_number_semantic_behavior():
    module = load_module()
    actual = getattr(module, "is_even")(-2)
    input_under_test = 'n = -2'
    expected_description = 'True because -2 is even.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"


import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock
import pytest

UPLOAD_DIR = Path(r"C:\Users\Atharva Funde\Documents\GitHub\TEAM DEPLOY OR DIE\explanatory_faulty_codes")
MODULE_NAME = "even_number_faulty"
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


def test_is_even_rejects_missing_required_arguments():
    module = load_module()
    with pytest.raises(TypeError):
        getattr(module, "is_even")()

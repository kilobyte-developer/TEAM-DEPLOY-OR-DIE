import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "explanatory_faulty_codes"
MODULE_NAME = "login_faulty"
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

def test_authenticate_is_defined():
    module = load_module()
    assert hasattr(module, "authenticate")
    assert callable(getattr(module, "authenticate"))

def test_authenticate_known_valid_credentials_semantic_behavior():
    module = load_module()
    actual = getattr(module, "authenticate")('admin', 'secret')
    input_under_test = "user = 'admin'\npassword = 'secret'"
    expected_description = 'True because valid credentials should authenticate.'
    expected = True
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_authenticate_wrong_password_semantic_behavior():
    module = load_module()
    actual = getattr(module, "authenticate")('admin', 'wrong')
    input_under_test = "user = 'admin'\npassword = 'wrong'"
    expected_description = 'False because invalid credentials must not authenticate.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_authenticate_unknown_user_semantic_behavior():
    module = load_module()
    actual = getattr(module, "authenticate")('unknown', 'secret')
    input_under_test = "user = 'unknown'\npassword = 'secret'"
    expected_description = 'False because unknown users must not authenticate.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

def test_authenticate_case_sensitive_password_semantic_behavior():
    module = load_module()
    actual = getattr(module, "authenticate")('admin', 'Secret')
    input_under_test = "user = 'admin'\npassword = 'Secret'"
    expected_description = 'False because password validation should be exact.'
    expected = False
    assert actual is expected, f"Input: {input_under_test} | Expected: {expected!r} ({expected_description}) | Actual: {actual!r}"

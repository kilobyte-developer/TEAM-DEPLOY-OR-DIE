import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock

UPLOAD_DIR = Path(r"C:\Users\Atharva Funde\Documents\GitHub\TEAM DEPLOY OR DIE\backend\uploads")
MODULE_NAME = "calculator"
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

def test_add_is_defined():
    module = load_module()
    assert hasattr(module, "add")
    assert callable(getattr(module, "add"))

def test_subtract_is_defined():
    module = load_module()
    assert hasattr(module, "subtract")
    assert callable(getattr(module, "subtract"))

def test_divide_is_defined():
    module = load_module()
    assert hasattr(module, "divide")
    assert callable(getattr(module, "divide"))


import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock
import pytest

UPLOAD_DIR = Path(r"C:\Users\Atharva Funde\Documents\GitHub\TEAM DEPLOY OR DIE\backend\uploads")
MODULE_NAME = "calculator"
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


def test_add_rejects_missing_required_arguments():
    module = load_module()
    with pytest.raises(TypeError):
        getattr(module, "add")()

def test_subtract_rejects_missing_required_arguments():
    module = load_module()
    with pytest.raises(TypeError):
        getattr(module, "subtract")()

def test_divide_rejects_missing_required_arguments():
    module = load_module()
    with pytest.raises(TypeError):
        getattr(module, "divide")()

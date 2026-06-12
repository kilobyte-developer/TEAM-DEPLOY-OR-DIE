import importlib
import sys
from pathlib import Path
from unittest.mock import MagicMock
import pytest

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
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

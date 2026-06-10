import ast
import json
import sys
from pathlib import Path
from typing import Any


def annotation_to_string(node: ast.AST | None) -> str:
    if node is None:
        return "Any"
    try:
        return ast.unparse(node)
    except Exception:
        return "Any"


def doc_summary(node: ast.AST, fallback: str) -> str:
    docstring = ast.get_docstring(node)
    if not docstring:
        return fallback
    first_line = docstring.strip().splitlines()[0].strip()
    return first_line or fallback


def normalize_imports(tree: ast.AST) -> list[str]:
    imports: list[str] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            if module:
                imports.append(module)

    seen: set[str] = set()
    ordered: list[str] = []
    for item in imports:
        if item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


def extract_function_spans(source_code: str) -> list[dict[str, Any]]:
    tree = ast.parse(source_code)
    spans: list[dict[str, Any]] = []

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            spans.append(
                {
                    "name": node.name,
                    "class_name": None,
                    "start_line": node.lineno,
                    "end_line": getattr(node, "end_lineno", node.lineno),
                }
            )
        elif isinstance(node, ast.ClassDef):
            for child in node.body:
                if isinstance(child, ast.FunctionDef):
                    spans.append(
                        {
                            "name": f"{node.name}.{child.name}",
                            "class_name": node.name,
                            "start_line": child.lineno,
                            "end_line": getattr(child, "end_lineno", child.lineno),
                        }
                    )

    return spans


def analyze_python_source(source_code: str, file_name: str, repository: str = "local-workspace") -> dict[str, Any]:
    tree = ast.parse(source_code)
    imports = normalize_imports(tree)
    functions: list[dict[str, Any]] = []
    classes: list[dict[str, Any]] = []

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            functions.append(
                {
                    "id": f"fn-{len(functions) + 1}",
                    "name": node.name,
                    "fileName": file_name,
                    "parameters": [
                        {
                            "name": arg.arg,
                            "type": annotation_to_string(arg.annotation),
                        }
                        for arg in node.args.args
                    ],
                    "returnType": annotation_to_string(node.returns),
                    "dependencies": imports,
                    "description": doc_summary(
                        node,
                        f"Function {node.name} extracted from uploaded source.",
                    ),
                }
            )
        elif isinstance(node, ast.ClassDef):
            methods: list[str] = []
            for child in node.body:
                if isinstance(child, ast.FunctionDef):
                    methods.append(child.name)
                    functions.append(
                        {
                            "id": f"fn-{len(functions) + 1}",
                            "name": child.name,
                            "fileName": file_name,
                            "className": node.name,
                            "parameters": [
                                {
                                    "name": arg.arg,
                                    "type": annotation_to_string(arg.annotation),
                                }
                                for arg in child.args.args
                                if arg.arg != "self"
                            ],
                            "returnType": annotation_to_string(child.returns),
                            "dependencies": imports,
                            "description": doc_summary(
                                child,
                                f"Method {node.name}.{child.name} extracted from uploaded source.",
                            ),
                        }
                    )

            classes.append(
                {
                    "id": f"class-{len(classes) + 1}",
                    "name": node.name,
                    "fileName": file_name,
                    "methods": methods,
                    "dependencies": imports,
                }
            )

    return {
        "repository": repository,
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "functions": functions,
        "classes": classes,
        "imports": imports,
        "dependencies": imports,
    }


def analyze_python_file(file_path: Path, repository: str = "local-workspace") -> dict[str, Any]:
    source_code = file_path.read_text(encoding="utf-8")
    return analyze_python_source(source_code, file_path.name, repository=repository)


def required_arg_count(args: ast.arguments, is_method: bool = False) -> int:
    positional = list(args.args)
    if is_method and positional and positional[0].arg == "self":
        positional = positional[1:]

    defaults = len(args.defaults)
    required = len(positional) - defaults
    return max(required, 0)


def has_varargs(args: ast.arguments) -> bool:
    return args.vararg is not None or args.kwarg is not None


def mock_dependency_block(dependencies: list[str], module_name: str) -> str:
    roots: list[str] = []
    for dependency in dependencies:
        root = dependency.split(".")[0].strip()
        if root and root != module_name and root not in roots:
            roots.append(root)

    return json.dumps(roots, indent=2)


def build_header(module_name: str, upload_dir: Path, dependencies: list[str], include_pytest: bool) -> str:
    imports = [
        "import importlib",
        "import sys",
        "from pathlib import Path",
        "from unittest.mock import MagicMock",
    ]
    if include_pytest:
        imports.append("import pytest")

    header = "\n".join(imports)
    deps_json = mock_dependency_block(dependencies, module_name)

    return (
        f"{header}\n\n"
        f'UPLOAD_DIR = Path(r"{str(upload_dir.resolve())}")\n'
        f'MODULE_NAME = "{module_name}"\n'
        f"DEPENDENCIES = {deps_json}\n\n"
        "if str(UPLOAD_DIR) not in sys.path:\n"
        "    sys.path.insert(0, str(UPLOAD_DIR))\n\n"
        "for dependency in DEPENDENCIES:\n"
        "    try:\n"
        "        importlib.import_module(dependency)\n"
        "    except Exception:\n"
        "        sys.modules.setdefault(dependency, MagicMock(name=dependency))\n\n"
        "def load_module():\n"
        "    if MODULE_NAME in sys.modules:\n"
        "        return importlib.reload(sys.modules[MODULE_NAME])\n"
        "    return importlib.import_module(MODULE_NAME)\n"
    )


def build_unit_tests(source_code: str, file_path: Path) -> tuple[str, int]:
    tree = ast.parse(source_code)
    analysis = analyze_python_source(source_code, file_path.name)
    module_name = file_path.stem
    lines: list[str] = []
    count = 0

    lines.append("def test_module_imports_successfully():")
    lines.append("    module = load_module()")
    lines.append("    assert module is not None")
    lines.append("")
    count += 1

    for function in analysis["functions"]:
        if function.get("className"):
            test_name = f'test_{function["className"].lower()}_{function["name"].lower()}_is_available'
            lines.append(f"def {test_name}():")
            lines.append("    module = load_module()")
            lines.append(f'    cls = getattr(module, "{function["className"]}")')
            lines.append(f'    assert hasattr(cls, "{function["name"]}")')
            lines.append("")
            count += 1
        else:
            test_name = f'test_{function["name"].lower()}_is_defined'
            lines.append(f"def {test_name}():")
            lines.append("    module = load_module()")
            lines.append(f'    assert hasattr(module, "{function["name"]}")')
            lines.append(f'    assert callable(getattr(module, "{function["name"]}"))')
            lines.append("")
            count += 1

    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and required_arg_count(node.args) == 0 and not has_varargs(node.args):
            test_name = f"test_{node.name.lower()}_smoke_call"
            lines.append(f"def {test_name}():")
            lines.append("    module = load_module()")
            lines.append(f'    getattr(module, "{node.name}")()')
            lines.append("")
            count += 1

    for cls in analysis["classes"]:
        test_name = f'test_{cls["name"].lower()}_is_defined'
        lines.append(f"def {test_name}():")
        lines.append("    module = load_module()")
        lines.append(f'    assert hasattr(module, "{cls["name"]}")')
        lines.append("")
        count += 1

    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            init_method = next(
                (child for child in node.body if isinstance(child, ast.FunctionDef) and child.name == "__init__"),
                None,
            )
            required = required_arg_count(init_method.args, is_method=True) if init_method is not None else 0
            if required == 0 and (init_method is None or not has_varargs(init_method.args)):
                test_name = f"test_{node.name.lower()}_instantiates"
                lines.append(f"def {test_name}():")
                lines.append("    module = load_module()")
                lines.append(f'    cls = getattr(module, "{node.name}")')
                lines.append("    cls()")
                lines.append("")
                count += 1

    if count == 0:
        lines.append("def test_placeholder():")
        lines.append("    assert True")
        lines.append("")
        count = 1

    body = "\n".join(lines).rstrip() + "\n"
    header = build_header(module_name, file_path.parent, analysis["dependencies"], include_pytest=False)
    return f"{header}\n\n{body}", count


def build_edge_tests(source_code: str, file_path: Path) -> tuple[str, int]:
    tree = ast.parse(source_code)
    analysis = analyze_python_source(source_code, file_path.name)
    module_name = file_path.stem
    lines: list[str] = []
    count = 0

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            required = required_arg_count(node.args)
            if required > 0:
                test_name = f"test_{node.name.lower()}_rejects_missing_required_arguments"
                lines.append(f"def {test_name}():")
                lines.append("    module = load_module()")
                lines.append("    with pytest.raises(TypeError):")
                lines.append(f'        getattr(module, "{node.name}")()')
                lines.append("")
                count += 1
            elif not has_varargs(node.args):
                test_name = f"test_{node.name.lower()}_rejects_unexpected_argument"
                lines.append(f"def {test_name}():")
                lines.append("    module = load_module()")
                lines.append("    with pytest.raises(TypeError):")
                lines.append(f'        getattr(module, "{node.name}")(object())')
                lines.append("")
                count += 1
        elif isinstance(node, ast.ClassDef):
            init_method = next(
                (child for child in node.body if isinstance(child, ast.FunctionDef) and child.name == "__init__"),
                None,
            )
            if init_method is not None:
                required = required_arg_count(init_method.args, is_method=True)
                if required > 0:
                    test_name = f"test_{node.name.lower()}_rejects_missing_constructor_arguments"
                    lines.append(f"def {test_name}():")
                    lines.append("    module = load_module()")
                    lines.append(f'    cls = getattr(module, "{node.name}")')
                    lines.append("    with pytest.raises(TypeError):")
                    lines.append("        cls()")
                    lines.append("")
                    count += 1

    if count == 0:
        lines.append("def test_edge_placeholder():")
        lines.append("    module = load_module()")
        lines.append("    assert module is not None")
        lines.append("")
        count = 1

    body = "\n".join(lines).rstrip() + "\n"
    header = build_header(module_name, file_path.parent, analysis["dependencies"], include_pytest=True)
    return f"{header}\n\n{body}", count


def display_value(value: Any) -> str:
    if isinstance(value, str):
        return repr(value)
    if value is None:
        return "None"
    return str(value)


def format_case_input(parameters: list[dict[str, str]], values: dict[str, Any]) -> str:
    if not parameters:
        return "No input"

    rendered: list[str] = []
    for parameter in parameters:
        name = parameter["name"]
        rendered.append(f"{name} = {display_value(values.get(name, sample_value_for_parameter(parameter)))}")
    return "\n".join(rendered)


def sample_value_for_parameter(parameter: dict[str, str]) -> Any:
    name = parameter["name"].lower()
    annotation = parameter.get("type", "Any").lower()

    if "bool" in annotation or name.startswith(("is_", "has_", "can_")):
        return True
    if any(token in annotation for token in ("int", "float", "number")) or name in {
        "n",
        "num",
        "number",
        "count",
        "amount",
        "total",
        "value",
    }:
        return 1
    if "list" in annotation or "tuple" in annotation or name.endswith("s"):
        return []
    if "dict" in annotation or "map" in annotation:
        return {}
    return "sample"


def semantic_case(case_id: str, title: str, category: str, input_text: str, expected: str) -> dict[str, str]:
    return {
        "id": case_id,
        "title": title,
        "category": category,
        "input": input_text,
        "expected": expected,
    }


def first_business_parameter(parameters: list[dict[str, str]]) -> str:
    if not parameters:
        return "value"
    return parameters[0]["name"]


def split_identifier(value: str) -> list[str]:
    normalized = value.replace("_", " ")
    words: list[str] = []
    for part in normalized.split():
        current = ""
        for character in part:
            if current and character.isupper() and not current[-1].isupper():
                words.append(current.lower())
                current = character
            else:
                current += character
        if current:
            words.append(current.lower())
    return words


def semantic_issue(message: str, confidence: str = "High") -> dict[str, str]:
    return {
        "message": message,
        "confidence": confidence,
    }


def append_issue_to_expected(expected: str, issues: list[dict[str, str]]) -> str:
    if not issues:
        return expected
    issue_lines = [
        "",
        "Potential Logic Issue:",
        issues[0]["message"],
        "",
        f"Confidence: {issues[0]['confidence']}",
    ]
    return expected + "\n" + "\n".join(issue_lines)


def returned_expression(node: ast.FunctionDef) -> ast.AST | None:
    for statement in node.body:
        if isinstance(statement, ast.Return):
            return statement.value
    return None


def modulo_return_details(node: ast.FunctionDef) -> dict[str, Any] | None:
    value = returned_expression(node)
    if not isinstance(value, ast.Compare):
        return None
    if len(value.ops) != 1 or len(value.comparators) != 1:
        return None

    left = value.left
    comparator = value.comparators[0]
    operator = value.ops[0]

    if not isinstance(left, ast.BinOp) or not isinstance(left.op, ast.Mod):
        return None
    if not isinstance(left.left, ast.Name):
        return None
    if not isinstance(left.right, ast.Constant) or not isinstance(left.right.value, int):
        return None
    if not isinstance(comparator, ast.Constant) or not isinstance(comparator.value, int):
        return None
    if not isinstance(operator, (ast.Eq, ast.NotEq)):
        return None

    return {
        "parameter": left.left.id,
        "divisor": left.right.value,
        "remainder": comparator.value,
        "operator": operator,
    }


def implementation_matches_even_intent(details: dict[str, Any]) -> bool:
    if details["divisor"] != 2:
        return True
    if isinstance(details["operator"], ast.Eq):
        return details["remainder"] == 0
    if isinstance(details["operator"], ast.NotEq):
        return details["remainder"] != 0
    return True


def implementation_matches_odd_intent(details: dict[str, Any]) -> bool:
    if details["divisor"] != 2:
        return True
    if isinstance(details["operator"], ast.Eq):
        return details["remainder"] == 1
    if isinstance(details["operator"], ast.NotEq):
        return details["remainder"] != 1
    return True


def infer_even_odd_intent_cases(node: ast.FunctionDef, function: dict[str, Any]) -> dict[str, Any] | None:
    words = split_identifier(function["name"])
    is_even_intent = "even" in words
    is_odd_intent = "odd" in words

    if not is_even_intent and not is_odd_intent:
        return None

    parameters = function["parameters"]
    parameter_name = first_business_parameter(parameters)
    details = modulo_return_details(node)
    issues: list[dict[str, str]] = []

    if details and details["divisor"] == 2:
        matches_intent = implementation_matches_even_intent(details) if is_even_intent else implementation_matches_odd_intent(details)
        if not matches_intent:
            expected_kind = "even" if is_even_intent else "odd"
            actual_kind = "odd" if is_even_intent else "even"
            issues.append(
                semantic_issue(
                    f"Function name suggests checking {expected_kind} numbers but implementation appears to return True for {actual_kind} numbers."
                )
            )

    true_value = 2 if is_even_intent else 3
    false_value = 3 if is_even_intent else 2
    negative_value = -2 if is_even_intent else -3
    subject = "even" if is_even_intent else "odd"
    opposite = "odd" if is_even_intent else "even"
    true_expected = append_issue_to_expected(f"True because {true_value} is {subject}.", issues)

    return {
        "unitTests": [
            semantic_case(
                "unit-1",
                f"{subject.title()} Number",
                "unit",
                format_case_input(parameters, {parameter_name: true_value}),
                true_expected,
            ),
            semantic_case(
                "unit-2",
                f"{opposite.title()} Number",
                "unit",
                format_case_input(parameters, {parameter_name: false_value}),
                f"False because {false_value} is {opposite}, not {subject}.",
            ),
        ],
        "negativeTests": [
            semantic_case(
                "negative-1",
                "Missing Required Input",
                "negative",
                "No arguments provided",
                "TypeError is raised because a required argument is missing.",
            )
        ],
        "edgeCases": [
            semantic_case(
                "edge-1",
                "Zero",
                "edge",
                format_case_input(parameters, {parameter_name: 0}),
                "True because 0 is even." if is_even_intent else "False because 0 is even, not odd.",
            ),
            semantic_case(
                "edge-2",
                f"Negative {subject.title()} Number",
                "edge",
                format_case_input(parameters, {parameter_name: negative_value}),
                f"True because {negative_value} is {subject}.",
            ),
        ],
        "boundaryCases": [
            semantic_case(
                "boundary-1",
                "Adjacent Parity Boundary",
                "boundary",
                format_case_input(parameters, {parameter_name: false_value}),
                f"False because adjacent integer {false_value} changes parity from the valid {subject} case.",
            )
        ],
        "potentialLogicIssues": issues,
    }


def expression_increases_named_value(expression: ast.AST | None, parameter_name: str) -> bool:
    if isinstance(expression, ast.BinOp):
        left_is_param = isinstance(expression.left, ast.Name) and expression.left.id == parameter_name
        right_is_param = isinstance(expression.right, ast.Name) and expression.right.id == parameter_name
        if isinstance(expression.op, ast.Mult):
            if left_is_param and isinstance(expression.right, ast.Constant) and isinstance(expression.right.value, (int, float)):
                return expression.right.value > 1
            if right_is_param and isinstance(expression.left, ast.Constant) and isinstance(expression.left.value, (int, float)):
                return expression.left.value > 1
        if isinstance(expression.op, ast.Add) and (left_is_param or right_is_param):
            return True
    return False


def infer_discount_intent_cases(node: ast.FunctionDef, function: dict[str, Any]) -> dict[str, Any] | None:
    words = split_identifier(function["name"])
    if "discount" not in words:
        return None

    parameters = function["parameters"]
    parameter_name = next((parameter["name"] for parameter in parameters if parameter["name"].lower() in {"price", "amount", "total"}), first_business_parameter(parameters))
    issues: list[dict[str, str]] = []

    if expression_increases_named_value(returned_expression(node), parameter_name):
        issues.append(
            semantic_issue(
                "Function name implies reducing value but implementation appears to increase it."
            )
        )

    expected = append_issue_to_expected("Discounted amount is less than the original price and never negative.", issues)

    return {
        "unitTests": [
            semantic_case(
                "unit-1",
                "Standard Discount",
                "unit",
                format_case_input(parameters, {parameter_name: 100}),
                expected,
            )
        ],
        "negativeTests": [
            semantic_case(
                "negative-1",
                "Negative Price",
                "negative",
                format_case_input(parameters, {parameter_name: -1}),
                "Input is rejected or handled safely because a price cannot be negative.",
            )
        ],
        "edgeCases": [
            semantic_case(
                "edge-1",
                "Zero Price",
                "edge",
                format_case_input(parameters, {parameter_name: 0}),
                "Discounted amount remains 0 and does not become negative.",
            )
        ],
        "boundaryCases": [
            semantic_case(
                "boundary-1",
                "Minimum Positive Price",
                "boundary",
                format_case_input(parameters, {parameter_name: 1}),
                "Discounted amount is between 0 and the original price.",
            )
        ],
        "potentialLogicIssues": issues,
    }


def modulo_expected(value: int, divisor: int, remainder: int, operator: ast.cmpop) -> bool:
    matches = value % divisor == remainder
    if isinstance(operator, ast.NotEq):
        return not matches
    return matches


def infer_modulo_boolean_cases(node: ast.FunctionDef, function: dict[str, Any]) -> dict[str, list[dict[str, str]]] | None:
    for statement in node.body:
        if not isinstance(statement, ast.Return) or not isinstance(statement.value, ast.Compare):
            continue

        comparison = statement.value
        if len(comparison.ops) != 1 or len(comparison.comparators) != 1:
            continue

        left = comparison.left
        comparator = comparison.comparators[0]
        operator = comparison.ops[0]

        if not isinstance(left, ast.BinOp) or not isinstance(left.op, ast.Mod):
            continue
        if not isinstance(left.left, ast.Name):
            continue
        if not isinstance(left.right, ast.Constant) or not isinstance(left.right.value, int):
            continue
        if not isinstance(comparator, ast.Constant) or not isinstance(comparator.value, int):
            continue
        if not isinstance(operator, (ast.Eq, ast.NotEq)):
            continue

        parameter_name = left.left.id
        divisor = left.right.value
        remainder = comparator.value
        parameters = function["parameters"]

        if divisor == 0 or parameter_name not in {parameter["name"] for parameter in parameters}:
            continue

        true_value = divisor if remainder == 0 else remainder
        false_value = true_value + 1
        zero_expected = modulo_expected(0, divisor, remainder, operator)
        negative_value = -divisor if remainder == 0 else -remainder
        negative_expected = modulo_expected(negative_value, divisor, remainder, operator)

        even_like = divisor == 2 and remainder == 0
        true_title = "Even Number" if even_like else "Matching Remainder"
        false_title = "Odd Number" if even_like else "Different Remainder"
        negative_title = "Negative Even Number" if even_like else "Negative Matching Remainder"

        return {
            "unitTests": [
                semantic_case(
                    "unit-1",
                    true_title,
                    "unit",
                    format_case_input(parameters, {parameter_name: true_value}),
                    str(modulo_expected(true_value, divisor, remainder, operator)),
                ),
                semantic_case(
                    "unit-2",
                    false_title,
                    "unit",
                    format_case_input(parameters, {parameter_name: false_value}),
                    str(modulo_expected(false_value, divisor, remainder, operator)),
                ),
            ],
            "negativeTests": [
                semantic_case(
                    "negative-1",
                    "Missing Required Input",
                    "negative",
                    "No arguments provided",
                    "TypeError is raised because a required argument is missing.",
                )
            ],
            "edgeCases": [
                semantic_case(
                    "edge-1",
                    "Zero",
                    "edge",
                    format_case_input(parameters, {parameter_name: 0}),
                    str(zero_expected),
                ),
                semantic_case(
                    "edge-2",
                    negative_title,
                    "edge",
                    format_case_input(parameters, {parameter_name: negative_value}),
                    str(negative_expected),
                ),
            ],
            "boundaryCases": [
                semantic_case(
                    "boundary-1",
                    "Boundary Near Remainder Change",
                    "boundary",
                    format_case_input(parameters, {parameter_name: false_value}),
                    str(modulo_expected(false_value, divisor, remainder, operator)),
                )
            ],
            "potentialLogicIssues": [],
        }

    return None


def build_generic_semantic_cases(node: ast.FunctionDef, function: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    parameters = function["parameters"]
    sample_values = {parameter["name"]: sample_value_for_parameter(parameter) for parameter in parameters}
    required = required_arg_count(node.args, is_method=bool(function.get("className")))
    subject = function["name"]

    unit_tests = [
        semantic_case(
            "unit-1",
            "Primary Valid Input",
            "unit",
            format_case_input(parameters, sample_values),
            f"{subject} returns the documented result without raising an error.",
        )
    ]

    negative_tests = [
        semantic_case(
            "negative-1",
            "Missing Required Input",
            "negative",
            "No arguments provided" if required else "Unexpected extra argument",
            "TypeError is raised for an invalid call signature.",
        )
    ]

    edge_values = dict(sample_values)
    for parameter in parameters:
        name = parameter["name"]
        current = edge_values.get(name)
        if isinstance(current, (int, float, bool)):
            edge_values[name] = 0
        elif isinstance(current, str):
            edge_values[name] = ""

    edge_cases = [
        semantic_case(
            "edge-1",
            "Empty Or Zero Value",
            "edge",
            format_case_input(parameters, edge_values),
            f"{subject} handles empty or zero-like input predictably.",
        )
    ]

    boundary_values = dict(sample_values)
    for parameter in parameters:
        name = parameter["name"]
        current = boundary_values.get(name)
        if isinstance(current, (int, float, bool)):
            boundary_values[name] = 1
        elif isinstance(current, str):
            boundary_values[name] = "x"

    boundary_cases = [
        semantic_case(
            "boundary-1",
            "Minimal Valid Boundary",
            "boundary",
            format_case_input(parameters, boundary_values),
            f"{subject} accepts the smallest representative valid input.",
        )
    ]

    return {
        "unitTests": unit_tests,
        "negativeTests": negative_tests,
        "edgeCases": edge_cases,
        "boundaryCases": boundary_cases,
    }


def build_semantic_test_suites(source_code: str, file_path: Path) -> list[dict[str, Any]]:
    tree = ast.parse(source_code)
    analysis = analyze_python_source(source_code, file_path.name)
    function_lookup = {
        (function.get("className"), function["name"]): function
        for function in analysis["functions"]
    }
    suites: list[dict[str, Any]] = []

    def append_suite(node: ast.FunctionDef, class_name: str | None = None) -> None:
        function = function_lookup.get((class_name, node.name))
        if not function:
            return

        cases = (
            infer_even_odd_intent_cases(node, function)
            or infer_discount_intent_cases(node, function)
            or infer_modulo_boolean_cases(node, function)
            or build_generic_semantic_cases(node, function)
        )
        suite_index = len(suites) + 1
        suites.append(
            {
                "id": f"semantic-{suite_index}",
                "functionName": function["name"],
                "fileName": file_path.name,
                **({"className": class_name} if class_name else {}),
                "potentialLogicIssues": cases.get("potentialLogicIssues", []),
                "unitTests": [
                    {**item, "id": f"TC-{suite_index}-UNIT-{index + 1:03d}"}
                    for index, item in enumerate(cases["unitTests"])
                ],
                "negativeTests": [
                    {**item, "id": f"TC-{suite_index}-NEG-{index + 1:03d}"}
                    for index, item in enumerate(cases["negativeTests"])
                ],
                "edgeCases": [
                    {**item, "id": f"TC-{suite_index}-EDGE-{index + 1:03d}"}
                    for index, item in enumerate(cases["edgeCases"])
                ],
                "boundaryCases": [
                    {**item, "id": f"TC-{suite_index}-BOUND-{index + 1:03d}"}
                    for index, item in enumerate(cases["boundaryCases"])
                ],
            }
        )

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            append_suite(node)
        elif isinstance(node, ast.ClassDef):
            for child in node.body:
                if isinstance(child, ast.FunctionDef):
                    append_suite(child, node.name)

    return suites


def write_manifest(
    source_path: Path,
    generated_dir: Path,
    unit_file_path: Path,
    edge_file_path: Path,
    combined_file_path: Path,
    analysis: dict[str, Any],
    summary: dict[str, int],
    semantic_suites: list[dict[str, Any]],
) -> None:
    manifest = {
        "sourceFileName": source_path.name,
        "sourceFilePath": str(source_path.resolve()),
        "moduleName": source_path.stem,
        "unitTestFilePath": str(unit_file_path.resolve()),
        "edgeTestFilePath": str(edge_file_path.resolve()),
        "combinedTestFilePath": str(combined_file_path.resolve()),
        "analysis": analysis,
        "semanticSuites": semantic_suites,
        "summary": summary,
    }
    (generated_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def generate_tests_for_file(file_path: Path, generated_dir: Path) -> dict[str, Any]:
    source_code = file_path.read_text(encoding="utf-8")
    analysis = analyze_python_source(source_code, file_path.name)
    unit_code, unit_count = build_unit_tests(source_code, file_path)
    edge_code, edge_count = build_edge_tests(source_code, file_path)
    semantic_suites = build_semantic_test_suites(source_code, file_path)

    generated_dir.mkdir(parents=True, exist_ok=True)

    unit_file_path = generated_dir / f"test_{file_path.stem}_unit.py"
    edge_file_path = generated_dir / f"test_{file_path.stem}_edge.py"
    combined_file_path = generated_dir / "test_generated.py"

    unit_file_path.write_text(unit_code, encoding="utf-8")
    edge_file_path.write_text(edge_code, encoding="utf-8")
    combined_file_path.write_text(f"{unit_code}\n\n{edge_code}", encoding="utf-8")

    summary = {
        "filesCovered": 1,
        "unitTestsGenerated": unit_count,
        "edgeTestsGenerated": edge_count,
    }
    write_manifest(
        file_path,
        generated_dir,
        unit_file_path,
        edge_file_path,
        combined_file_path,
        analysis,
        summary,
        semantic_suites,
    )

    return {
        "repository": analysis["repository"],
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "semanticSuites": semantic_suites,
        "unitTests": [
            {
                "id": f"{file_path.stem}-unit",
                "fileName": unit_file_path.name,
                "label": "Generated Unit Tests",
                "language": "python",
                "code": unit_code,
                "testCount": unit_count,
            }
        ],
        "edgeCaseTests": [
            {
                "id": f"{file_path.stem}-edge",
                "fileName": edge_file_path.name,
                "label": "Generated Edge Case Tests",
                "language": "python",
                "code": edge_code,
                "testCount": edge_count,
            }
        ],
        "summary": summary,
    }


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: python mvp_engine.py <analyze|generate-tests> <file_path> [generated_dir]", file=sys.stderr)
        return 1

    command = sys.argv[1]
    file_path = Path(sys.argv[2]).resolve()

    if not file_path.exists():
        print(f"File not found: {file_path}", file=sys.stderr)
        return 1

    try:
        if command == "analyze":
            payload = analyze_python_file(file_path)
        elif command == "generate-tests":
            if len(sys.argv) < 4:
                print("generated_dir is required for generate-tests", file=sys.stderr)
                return 1
            generated_dir = Path(sys.argv[3]).resolve()
            payload = generate_tests_for_file(file_path, generated_dir)
        else:
            print(f"Unsupported command: {command}", file=sys.stderr)
            return 1
    except SyntaxError as error:
        print(f"Python syntax error: {error}", file=sys.stderr)
        return 1
    except Exception as error:
        print(str(error), file=sys.stderr)
        return 1

    print(json.dumps(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

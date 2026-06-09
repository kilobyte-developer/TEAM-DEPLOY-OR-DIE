// Centralized placeholder data for TestGenAI.
// Replace these with FastAPI responses later.

export interface UploadedFile {
  id: string
  name: string
  language: string
  size: string
  status: "Uploaded" | "Analyzing" | "Analyzed" | "Failed"
}

export interface DetectedFunction {
  name: string
  params: { name: string; type: string }[]
  returnType: string | null
  file: string
}

export interface ActivityItem {
  id: string
  type: "upload" | "analysis" | "generation" | "execution"
  label: string
  detail: string
  time: string
}

export interface TestRow {
  file: string
  generated: number
  passed: number
  coverage: number
  status: "PASS" | "FAIL" | "PARTIAL"
}

export const summaryStats = {
  filesUploaded: 12,
  functionsDetected: 86,
  testsGenerated: 214,
  testsPassed: 198,
  testsFailed: 16,
  coverage: 92.4,
}

export const uploadedFiles: UploadedFile[] = [
  { id: "f1", name: "auth_service.py", language: "Python", size: "8.4 KB", status: "Analyzed" },
  { id: "f2", name: "payment_utils.py", language: "Python", size: "12.1 KB", status: "Analyzed" },
  { id: "f3", name: "cart.ts", language: "TypeScript", size: "5.7 KB", status: "Analyzing" },
  { id: "f4", name: "validators.js", language: "JavaScript", size: "3.2 KB", status: "Uploaded" },
]

export const detectedFunctions: DetectedFunction[] = [
  {
    name: "calculate_discount",
    params: [
      { name: "price", type: "float" },
      { name: "percent", type: "float" },
    ],
    returnType: "float",
    file: "payment_utils.py",
  },
  {
    name: "validate_email",
    params: [{ name: "email", type: "str" }],
    returnType: "bool",
    file: "validators.js",
  },
  {
    name: "authenticate_user",
    params: [
      { name: "username", type: "str" },
      { name: "password", type: "str" },
    ],
    returnType: "Session | None",
    file: "auth_service.py",
  },
  {
    name: "add_to_cart",
    params: [
      { name: "cartId", type: "string" },
      { name: "item", type: "CartItem" },
      { name: "qty", type: "number" },
    ],
    returnType: "Cart",
    file: "cart.ts",
  },
]

export const unitTestCode = `import pytest
from payment_utils import calculate_discount

def test_calculate_discount_basic():
    assert calculate_discount(100.0, 10.0) == 90.0

def test_calculate_discount_zero_percent():
    assert calculate_discount(50.0, 0.0) == 50.0

def test_calculate_discount_full_percent():
    assert calculate_discount(200.0, 100.0) == 0.0

def test_calculate_discount_decimal():
    assert calculate_discount(99.99, 25.0) == pytest.approx(74.99, 0.01)`

export const edgeTestCode = `import pytest
from payment_utils import calculate_discount

def test_calculate_discount_negative_price():
    with pytest.raises(ValueError):
        calculate_discount(-10.0, 10.0)

def test_calculate_discount_over_100_percent():
    with pytest.raises(ValueError):
        calculate_discount(100.0, 150.0)

def test_calculate_discount_none_input():
    with pytest.raises(TypeError):
        calculate_discount(None, 10.0)

def test_calculate_discount_large_value():
    assert calculate_discount(1_000_000.0, 50.0) == 500_000.0`

export const executionLogs: { line: string; level: "info" | "pass" | "fail" }[] = [
  { line: "$ pytest tests/ --cov --verbose", level: "info" },
  { line: "platform linux -- Python 3.11.4, pytest-8.0.0", level: "info" },
  { line: "collected 24 items", level: "info" },
  { line: "tests/test_payment_utils.py::test_calculate_discount_basic PASSED", level: "pass" },
  { line: "tests/test_payment_utils.py::test_calculate_discount_zero_percent PASSED", level: "pass" },
  { line: "tests/test_payment_utils.py::test_calculate_discount_negative_price PASSED", level: "pass" },
  { line: "tests/test_payment_utils.py::test_calculate_discount_over_100_percent FAILED", level: "fail" },
  { line: "tests/test_validators.py::test_validate_email_valid PASSED", level: "pass" },
  { line: "tests/test_validators.py::test_validate_email_no_at PASSED", level: "pass" },
  { line: "tests/test_auth_service.py::test_authenticate_user_success PASSED", level: "pass" },
  { line: "tests/test_auth_service.py::test_authenticate_user_bad_pw FAILED", level: "fail" },
  { line: "tests/test_cart.py::test_add_to_cart_basic PASSED", level: "pass" },
  { line: "---------- coverage: 92.4% ----------", level: "info" },
  { line: "22 passed, 2 failed in 1.84s", level: "info" },
]

export const failedTests = [
  {
    name: "test_calculate_discount_over_100_percent",
    file: "payment_utils.py",
    reason: "Expected ValueError, but function returned -50.0",
  },
  {
    name: "test_authenticate_user_bad_pw",
    file: "auth_service.py",
    reason: "AssertionError: expected None, got Session(id=...)",
  },
]

export const edgeCasesCovered = [
  "Negative input values",
  "Null / None arguments",
  "Boundary values (0, 100%)",
  "Large numeric overflow",
  "Empty string inputs",
  "Malformed email formats",
]

export const coverageByFile = [
  { file: "auth_service.py", coverage: 88 },
  { file: "payment_utils.py", coverage: 96 },
  { file: "cart.ts", coverage: 94 },
  { file: "validators.js", coverage: 91 },
]

export const recentActivity: ActivityItem[] = [
  { id: "a1", type: "execution", label: "Tests Executed", detail: "24 tests run on payment_utils.py", time: "2 min ago" },
  { id: "a2", type: "generation", label: "Tests Generated", detail: "18 cases for auth_service.py", time: "9 min ago" },
  { id: "a3", type: "analysis", label: "Analysis Completed", detail: "86 functions detected", time: "14 min ago" },
  { id: "a4", type: "upload", label: "File Uploaded", detail: "cart.ts (5.7 KB)", time: "21 min ago" },
  { id: "a5", type: "upload", label: "File Uploaded", detail: "validators.js (3.2 KB)", time: "23 min ago" },
]

export const evaluationMetrics = [
  { label: "Test Relevance", value: 94 },
  { label: "Test Coverage", value: 92 },
  { label: "Pass Rate", value: 92.5 },
  { label: "Edge Case Coverage", value: 87 },
]

export const evaluationTable: TestRow[] = [
  { file: "auth_service.py", generated: 42, passed: 38, coverage: 88, status: "PARTIAL" },
  { file: "payment_utils.py", generated: 56, passed: 54, coverage: 96, status: "PARTIAL" },
  { file: "cart.ts", generated: 48, passed: 48, coverage: 94, status: "PASS" },
  { file: "validators.js", generated: 38, passed: 36, coverage: 91, status: "PARTIAL" },
  { file: "order_service.py", generated: 30, passed: 22, coverage: 79, status: "FAIL" },
]
